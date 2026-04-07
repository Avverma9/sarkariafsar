/**
 * server/utils/aiCrons/blogCron.js
 * Daily cron: generates 5 AI-written blog posts about govt jobs / exams.
 * Runs at 07:00 AM IST every day.
 */

const cron = require('node-cron');
const Blog = require('../../models/blog');
const { generateText } = require('../gemini');

const DAILY_BLOG_TARGET = 5;
let isBlogCronRunning = false;

// ── Topics pool — shuffled each run so we don't repeat ────────────────────
const BLOG_TOPICS = [
  'How to prepare for UPSC CSE 2026',
  'Top 10 government jobs for graduates in India 2026',
  'SSC CGL 2026 complete guide for beginners',
  'Railway NTPC vs Group D: which to choose',
  'How to fill online government job application forms',
  'Best books for UPSC Prelims 2026',
  'State PCS exams list 2026: complete overview',
  'Bank PO vs SSC CGL: salary and career comparison',
  'How to get government job after 12th in India',
  'Defence jobs in India 2026: NDA, CDS, AFCAT guide',
  'Government jobs for women in India 2026',
  'How to crack SSC CHSL exam in 3 months',
  'IBPS PO 2026 preparation strategy',
  'Teaching jobs in government sector: TET, CTET guide',
  'Police recruitment 2026: state-wise notification guide',
  'How to write a good application for government jobs',
  'Age relaxation rules in government jobs India',
  'OBC, SC, ST reservation in government jobs explained',
  'EWS reservation: who is eligible and how to apply',
  'Medical government jobs 2026: AIIMS, ESIC, CHS guide',
  'How to download admit card for government exams',
  'Result checking process for government recruitment exams',
  'Document verification process in government job selection',
  'Physical fitness tests in government job recruitment India',
  'How to prepare for government exam at home without coaching',
];

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateSlug(text) {
  return String(text)
    .toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function extractJsonObject(raw) {
  const cleaned = String(raw || '').replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const first = cleaned.indexOf('{');
  const last = cleaned.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('Invalid JSON response from Gemini');
  }
  return cleaned.slice(first, last + 1);
}

function normalizeSections(sections) {
  if (!Array.isArray(sections)) return [];
  return sections
    .filter(s => s && typeof s === 'object')
    .map((s, idx) => ({
      heading: String(s.heading || `Section ${idx + 1}`).trim(),
      paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs.map(p => String(p || '').trim()).filter(Boolean) : [],
      bullets: Array.isArray(s.bullets) ? s.bullets.map(b => String(b || '').trim()).filter(Boolean) : [],
    }))
    .filter(s => s.heading && s.paragraphs.length);
}

async function generateUniqueBlogSlug(base) {
  const root = generateSlug(base) || `blog-${Date.now()}`;
  let slug = root;
  let suffix = 1;

  while (await Blog.findOne({ slug }, { _id: 1 }).lean()) {
    slug = `${root}-${suffix}`;
    suffix += 1;
  }

  return slug;
}

/**
 * Generates one blog post object using Gemini AI.
 */
async function generateOneBlog(topic) {
  const year = new Date().getFullYear();
  const prompt = `Write a detailed, SEO-friendly government job portal blog post about: "${topic} ${year}".

Return STRICT JSON only (no markdown, no \`\`\`, no commentary) with this exact structure:
{
  "title": "<engaging blog title with year>",
  "category": "<one of: Exam Tips, Career Guide, Government Jobs, Schemes, Results, Admit Card>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "excerpt": "<2-sentence summary, max 160 chars>",
  "intro": "<2-3 sentence introduction paragraph>",
  "sections": [
    { "heading": "<section heading>", "paragraphs": ["<para1>", "<para2>"], "bullets": ["<point1>", "<point2>"] },
    { "heading": "<section heading 2>", "paragraphs": ["<para>"], "bullets": [] }
  ],
  "readingTime": "<e.g. 5 min read>"
}

Requirements:
- At least 5 sections
- Each section must have at least 1 paragraph
- Total content must be 700-900 words
- Write in simple English for Indian government job aspirants
- Include practical tips and current information for ${year}
- Do NOT include any website links or ads`;

  const raw = await generateText(prompt);
  const parsed = JSON.parse(extractJsonObject(raw));

  const title = String(parsed.title || topic).trim();
  const intro = String(parsed.intro || '').trim() || `This guide covers ${topic} for ${year} aspirants.`;
  const excerpt = String(parsed.excerpt || '').trim() || `Complete guide on ${topic} with updated ${year} strategy.`;
  const sections = normalizeSections(parsed.sections);
  const slug = await generateUniqueBlogSlug(title || topic);

  if (!sections.length) {
    throw new Error('Gemini returned invalid sections payload');
  }

  return {
    slug,
    title,
    category: parsed.category || 'Career Guide',
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(t => String(t || '').trim()).filter(Boolean).slice(0, 8) : [],
    excerpt,
    intro,
    sections,
    readingTime: parsed.readingTime || '5 min read',
    author: 'Sarkari Afsar Editorial Team',
    authorBio: 'Expert team covering government jobs, exams and schemes in India.',
    publishedAt: new Date(),
    wordCount: Math.round((intro + JSON.stringify(sections)).split(' ').length),
  };
}

/**
 * Main cron task: generate 5 blogs per day.
 */
async function runBlogCron() {
  if (isBlogCronRunning) {
    console.log('[BlogCron] Skipping run — previous run still in progress');
    return { skipped: true, reason: 'already-running' };
  }

  isBlogCronRunning = true;

  const topics = shuffleArray(BLOG_TOPICS);
  let created = 0;
  let tried = 0;

  try {
    for (const topic of topics) {
      if (created >= DAILY_BLOG_TARGET) break;
      tried++;

      try {
        const blogData = await generateOneBlog(topic);

        await Blog.create(blogData);
        created++;
        console.log(`[BlogCron] Created (${created}/${DAILY_BLOG_TARGET}): ${blogData.title}`);

        await new Promise(r => setTimeout(r, 3000));
      } catch (err) {
        console.error(`[BlogCron] Failed topic "${topic}": ${err.message}`);
      }
    }

    const summary = { skipped: false, created, tried, target: DAILY_BLOG_TARGET };
    console.log(`[BlogCron] Done — ${created} blogs created (tried ${tried} topics)`);
    return summary;
  } finally {
    isBlogCronRunning = false;
  }
}

/**
 * Schedules the blog cron at 07:00 AM IST every day.
 * Call startBlogCron() once at server startup.
 */
function startBlogCron() {
  cron.schedule('0 7 * * *', async () => {
    console.log('[BlogCron] Starting daily blog generation...');

    try {
      await runBlogCron();
    } catch (err) {
      console.error('[BlogCron] Fatal error:', err.message);
    }
  }, { timezone: 'Asia/Kolkata' });

  console.log('[BlogCron] Scheduled — runs daily at 07:00 AM IST');
}

module.exports = { startBlogCron, runBlogCron };
