import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'
import AiSummaryBox from '@/components/AiSummaryBox'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export async function generateMetadata({ params }) {
  const { slug } = await params
  try {
    const res = await fetch(`${API_BASE}/post/slug/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    const job = data?.data
    if (!job) return { title: 'Job Not Found - Sarkari Afsar' }
    const canonical = `${SITE_URL}/jobs/${job.slug}`
    const year = new Date().getFullYear()
    const titleYear = String(job.title).includes(String(year)) ? '' : ` ${year}`
    const aiKeywords = [...(job.seo?.keywords || []), ...(job.tags || [])]
    const baseKeywords = [job.title, job.conductingAuthority, job.location, `sarkari naukri ${year}`, 'government job', job.category]
    const keywords = [...new Set([...aiKeywords, ...baseKeywords].filter(Boolean))].slice(0, 15)
    const lastDateStr = job.applyLastDate
      ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : null
    let desc = job.seo?.metaDescription?.trim() || ''
    if (!desc) {
      const descParts = [`Apply for ${job.title}${titleYear}.`]
      if (job.conductingAuthority) descParts.push(`Conducting Authority: ${job.conductingAuthority}.`)
      if (job.totalVacancies) descParts.push(`Total Vacancies: ${job.totalVacancies}.`)
      if (lastDateStr) descParts.push(`Last Date: ${lastDateStr}.`)
      else descParts.push('Check official site for last date.')
      desc = descParts.join(' ')
    }
    const ogImageUrl = job.seo?.ogImage
      ? (job.seo.ogImage.startsWith('http') ? job.seo.ogImage : `${SITE_URL}${job.seo.ogImage}`)
      : `${SITE_URL}/api/og?title=${encodeURIComponent(job.title)}&type=job`
    return {
      title: `${job.title}${titleYear} — Sarkari Afsar`,
      description: desc,
      keywords,
      robots: job.noIndex === true
        ? { index: false, follow: false }
        : job.isActive === false
          ? { index: true, follow: true, 'max-snippet': 100, 'max-image-preview': 'large' }
          : { index: true, follow: true, googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' } },
      alternates: {
        canonical,
        languages: { 'en-IN': canonical, 'x-default': canonical },
      },
      openGraph: {
        title: `${job.title}${titleYear}`,
        description: desc,
        url: canonical,
        siteName: 'Sarkari Afsar',
        images: [{ url: ogImageUrl, width: 1200, height: 630, alt: `${job.title}${titleYear}` }],
        locale: 'en_IN',
        type: 'article',
        publishedTime: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
        modifiedTime: job.updatedAt ? new Date(job.updatedAt).toISOString() : undefined,
      },
      twitter: { card: 'summary_large_image', title: `${job.title}${titleYear}`, description: desc, images: [ogImageUrl], site: '@sarkariafsar' },
    }
  } catch { return { title: 'Job Details - Sarkari Afsar' } }
}

// ── Date utilities ──────────────────────────────────────────────────────────
const MONTH_MAP = {
  jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
  january:0,february:1,march:2,april:3,may2:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11,
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
  const win=text.slice(Math.max(0,idx-80),idx);let result=null,lastMatchEnd=-1
  for(const{re,label}of DATE_LABEL_KEYWORDS){const gr=new RegExp(re.source,'gi');let m2;while((m2=gr.exec(win))!==null){const end=m2.index+m2[0].length;if(end>lastMatchEnd){lastMatchEnd=end;result=label}}}
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
  const minDate=new Date(today.getFullYear()-1,0,1);const maxDate=new Date(today.getFullYear()+2,11,31)
  const text=(html||'').replace(/<[^>]+>/g,' ');const all=extractAllDates(text);const expired=[],upcoming=[]
  for(const d of all){if(d.date<minDate||d.date>maxDate)continue;if(d.date<today)expired.push(d);else upcoming.push(d)}
  return{expired:expired.slice(0,8),upcoming:upcoming.slice(0,6)}
}
function detectExtensions(expired,upcoming){
  const extensionMap=new Map()
  for(const exp of expired){if(!exp.label)continue;const matches=upcoming.filter(up=>{if(up.label!==exp.label)return false;if(up.date<=exp.date)return false;return(up.date-exp.date)/(1000*60*60*24)<=60}).sort((a,b)=>a.date-b.date);if(matches.length>0)extensionMap.set(exp.text,matches[0])}
  return extensionMap
}
const NO_BADGE_LABELS=new Set(['Application Start','Date of Birth','Age Cutoff Date','Notification'])
function injectDateBadges(html,expired,upcoming,jobMeta={}){
  if(!html)return html
  const{isActive,updatedAt}=jobMeta;const today=new Date();today.setHours(0,0,0,0)
  const postUpdatedAt=updatedAt?new Date(updatedAt):null;const updatedDaysAgo=postUpdatedAt&&!isNaN(postUpdatedAt)?Math.round((today-postUpdatedAt)/(1000*60*60*24)):Infinity
  const isRecentlyUpdated=updatedDaysAgo<=60;const formattedUpdatedAt=postUpdatedAt&&!isNaN(postUpdatedAt)?postUpdatedAt.toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}):''
  const extensionMap=detectExtensions(expired,upcoming);const extensionTargetTexts=new Set([...extensionMap.values()].map(e=>e.text))
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

// ── Design System ──────────────────────────────────────────────────────────
const C = {
  bg:       '#F4F1EC',
  surface:  '#FFFFFF',
  navy:     '#0D1B2A',
  navyD:    '#060D14',
  saffron:  '#E8622A',
  saffronL: '#FDF0EA',
  gold:     '#C9952A',
  goldL:    '#FBF5E6',
  green:    '#1A7A4A',
  greenL:   '#EAF6EF',
  red:      '#C0392B',
  redL:     '#FDEEEC',
  blue:     '#1B4F8A',
  blueL:    '#EAF0FA',
  ink:      '#1A1A1A',
  sub:      '#5C5C5C',
  muted:    '#8C8C8C',
  border:   '#DDD8CF',
  borderD:  '#C8C2B6',
}
const heading = "'Playfair Display', 'Georgia', serif"
const body    = "'Nunito', 'Segoe UI', sans-serif"

// ── Section Header ─────────────────────────────────────────────────────────
function SectionLabel({ children, icon, color = C.navy }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 12,
    }}>
      <div style={{
        width: 4, height: 20, background: color, borderRadius: 2, flexShrink: 0,
      }} />
      {icon && <span style={{ fontSize: 14 }} aria-hidden>{icon}</span>}
      <span style={{
        fontFamily: body, fontSize: 10, fontWeight: 800,
        letterSpacing: '0.18em', textTransform: 'uppercase', color: C.sub,
      }}>
        {children}
      </span>
    </div>
  )
}

// ── Tabular Data Block ─────────────────────────────────────────────────────
function DataTable({ rows, borderColor = C.border }) {
  const valid = rows.filter(r => r && r.value != null && r.value !== '')
  if (!valid.length) return null
  return (
    <table style={{
      width: '100%', borderCollapse: 'collapse',
      tableLayout: 'fixed',
    }}>
      <tbody>
        {valid.map((row, i) => (
          <tr key={i} style={{
            background: i % 2 === 0 ? C.surface : C.bg,
          }}>
            <td style={{
              fontFamily: body, fontSize: 12, color: C.muted, fontWeight: 600,
              padding: '9px 14px', width: '40%',
              borderBottom: `1px solid ${borderColor}`,
              verticalAlign: 'middle',
            }}>
              {row.label}
            </td>
            <td style={{
              fontFamily: body, fontSize: 12.5, color: row.color || C.ink, fontWeight: 700,
              padding: '9px 14px',
              borderBottom: `1px solid ${borderColor}`,
              verticalAlign: 'middle',
              wordBreak: 'break-word',
            }}>
              {row.badge
                ? <span style={{
                    display: 'inline-block',
                    background: row.badge.bg, color: row.badge.fg,
                    padding: '2px 10px', borderRadius: 4,
                    fontSize: 11, fontWeight: 800,
                  }}>{row.value}</span>
                : row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ── Module Box (reusable panel) ────────────────────────────────────────────
function Module({ title, icon, accent = C.navy, children, style = {}, topLine = true }) {
  return (
    <div style={{
      background: C.surface,
      borderRadius: 10,
      border: `1px solid ${C.border}`,
      borderTop: topLine ? `3px solid ${accent}` : `1px solid ${C.border}`,
      overflow: 'hidden',
      marginBottom: 16,
      ...style,
    }}>
      {title && (
        <div style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${C.border}`,
          background: C.bg,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {icon && <span style={{ fontSize: 13 }} aria-hidden>{icon}</span>}
          <span style={{
            fontFamily: body, fontSize: 10, fontWeight: 800,
            letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sub,
          }}>
            {title}
          </span>
        </div>
      )}
      {children}
    </div>
  )
}

