/**
 * server/utils/aiCrons/blogCron.js
 * Daily cron: generates 5 AI-written blog posts about govt jobs / exams.
 * Runs at 07:00 AM IST every day.
 */

const cron = require('node-cron');
const Blog = require('../../models/blog');
const { generateText } = require('../gemini');

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

  // Strip possible markdown code fences
  const jsonStr = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  const parsed = JSON.parse(jsonStr);

  const slug = generateSlug(parsed.title || topic);

  return {
    slug,
    title: parsed.title || topic,
    category: parsed.category || 'Career Guide',
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    excerpt: parsed.excerpt || '',
    intro: parsed.intro || '',
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    readingTime: parsed.readingTime || '5 min read',
    author: 'Sarkari Afsar Editorial Team',
    authorBio: 'Expert team covering government jobs, exams and schemes in India.',
    publishedAt: new Date(),
    wordCount: Math.round((parsed.intro + JSON.stringify(parsed.sections)).split(' ').length),
  };
}

/**
 * Main cron task: generate 5 blogs per day.
 */
async function runBlogCron() {
  const topics = shuffleArray(BLOG_TOPICS);
  let created = 0;
  let tried = 0;

  for (const topic of topics) {
    if (created >= 5) break;
    tried++;
    try {
      const blogData = await generateOneBlog(topic);

      // Skip if slug already exists
      const exists = await Blog.findOne({ slug: blogData.slug });
      if (exists) {
        console.log(`[BlogCron] Slug exists, skipping: ${blogData.slug}`);
        continue;
      }

      await Blog.create(blogData);
      created++;
      console.log(`[BlogCron] Created (${created}/5): ${blogData.title}`);

      // Small delay between requests to avoid rate-limiting
      await new Promise(r => setTimeout(r, 3000));
    } catch (err) {
      console.error(`[BlogCron] Failed topic "${topic}": ${err.message}`);
    }
  }
  console.log(`[BlogCron] Done — ${created} blogs created (tried ${tried} topics)`);
}

/**
 * Schedules the blog cron at 07:00 AM IST every day.
 * Call startBlogCron() once at server startup.
 */
function startBlogCron() {
  // 07:00 IST = 01:30 UTC
  cron.schedule('30 1 * * *', async () => {
    console.log('[BlogCron] Starting daily blog generation...');
    await runBlogCron();
  }, { timezone: 'Asia/Kolkata' });

  console.log('[BlogCron] Scheduled — runs daily at 07:00 AM IST');
}

module.exports = { startBlogCron, runBlogCron };
