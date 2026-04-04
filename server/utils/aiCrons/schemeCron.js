/**
 * server/utils/aiCrons/schemeCron.js
 *
 * Daily cron — Target: 50 schemes per state.
 * Logic per run (10 schemes total per day):
 *  1. Sort all states by scheme count ascending (fewest first).
 *  2. For each state, fetch existing scheme titles from DB and pass to Gemini.
 *  3. Ask Gemini to generate ONLY schemes that don't already exist.
 *  4. If Gemini says no more unique schemes possible → move to next state.
 *  5. Stop once 10 new schemes are saved OR all states at 50+.
 *
 * Runs at 08:00 AM IST every day.
 */

const cron = require('node-cron');
const GovScheme = require('../../models/schemes');
const { generateText } = require('../gemini');

const TARGET_PER_STATE = 50;
const DAILY_BATCH = 10;

// All Indian states + UTs
const ALL_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli',
  'Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep',
  'Puducherry',
];

function generateSlug(text) {
  return String(text)
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 90);
}

/**
 * Fetch all existing scheme titles for a state from DB.
 * @param {string} state
 * @returns {Promise<string[]>}
 */
async function getExistingTitles(state) {
  const docs = await GovScheme.find({ state }, { schemeTitle: 1, _id: 0 }).lean();
  return docs.map(d => d.schemeTitle).filter(Boolean);
}

/**
 * Ask Gemini to generate `count` NEW schemes for `state`,
 * explicitly avoiding all titles in `existingTitles`.
 * Returns array of scheme objects, or empty array if AI says "exhausted".
 */
