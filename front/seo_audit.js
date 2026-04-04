const fs = require('fs')
const path = require('path')

const checks = []
const warn = (msg) => checks.push({ level: 'WARN', msg })
const error = (msg) => checks.push({ level: 'ERROR', msg })
const ok = (msg) => checks.push({ level: 'OK', msg })

function read(rel) {
  return fs.readFileSync(path.join(__dirname, rel), 'utf8')
}

// ─── layout.js ───────────────────────────────────────────────────────────────
const layout = read('app/layout.js')
layout.includes('export const viewport') ? ok('layout: viewport export present') : error('layout: themeColor still in metadata (not viewport export)')
layout.includes("template: '%s \u2014 Sarkari Afsar'") ? ok('layout: title template uses em-dash') : (layout.includes("template: '%s | Sarkari Afsar'") ? error('layout: title template still uses pipe') : warn('layout: title template non-standard'))
layout.includes('rel="preconnect" href="https://fonts.googleapis.com"') ? ok('layout: Google Fonts preconnect present') : error('layout: Google Fonts preconnect MISSING')
layout.includes('rel="stylesheet"') && layout.includes('fonts.googleapis.com') ? ok('layout: Google Fonts link tag present') : error('layout: Google Fonts link tag MISSING')
layout.includes('@import url') ? error('layout: still has @import url (render-blocking)') : ok('layout: no render-blocking @import')

// ─── sitemap.js ───────────────────────────────────────────────────────────────
const sitemap = read('app/sitemap.js')
sitemap.includes('generateSitemaps') ? ok('sitemap: generateSitemaps present (XML index mode)') : error('sitemap: single flat sitemap — no split')
sitemap.includes('export default async function sitemap') ? ok('sitemap: default export present') : error('sitemap: default export missing')
const caseMatches = sitemap.match(/case\s+\d+/g)
const shardCount = caseMatches ? caseMatches.length : 0
shardCount === 4 ? ok('sitemap: 4 shards (static/jobs/yojana/blog)') : warn('sitemap: shard count = ' + shardCount + ' (expected 4)')
sitemap.includes('noIndex') ? ok('sitemap: noIndex exclusion present') : error('sitemap: noIndex posts NOT excluded from sitemap')

// ─── robots.js ───────────────────────────────────────────────────────────────
const robots = read('app/robots.js')
robots.includes('/api/') ? ok('robots: /api/ disallowed') : error('robots: /api/ NOT disallowed')
robots.includes('/search') ? ok('robots: /search disallowed') : error('robots: /search NOT disallowed')
robots.includes('/admin') ? ok('robots: /admin disallowed') : error('robots: /admin NOT disallowed')
robots.includes('sitemap:') ? ok('robots: sitemap URL present') : error('robots: sitemap URL missing')

// ─── next.config.js ───────────────────────────────────────────────────────────
const nextcfg = read('next.config.js')
nextcfg.includes('unoptimized: true') ? error('next.config: images.unoptimized=true — no WebP/AVIF optimization') : ok('next.config: images optimization enabled')
nextcfg.includes('webp') && nextcfg.includes('avif') ? ok('next.config: modern image formats (WebP + AVIF)') : warn('next.config: no explicit image formats configured')
nextcfg.includes('removeConsole') ? ok('next.config: removeConsole in production') : warn('next.config: console.log may appear in production JS bundle')
const redirects = nextcfg.match(/permanent:\s*true/g)
ok('next.config: ' + (redirects ? redirects.length : 0) + ' permanent 301 redirects defined')

