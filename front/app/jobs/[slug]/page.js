import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

// ── generateMetadata (unchanged logic) ────────────────────────────────────
export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_BASE}/post/slug/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    const job = data?.data
    if (!job) return { title: 'Job Not Found - Sarkari Afsar' }
    const canonical = `${SITE_URL}/jobs/${job.slug}`
    const year = new Date().getFullYear()

    // ── Keywords: AI-generated (seo.keywords + tags) merged with rule-based, deduped ──
    const aiKeywords = [
      ...(job.seo?.keywords || []),
      ...(job.tags || []),
    ]
    const baseKeywords = [
      job.title,
      job.conductingAuthority,
      job.location,
      `sarkari naukri ${year}`,
      'government job',
      job.category,
    ]
    const keywords = [...new Set([...aiKeywords, ...baseKeywords].filter(Boolean))].slice(0, 15)

    // ── Description: prefer manually/AI set metaDescription, else auto-build ──
    const lastDateStr = job.applyLastDate
      ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : null
    let desc = job.seo?.metaDescription?.trim() || ''
    if (!desc) {
      const descParts = [`Apply for ${job.title} ${year}.`]
      if (job.conductingAuthority) descParts.push(`Conducting Authority: ${job.conductingAuthority}.`)
      if (job.totalVacancies) descParts.push(`Total Vacancies: ${job.totalVacancies}.`)
      if (lastDateStr) descParts.push(`Last Date: ${lastDateStr}.`)
      else descParts.push('Check official site for last date.')
      desc = descParts.join(' ')
    }

    // ── OG Image: prefer real downloaded post image, fallback to generated OG ──
    const ogImageUrl = job.seo?.ogImage
      ? (job.seo.ogImage.startsWith('http') ? job.seo.ogImage : `${SITE_URL}${job.seo.ogImage}`)
      : `${SITE_URL}/api/og?title=${encodeURIComponent(job.title)}&type=job`

    return {
      title: `${job.title} ${year} — Sarkari Afsar`,
      description: desc,
      keywords,
      // Reduce snippet length for closed/expired jobs to avoid stale info in SERPs
      robots: job.isActive === false
        ? { index: true, follow: true, 'max-snippet': 100, 'max-image-preview': 'large' }
        : undefined,
      alternates: { canonical },
      openGraph: {
        title: `${job.title} ${year}`,
        description: desc,
        url: canonical,
        siteName: 'Sarkari Afsar',
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${job.title} ${year}` }],
        locale: 'en_IN',
        type: 'article',
        publishedTime: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
        modifiedTime: job.updatedAt ? new Date(job.updatedAt).toISOString() : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${job.title} ${year}`,
        description: desc,
        images: [ogImageUrl],
        site: '@sarkariafsar',
      },
    }
  } catch { return { title: 'Job Details - Sarkari Afsar' } }
}