// ── Apply Button ───────────────────────────────────────────────────────────
function ApplyButton({ href }) {
  if (!href) return null
  return (
    <div style={{ marginBottom: 16 }}>
      <a href={href} target="_blank" rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          width: '100%', padding: '14px 20px',
          background: `linear-gradient(135deg, ${C.green} 0%, #0E5C37 100%)`,
          color: '#fff', borderRadius: 10,
          fontFamily: body, fontSize: 14, fontWeight: 800,
          textDecoration: 'none', letterSpacing: '0.04em',
          boxShadow: `0 4px 16px ${C.green}55`,
          transition: 'transform 0.15s',
        }}
      >
        <span style={{ fontSize: 18 }}>📝</span>
        Apply Online Now →
      </a>
      <p style={{
        fontFamily: body, fontSize: 10, color: C.muted,
        textAlign: 'center', margin: '6px 0 0', fontStyle: 'italic',
      }}>
        Always verify from official source before applying
      </p>
    </div>
  )
}

// ── Quick Stats Sidebar Card ───────────────────────────────────────────────
function QuickStatsCard({ job, hasVacancyTable }) {
  const rows = [
    !hasVacancyTable && job.totalVacancies && { label: '👥 Vacancies', value: String(job.totalVacancies) },
    job.salary && { label: '💰 Pay Scale', value: job.salary },
    job.category && { label: '📂 Category', value: job.category },
    job.location && { label: '📍 Location', value: job.location },
    job.advertisementNumber && { label: '📄 Advt. No.', value: job.advertisementNumber },
  ].filter(Boolean)
  if (!rows.length) return null
  return (
    <Module title="Quick Overview" icon="📋" accent={C.navy}>
      <DataTable rows={rows} />
    </Module>
  )
}