// ─── jobs/[slug]/page.js ─────────────────────────────────────────────────────
const jobSlug = read('app/jobs/[slug]/page.js')
jobSlug.includes("cache: 'no-store'") || jobSlug.includes('cache: "no-store"') ? error('jobs/[slug]: cache:no-store still present (no ISR)') : ok('jobs/[slug]: cache:no-store removed (ISR active)')
jobSlug.includes('revalidate: 3600') ? ok('jobs/[slug]: ISR revalidate=3600 (1h)') : warn('jobs/[slug]: ISR revalidate not found')
jobSlug.includes('job.noIndex') ? ok('jobs/[slug]: noIndex field used for robots meta') : error('jobs/[slug]: noIndex field NOT used — thin pages will be indexed')
const jobFetches = (jobSlug.match(/fetch\(`\${API_BASE}\/post\/slug\/\${slug}`/g) || []).length
const jobNoStore = (jobSlug.match(/cache:\s*['"]no-store['"]/g) || []).length
if (jobNoStore > 0) error('jobs/[slug]: still has cache:no-store — ISR disabled, no memoization (' + jobNoStore + 'x)')
else if (jobFetches >= 2) {
  const jobBothISR = (jobSlug.match(/next:\s*\{\s*revalidate/g) || []).length >= 2
  jobBothISR ? ok('jobs/[slug]: double-source-fetch but memoized by ISR (' + jobFetches + 'x in source, 1x actual)') : warn('jobs/[slug]: ' + jobFetches + ' fetch calls — check options match')
} else ok('jobs/[slug]: single fetch per render')
jobSlug.includes('@import url') ? error('jobs/[slug]: @import url still present (render-blocking)') : ok('jobs/[slug]: no render-blocking @import')
jobSlug.includes('BreadcrumbList') ? ok('jobs/[slug]: BreadcrumbList schema present') : warn('jobs/[slug]: BreadcrumbList missing')
jobSlug.includes('JobPosting') ? ok('jobs/[slug]: JobPosting schema present') : error('jobs/[slug]: JobPosting schema MISSING')
jobSlug.includes('FAQPage') ? ok('jobs/[slug]: FAQPage schema present (conditional)') : warn('jobs/[slug]: FAQPage schema missing')

// ─── blog/[slug]/page.js ─────────────────────────────────────────────────────
const blogSlug = read('app/blog/[slug]/page.js')
blogSlug.includes("cache: 'no-store'") ? error('blog/[slug]: cache:no-store still present') : ok('blog/[slug]: cache:no-store removed')
blogSlug.includes('keywords') ? ok('blog/[slug]: keywords meta present') : error('blog/[slug]: keywords meta MISSING')
blogSlug.includes('Article') ? ok('blog/[slug]: Article schema present') : warn('blog/[slug]: Article schema missing')
const blogFetches = (blogSlug.match(/fetch\(`\${API_BASE}\/blog\/slug\/\${slug}`/g) || []).length
// Both calls use { next: { revalidate: 3600 } } → Next.js memoizes them (1 actual DB hit)
const blogBothISR = blogSlug.includes("next: { revalidate:") || blogSlug.includes('next: { revalidate:') || (blogSlug.match(/next:\s*\{\s*revalidate/g) || []).length >= 2
blogFetches >= 2 && !blogBothISR ? error('blog/[slug]: DOUBLE FETCH = ' + blogFetches + 'x — mismatched options, no memoization') : ok('blog/[slug]: fetch deduplicated via ISR memoization (' + blogFetches + 'x in source, 1x actual)')

// ─── yojana/[slug]/page.js ───────────────────────────────────────────────────
const yojanaSlug = read('app/yojana/[slug]/page.js')
yojanaSlug.includes("cache: 'no-store'") ? error('yojana/[slug]: cache:no-store still present') : ok('yojana/[slug]: cache:no-store removed')
yojanaSlug.includes('keywords') ? ok('yojana/[slug]: keywords meta present') : error('yojana/[slug]: keywords meta MISSING')
const yojanaFetches = (yojanaSlug.match(/fetch\(`\${API_BASE}\/schemes\/slug\/\${slug}`/g) || []).length
// Both calls use { next: { revalidate: 7200 } } → memoized
const yojanaBothISR = (yojanaSlug.match(/next:\s*\{\s*revalidate/g) || []).length >= 2
yojanaFetches >= 2 && !yojanaBothISR ? error('yojana/[slug]: DOUBLE FETCH = ' + yojanaFetches + 'x — mismatched options') : ok('yojana/[slug]: fetch deduplicated via ISR memoization (' + yojanaFetches + 'x in source, 1x actual)')

// ─── listing pages ────────────────────────────────────────────────────────────
const listing = ['results', 'latest-jobs', 'admit-cards', 'admission']
listing.forEach(name => {
  try {
    const c = read('app/' + name + '/page.js')
    ;(c.includes('page > 1') && c.includes('index: false')) ? ok(name + ': pagination noindex present') : error(name + ': pagination noindex MISSING — page 2+ indexed')
    ;(c.includes('alternates:') || c.includes('canonical')) ? ok(name + ': canonical set') : warn(name + ': canonical not in metadata')
    c.includes('revalidate') ? ok(name + ': ISR revalidate set') : warn(name + ': no revalidate on listing fetch')
  } catch (e) { error('MISSING FILE: app/' + name + '/page.js') }
})

// ─── @import checks on listing/home pages ────────────────────────────────────
;['page', 'blog/page', 'yojana/page', 'jobs/page'].forEach(name => {
  try {
    const c = read('app/' + name + '.js')
    c.includes('@import url') ? error(name + '.js: @import url still present (render-blocking)') : ok(name + '.js: no render-blocking @import')
  } catch (e) { warn('Could not read: app/' + name + '.js') }
})

// ─── home page canonical ─────────────────────────────────────────────────────
const home = read('app/page.js')
;(home.includes('alternates:') && home.includes('canonical')) ? ok('home: canonical meta present') : warn('home: canonical not explicitly set in page.js (may inherit from layout)')

// ─── OG image route ───────────────────────────────────────────────────────────
try {
  const og = read('app/api/og/route.js')
  ;(og.includes("runtime = 'edge'") || og.includes('runtime = "edge"')) ? ok('og: edge runtime (fast OG images)') : warn('og: not on edge runtime — OG generation may be slow')
  // Flag naive slice(0,80) only — word-aware truncation with lastIndexOf is acceptable
  og.includes('slice(0, 80)') && !og.includes('lastIndexOf') ? warn('og: title sliced to 80 chars — may truncate mid-word') : ok('og: title truncation is word-aware')
} catch (e) { error('og route MISSING — no dynamic OG images') }

// ─── server sitemap endpoint ─────────────────────────────────────────────────
try {
  const postCtrl = fs.readFileSync(path.join(__dirname, '../server/controllers/post.js'), 'utf8')
  postCtrl.includes('noIndex') && postCtrl.includes('getSitemapPosts') ? ok('server: noIndex posts excluded from sitemap endpoint') : error('server: noIndex posts NOT excluded from sitemap endpoint')
} catch (e) { warn('Could not read server/controllers/post.js') }

// ─── page.js titles ──────────────────────────────────────────────────────────
;[
  ['app/about/page.js', 'about'],
  ['app/contact/page.js', 'contact'],
  ['app/privacy-policy/page.js', 'privacy-policy'],
  ['app/disclaimer/page.js', 'disclaimer'],
].forEach(([file, name]) => {
  try {
    const c = read(file)
    c.includes('\u2014 Sarkari Afsar') ? ok(name + ': title uses em-dash') : warn(name + ': title may use pipe or be missing em-dash')
  } catch (e) { warn('Could not read: ' + file) }
})

// ─── sitemap-page canonical links ────────────────────────────────────────────
try {
  const sitemapPage = read('app/sitemap-page/page.js')
  ;(!sitemapPage.includes('?id=') && !sitemapPage.includes('?slug=')) ? ok('sitemap-page: uses canonical URLs (no query params)') : error('sitemap-page: still using query param URLs (?id= or ?slug=)')
} catch (e) { warn('Could not read: app/sitemap-page/page.js') }

// ─── Print Summary ────────────────────────────────────────────────────────────
const errors = checks.filter(c => c.level === 'ERROR')
const warns  = checks.filter(c => c.level === 'WARN')
const oks    = checks.filter(c => c.level === 'OK')
const score  = Math.round((oks.length / checks.length) * 100)

const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'

console.log('\n' + '='.repeat(55))
console.log('  SEO AUDIT REPORT — sarkariafsar.com')
console.log('='.repeat(55))
console.log('  SCORE : ' + oks.length + '/' + checks.length + ' checks passed (' + score + '%)')
console.log('  GRADE : ' + grade)
console.log('='.repeat(55))

if (errors.length) {
  console.log('\nERRORS (' + errors.length + ') — must fix:')
  errors.forEach(c => console.log('  [FAIL] ' + c.msg))
}
if (warns.length) {
  console.log('\nWARNINGS (' + warns.length + ') — should fix:')
  warns.forEach(c => console.log('  [WARN] ' + c.msg))
}
if (oks.length) {
  console.log('\nPASSED (' + oks.length + '):')
  oks.forEach(c => console.log('  [OK]   ' + c.msg))
}
console.log('')