// ── Date utilities (all unchanged) ────────────────────────────────────────
const MONTH_MAP = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
  january:0,february:1,march:2,april:3,may2:4,june:5,july:6,august:7,
  september:8,october:9,november:10,december:11,
}
function parseTextDate(str) {
  const s = String(str||'').trim()
  let m = s.match(/^(\d{1,2})(?:st|nd|rd|th)?[\s-]+([A-Za-z]+)[,\s]+(\d{4})/i)
  if(m){const mo=MONTH_MAP[m[2].toLowerCase().slice(0,9)];if(mo!==undefined)return new Date(+m[3],mo,+m[1])}
  m=s.match(/^([A-Za-z]+)[\s]+([0-9]{1,2})(?:st|nd|rd|th)?[,\s]+(\d{4})/i)
  if(m){const mo=MONTH_MAP[m[1].toLowerCase().slice(0,9)];if(mo!==undefined)return new Date(+m[3],mo,+m[2])}
  m=s.match(/^(\d{1,2})-(\d{1,2})[\s]+([A-Za-z]+)[,\s]+(\d{4})/i)
  if(m){const mo=MONTH_MAP[m[3].toLowerCase().slice(0,9)];if(mo!==undefined)return new Date(+m[4],mo,+m[1])}
  const iso=new Date(s);return isNaN(iso.getTime())?null:iso
}
const DATE_LABEL_KEYWORDS=[
  {re:/fee\s*(?:payment|deposit)|last\s*date\s*for\s*fee|payment\s*last\s*date/i,label:'Fee Last Date'},
  {re:/application\s*(?:start|begin|open)|apply\s*start\s*date|online\s*apply\s*start/i,label:'Application Start'},
  {re:/(?:last\s*date|closing\s*date|apply\s*(?:by|before)|end\s*date)/i,label:'Last Date to Apply'},
  {re:/(?:admit\s*card|hall\s*ticket)/i,label:'Admit Card'},
  {re:/(?:exam\s*date|written\s*test|cbt|examination\s*date)/i,label:'Exam Date'},
  {re:/(?:result|merit\s*list)/i,label:'Result Date'},
  {re:/(?:interview|document\s*verif)/i,label:'Interview'},
  {re:/(?:notification|advt|advertisement)/i,label:'Notification'},
  {re:/(?:age\s*limit|age\s*as\s*on|as\s*on\s*date)/i,label:'Age Cutoff Date'},
  {re:/(?:registration|apply\s*online)/i,label:'Registration'},
]
function getDateLabel(text,idx){
  const win=text.slice(Math.max(0,idx-80),idx)
  let result=null,lastMatchEnd=-1
  for(const{re,label}of DATE_LABEL_KEYWORDS){
    const gr=new RegExp(re.source,'gi');let m2
    while((m2=gr.exec(win))!==null){const end=m2.index+m2[0].length;if(end>lastMatchEnd){lastMatchEnd=end;result=label}}
  }
  return result
}
function extractAllDates(text){
  const patterns=[
    /\d{1,2}-\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+\d{4}/gi,
    /\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)[,\s]+\d{4}/gi,
    /(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{4}/gi,
  ]
  const found=new Map()
  for(const p of patterns){let m;while((m=p.exec(text))!==null){const raw=m[0].trim();if(!found.has(raw)){const d=parseTextDate(raw);if(d){const label=getDateLabel(text,m.index);found.set(raw,{text:raw,date:d,idx:m.index,label})}}}}
  return[...found.values()]
}
function classifyDates(html){
  const today=new Date();today.setHours(0,0,0,0)
  const minDate=new Date(today.getFullYear()-1,0,1)
  const maxDate=new Date(today.getFullYear()+2,11,31)
  const text=(html||'').replace(/<[^>]+>/g,' ')
  const all=extractAllDates(text)
  const expired=[],upcoming=[]
  for(const d of all){if(d.date<minDate||d.date>maxDate)continue;if(d.date<today)expired.push(d);else upcoming.push(d)}
  return{expired:expired.slice(0,8),upcoming:upcoming.slice(0,6)}
}
function detectExtensions(expired,upcoming){
  const extensionMap=new Map()
  for(const exp of expired){
    if(!exp.label)continue
    const matches=upcoming.filter(up=>{if(up.label!==exp.label)return false;if(up.date<=exp.date)return false;return(up.date-exp.date)/(1000*60*60*24)<=60}).sort((a,b)=>a.date-b.date)
    if(matches.length>0)extensionMap.set(exp.text,matches[0])
  }
  return extensionMap
}
const NO_BADGE_LABELS=new Set(['Application Start','Date of Birth','Age Cutoff Date','Notification'])
function injectDateBadges(html,expired,upcoming,jobMeta={}){
  if(!html)return html
  const{isActive,updatedAt}=jobMeta
  const today=new Date();today.setHours(0,0,0,0)
  const postUpdatedAt=updatedAt?new Date(updatedAt):null
  const updatedDaysAgo=postUpdatedAt&&!isNaN(postUpdatedAt)?Math.round((today-postUpdatedAt)/(1000*60*60*24)):Infinity
  const isRecentlyUpdated=updatedDaysAgo<=60
  const formattedUpdatedAt=postUpdatedAt&&!isNaN(postUpdatedAt)?postUpdatedAt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):''
  const extensionMap=detectExtensions(expired,upcoming)
  const extensionTargetTexts=new Set([...extensionMap.values()].map(e=>e.text))
  const ACTIVE_BADGE=`<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#16a34a;background:#f0fdf4;border:1px solid #86efac;padding:1px 8px;border-radius:9999px;margin-left:5px;vertical-align:middle;white-space:nowrap;line-height:1.4;">Active</span>`
  const UPDATED_BADGE=`<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#1d4ed8;background:#eff6ff;border:1px solid #93c5fd;padding:1px 8px;border-radius:9999px;margin-left:5px;vertical-align:middle;white-space:nowrap;line-height:1.4;">Updated: ${formattedUpdatedAt}</span>`
  const extendedBadge=(newDateText)=>`<span style="display:inline-flex;align-items:center;gap:3px;font-size:10px;font-weight:700;color:#7c3aed;background:#f5f3ff;border:1px solid #c4b5fd;padding:1px 8px;border-radius:9999px;margin-left:5px;vertical-align:middle;white-space:nowrap;line-height:1.4;">Extended to ${newDateText}</span>`
  const badgeMap=new Map()
  for(const item of expired){if(NO_BADGE_LABELS.has(item.label))continue;const ext=extensionMap.get(item.text);if(ext)badgeMap.set(item.text,extendedBadge(ext.text));else if(isActive)badgeMap.set(item.text,ACTIVE_BADGE);else if(isRecentlyUpdated&&formattedUpdatedAt)badgeMap.set(item.text,UPDATED_BADGE)}
  for(const item of upcoming){if(extensionTargetTexts.has(item.text))continue;if(NO_BADGE_LABELS.has(item.label))continue;if(!badgeMap.has(item.text))badgeMap.set(item.text,ACTIVE_BADGE)}
  if(!badgeMap.size)return html
  const sortedTexts=[...badgeMap.keys()].sort((a,b)=>b.length-a.length)
  const escapedParts=sortedTexts.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))
  const combinedRe=new RegExp(`(${escapedParts.join('|')})(?![^<>]*>)`,'g')
  return html.replace(combinedRe,(match)=>match+(badgeMap.get(match)??''))
}