// ── Important Dates Card ───────────────────────────────────────────────────
function ImportantDatesCard({ dates }) {
  if (!dates || typeof dates !== 'object') return null
  const entries = Object.entries(dates).filter(([, v]) => v)
  if (!entries.length) return null
  const today = new Date(); today.setHours(0,0,0,0)
  return (
    <Module title="Important Dates" icon="📅" accent={C.blue}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          {entries.map(([label, value], i) => {
            const parsed = parseTextDate(String(value))
            const isUpcoming = parsed && parsed >= today
            const isExpired  = parsed && parsed < today
            return (
              <tr key={label} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                <td style={{
                  fontFamily: body, fontSize: 11, color: C.muted, fontWeight: 600,
                  padding: '9px 14px', width: '48%',
                  borderBottom: `1px solid ${C.border}`,
                  verticalAlign: 'middle',
                }}>
                  {label}
                </td>
                <td style={{
                  fontFamily: body, fontSize: 11, fontWeight: 700,
                  color: isUpcoming ? C.green : isExpired ? C.red : C.ink,
                  padding: '9px 14px',
                  borderBottom: `1px solid ${C.border}`,
                  verticalAlign: 'middle',
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {isUpcoming && (
                      <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: C.green, display: 'inline-block',
                        flexShrink: 0,
                      }} />
                    )}
                    <time dateTime={parsed ? parsed.toISOString().slice(0,10) : undefined}>
                      {String(value)}
                    </time>
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Module>
  )
}

// ── Application Fee Card ───────────────────────────────────────────────────
function AppFeeCard({ fee }) {
  if (!fee || typeof fee !== 'object') return null
  const rows = [
    { label: 'General / OBC', value: fee.general },
    { label: 'SC / ST',       value: fee.sc },
    { label: 'PwD / EWS',     value: fee.ph || fee.ews },
  ].filter(r => r.value != null)
  if (!rows.length) return null
  return (
    <Module title="Application Fee" icon="💳" accent={C.gold}>
      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
              <td style={{
                fontFamily: body, fontSize: 11.5, color: C.muted, fontWeight: 600,
                padding: '9px 14px', width: '55%',
                borderBottom: `1px solid ${C.border}`,
              }}>
                {r.label}
              </td>
              <td style={{
                fontFamily: body, fontSize: 13, fontWeight: 800, color: '#7A4F00',
                padding: '9px 14px',
                borderBottom: `1px solid ${C.border}`,
              }}>
                ₹{r.value}/-
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {fee.paymentModes?.length > 0 && (
        <div style={{ padding: '8px 14px', background: C.goldL }}>
          <span style={{ fontFamily: body, fontSize: 10, color: C.sub }}>
            Mode: {fee.paymentModes.join(' · ')}
          </span>
        </div>
      )}
    </Module>
  )
}

// ── Age Limit Card ─────────────────────────────────────────────────────────
function AgeLimitCard({ ageLimit }) {
  if (!ageLimit) return null
  const { min, max, byCategory } = ageLimit
  if (!min && !max && !byCategory?.length) return null
  return (
    <Module title="Age Limit" icon="🎂" accent={C.saffron}>
      {(min || max) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 0, padding: '16px 14px',
          borderBottom: byCategory?.length ? `1px solid ${C.border}` : 'none',
        }}>
          {min && (
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: heading, fontSize: 28, fontWeight: 700, color: C.navy, lineHeight: 1 }}>{min}</div>
              <div style={{ fontFamily: body, fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Min Years</div>
            </div>
          )}
          {min && max && (
            <div style={{ width: 1, height: 40, background: C.border, margin: '0 8px' }} />
          )}
          {max && (
            <div style={{ textAlign: 'center', flex: 1 }}>
              <div style={{ fontFamily: heading, fontSize: 28, fontWeight: 700, color: C.saffron, lineHeight: 1 }}>{max}</div>
              <div style={{ fontFamily: body, fontSize: 9, color: C.muted, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 4 }}>Max Years</div>
            </div>
          )}
        </div>
      )}
      {byCategory?.length > 0 && (
        <div style={{ padding: '10px 14px' }}>
          {byCategory.map((c, i) => (
            <div key={i} style={{
              display: 'flex', gap: 8, alignItems: 'flex-start',
              fontFamily: body, fontSize: 11.5, color: C.sub,
              padding: '5px 0',
              borderBottom: i < byCategory.length - 1 ? `1px dashed ${C.border}` : 'none',
            }}>
              <span style={{ color: C.saffron, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>▸</span>
              {c}
            </div>
          ))}
        </div>
      )}
    </Module>
  )
}

// ── Important Links Card ───────────────────────────────────────────────────
function ImportantLinksCard({ links }) {
  if (!links?.length) return null
  const filtered = links.filter(l => l.label && l.url)
  if (!filtered.length) return null
  const seenUrls = new Set()
  const deduped = filtered.filter(l => { if (seenUrls.has(l.url)) return false; seenUrls.add(l.url); return true })
  const groups = []
  const groupMap = {}
  deduped.forEach(l => {
    if (groupMap[l.label] !== undefined) groups[groupMap[l.label]].items.push(l)
    else { groupMap[l.label] = groups.length; groups.push({ label: l.label, type: l.type, items: [l] }) }
  })
  if (!groups.length) return null
  const TYPE_CONFIG = {
    apply:        { bg: C.green,   fg: '#fff',    icon: '📝' },
    'admit-card': { bg: '#6D28D9', fg: '#fff',    icon: '🎫' },
    result:       { bg: C.blue,    fg: '#fff',    icon: '📊' },
    notification: { bg: C.gold,    fg: C.navyD,   icon: '🔔' },
    official:     { bg: C.navy,    fg: '#fff',    icon: '🏛️' },
    'answer-key': { bg: '#B45309', fg: '#fff',    icon: '🗝️' },
  }
  const defaultCfg = { bg: C.sub, fg: '#fff', icon: '🔗' }
  return (
    <Module title="Important Links" icon="🔗" accent={C.saffron}>
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {groups.map((group, gi) => {
          const cfg = TYPE_CONFIG[group.type] || defaultCfg
          if (group.items.length === 1) {
            return (
              <a key={gi} href={group.items[0].url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px',
                  background: cfg.bg, color: cfg.fg,
                  borderRadius: 7, fontFamily: body,
                  fontSize: 12, fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
              >
                <span style={{ fontSize: 14, flexShrink: 0 }}>{cfg.icon}</span>
                <span style={{ flex: 1 }}>{group.label}</span>
                <span style={{ opacity: 0.6, fontSize: 11 }}>↗</span>
              </a>
            )
          }
          return (
            <div key={gi} style={{ borderRadius: 7, overflow: 'hidden', border: `2px solid ${cfg.bg}` }}>
              <div style={{
                padding: '8px 12px', background: cfg.bg, color: cfg.fg,
                fontFamily: body, fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ fontSize: 13 }}>{cfg.icon}</span>
                <span style={{ flex: 1 }}>{group.label}</span>
                <span style={{
                  fontFamily: body, fontSize: 9, fontWeight: 700,
                  background: 'rgba(255,255,255,0.25)',
                  padding: '1px 6px', borderRadius: 10,
                }}>{group.items.length} Links</span>
              </div>
              {group.items.map((item, ii) => (
                <a key={ii} href={item.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 12px',
                    background: ii % 2 === 0 ? '#F8F9FA' : '#FFF',
                    color: C.blue, fontFamily: body, fontSize: 11.5,
                    fontWeight: 600, textDecoration: 'none',
                    borderTop: `1px solid ${C.border}`,
                  }}
                >
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    background: cfg.bg, color: cfg.fg,
                    fontFamily: body, fontSize: 9, fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>{ii + 1}</span>
                  <span style={{ flex: 1 }}>Link {ii + 1}</span>
                  <span style={{ color: C.muted, fontSize: 10 }}>↗</span>
                </a>
              ))}
            </div>
          )
        })}
      </div>
    </Module>
  )
}

// ── Vacancy Table ──────────────────────────────────────────────────────────
function VacancyTableCard({ vacancyTable, totalVacancies }) {
  if (!vacancyTable?.length) return null
  const headers = ['Post Name', 'Total', 'UR', 'OBC', 'SC', 'ST', 'EWS']
  const keys    = [null, null, 'ur', 'obc', 'sc', 'st', 'ews']
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel icon="👥" color={C.navy}>Vacancy Breakdown</SectionLabel>
      <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.navy}`, overflow: 'hidden' }}>
        {totalVacancies && (
          <div style={{
            padding: '8px 16px', background: C.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: body, fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>Total Sanctioned Posts</span>
            <span style={{
              fontFamily: heading, fontSize: 20, fontWeight: 700, color: '#fff',
            }}>{totalVacancies}</span>
          </div>
        )}
        <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: body, minWidth: 480 }}>
            <thead>
              <tr style={{ background: '#F0EDE8' }}>
                {headers.map((h, i) => (
                  <th key={h} style={{
                    padding: '9px 12px',
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.14em',
                    textTransform: 'uppercase', color: C.sub,
                    textAlign: i === 0 ? 'left' : 'center',
                    borderBottom: `2px solid ${C.borderD}`,
                    whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vacancyTable.map((row, i) => (
                <tr key={i} style={{
                  background: i % 2 === 0 ? C.surface : C.bg,
                  borderBottom: `1px solid ${C.border}`,
                }}>
                  <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 600, color: C.ink }}>{row.post || '—'}</td>
                  <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-block',
                      background: C.navy, color: '#fff',
                      padding: '2px 10px', borderRadius: 4,
                      fontSize: 13, fontWeight: 800,
                    }}>
                      {row.count || row.total || '—'}
                    </span>
                  </td>
                  {['ur','obc','sc','st','ews'].map(k => (
                    <td key={k} style={{ padding: '10px 12px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: C.sub }}>
                      {row[k] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ── Eligibility Card ───────────────────────────────────────────────────────
function EligibilityCard({ eligibility }) {
  if (!eligibility?.length) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel icon="🎓" color={C.blue}>Eligibility & Qualification</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {eligibility.map((e, i) => (
          <div key={i} style={{
            background: C.surface, borderRadius: 10,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '10px 16px',
              background: C.blueL, borderBottom: `1px solid ${C.border}`,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: C.blue, color: '#fff',
                fontFamily: body, fontSize: 12, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>{i + 1}</div>
              <span style={{ fontFamily: body, fontSize: 13, fontWeight: 700, color: C.navy }}>{e.post}</span>
              {e.payScale && (
                <span style={{
                  marginLeft: 'auto', fontFamily: body, fontSize: 11, fontWeight: 700,
                  color: '#7A4F00', background: C.goldL,
                  padding: '2px 10px', borderRadius: 4, whiteSpace: 'nowrap',
                }}>
                  💰 {e.payScale}
                </span>
              )}
            </div>
            <div style={{ padding: '12px 16px', fontFamily: body, fontSize: 13, color: C.sub, lineHeight: 1.7 }}>
              {e.qualification || 'Refer to official notification for qualification details.'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Selection Process ──────────────────────────────────────────────────────
function SelectionProcessCard({ steps }) {
  if (!steps?.length) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <SectionLabel icon="🏆" color={C.saffron}>Selection Process</SectionLabel>
      <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, padding: '20px 16px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, minWidth: steps.length * 90 }}>
          {steps.map((step, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', top: 16, left: '50%',
                  width: '100%', height: 2,
                  background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})`,
                  zIndex: 0,
                }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`,
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: body, fontSize: 13, fontWeight: 800,
                position: 'relative', zIndex: 1, flexShrink: 0, marginBottom: 10,
                boxShadow: `0 2px 8px ${C.saffron}44`,
              }}>
                {i + 1}
              </div>
              <div style={{
                fontFamily: body, fontSize: 10.5, color: C.sub,
                textAlign: 'center', lineHeight: 1.4, padding: '0 4px', fontWeight: 600,
              }}>
                {step}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Human Content Blocks ───────────────────────────────────────────────────
const BLOCK_META = {
  introduction:       { icon: '📌', bg: C.blueL,    border: C.blue,    label: 'Overview' },
  'exam-tips':        { icon: '🎯', bg: '#FFFBEB',   border: C.gold,    label: 'Exam Tips' },
  salary:             { icon: '💰', bg: C.greenL,    border: C.green,   label: 'Salary Info' },
  'how-to':           { icon: '📝', bg: C.greenL,    border: C.green,   label: 'How To Apply' },
  preparation:        { icon: '📚', bg: '#FDF4FF',   border: '#7C3AED', label: 'Preparation' },
  trust:              { icon: '🔒', bg: C.redL,      border: C.red,     label: 'Official Source' },
  'trust-signal':     { icon: '🔒', bg: C.redL,      border: C.red,     label: 'Important Note' },
  analysis:           { icon: '📊', bg: C.blueL,     border: C.blue,    label: 'Analysis' },
  documents:          { icon: '📄', bg: '#FAFAF0',   border: C.gold,    label: 'Documents' },
  'fee-tips':         { icon: '💳', bg: C.goldL,     border: C.gold,    label: 'Fee Tips' },
  'age-info':         { icon: '🎂', bg: C.saffronL,  border: C.saffron, label: 'Age & Relaxation' },
  'vacancy-insight':  { icon: '📊', bg: C.blueL,     border: C.blue,    label: 'Vacancy Insights' },
  'who-should-apply': { icon: '🎓', bg: '#FEFCE8',   border: C.gold,    label: 'Who Should Apply' },
  'exam-strategy':    { icon: '🏆', bg: C.greenL,    border: C.green,   label: 'Exam Strategy' },
  'expert-faq':       { icon: '❓', bg: '#F8FAFC',   border: C.blue,    label: 'Expert FAQ' },
  mistakes:           { icon: '⚠️', bg: C.redL,      border: C.red,     label: 'Common Mistakes' },
}

function HumanContentSection({ humanContent }) {
  if (!humanContent?.blocks?.length) return null
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 16px' }}>
        <div style={{ flex: 1, height: 1, background: C.border }} />
        <span style={{ fontFamily: body, fontSize: 10, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.muted }}>
          Detailed Guide
        </span>
        <div style={{ flex: 1, height: 1, background: C.border }} />
      </div>
      <div className="human-grid">
        {humanContent.blocks.map((block) => {
          const meta = BLOCK_META[block.type] || { icon: '📋', bg: C.bg, border: C.border, label: block.type }
          const lines = block.content.split('\n').filter(l => l.trim())
          return (
            <div key={block.blockId} style={{
              background: meta.bg,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${meta.border}`,
              padding: '14px 16px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
                <span style={{ fontSize: 16 }} aria-hidden>{meta.icon}</span>
                <span style={{
                  fontFamily: body, fontSize: 9, fontWeight: 800,
                  letterSpacing: '0.15em', textTransform: 'uppercase', color: C.sub,
                }}>
                  {meta.label}
                </span>
              </div>
              <div style={{ fontFamily: body, fontSize: 13, color: C.ink, lineHeight: 1.75 }}>
                {lines.map((line, i) => {
                  const isList = /^[•\-]/.test(line) || /^\d+[.)]\s/.test(line)
                  return isList
                    ? <div key={i} style={{ marginBottom: 5, paddingLeft: 6, display: 'flex', gap: 6 }}>
                        <span style={{ color: meta.border, flexShrink: 0 }}>▸</span>
                        <span>{line.replace(/^[•\-]\s*/,'').replace(/^\d+[.)]\s*/,'')}</span>
                      </div>
                    : <p key={i} style={{ margin: i > 0 ? '8px 0 0' : 0 }}>{line}</p>
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Structured FAQ ─────────────────────────────────────────────────────────
function StructuredFaqSection({ faq }) {
  if (!faq?.length) return null
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  }
  return (
    <div style={{ marginBottom: 20 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SectionLabel icon="❓" color={C.blue}>Frequently Asked Questions</SectionLabel>
      <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        {faq.map((item, i) => (
          <details key={i} style={{ borderBottom: i < faq.length - 1 ? `1px solid ${C.border}` : 'none' }}>
            <summary style={{
              padding: '13px 18px',
              cursor: 'pointer', display: 'flex',
              justifyContent: 'space-between', alignItems: 'flex-start', gap: 12,
              listStyle: 'none', fontFamily: body, fontSize: 13.5,
              fontWeight: 700, color: C.ink, userSelect: 'none',
            }}>
              <span>{item.q}</span>
              <span style={{
                color: C.saffron, flexShrink: 0, fontSize: 20,
                lineHeight: 1, fontWeight: 300,
              }}>+</span>
            </summary>
            <div style={{
              padding: '12px 18px 16px', background: C.bg,
              fontFamily: body, fontSize: 13, color: C.sub, lineHeight: 1.75,
              borderTop: `1px solid ${C.border}`,
            }}>
              {item.a}
            </div>
          </details>
        ))}
      </div>
    </div>
  )
}

// ── Dynamic Editorial Section ──────────────────────────────────────────────
// Generates ~300 words of unique, candidate-useful content from structured
// job fields. Fixes thin-page SEO issue without any server-side changes.
function DynamicEditorialSection({ job }) {
  const authority = job.conductingAuthority || 'the official authority'
  const lastDate = job.applyLastDate
    ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  // How to Apply steps (conditional fee step)
  const applySteps = [
    `Visit the official website of ${authority}.`,
    'Navigate to the Recruitment / Latest Jobs section.',
    `Find the "${job.title}" advertisement and download the official notification PDF.`,
    'Register with a valid email address and mobile number to create a login.',
    'Log in and fill the online application form — verify all personal, academic, and category details carefully.',
    'Upload scanned documents: photograph, signature, and certificates in the required format (JPG / PDF).',
    job.applicationFee ? 'Pay the prescribed application fee through the online payment gateway.' : null,
    'Submit the form. Save the application number and print or download the confirmation page.',
    'Keep the submitted form printout safe for admit card download, exam day, and document verification.',
  ].filter(Boolean)

  // Documents checklist — education documents derived from eligibility, rest standard
  const eduDocs = []
  if (job.eligibility?.length) {
    const quals = job.eligibility.map(e => (e.qualification || '').toLowerCase()).join(' ')
    if (/10th|matric|ssc/.test(quals))                                    eduDocs.push('10th Pass Certificate & Marksheet')
    if (/12th|inter|hsc/.test(quals))                                     eduDocs.push('12th Pass Certificate & Marksheet')
    if (/degree|bachelor|b\.sc|b\.a|b\.com|b\.tech|graduate/.test(quals)) eduDocs.push('Graduation Degree & All Semester Marksheets')
    if (/diploma/.test(quals))                                             eduDocs.push('Diploma Certificate')
    if (/post.?grad|m\.sc|mba|m\.tech|ma\b/.test(quals))                  eduDocs.push('Post-Graduation Degree & Marksheets')
  }
  const documents = [
    ...eduDocs,
    'Aadhaar Card / Voter ID / Passport (any valid govt. photo ID)',
    'Recent Passport-size Photographs (white background preferred)',
    'Signature scan on plain white paper',
    'Caste / Category Certificate (OBC / SC / ST, if applicable)',
    'EWS Certificate (if claiming EWS reservation)',
    'PwD / Disability Certificate (if applicable)',
    'Date of Birth Proof (Birth Certificate or 10th Marksheet)',
  ]

  // Preparation tips — 7 category-aware buckets
  const combined = `${job.category || ''} ${job.sectionName || ''} ${job.title || ''}`.toLowerCase()
  let prepTips
  if (/railway|rrb|ntpc|group[\s-]*d/.test(combined)) {
    prepTips = [
      'Mathematics (Arithmetic): Number System, Percentage, Ratio, and Simplification are RRB exam staples — start here.',
      'General Intelligence & Reasoning: Practise coding-decoding, series, and analogy questions daily to build speed.',
      'General Awareness: Cover last 6 months of current affairs; balance it with static GK (History, Geography, Polity).',
      'Time Management: Each section has ~25 minutes. Aim for 70–80% accuracy at pace rather than attempting all questions.',
    ]
  } else if (/bank|sbi|ibps|clerk|po|rrb\s*po|rrb\s*clerk/.test(combined)) {
    prepTips = [
      'Quantitative Aptitude: Data Interpretation and Arithmetic carry the most weight — prioritise these topics.',
      'English Language: Reading Comprehension, Error Detection, and Cloze Test appear in almost every bank exam.',
      'Reasoning Ability: Puzzles and Seating Arrangement are time-consuming — build speed through consistent daily practice.',
      'Current Affairs: A 6-month capsule plus Banking Awareness is essential, especially for the Mains stage.',
    ]
  } else if (/police|constable|sub\s*inspector|\bsi\b/.test(combined)) {
    prepTips = [
      'Physical Fitness First: PET / PST eliminates many candidates — begin running and physical training at least 3 months early.',
      'State-specific GK: Each state exam includes questions on local history, geography, and current events — do not skip.',
      'General Knowledge & Reasoning: Practise SSC-level material for the written examination.',
      'Know the Sequence: Written → PET → Medical. Clear each stage fully before focusing on the next.',
    ]
  } else if (/teacher|tet|ctet|shikshak|kvs|nvs/.test(combined)) {
    prepTips = [
      'Child Development & Pedagogy (CDP): Highest-weightage section — study Piaget, Vygotsky, and learning theories in depth.',
      'NCERT Mastery: Deep knowledge of subject NCERT books (6th–12th) is essential for the Paper II subject section.',
      'Language Sections: Both L1 and L2 are tested on grammar, comprehension, and pedagogy — do not neglect either.',
      'Previous Year Papers: CTET patterns are consistent — solving 2019–2024 papers is a must for exam readiness.',
    ]
  } else if (/navy|army|air\s*force|nda|cds|agniveer|military|defence|ssb/.test(combined)) {
    prepTips = [
      'Physical Preparation: Begin at least 3–4 months before the exam — running, chin-ups, and endurance training are tested.',
      'Mathematics (NDA / CDS): Class 11–12 NCERT Maths is the backbone — Algebra, Trigonometry, and Statistics are key areas.',
      'General Ability Test (GAT): Covers English, Physics, Chemistry, History, Geography, Current Events — distribute study evenly.',
      'SSB Interview: Personality, group activities, and psychological tests matter as much as academics — prepare holistically.',
    ]
  } else if (/ssc|staff\s*selection|cgl|chsl|mts|cpo/.test(combined)) {
    prepTips = [
      'Tier I Focus: Reasoning and General Awareness are the fastest to score — master these in the Tier I stage.',
      'Quantitative Aptitude: Arithmetic (Percentage, SI/CI, Profit-Loss, Time-Work) is tested at every level.',
      'English: Fill in the Blanks, Sentence Improvement, and One-word Substitution are high-frequency question types.',
      'Tier II: English Language and Quantitative Ability go deeper — start Tier II preparation early after clearing Tier I.',
    ]
  } else {
    prepTips = [
      'Read the full official notification — the syllabus and exam pattern are officially defined there.',
      'Make a topic-wise study schedule and follow it consistently — regularity beats last-minute cramming.',
      'Solve previous year question papers for pattern familiarity and to identify high-weightage topics.',
      'Attempt full-length mock tests regularly to build speed, accuracy, and exam composure.',
    ]
  }

  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── How to Apply ── */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel icon="📝" color={C.green}>How to Apply — Step by Step</SectionLabel>
        <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.green}`, padding: '16px 20px' }}>
          {lastDate && (
            <div style={{ background: C.greenL, border: '1px solid #86EFAC', borderRadius: 7, padding: '8px 14px', marginBottom: 14, fontFamily: body, fontSize: 12, color: C.green, fontWeight: 700 }}>
              ⏰ Application Deadline: {lastDate}
            </div>
          )}
          <ol style={{ paddingLeft: 22, margin: 0 }}>
            {applySteps.map((step, i) => (
              <li key={i} style={{ fontFamily: body, fontSize: 13, color: C.ink, lineHeight: 1.7, marginBottom: 8 }}>
                {step}
              </li>
            ))}
          </ol>
          {job.officialWebsite && (
            <a href={job.officialWebsite} target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontFamily: body, fontSize: 12, fontWeight: 700, color: C.green, textDecoration: 'none' }}>
              → Apply at Official Website ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Documents Required ── */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel icon="📄" color={C.blue}>Documents Required</SectionLabel>
        <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.blue}`, padding: '14px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 0' }}>
            {documents.map((doc, i) => (
              <div key={i} style={{ width: '50%', minWidth: 200, display: 'flex', alignItems: 'flex-start', gap: 8, fontFamily: body, fontSize: 12.5, color: C.ink, lineHeight: 1.55, padding: '5px 12px 5px 0' }}>
                <span style={{ color: C.blue, fontWeight: 800, flexShrink: 0 }}>✓</span>
                <span>{doc}</span>
              </div>
            ))}
          </div>
          <p style={{ fontFamily: body, fontSize: 11, color: C.muted, marginTop: 12, fontStyle: 'italic' }}>
            * Carry originals and self-attested photocopies for document verification.
          </p>
        </div>
      </div>

      {/* ── Preparation Tips ── */}
      <div style={{ marginBottom: 20 }}>
        <SectionLabel icon="🎯" color={C.gold}>Preparation Tips</SectionLabel>
        <div style={{ background: C.surface, borderRadius: 10, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.gold}`, padding: '14px 20px' }}>
          {prepTips.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', fontFamily: body, fontSize: 13, color: C.ink, lineHeight: 1.7, padding: '8px 0', borderBottom: i < prepTips.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '50%', background: C.goldL, color: C.gold, fontFamily: body, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {i + 1}
              </span>
              <span>{tip}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

// ── Meta Strip Pill ────────────────────────────────────────────────────────
function HeroPill({ icon, label, value, accent }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      padding: '10px 16px',
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 8,
      border: '1px solid rgba(255,255,255,0.1)',
      minWidth: 100,
    }}>
      <span style={{ fontFamily: body, fontSize: 10, color: 'rgba(255,255,255,0.45)', fontWeight: 600, marginBottom: 3 }}>
        {icon} {label}
      </span>
      <span style={{ fontFamily: body, fontSize: 13, fontWeight: 700, color: accent || '#fff' }}>
        {value}
      </span>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────
export default async function JobDetailPage({ params }) {
  const { slug } = await params
  let job = null
  try {
    const res  = await fetch(`${API_BASE}/post/slug/${slug}`, { cache: 'no-store' })
    const data = await res.json()
    job = data?.data
  } catch {}
  if (!job) return notFound()

  const contentHtml    = job.scrapedContent?.contentHtml || job.content || ''
  const importantDates = job.scrapedContent?.contentJson?.importantDates || job.importantDates || null
  const structuredFaq  = job.structured?.faq || []
  const vacancyTable   = job.structured?.vacancyTable || []
  const importantLinks = job.structured?.importantLinks || []

  // ── Strip scraped sections already shown in structured sidebar cards ────
  // Only strips when the corresponding card actually has data — avoids wiping
  // content that would otherwise appear nowhere. Uses heading-level traversal
  // instead of nested lookahead regex (no catastrophic backtracking risk).
  const stripPatterns = [
    /short\s+details/i,              // always — duplicates hero meta row
    /pay\s+scale/i,                  // always — shown in eligibility/stats card
    ...(importantDates && Object.keys(importantDates).length
      ? [/important\s+dates?/i] : []),
    ...(job.applicationFee
      ? [/application\s+fee/i, /fee\s+(?:details?|payment)/i] : []),
    ...((job.ageLimit?.min || job.ageLimit?.max || job.ageLimit?.byCategory?.length)
      ? [/age\s+limit/i, /age\s+relaxation/i] : []),
    ...(vacancyTable.length > 0
      ? [/vacancy\s+(?:details?|break)/i, /post[\s-]*wise\s+vacancy/i] : []),
    ...(job.eligibility?.length ? [/educational\s+qualif/i] : []),
    ...(job.selectionProcess?.length ? [/selection\s+process/i] : []),
  ]
  function stripDuplicateSections(html, patterns) {
    if (!html || !patterns.length) return html
    // Collect all heading tags with position, nesting level, and plain-text content
    const headingRe = /<(h[1-6])(?:\s[^>]*)?>[\s\S]*?<\/h[1-6]>/gi
    const headings = []
    let hm
    while ((hm = headingRe.exec(html)) !== null) {
      headings.push({
        start: hm.index,
        end:   hm.index + hm[0].length,
        level: parseInt(hm[0][2]),
        text:  hm[0].replace(/<[^>]+>/g, '').trim(),
      })
    }
    // For each heading matching a strip pattern, remove from heading start to
    // the next heading of equal-or-higher level (end of that section)
    const toRemove = []
    for (let i = 0; i < headings.length; i++) {
      const h = headings[i]
      if (!patterns.some(p => p.test(h.text))) continue
      let end = html.length
      for (let j = i + 1; j < headings.length; j++) {
        if (headings[j].level <= h.level) { end = headings[j].start; break }
      }
      toRemove.push([h.start, end])
    }
    // Apply in reverse so earlier indices stay valid after each splice
    let result = html
    for (let i = toRemove.length - 1; i >= 0; i--) {
      result = result.slice(0, toRemove[i][0]) + result.slice(toRemove[i][1])
    }
    return result
  }
  const cleanedHtml = stripDuplicateSections(contentHtml, stripPatterns)

  const { expired, upcoming } = classifyDates(cleanedHtml)
  const annotatedHtml = injectDateBadges(cleanedHtml, expired, upcoming, { isActive: job.isActive, updatedAt: job.updatedAt })

  const applyDate  = job.applyLastDate
    ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : 'N/A'
  const postedDate = job.createdAt
    ? new Date(job.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })
    : ''
  const canonical = `${SITE_URL}/jobs/${job.slug}`

  const breadcrumbSchema = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type':'ListItem', position:1, name:'Home', item:SITE_URL },
      { '@type':'ListItem', position:2, name:'Jobs', item:`${SITE_URL}/jobs` },
      { '@type':'ListItem', position:3, name:job.title, item:canonical },
    ],
  }

  const jobPostingSchema = {
    '@context': 'https://schema.org', '@type': 'JobPosting',
    title: job.jobtitle || job.title,
    description: [job.title, job.conductingAuthority && `Conducting Authority: ${job.conductingAuthority}`, job.totalVacancies && `Total Vacancies: ${job.totalVacancies}`, job.salary && `Salary: ${job.salary}`].filter(Boolean).join('. '),
    datePosted: job.createdAt ? new Date(job.createdAt).toISOString() : new Date().toISOString(),
    validThrough: job.applyLastDate ? new Date(job.applyLastDate).toISOString() : new Date(Date.now() + 90*24*60*60*1000).toISOString(),
    employmentType: 'FULL_TIME', url: canonical,
    identifier: { '@type':'PropertyValue', name: job.advertisementNumber ? 'Advertisement Number' : 'SarkariAfsar', value: job.advertisementNumber || job.slug },
    hiringOrganization: { '@type':'Organization', name: job.conductingAuthority || 'Government of India', sameAs: job.officialWebsite || 'https://sarkariafsar.com' },
    jobLocation: { '@type':'Place', address: { '@type':'PostalAddress', addressCountry:'IN', addressRegion: job.location || 'India' } },
    ...(job.totalVacancies && { vacancyCount: job.totalVacancies }),
    ...(job.eligibility?.length && { educationRequirements: { '@type':'EducationalOccupationalCredential', credentialCategory: job.eligibility.map(e=>e.qualification).filter(Boolean).join('; ') } }),
    ...(job.salary && { baseSalary: { '@type':'MonetaryAmount', currency:'INR', value: { '@type':'QuantitativeValue', value:job.salary, unitText:'MONTH' } } }),
  }

  return (
    <div className="sa-root">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jobPostingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* ══ HERO ══ */}
      <header className="sa-hero">
        <div className="sa-hero-inner">

          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="sa-breadcrumb">
            <Link href="/" className="sa-bc-link">Home</Link>
            <span aria-hidden>›</span>
            <Link href="/jobs" className="sa-bc-link">Jobs</Link>
            <span aria-hidden>›</span>
            <span className="sa-bc-curr">{job.title}</span>
          </nav>

          {/* Badge row */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
            {job.sectionName && (
              <span className="sa-tag sa-tag-gold">{job.sectionName}</span>
            )}
            {job.category && (
              <span className="sa-tag sa-tag-ghost">{job.category}</span>
            )}
            <span className={`sa-tag ${job.isActive ? 'sa-tag-green' : 'sa-tag-red'}`}>
              {job.isActive ? '● Active' : '● Closed'}
            </span>
            {job.updatedAt && (
              <time
                dateTime={new Date(job.updatedAt).toISOString()}
                className="sa-tag sa-tag-blue"
              >
                ↻ Updated {new Date(job.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
              </time>
            )}
          </div>

          {/* Title */}
          <h1 className="sa-title">{job.title}</h1>

          {/* Author */}
          {job.author?.name && (
            <div style={{ fontFamily: body, fontSize:11, color:'rgba(255,255,255,0.45)', marginBottom:18 }}
              itemScope itemType="https://schema.org/Person">
              By <span itemProp="name">{job.author.name}</span>
            </div>
          )}

          {/* Meta pills */}
          <div className="sa-hero-pills">
            <HeroPill icon="📅" label="Posted" value={postedDate} />
            <HeroPill icon="⏰" label="Last Date" value={applyDate} accent="#FCD34D" />
            {job.conductingAuthority && <HeroPill icon="🏢" label="Authority" value={job.conductingAuthority} />}
            {job.totalVacancies && <HeroPill icon="👥" label="Vacancies" value={String(job.totalVacancies)} accent="#6EE7B7" />}
          </div>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <main className="sa-body">

        {/* Back link */}
        <Link href="/jobs" className="sa-back">
          ← All Jobs
        </Link>

        {/* AI Summary */}
        <AiSummaryBox post={{
          slug: job.slug, title: job.title,
          conductingAuthority: job.conductingAuthority,
          totalVacancies: job.totalVacancies, salary: job.salary,
          applyLastDate: job.applyLastDate, category: job.category,
          location: job.location, sectionName: job.sectionName,
        }} />

        {/* Top Ad */}
        <div className="sa-ad-wrap" style={{ marginBottom:20 }}>
          <AdsenseUnit placement="detail-top" className="w-full" />
        </div>

        {/* Two-column layout */}
        <div className="sa-layout">

          {/* ── MAIN CONTENT ── */}
          <article className="sa-main">
            <VacancyTableCard vacancyTable={vacancyTable} totalVacancies={job.totalVacancies} />
            <AppFeeCard fee={job.applicationFee} />
            <EligibilityCard eligibility={job.eligibility} />
            <SelectionProcessCard steps={job.selectionProcess} />
            <DynamicEditorialSection job={job} />

            {/* Mid Ad */}
            <div className="sa-ad-wrap" style={{ marginBottom:20 }}>
              <AdsenseUnit placement="detail-inarticle" className="w-full" />
            </div>

            {/* Scraped content */}
            {annotatedHtml && (
              <div style={{ marginBottom:20 }}>
                <SectionLabel icon="📋" color={C.navy}>Full Details</SectionLabel>
                <div
                  className="sa-content"
                  dangerouslySetInnerHTML={{ __html: annotatedHtml }}
                />
              </div>
            )}

            <HumanContentSection humanContent={job.humanContent} />
            <StructuredFaqSection faq={structuredFaq} />
          </article>

          {/* ── SIDEBAR ── */}
          <aside className="sa-sidebar" aria-label="Job summary">
            <ApplyButton href={job.officialWebsite} />
            <ImportantDatesCard dates={importantDates} />
            <AgeLimitCard ageLimit={job.ageLimit} />
            <QuickStatsCard job={job} hasVacancyTable={vacancyTable.length > 0} />
            <ImportantLinksCard links={importantLinks} />

            {/* Sidebar Ad */}
            <div className="sa-ad-wrap">
              <AdsenseUnit placement="detail-sidebar" className="w-full" />
            </div>
          </aside>

        </div>

        {/* Bottom Ad */}
        <div className="sa-ad-wrap" style={{ marginTop:28 }}>
          <AdsenseUnit placement="detail-bottom" className="w-full" />
        </div>
      </main>

      {/* ══ GLOBAL CSS ══ */}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Root */
        .sa-root { background: ${C.bg}; min-height: 100vh; font-family: ${body}; }

        /* Hero */
        .sa-hero {
          background: linear-gradient(160deg, ${C.navyD} 0%, ${C.navy} 60%, #1B3A5E 100%);
          border-bottom: 4px solid ${C.saffron};
        }
        .sa-hero-inner { max-width: 1140px; margin: 0 auto; padding: 24px 20px 28px; }

        /* Breadcrumb */
        .sa-breadcrumb {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          font-family: ${body}; font-size: 11px; color: rgba(255,255,255,0.35);
          margin-bottom: 16px; list-style: none;
        }
        .sa-bc-link { color: rgba(255,255,255,0.4); text-decoration: none; }
        .sa-bc-link:hover { color: rgba(255,255,255,0.7); }
        .sa-bc-curr { color: ${C.gold}; font-weight: 600; }

        /* Tags */
        .sa-tag {
          font-family: ${body}; font-size: 10px; font-weight: 700;
          padding: 3px 11px; border-radius: 20px;
          letter-spacing: 0.04em; white-space: nowrap;
        }
        .sa-tag-gold   { background: rgba(201,149,42,0.2); color: ${C.gold}; border: 1px solid rgba(201,149,42,0.35); }
        .sa-tag-ghost  { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.12); }
        .sa-tag-green  { background: rgba(26,122,74,0.25); color: #4ADE80; border: 1px solid rgba(74,222,128,0.3); }
        .sa-tag-red    { background: rgba(192,57,43,0.25); color: #F87171; border: 1px solid rgba(248,113,113,0.3); }
        .sa-tag-blue   { background: rgba(27,79,138,0.3); color: #93C5FD; border: 1px solid rgba(147,197,253,0.3); }

        /* Title */
        .sa-title {
          font-family: ${heading};
          font-size: clamp(20px, 3.5vw, 30px);
          font-weight: 800; color: #fff;
          line-height: 1.2; margin-bottom: 10px;
          letter-spacing: -0.01em;
        }

        /* Hero pills */
        .sa-hero-pills {
          display: flex; gap: 10px; flex-wrap: wrap;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        /* Body */
        .sa-body { max-width: 1140px; margin: 0 auto; padding: 24px 20px 56px; }

        /* Back link */
        .sa-back {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: ${body}; font-size: 12px; font-weight: 700;
          color: ${C.sub}; text-decoration: none; margin-bottom: 20px;
          padding: 6px 14px; border-radius: 6px;
          background: ${C.surface}; border: 1px solid ${C.border};
          transition: border-color 0.15s;
        }
        .sa-back:hover { border-color: ${C.saffron}; color: ${C.saffron}; }

        /* Ad wrapper */
        .sa-ad-wrap {
          border: 1px solid ${C.border}; border-radius: 8px;
          background: ${C.surface}; padding: 4px; overflow: hidden;
        }

        /* Two-column layout */
        .sa-layout {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: 24px;
          align-items: start;
        }

        /* Sidebar sticky */
        .sa-sidebar { position: sticky; top: 20px; }

        /* Human content grid */
        .human-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* Scraped content styling */
        .sa-content { font-family: ${body}; font-size: 13.5px; color: #3A3530; line-height: 1.78; }
        .sa-content h1 { font-family: ${heading}; font-size: 20px; font-weight: 700; color: ${C.navy}; margin: 0 0 14px; line-height: 1.3; }
        .sa-content h2 {
          font-family: ${body}; font-size: 11px; font-weight: 800;
          letter-spacing: 0.16em; text-transform: uppercase; color: ${C.sub};
          margin: 22px 0 10px; padding: 8px 14px;
          background: ${C.bg}; border-left: 4px solid ${C.saffron};
          border-radius: 0 6px 6px 0;
        }
        .sa-content ul { padding-left: 20px; margin: 10px 0; }
        .sa-content li { margin-bottom: 6px; color: #3A3530; }
        .sa-content table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 12.5px; border-radius: 8px; overflow: hidden; border: 1px solid ${C.border}; }
        .sa-content table td, .sa-content table th { padding: 9px 13px; border: 1px solid ${C.border}; vertical-align: top; }
        .sa-content table tr:first-child td, .sa-content table thead th { background: ${C.navy}; font-weight: 700; color: #fff; border-color: ${C.navyD}; }
        .sa-content table tr:nth-child(even) td { background: ${C.bg}; }
        .sa-content p { margin: 9px 0; }

        /* FAQ */
        details summary::-webkit-details-marker { display: none; }
        details[open] summary span:last-child { transform: rotate(45deg); display: inline-block; }

        /* Animations */
        @keyframes sa-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

        /* ── RESPONSIVE ── */
        @media (max-width: 900px) {
          .sa-layout {
            grid-template-columns: 1fr;
          }
          .sa-sidebar {
            position: static;
            /* On mobile, show sidebar ABOVE article */
            order: -1;
          }
          .sa-main { order: 0; }
          .human-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 600px) {
          .sa-hero-inner { padding: 18px 14px 22px; }
          .sa-body { padding: 16px 14px 40px; }
          .sa-title { font-size: 20px; }
          .sa-hero-pills { gap: 8px; }
          .sa-hero-pills > div { min-width: calc(50% - 4px); flex: 1; }
          .sa-layout { gap: 16px; }
        }

        @media (max-width: 400px) {
          .sa-hero-pills > div { min-width: 100%; }
          .sa-tag { font-size: 9px; padding: 2px 8px; }
        }
      `}</style>
    </div>
  )
}