async function generateSchemeBatch(state, existingTitles, count) {
  const year = new Date().getFullYear();
  const existingList = existingTitles.length
    ? `\nAlready existing schemes for ${state} (DO NOT repeat or closely duplicate these):\n${existingTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
    : '';

  const prompt = `You are an expert on Indian government welfare schemes.
State: ${state}
Task: Generate exactly ${count} NEW and UNIQUE government welfare schemes for ${state} that do NOT already exist.
${existingList}
If you genuinely cannot think of ${count} more unique schemes for this state (all major categories already covered), respond with exactly: {"exhausted": true}

Otherwise return STRICT JSON array only (no markdown, no \`\`\`, no extra text):
[
  {
    "schemeTitle": "<unique official-sounding scheme name with Yojana/Scheme suffix>",
    "schemetype": "<one of: Education Scheme|Health Scheme|Agriculture Scheme|Women Empowerment|Youth Scheme|Housing Scheme|Employment Scheme|Social Welfare|Financial Assistance|Skill Development|Pension Scheme|Scholarship|Farmer Welfare|Digital Scheme|Sports Scheme|Minority Welfare|Tribal Welfare|Disability Scheme|Child Welfare|Senior Citizen Scheme>",
    "aboutScheme": "<detailed 3-4 paragraph description, min 150 words, what it offers, who benefits, how to apply>",
    "process": "<numbered step-by-step application process, 4-6 steps>",
    "requiredDocs": ["<doc1>", "<doc2>", "<doc3>", "<doc4>", "<doc5>"],
    "benefits": "<specific financial amount or goods/services provided>",
    "eligibility": "<age, income, caste, occupation criteria>"
  }
]

Requirements:
- Each scheme must be genuinely different in purpose from others in the list
- Use realistic Indian government naming (state language + Hindi/English mix acceptable)
- Relevant to ${state}'s specific geography, economy, population (e.g. tribal schemes for NE states, agriculture for UP/MP, coastal for Goa/Kerala)
- requiredDocs: include Aadhar, income certificate, and 3+ specific ones
- Year context: ${year}`;

  const raw = await generateText(prompt);
  const jsonStr = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  // Check if AI says exhausted
  if (jsonStr.includes('"exhausted"') && jsonStr.includes('true')) {
    return null; // signal: no more unique schemes for this state
  }

  const parsed = JSON.parse(jsonStr);
  if (!Array.isArray(parsed)) throw new Error('Gemini returned non-array');
  return parsed;
}

/**
 * Main cron task.
 */
async function runSchemeCron() {
  // 1. Get current counts for all states
  const counts = await GovScheme.aggregate([
    { $match: { state: { $in: ALL_STATES } } },
    { $group: { _id: '$state', count: { $sum: 1 } } },
  ]);
  const countMap = {};
  for (const c of counts) countMap[c._id] = c.count;

  // 2. Sort states: fewest schemes first; skip if already at TARGET
  const statesNeedingWork = [...ALL_STATES]
    .map(s => ({ state: s, count: countMap[s] || 0 }))
    .filter(s => s.count < TARGET_PER_STATE)
    .sort((a, b) => a.count - b.count);

  if (!statesNeedingWork.length) {
    console.log(`[SchemeCron] All ${ALL_STATES.length} states have ${TARGET_PER_STATE}+ schemes — nothing to do.`);
    return;
  }

  console.log(`[SchemeCron] ${statesNeedingWork.length} states need more schemes. Starting batch of ${DAILY_BATCH}...`);

  let totalCreated = 0;

  for (const { state, count } of statesNeedingWork) {
    if (totalCreated >= DAILY_BATCH) break;

    const needed = TARGET_PER_STATE - count;
    const batchSize = Math.min(needed, DAILY_BATCH - totalCreated, 5); // max 5 per state per run

    console.log(`[SchemeCron] State: ${state} | Has: ${count} | Needs: ${needed} | Generating: ${batchSize}`);

    // 3. Fetch all existing titles for this state
    const existingTitles = await getExistingTitles(state);

    let attempts = 0;
    let stateCreated = 0;

    while (stateCreated < batchSize && attempts < 3) {
      attempts++;
      const remaining = batchSize - stateCreated;

      try {
        // 4. Ask Gemini (with existing titles so no duplicates)
        const schemes = await generateSchemeBatch(state, existingTitles, remaining);

        // 5. Gemini said exhausted → skip to next state
        if (schemes === null) {
          console.log(`[SchemeCron] Gemini says no more unique schemes for ${state} — moving to next state.`);
          break;
        }

        for (const s of schemes) {
          if (stateCreated >= batchSize || totalCreated >= DAILY_BATCH) break;

          const slug = generateSlug(`${s.schemeTitle} ${state}`);

          // Double-check slug uniqueness in DB
          const exists = await GovScheme.findOne({ slug });
          if (exists) {
            console.log(`[SchemeCron] Slug exists: ${slug} — skipping`);
            continue;
          }

          await GovScheme.create({
            schemeTitle: s.schemeTitle,
            schemetype: s.schemetype || 'Social Welfare',
            state,
            aboutScheme: s.aboutScheme || '',
            process: s.process || '',
            requiredDocs: Array.isArray(s.requiredDocs) ? s.requiredDocs : [],
            benefits: s.benefits || '',
            eligibility: s.eligibility || '',
            applyLink: '',
            officialSourceUrl: '',
            authorName: 'Sarkari Afsar Editorial Team',
            slug,
            wordCount: (s.aboutScheme || '').split(' ').length,
          });

          // Track new title so next retry batch doesn't duplicate within same run
          existingTitles.push(s.schemeTitle);
          stateCreated++;
          totalCreated++;
          console.log(`[SchemeCron] ✓ (${totalCreated}/${DAILY_BATCH}) ${s.schemeTitle} [${state}]`);

          await new Promise(r => setTimeout(r, 2000));
        }

      } catch (err) {
        console.error(`[SchemeCron] Error generating for ${state} (attempt ${attempts}): ${err.message}`);
        await new Promise(r => setTimeout(r, 5000));
      }
    }

    if (stateCreated === 0) {
      console.log(`[SchemeCron] No schemes created for ${state} after ${attempts} attempts — moving on.`);
    }
  }

  console.log(`[SchemeCron] Done — ${totalCreated} schemes created today.`);
}

/**
 * Schedule scheme cron at 08:00 AM IST every day.
 */
function startSchemeCron() {
  // 08:00 IST = 02:30 UTC
  cron.schedule('30 2 * * *', async () => {
    console.log('[SchemeCron] Starting daily scheme generation...');
    try {
      await runSchemeCron();
    } catch (err) {
      console.error('[SchemeCron] Fatal error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[SchemeCron] Scheduled — runs daily at 08:00 AM IST');
}

module.exports = { startSchemeCron, runSchemeCron };