// ── Design tokens ──────────────────────────────────────────────────────────
const T = {
  navy:    '#0f1f3d',
  gold:    '#c9a84c',
  goldL:   '#f5edd6',
  ink:     '#1c1c1c',
  muted:   '#6b6355',
  faint:   '#9c8f7a',
  rule:    '#e8e3d8',
  bg:      '#faf8f4',
  white:   '#ffffff',
  green:   '#15803d',
  greenL:  '#f0fdf4',
  red:     '#b91c1c',
  redL:    '#fef2f2',
  purple:  '#6d28d9',
  purpleL: '#f5f3ff',
}

const serif = "'Lora', Georgia, 'Times New Roman', serif"
const sans  = "'DM Sans', system-ui, sans-serif"

// ── Shared card wrapper ────────────────────────────────────────────────────
function Card({ children, style = {}, accent }) {
  return (
    <div style={{
      background: T.white,
      border: `1px solid ${T.rule}`,
      borderTop: accent ? `3px solid ${accent}` : `1px solid ${T.rule}`,
      borderRadius: 8,
      overflow: 'hidden',
      marginBottom: 16,
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      ...style,
    }}>
      {children}
    </div>
  )
}

function CardHeader({ title, icon, right, level = 2 }) {
  const Tag = `h${level}`
  return (
    <div style={{
      padding: '12px 18px',
      borderBottom: `1px solid ${T.rule}`,
      background: '#faf8f4',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* emoji outside heading so screen readers don't announce it */}
        {icon && <span style={{ fontSize: 14 }} aria-hidden="true">{icon}</span>}
        <Tag style={{
          fontFamily: sans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: T.muted,
          margin: 0,
        }}>
          {title}
        </Tag>
      </div>
      {right}
    </div>
  )
}

function Row({ label, value, highlight }) {
  if (!value) return null
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 12,
      padding: '9px 18px',
      borderBottom: `1px solid ${T.rule}`,
    }}>
      <span style={{ fontFamily: sans, fontSize: 12, color: T.faint, flexShrink: 0 }}>{label}</span>
      <span style={{
        fontFamily: sans,
        fontSize: 12,
        fontWeight: 600,
        color: highlight || T.ink,
        textAlign: 'right',
        wordBreak: 'break-word',
      }}>
        {value}
      </span>
    </div>
  )
}

// ── Sidebar components ─────────────────────────────────────────────────────

function ApplyButton({ href }) {
  if (!href) return null
  return (
    <Card accent={T.green} style={{ marginBottom: 16 }}>
      <div style={{ padding: '18px 18px 14px', textAlign: 'center' }}>
        <div style={{ fontFamily: sans, fontSize: 10, color: T.faint, marginBottom: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Official Application Portal
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block',
            width: '100%',
            padding: '11px 0',
            background: T.green,
            color: '#fff',
            borderRadius: 6,
            fontFamily: sans,
            fontSize: 13,
            fontWeight: 700,
            textDecoration: 'none',
            letterSpacing: '0.04em',
            boxSizing: 'border-box',
            textAlign: 'center',
          }}
        >
          Apply Online →
        </a>
        <div style={{ fontFamily: sans, fontSize: 10, color: T.faint, marginTop: 8, fontStyle: 'italic' }}>
          Always verify from official source
        </div>
      </div>
    </Card>
  )
}

function QuickStatsCard({ job, hasVacancyTable }) {
  const rows = [
    // Suppress totalVacancies if VacancyTableCard already shows it on the page
    !hasVacancyTable && { label: '👥 Total Vacancies', value: job.totalVacancies ? String(job.totalVacancies) : null },
    { label: '💰 Pay Scale',  value: job.salary },
    // Suppress Max Age — AgeLimitCard already shows full detail
    { label: '📂 Category',   value: job.category },
    { label: '📍 Location',   value: job.location },
    { label: '#  Advt. No.', value: job.advertisementNumber },
  ].filter(r => r && r.value)
  if (!rows.length) return null
  return (
    <Card accent={T.navy}>
      <CardHeader title="Quick Overview" icon="📋" />
      <div>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 10,
            padding: '8px 18px',
            borderBottom: i < rows.length - 1 ? `1px solid ${T.rule}` : 'none',
          }}>
            <span style={{ fontFamily: sans, fontSize: 11.5, color: T.faint, flexShrink: 0 }}>{r.label}</span>
            <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: T.ink, textAlign: 'right', wordBreak: 'break-word', maxWidth: '60%' }}>{r.value}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

function ImportantDatesCard({ dates }) {
  if (!dates || typeof dates !== 'object') return null
  const entries = Object.entries(dates).filter(([, v]) => v)
  if (!entries.length) return null
  const today = new Date(); today.setHours(0,0,0,0)
  return (
    <Card accent="#1d4ed8">
      <CardHeader title="Important Dates" icon="📅" />
      <div>
        {entries.map(([label, value], i) => {
          const parsed = parseTextDate(String(value))
          const isUpcoming = parsed && parsed >= today
          const isExpired  = parsed && parsed < today
          return (
            <div key={label} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 10,
              padding: '8px 18px',
              borderBottom: i < entries.length - 1 ? `1px solid ${T.rule}` : 'none',
            }}>
              <span style={{ fontFamily: sans, fontSize: 11, color: T.faint }}>{label}</span>
              <span style={{
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 600,
                color: isUpcoming ? T.green : isExpired ? T.red : T.ink,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}>
                {isUpcoming && <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, display: 'inline-block', animation: 'pulse 2s infinite' }} />}
                <time dateTime={parsed ? parsed.toISOString().slice(0, 10) : undefined}>{String(value)}</time>
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function AppFeeCard({ fee }) {
  if (!fee || typeof fee !== 'object') return null
  const rows = [
    { label: 'General / OBC', value: fee.general },
    { label: 'SC / ST',        value: fee.sc },
    { label: 'PwD',            value: fee.ph },
    { label: 'EWS',            value: fee.ews },
  ].filter(r => r.value != null)
  if (!rows.length) return null
  return (
    <Card accent={T.gold}>
      <CardHeader title="Application Fee" icon="💳" />
      <div>
        {rows.map((r, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '8px 18px',
            borderBottom: i < rows.length - 1 ? `1px solid ${T.rule}` : 'none',
          }}>
            <span style={{ fontFamily: sans, fontSize: 11.5, color: T.faint }}>{r.label}</span>
            <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: '#92400e' }}>₹{r.value}/-</span>
          </div>
        ))}
        {fee.paymentModes?.length > 0 && (
          <div style={{ padding: '8px 18px' }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.faint }}>
              Via: {fee.paymentModes.join(' · ')}
            </span>
          </div>
        )}
      </div>
    </Card>
  )
}

function AgeLimitCard({ ageLimit }) {
  if (!ageLimit) return null
  const { min, max, byCategory } = ageLimit
  if (!min && !max && !byCategory?.length) return null
  return (
    <Card>
      <CardHeader title="Age Limit" icon="🎂" />
      <div style={{ padding: '14px 18px' }}>
        {(min || max) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: byCategory?.length ? 12 : 0 }}>
            {min && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: T.navy }}>{min}</div>
                <div style={{ fontFamily: sans, fontSize: 9, color: T.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Min Yrs</div>
              </div>
            )}
            {min && max && <div style={{ height: 28, width: 1, background: T.rule }} />}
            {max && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: serif, fontSize: 22, fontWeight: 700, color: T.navy }}>{max}</div>
                <div style={{ fontFamily: sans, fontSize: 9, color: T.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Max Yrs</div>
              </div>
            )}
          </div>
        )}
        {byCategory?.length > 0 && (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {byCategory.map((c, i) => (
              <li key={i} style={{
                fontFamily: sans,
                fontSize: 11.5,
                color: T.muted,
                padding: '4px 0',
                borderBottom: i < byCategory.length - 1 ? `1px solid ${T.rule}` : 'none',
                display: 'flex',
                gap: 6,
              }}>
                <span style={{ color: T.gold, flexShrink: 0 }}>›</span>
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}

function ImportantLinksCard({ links }) {
  if (!links?.length) return null

  // 1. Filter valid links
  const filtered = links.filter(l => l.label && l.url)
  if (!filtered.length) return null

  // 2. Deduplicate by URL (keep first occurrence)
  const seenUrls = new Set()
  const deduped = filtered.filter(l => {
    if (seenUrls.has(l.url)) return false
    seenUrls.add(l.url)
    return true
  })

  // 3. Group by label — preserves all URLs without repeating the same button
  const groups = []
  const groupMap = {}
  deduped.forEach(l => {
    if (groupMap[l.label] !== undefined) {
      groups[groupMap[l.label]].items.push(l)
    } else {
      groupMap[l.label] = groups.length
      groups.push({ label: l.label, type: l.type, items: [l] })
    }
  })

  if (!groups.length) return null

  const TYPE_STYLE = {
    apply:         { bg: T.green,   color: '#fff' },
    'admit-card':  { bg: '#7c3aed', color: '#fff' },
    result:        { bg: '#0369a1', color: '#fff' },
    notification:  { bg: T.gold,    color: T.ink  },
    official:      { bg: T.navy,    color: '#fff' },
    'answer-key':  { bg: '#c2410c', color: '#fff' },
  }

  return (
    <Card>
      <CardHeader title="Important Links" icon="🔗" />
      <div style={{ padding: '12px 18px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        {groups.map((group, gi) => {
          const s = TYPE_STYLE[group.type] || { bg: T.muted, color: '#fff' }
          if (group.items.length === 1) {
            // Single link — full button as before
            return (
              <a
                key={gi}
                href={group.items[0].url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: s.bg,
                  color: s.color,
                  borderRadius: 5,
                  fontFamily: sans,
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  gap: 6,
                }}
              >
                <span>{group.label}</span>
                <span style={{ opacity: 0.7, fontSize: 10 }}>↗</span>
              </a>
            )
          }
          // Multiple URLs under same label — group header + numbered sub-links
          return (
            <div key={gi} style={{ borderRadius: 5, overflow: 'hidden', border: `1px solid ${s.bg}` }}>
              {/* Group header (non-clickable) */}
              <div style={{
                padding: '7px 12px',
                background: s.bg,
                color: s.color,
                fontFamily: sans,
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>{group.label}</span>
                <span style={{ opacity: 0.75, fontSize: 10 }}>{group.items.length} links</span>
              </div>
              {/* Sub-links */}
              {group.items.map((item, ii) => (
                <a
                  key={ii}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 12px',
                    background: ii % 2 === 0 ? '#f8f9fa' : '#fff',
                    color: '#1e3a5f',
                    fontFamily: sans,
                    fontSize: 11,
                    fontWeight: 500,
                    textDecoration: 'none',
                    borderTop: `1px solid #e5e7eb`,
                    gap: 6,
                  }}
                >
                  <span style={{ color: s.bg, fontWeight: 700, marginRight: 4 }}>{ii + 1}.</span>
                  <span style={{ flex: 1 }}>Link {ii + 1}</span>
                  <span style={{ opacity: 0.5, fontSize: 10 }}>↗</span>
                </a>
              ))}
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ── Main content components ────────────────────────────────────────────────

function VacancyTableCard({ vacancyTable, totalVacancies }) {
  if (!vacancyTable?.length) return null
  return (
    <Card accent={T.navy} style={{ marginBottom: 20 }}>
      <CardHeader
        title="Vacancy Breakdown"
        icon="👥"
        right={totalVacancies && (
          <span style={{
            fontFamily: sans, fontSize: 10, fontWeight: 700,
            background: T.navy, color: '#fff',
            padding: '2px 10px', borderRadius: 20,
          }}>
            Total: {totalVacancies}
          </span>
        )}
      />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: sans }}>
          <thead>
            <tr style={{ background: '#faf8f4' }}>
              {['Post', 'Count', 'UR', 'OBC', 'SC', 'ST', 'EWS'].map((h, i) => (
                <th key={h} style={{
                  padding: '7px 14px',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.faint,
                  textAlign: i === 0 ? 'left' : 'center',
                  borderBottom: `1px solid ${T.rule}`,
                  display: i > 1 ? undefined : undefined,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vacancyTable.map((row, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.rule}` }}>
                <td style={{ padding: '9px 14px', fontSize: 12.5, fontWeight: 500, color: T.ink }}>{row.post || '—'}</td>
                <td style={{ padding: '9px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.navy }}>{row.count || row.total || '—'}</td>
                {['ur','obc','sc','st','ews'].map(k => (
                  <td key={k} style={{ padding: '9px 14px', textAlign: 'center', fontSize: 12, color: T.muted }}>{row[k] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

function EligibilityCard({ eligibility }) {
  if (!eligibility?.length) return null
  return (
    <Card style={{ marginBottom: 20 }}>
      <CardHeader title="Eligibility & Qualification" icon="🎓" />
      <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {eligibility.map((e, i) => (
          <div key={i} style={{
            paddingLeft: 12,
            borderLeft: `2px solid ${T.gold}`,
          }}>
            <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: T.ink, marginBottom: 3 }}>
              {e.post}
            </div>
            <div style={{ fontFamily: sans, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>
              {e.qualification || 'See official notification'}
            </div>
            {e.payScale && (
              <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: '#92400e', marginTop: 4 }}>
                💰 {e.payScale}
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function SelectionProcessCard({ steps }) {
  if (!steps?.length) return null
  return (
    <Card style={{ marginBottom: 20 }}>
      <CardHeader title="Selection Process" icon="🏆" />
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {/* connector line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute',
                  top: 14,
                  left: '50%',
                  width: '100%',
                  height: 1,
                  background: T.rule,
                  zIndex: 0,
                }} />
              )}
              {/* step circle */}
              <div style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: T.navy,
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: sans,
                fontSize: 11,
                fontWeight: 700,
                flexShrink: 0,
                position: 'relative',
                zIndex: 1,
                marginBottom: 8,
              }}>
                {i + 1}
              </div>
              <div style={{
                fontFamily: sans,
                fontSize: 10,
                color: T.muted,
                textAlign: 'center',
                lineHeight: 1.4,
                padding: '0 4px',
              }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

const BLOCK_META = {
  introduction:       { icon: '📌', accent: '#dbeafe', label: 'Overview' },
  'exam-tips':        { icon: '🎯', accent: '#fef3c7', label: 'Exam Tips' },
  salary:             { icon: '💰', accent: '#d1fae5', label: 'Salary Info' },
  'how-to':           { icon: '📝', accent: '#f0fdf4', label: 'How To Apply' },
  'dates-tips':       { icon: '📅', accent: '#eff6ff', label: 'Dates & Tips' },
  preparation:        { icon: '📚', accent: '#fdf4ff', label: 'Preparation' },
  trust:              { icon: '🔒', accent: '#fef2f2', label: 'Official Source' },
  'trust-signal':     { icon: '🔒', accent: '#fef2f2', label: 'Important Note' },
  analysis:           { icon: '📊', accent: '#f0f9ff', label: 'Competition Analysis' },
  counselling:        { icon: '🗂️', accent: '#fdf4ff', label: 'Counselling' },
  documents:          { icon: '📄', accent: '#fafaf0', label: 'Documents' },
  links:              { icon: '🔗', accent: '#f0f9ff', label: 'Links' },
  // New v3 types — no duplication with structured cards
  'fee-tips':         { icon: '💳', accent: '#fffbeb', label: 'Fee Tips' },
  'age-info':         { icon: '🎂', accent: '#fffbeb', label: 'Age & Relaxation' },
  'vacancy-insight':  { icon: '📊', accent: '#f0f9ff', label: 'Vacancy Insights' },
  'who-should-apply': { icon: '🎓', accent: '#fefce8', label: 'Who Should Apply' },
  'exam-strategy':    { icon: '🏆', accent: '#f0fdf4', label: 'Exam Strategy' },
  'expert-faq':       { icon: '❓', accent: '#f8fafc', label: 'Expert FAQ' },
  mistakes:           { icon: '⚠️', accent: '#fef2f2', label: 'Common Mistakes' },
}

function HumanContentSection({ humanContent }) {
  if (!humanContent?.blocks?.length) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: T.rule }} />
        <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: T.faint }}>
          Detailed Guide
        </span>
        <div style={{ flex: 1, height: 1, background: T.rule }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {humanContent.blocks.map((block, idx) => {
          const meta  = BLOCK_META[block.type] || { icon: '📋', accent: '#f9f9f9', label: block.type }
          const lines = block.content.split('\n').filter(l => l.trim())
          const isWide = lines.join(' ').length > 300

          return (
            <div
              key={block.blockId}
              style={{
                gridColumn: isWide ? '1 / -1' : 'auto',
                background: meta.accent,
                border: `1px solid ${T.rule}`,
                borderRadius: 8,
                padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ fontSize: 15 }} aria-hidden="true">{meta.icon}</span>
                <h3 style={{
                  fontFamily: sans,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: T.faint,
                  margin: 0,
                }}>
                  {meta.label}
                </h3>
              </div>
              <div style={{ fontFamily: sans, fontSize: 13, color: T.ink, lineHeight: 1.7 }}>
                {lines.map((line, i) => {
                  const isList = /^[•\-]/.test(line) || /^\d+[.)]\s/.test(line)
                  return isList
                    ? <div key={i} style={{ marginBottom: 4, paddingLeft: 4 }}>{line}</div>
                    : <p key={i} style={{ margin: i > 0 ? '8px 0 0' : '0' }}>{line}</p>
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StructuredFaqSection({ faq }) {
  if (!faq?.length) return null
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(f => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
  return (
    <Card style={{ marginBottom: 20 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <CardHeader title="Frequently Asked Questions" icon="❓" />
      <div style={{ padding: '10px 0' }}>
        {faq.map((item, i) => (
          <details key={i} style={{ borderBottom: i < faq.length - 1 ? `1px solid ${T.rule}` : 'none' }}>
            <summary style={{
              padding: '11px 18px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              listStyle: 'none',
              fontFamily: sans,
              fontSize: 13,
              fontWeight: 600,
              color: T.ink,
              userSelect: 'none',
            }}>
              <span>{item.q}</span>
              <span style={{ color: T.faint, flexShrink: 0, fontSize: 18, lineHeight: 1 }}>+</span>
            </summary>
            <div style={{
              padding: '10px 18px 14px',
              background: T.bg,
              fontFamily: sans,
              fontSize: 13,
              color: T.muted,
              lineHeight: 1.7,
              borderTop: `1px solid ${T.rule}`,
            }}>
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </Card>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────
export default async function JobDetailPage({ params }) {
  const { slug } = await params
  let job = null
  try {
    const res  = await fetch(`${API_BASE}/post/slug/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    job = data?.data
  } catch {}
  if (!job) return notFound()

  const contentHtml   = job.scrapedContent?.contentHtml || job.content || ''
  const importantDates= job.scrapedContent?.contentJson?.importantDates || job.importantDates || null
  const structuredFaq = job.structured?.faq || []
  const vacancyTable  = job.structured?.vacancyTable || []
  const importantLinks= job.structured?.importantLinks || []

  const { expired, upcoming } = classifyDates(contentHtml)
  const annotatedHtml = injectDateBadges(contentHtml, expired, upcoming, {
    isActive: job.isActive,
    updatedAt: job.updatedAt,
  })

  const applyDate = job.applyLastDate
    ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : 'N/A'
  const postedDate = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : ''
  const canonical = `${SITE_URL}/jobs/${job.slug}`

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type':'ListItem', position:1, name:'Home', item:SITE_URL },
      { '@type':'ListItem', position:2, name:'Jobs', item:`${SITE_URL}/jobs` },
      { '@type':'ListItem', position:3, name:job.title, item:canonical },
    ],
  }

  const jobPostingSchema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.jobtitle || job.title,
    description: [
      job.title,
      job.conductingAuthority && `Conducting Authority: ${job.conductingAuthority}`,
      job.totalVacancies && `Total Vacancies: ${job.totalVacancies}`,
      job.salary && `Salary: ${job.salary}`,
    ].filter(Boolean).join('. '),
    datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    validThrough: job.applyLastDate
      ? new Date(job.applyLastDate).toISOString()
      : new Date(Date.now() + 90*24*60*60*1000).toISOString(),
    employmentType: 'FULL_TIME',
    url: canonical,
    identifier: {
      '@type': 'PropertyValue',
      name: job.advertisementNumber ? 'Advertisement Number' : 'SarkariAfsar',
      value: job.advertisementNumber || job.slug,
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: job.conductingAuthority || 'Government of India',
      sameAs: job.officialWebsite || 'https://sarkariafsar.com',
    },
    jobLocation: {
      '@type': 'Place',
      address: { '@type':'PostalAddress', addressCountry:'IN', addressRegion: job.location || 'India' },
    },
    ...(job.totalVacancies && { vacancyCount: job.totalVacancies }),
    ...(job.eligibility?.length && {
      educationRequirements: {
        '@type': 'EducationalOccupationalCredential',
        credentialCategory: job.eligibility.map(e => e.qualification).filter(Boolean).join('; '),
      },
    }),
    ...(job.salary && {
      baseSalary: {
        '@type': 'MonetaryAmount',
        currency: 'INR',
        value: { '@type':'QuantitativeValue', value:job.salary, unitText:'MONTH' },
      },
    }),
  }

  return (
    <div style={{ background: T.bg, minHeight: '100vh', fontFamily: sans }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <header style={{ background: T.navy, borderBottom: `3px solid ${T.gold}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '22px 20px 24px' }}>

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" style={{ fontFamily: sans, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 14 }}>
            <ol style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', listStyle: 'none', margin: 0, padding: 0 }}>
              <li><Link href="/" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Home</Link></li>
              <li aria-hidden="true">›</li>
              <li><Link href="/jobs" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>Jobs</Link></li>
              <li aria-hidden="true">›</li>
              <li aria-current="page" style={{ color: T.gold }}>{job.title}</li>
            </ol>
          </nav>

          {/* Tags row */}
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            {job.sectionName && (
              <span style={{
                fontFamily: sans, fontSize: 10, fontWeight: 700,
                background: `${T.gold}25`, color: T.gold,
                padding: '3px 10px', borderRadius: 20,
                border: `1px solid ${T.gold}40`,
                letterSpacing: '0.05em',
              }}>
                {job.sectionName}
              </span>
            )}
            {job.category && (
              <span style={{
                fontFamily: sans, fontSize: 10,
                background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)',
                padding: '3px 10px', borderRadius: 20,
                border: '1px solid rgba(255,255,255,0.12)',
              }}>
                {job.category}
              </span>
            )}
            <span style={{
              fontFamily: sans, fontSize: 10, fontWeight: 700,
              background: job.isActive ? 'rgba(22,163,74,0.2)' : 'rgba(185,28,28,0.2)',
              color: job.isActive ? '#4ade80' : '#f87171',
              padding: '3px 10px', borderRadius: 20,
              border: `1px solid ${job.isActive ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)'}`,
            }}>
              {job.isActive ? '● Active' : '● Closed'}
            </span>
          </div>

          {/* Title */}
          <h1 style={{
            fontFamily: serif,
            fontSize: 'clamp(20px, 3vw, 28px)',
            fontWeight: 700,
            color: '#fff',
            margin: '0 0 10px',
            lineHeight: 1.25,
            letterSpacing: '-0.01em',
          }}>
            {job.title}
          </h1>

          {/* Author + Last Updated */}
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
            {job.author?.name && (
              <span style={{ fontFamily: sans, fontSize: 11, color: 'rgba(255,255,255,0.55)' }}
                itemScope itemType="https://schema.org/Person">
                By <span itemProp="name">{job.author.name}</span>
              </span>
            )}
            {job.updatedAt && (
              <time
                dateTime={new Date(job.updatedAt).toISOString()}
                style={{
                  fontFamily: sans, fontSize: 10, fontWeight: 600,
                  background: 'rgba(201,168,76,0.15)', color: T.gold,
                  padding: '2px 9px', borderRadius: 12,
                  border: `1px solid ${T.gold}35`,
                  display: 'inline-block',
                }}
              >
                Updated: {new Date(job.updatedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </time>
            )}
          </div>

          {/* Meta strip */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 20,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.1)',
          }}>
            {[
              { icon: '📅', label: 'Posted', value: postedDate },
              { icon: '⏰', label: 'Last Date', value: applyDate },
              job.conductingAuthority && { icon: '🏢', label: 'Authority', value: job.conductingAuthority },
              job.totalVacancies && { icon: '👥', label: 'Vacancies', value: String(job.totalVacancies) },
            ].filter(Boolean).map((item) => (
              <div key={item.label}>
                <div style={{ fontFamily: sans, fontSize: 10, color: 'rgba(255,255,255,0.35)', marginBottom: 3, letterSpacing: '0.08em' }}>
                  {item.icon} {item.label}
                </div>
                <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: '#fff' }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* ══ BODY ══════════════════════════════════════════════════════════ */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 48px' }}>

        {/* Back link */}
        <Link
          href="/jobs"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontFamily: sans,
            fontSize: 12,
            fontWeight: 600,
            color: T.muted,
            textDecoration: 'none',
            marginBottom: 20,
            letterSpacing: '0.03em',
          }}
        >
          ← Back to All Jobs
        </Link>

        {/* Top AdSense */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ border: `1px solid ${T.rule}`, borderRadius: 6, background: '#faf8f4', padding: 4, overflow: 'hidden' }}>
            <AdsenseUnit placement="detail-top" className="w-full" />
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, alignItems: 'start' }}>

          {/* ── MAIN CONTENT (left) ─────────────────────────────────────── */}
          <article>

            {/* 1. Core structured job details */}
            <VacancyTableCard vacancyTable={vacancyTable} totalVacancies={job.totalVacancies} />
            <EligibilityCard eligibility={job.eligibility} />
            <SelectionProcessCard steps={job.selectionProcess} />

            {/* Mid AdSense */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ border: `1px solid ${T.rule}`, borderRadius: 6, background: '#faf8f4', padding: 4 }}>
                <AdsenseUnit placement="detail-inarticle" className="w-full" />
              </div>
            </div>

            {/* 2. Editorial guide blocks (tips, strategy, FAQ) */}
            <HumanContentSection humanContent={job.humanContent} />

            {/* 3. Structured FAQ */}
            <StructuredFaqSection faq={structuredFaq} />

          </article>

          {/* ── SIDEBAR (right) ─────────────────────────────────────────── */}
          <aside style={{ position: 'sticky', top: 20 }} aria-label="Job summary">
            <ApplyButton href={job.officialWebsite} />
            <ImportantDatesCard dates={importantDates} />
            <AppFeeCard fee={job.applicationFee} />
            <AgeLimitCard ageLimit={job.ageLimit} />
            <QuickStatsCard job={job} hasVacancyTable={vacancyTable.length > 0} />
            <ImportantLinksCard links={importantLinks} />

            {/* Sidebar AdSense */}
            <div style={{ border: `1px solid ${T.rule}`, borderRadius: 6, background: '#faf8f4', padding: 4, overflow: 'hidden' }}>
              <AdsenseUnit placement="detail-sidebar" className="w-full" />
            </div>
          </aside>

        </div>

        {/* Bottom AdSense */}
        <div style={{ marginTop: 28 }}>
          <div style={{ border: `1px solid ${T.rule}`, borderRadius: 6, background: '#faf8f4', padding: 4 }}>
            <AdsenseUnit placement="detail-bottom" className="w-full" />
          </div>
        </div>

      </main>

      {/* ══ GLOBAL STYLES ════════════════════════════════════════════════ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        /* Content HTML styling */
        .job-content { font-family: 'DM Sans', sans-serif; font-size: 13.5px; color: #3a3530; line-height: 1.75; }
        .job-content h1 { font-family: 'Lora', serif; font-size: 18px; font-weight: 700; color: #0f1f3d; margin: 0 0 14px; line-height: 1.3; }
        .job-content h2 { font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: #9c8f7a; margin: 20px 0 10px; padding-bottom: 6px; border-bottom: 1px solid #e8e3d8; }
        .job-content ul { padding-left: 18px; margin: 8px 0; }
        .job-content li { margin-bottom: 5px; color: #3a3530; }
        .job-content table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12.5px; }
        .job-content table td, .job-content table th { padding: 8px 12px; border: 1px solid #e8e3d8; vertical-align: top; }
        .job-content table tr:first-child td { background: #faf8f4; font-weight: 700; color: #0f1f3d; }
        .job-content table tr:hover td { background: #faf8f4; }
        .job-content p { margin: 8px 0; }

        /* FAQ details toggle */
        details summary::-webkit-details-marker { display: none; }
        details[open] summary span:last-child { transform: rotate(45deg); display: inline-block; }

        /* Pulse animation for active dates */
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        @media (max-width: 768px) {
          .two-col { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}