import Link from 'next/link'
import { notFound } from 'next/navigation'
import AdsenseUnit from '@/components/ads/AdsenseUnitClient'

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

// ── Design Tokens ────────────────────────────────────────────────────────────
const C = {
  bg:       '#F5F3EE',
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
  border:   '#E0DBD2',
  borderD:  '#C8C2B6',
  divider:  '#EDEAE4',
}
// ── Font: Roboto (user-specified) ─────────────────────────────────────────────
const heading = "'Roboto Slab', Georgia, serif"
const body    = "'Roboto', 'Segoe UI', sans-serif"

// ── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({ icon, title, accent = C.saffron, action }) {
  return (
    <div className="flex items-center justify-between mb-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: accent + '18' }}>
          {icon}
        </div>
        <span className="text-base font-bold tracking-tight" style={{ fontFamily: heading, color: C.navy }}>
          {title}
        </span>
      </div>
      {action}
    </div>
  )
}

// ── Card wrapper ──────────────────────────────────────────────────────────────
function Card({ children, accent = C.saffron, style = {} }) {
  return (
    <div className="rounded-xl"
      style={{ background: C.surface, border: `1px solid ${C.border}`, borderTop: `3px solid ${accent}`, ...style }}>
      {children}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
function Divider({ label }) {
  return (
    <div className="flex items-center gap-3.5 my-7">
      <div className="flex-1 h-px" style={{ background: C.border }} />
      {label && (
        <span className="text-xs font-extrabold tracking-widest uppercase whitespace-nowrap" style={{ fontFamily: body, color: C.muted }}>
          {label}
        </span>
      )}
      <div className="flex-1 h-px" style={{ background: C.border }} />
    </div>
  )
}

// ── Apply Button ──────────────────────────────────────────────────────────────
function ApplyButton({ href }) {
  if (!href) return null
  return (
    <div className="mb-6">
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2.5 w-full py-4 px-6 rounded-xl text-white no-underline"
        style={{
          background: `linear-gradient(135deg, ${C.green} 0%, #0E5C37 100%)`,
          fontFamily: body, fontSize: 15, fontWeight: 800,
          letterSpacing: '0.03em', boxShadow: `0 6px 24px ${C.green}40`,
        }}>
        <span className="text-xl">📝</span>
        Apply Online Now →
      </a>
      <p className="text-center mt-1.5 italic" style={{ fontFamily: body, fontSize: 10.5, color: C.muted }}>
        Always verify from official source before applying
      </p>
    </div>
  )
}

// ── Overview Strip ────────────────────────────────────────────────────────────
function OverviewStrip({ job }) {
  const items = [
    job.conductingAuthority && { icon: '🏢', label: 'Authority', value: job.conductingAuthority },
    job.totalVacancies      && { icon: '👥', label: 'Vacancies', value: String(job.totalVacancies) },
    job.category            && { icon: '📂', label: 'Category',  value: job.category },
    job.location            && { icon: '📍', label: 'Location',  value: job.location },
    job.salary              && { icon: '💰', label: 'Pay Scale', value: job.salary },
    job.advertisementNumber && { icon: '📄', label: 'Advt. No.', value: job.advertisementNumber },
  ].filter(Boolean)
  if (!items.length) return null
  return (
    <div className="grid gap-px rounded-xl overflow-hidden mb-6"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', background: C.border, border: `1px solid ${C.border}` }}>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2.5 p-3.5" style={{ background: C.surface }}>
          <span className="text-lg leading-none mt-0.5">{item.icon}</span>
          <div>
            <div className="font-bold uppercase tracking-widest mb-1" style={{ fontFamily: body, fontSize: 9.5, color: C.muted, letterSpacing: '0.12em' }}>
              {item.label}
            </div>
            <div className="font-bold leading-tight" style={{ fontFamily: body, fontSize: 13, color: C.ink }}>
              {item.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Important Dates + Fee — side by side ─────────────────────────────────────
function DatesFeeRow({ dates, fee }) {
  const hasDates = dates && Object.entries(dates).filter(([, v]) => v).length > 0
  const hasFee   = fee && typeof fee === 'object' && [fee.general, fee.sc, fee.ph || fee.ews].some(Boolean)
  if (!hasDates && !hasFee) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return (
    <div className="dates-fee-row mb-6">
      {hasDates && (
        <Card accent={C.blue}>
          <div className="px-4 pt-3.5">
            <SectionHeader icon="📅" title="Important Dates" accent={C.blue} />
          </div>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {Object.entries(dates).filter(([, v]) => v).map(([label, value], i) => {
                const parsed    = parseTextDate(String(value))
                const isUpcoming = parsed && parsed >= today
                const isExpired  = parsed && parsed < today
                return (
                  <tr key={label} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                    <td className="font-semibold align-middle" style={{ fontFamily: body, fontSize: 11.5, color: C.sub, padding: '10px 18px', borderBottom: `1px solid ${C.divider}`, width: '52%' }}>
                      {label}
                    </td>
                    <td className="align-middle font-bold" style={{ fontFamily: body, fontSize: 12, color: isUpcoming ? C.green : isExpired ? C.red : C.ink, padding: '10px 18px', borderBottom: `1px solid ${C.divider}` }}>
                      <span className="flex items-center gap-1.5">
                        {isUpcoming && <span className="w-2 h-2 rounded-full flex-shrink-0 inline-block" style={{ background: C.green }} />}
                        <time dateTime={parsed ? parsed.toISOString().slice(0, 10) : undefined}>{String(value)}</time>
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
      {hasFee && (
        <Card accent={C.gold}>
          <div className="px-4 pt-3.5">
            <SectionHeader icon="💳" title="Application Fee" accent={C.gold} />
          </div>
          <table className="w-full" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              {[
                { label: 'General / OBC', value: fee.general },
                { label: 'SC / ST',       value: fee.sc },
                { label: 'PwD / EWS',     value: fee.ph || fee.ews },
              ].filter(r => r.value != null).map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? C.surface : C.bg }}>
                  <td className="font-semibold align-middle" style={{ fontFamily: body, fontSize: 12, color: C.sub, padding: '11px 18px', borderBottom: `1px solid ${C.divider}`, width: '55%' }}>
                    {r.label}
                  </td>
                  <td className="font-extrabold align-middle" style={{ fontFamily: body, fontSize: 15, color: '#7A4F00', padding: '11px 18px', borderBottom: `1px solid ${C.divider}` }}>
                    ₹{r.value}/-
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fee.paymentModes?.length > 0 && (
            <div className="px-4 py-2 pb-3" style={{ background: C.goldL }}>
              <span className="font-semibold" style={{ fontFamily: body, fontSize: 10.5, color: '#7A4F00' }}>
                💳 Mode: {fee.paymentModes.join(' · ')}
              </span>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

// ── Age Limit ─────────────────────────────────────────────────────────────────
function AgeLimitSection({ ageLimit }) {
  if (!ageLimit) return null
  const { min, max, byCategory } = ageLimit
  if (!min && !max && !byCategory?.length) return null
  return (
    <div className="mb-6">
      <SectionHeader icon="🎂" title="Age Limit" accent={C.saffron} />
      <Card accent={C.saffron}>
        {(min || max) && (
          <div className="flex items-center gap-0 px-6 py-5" style={{ borderBottom: byCategory?.length ? `1px solid ${C.divider}` : 'none' }}>
            {min && (
              <div className="text-center flex-1">
                <div className="font-bold leading-none" style={{ fontFamily: heading, fontSize: 36, color: C.navy }}>{min}</div>
                <div className="font-bold uppercase tracking-widest mt-1.5" style={{ fontFamily: body, fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>Min Age</div>
              </div>
            )}
            {min && max && <div className="h-12 w-px" style={{ background: C.border }} />}
            {max && (
              <div className="text-center flex-1">
                <div className="font-bold leading-none" style={{ fontFamily: heading, fontSize: 36, color: C.saffron }}>{max}</div>
                <div className="font-bold uppercase tracking-widest mt-1.5" style={{ fontFamily: body, fontSize: 9, color: C.muted, letterSpacing: '0.12em' }}>Max Age</div>
              </div>
            )}
          </div>
        )}
        {byCategory?.length > 0 && (
          <div className="p-5">
            {byCategory.map((c, i) => (
              <div key={i} className="flex gap-2.5 items-start py-1.5" style={{ fontFamily: body, fontSize: 13, color: C.sub, lineHeight: 1.6, borderBottom: i < byCategory.length - 1 ? `1px dashed ${C.border}` : 'none' }}>
                <span className="font-bold flex-shrink-0 mt-0.5" style={{ color: C.saffron }}>▸</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

// ── Vacancy Table ─────────────────────────────────────────────────────────────
function VacancySection({ vacancyTable, totalVacancies }) {
  if (!vacancyTable?.length) return null
  const headers = ['Post Name', 'Total', 'UR', 'OBC', 'SC', 'ST', 'EWS']
  return (
    <div className="mb-6">
      <SectionHeader icon="👥" title="Vacancy Breakdown" accent={C.navy} />
      <Card accent={C.navy} style={{ overflow: 'hidden' }}>
        {totalVacancies && (
          <div className="flex items-center justify-between px-5 py-2.5" style={{ background: C.navy }}>
            <span className="font-semibold" style={{ fontFamily: body, fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>Total Sanctioned Posts</span>
            <span className="font-bold text-white" style={{ fontFamily: heading, fontSize: 22 }}>{totalVacancies}</span>
          </div>
        )}
        <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
          <table className="w-full" style={{ borderCollapse: 'collapse', fontFamily: body, minWidth: 520 }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {headers.map((h, i) => (
                  <th key={h} className="whitespace-nowrap font-extrabold uppercase tracking-widest" style={{ padding: '10px 14px', fontSize: 9.5, color: C.sub, textAlign: i === 0 ? 'left' : 'center', borderBottom: `2px solid ${C.borderD}`, letterSpacing: '0.14em' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vacancyTable.map((row, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${C.divider}`, background: i % 2 === 0 ? C.surface : C.bg }}>
                  <td className="font-semibold" style={{ padding: '11px 14px', fontSize: 13.5, color: C.ink }}>{row.post || '—'}</td>
                  <td style={{ padding: '11px 14px', textAlign: 'center' }}>
                    <span className="inline-block font-extrabold text-white rounded" style={{ background: C.navy, padding: '2px 12px', fontSize: 13 }}>
                      {row.count || row.total || '—'}
                    </span>
                  </td>
                  {['ur','obc','sc','st','ews'].map(k => (
                    <td key={k} className="font-semibold" style={{ padding: '11px 14px', textAlign: 'center', fontSize: 13, color: C.sub }}>
                      {row[k] || '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ── Eligibility ───────────────────────────────────────────────────────────────
function EligibilitySection({ eligibility }) {
  if (!eligibility?.length) return null
  return (
    <div className="mb-6">
      <SectionHeader icon="🎓" title="Eligibility & Qualification" accent={C.blue} />
      <div className="flex flex-col gap-2.5">
        {eligibility.map((e, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="flex items-center gap-3 px-4 py-2.5" style={{ background: C.blueL, borderBottom: `1px solid ${C.border}` }}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-white font-extrabold" style={{ background: C.blue, fontFamily: body, fontSize: 12 }}>{i + 1}</div>
              <span className="font-bold" style={{ fontFamily: body, fontSize: 13.5, color: C.navy }}>{e.post}</span>
              {e.payScale && (
                <span className="ml-auto font-bold whitespace-nowrap rounded" style={{ fontFamily: body, fontSize: 11.5, color: '#7A4F00', background: C.goldL, padding: '3px 12px' }}>
                  💰 {e.payScale}
                </span>
              )}
            </div>
            <div className="px-4 py-3.5" style={{ fontFamily: body, fontSize: 13, color: C.sub, lineHeight: 1.75 }}>
              {e.qualification || 'Refer to official notification for qualification details.'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Selection Process ─────────────────────────────────────────────────────────
function SelectionProcessSection({ steps }) {
  if (!steps?.length) return null
  return (
    <div className="mb-6">
      <SectionHeader icon="🏆" title="Selection Process" accent={C.saffron} />
      <Card accent={C.saffron} style={{ padding: '20px 18px', overflowX: 'auto' }}>
        <div className="flex items-start overflow-x-auto" style={{ minWidth: steps.length * 100, gap: 0 }}>
          {steps.map((step, i) => (
            <div key={i} className="flex-1 flex flex-col items-center relative">
              {i < steps.length - 1 && (
                <div className="absolute top-4.5 left-1/2 h-0.5 w-full z-0" style={{ background: `linear-gradient(90deg, ${C.saffron}, ${C.gold})` }} />
              )}
              <div className="w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-white relative z-10 flex-shrink-0 mb-2.5" style={{ background: `linear-gradient(135deg, ${C.saffron}, ${C.gold})`, fontFamily: body, fontSize: 14, boxShadow: `0 3px 10px ${C.saffron}44` }}>
                {i + 1}
              </div>
              <div className="font-semibold text-center px-1.5" style={{ fontFamily: body, fontSize: 11, color: C.sub, lineHeight: 1.45 }}>{step}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ── Important Links ───────────────────────────────────────────────────────────
function ImportantLinksSection({ links }) {
  if (!links?.length) return null
  const filtered = links.filter(l => l.label && l.url)
  if (!filtered.length) return null
  const seenUrls = new Set()
  const deduped = filtered.filter(l => { if (seenUrls.has(l.url)) return false; seenUrls.add(l.url); return true })
  const groups = []; const groupMap = {}
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
    <div className="mb-6">
      <SectionHeader icon="🔗" title="Important Links" accent={C.saffron} />
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {groups.map((group, gi) => {
          const cfg = TYPE_CONFIG[group.type] || defaultCfg
          if (group.items.length === 1) {
            return (
              <a key={gi} href={group.items[0].url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 no-underline rounded-xl"
                style={{ padding: '12px 16px', background: cfg.bg, color: cfg.fg, fontFamily: body, fontSize: 13, fontWeight: 700 }}>
                <span className="text-lg flex-shrink-0">{cfg.icon}</span>
                <span className="flex-1">{group.label}</span>
                <span style={{ opacity: 0.6, fontSize: 12 }}>↗</span>
              </a>
            )
          }
          return (
            <div key={gi} className="rounded-xl overflow-hidden" style={{ border: `2px solid ${cfg.bg}` }}>
              <div className="flex items-center gap-2 px-3.5 py-2.5 font-bold" style={{ background: cfg.bg, color: cfg.fg, fontFamily: body, fontSize: 13 }}>
                <span className="text-base">{cfg.icon}</span>
                <span className="flex-1">{group.label}</span>
                <span className="font-bold rounded-full" style={{ fontFamily: body, fontSize: 9, fontWeight: 700, background: 'rgba(255,255,255,0.25)', padding: '1px 6px' }}>
                  {group.items.length} Links
                </span>
              </div>
              {group.items.map((item, ii) => (
                <a key={ii} href={item.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 no-underline font-semibold"
                  style={{ padding: '8px 14px', background: ii % 2 === 0 ? '#F8F9FA' : '#FFF', color: C.blue, fontFamily: body, fontSize: 12, borderTop: `1px solid ${C.border}` }}>
                  <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 font-extrabold" style={{ background: cfg.bg, color: cfg.fg, fontFamily: body, fontSize: 10 }}>{ii + 1}</span>
                  <span className="flex-1">Link {ii + 1}</span>
                  <span className="text-xs" style={{ color: C.muted }}>↗</span>
                </a>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── How to Apply + Documents ──────────────────────────────────────────────────
function DynamicEditorialSection({ job }) {
  const authority = job.conductingAuthority || 'the official authority'
  const lastDate = job.applyLastDate
    ? new Date(job.applyLastDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

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

  return (
    <>
      <Divider label="Quick Reference" />
      {/* How to Apply */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📝</span>
          <span className="font-extrabold tracking-tight" style={{ fontFamily: body, fontSize: 13, color: C.navy }}>
            How to Apply — Step by Step
          </span>
          {lastDate && (
            <span className="ml-auto font-bold" style={{ fontFamily: body, fontSize: 11, color: C.green }}>
              ⏰ Deadline: {lastDate}
            </span>
          )}
        </div>
        <ol className="flex flex-col gap-2" style={{ paddingLeft: 20, margin: 0 }}>
          {applySteps.map((step, i) => (
            <li key={i} style={{ fontFamily: body, fontSize: 13, color: C.ink, lineHeight: 1.7 }}>{step}</li>
          ))}
        </ol>
        {job.officialWebsite && (
          <a href={job.officialWebsite} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-3 no-underline font-bold" style={{ fontFamily: body, fontSize: 12.5, color: C.green }}>
            → Apply at Official Website ↗
          </a>
        )}
      </div>

      {/* Documents Required */}
      <div className="mb-7">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">📄</span>
          <span className="font-extrabold tracking-tight" style={{ fontFamily: body, fontSize: 13, color: C.navy }}>
            Documents Required
          </span>
        </div>
        <ul className="flex flex-col gap-1.5" style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
          {documents.map((doc, i) => (
            <li key={i} className="flex items-start gap-2" style={{ fontFamily: body, fontSize: 13, color: C.ink, lineHeight: 1.6 }}>
              <span className="font-extrabold flex-shrink-0 mt-0.5" style={{ color: C.blue }}>✓</span>
              <span>{doc}</span>
            </li>
          ))}
        </ul>
        <p className="italic mt-2.5" style={{ fontFamily: body, fontSize: 11, color: C.muted }}>
          * Carry originals and self-attested photocopies for document verification.
        </p>
      </div>
    </>
  )
}

// ── Human Content Blocks — PLAIN LIST STYLE (moved to bottom) ─────────────────
const BLOCK_META = {
  introduction:       { icon: '📌', label: 'Overview',        accent: C.blue },
  'exam-tips':        { icon: '🎯', label: 'Exam Tips',        accent: C.gold },
  salary:             { icon: '💰', label: 'Salary Info',      accent: C.green },
  'how-to':           { icon: '📝', label: 'How To Apply',     accent: C.green },
  preparation:        { icon: '📚', label: 'Preparation',      accent: '#7C3AED' },
  trust:              { icon: '🔒', label: 'Official Source',  accent: C.red },
  'trust-signal':     { icon: '🔒', label: 'Important Note',   accent: C.red },
  analysis:           { icon: '📊', label: 'Analysis',         accent: C.blue },
  documents:          { icon: '📄', label: 'Documents',        accent: C.gold },
  'fee-tips':         { icon: '💳', label: 'Fee Tips',         accent: C.gold },
  'age-info':         { icon: '🎂', label: 'Age & Relaxation', accent: C.saffron },
  'vacancy-insight':  { icon: '📊', label: 'Vacancy Insights', accent: C.blue },
  'who-should-apply': { icon: '🎓', label: 'Who Should Apply', accent: C.gold },
  'exam-strategy':    { icon: '🏆', label: 'Exam Strategy',    accent: C.green },
  'expert-faq':       { icon: '❓', label: 'Expert FAQ',       accent: C.blue },
  mistakes:           { icon: '⚠️', label: 'Common Mistakes',  accent: C.red },
}

function HumanContentSection({ humanContent }) {
  if (!humanContent?.blocks?.length) return null
  return (
    <div className="mb-6">
      <Divider label="Detailed Guide" />
      <div className="flex flex-col gap-6">
        {humanContent.blocks.map((block) => {
          const meta = BLOCK_META[block.type] || { icon: '📋', label: block.type, accent: C.border }
          const lines = block.content.split('\n').filter(l => l.trim())
          return (
            <div key={block.blockId}>
              {/* Section heading — plain, no box */}
              <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: `2px solid ${meta.accent}` }}>
                <span className="text-base">{meta.icon}</span>
                <span className="font-extrabold uppercase tracking-widest" style={{ fontFamily: body, fontSize: 10, color: meta.accent, letterSpacing: '0.18em' }}>
                  {meta.label}
                </span>
              </div>
              {/* Content as plain list */}
              <ul className="flex flex-col gap-1.5" style={{ paddingLeft: 0, margin: 0, listStyle: 'none' }}>
                {lines.map((line, i) => {
                  const isList = /^[•\-]/.test(line) || /^\d+[.)]\s/.test(line)
                  const cleanLine = line.replace(/^[•\-]\s*/,'').replace(/^\d+[.)]\s*/,'')
                  return (
                    <li key={i} className="flex items-start gap-2" style={{ fontFamily: body, fontSize: 13, color: C.ink, lineHeight: 1.75 }}>
                      {isList ? (
                        <>
                          <span className="flex-shrink-0 font-bold mt-0.5" style={{ color: meta.accent }}>▸</span>
                          <span>{cleanLine}</span>
                        </>
                      ) : (
                        <p className="m-0">{line}</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────────────
function FaqSection({ faq }) {
  if (!faq?.length) return null
  const faqSchema = {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(f => ({ '@type':'Question', name:f.q, acceptedAnswer: { '@type':'Answer', text:f.a } })),
  }
  return (
    <div className="mb-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <SectionHeader icon="❓" title="Frequently Asked Questions" accent={C.blue} />
      <Card accent={C.blue}>
        {faq.map((item, i) => (
          <details key={i} style={{ borderBottom: i < faq.length - 1 ? `1px solid ${C.divider}` : 'none' }}>
            <summary className="flex justify-between items-start gap-3 cursor-pointer select-none font-bold" style={{ padding: '14px 20px', listStyle: 'none', fontFamily: body, fontSize: 14, color: C.ink }}>
              <span>{item.q}</span>
              <span className="flex-shrink-0 font-light text-2xl leading-none" style={{ color: C.saffron }}>+</span>
            </summary>
            <div className="leading-relaxed" style={{ padding: '12px 20px 16px', background: C.bg, fontFamily: body, fontSize: 13.5, color: C.sub, lineHeight: 1.78, borderTop: `1px solid ${C.divider}` }}>
              {item.a}
            </div>
          </details>
        ))}
      </Card>
    </div>
  )
}

// ── START PREPARING SECTION ──────────────────────────────────────────────────
function StartPreparingSection({ job }) {
  const combined = `${job.category || ''} ${job.sectionName || ''} ${job.title || ''}`.toLowerCase()
  let prepTips
  if (/railway|rrb|ntpc|group[\s-]*d/.test(combined)) {
    prepTips = [
      { title: 'Mathematics (Arithmetic)', desc: 'Number System, Percentage, Ratio, and Simplification are RRB exam staples — start here.', icon: '🔢' },
      { title: 'General Intelligence & Reasoning', desc: 'Practise coding-decoding, series, and analogy questions daily to build speed.', icon: '🧠' },
      { title: 'General Awareness', desc: 'Cover last 6 months of current affairs; balance it with static GK (History, Geography, Polity).', icon: '🌐' },
      { title: 'Time Management', desc: 'Each section has ~25 minutes. Aim for 70–80% accuracy at pace rather than attempting all questions.', icon: '⏱️' },
    ]
  } else if (/bank|sbi|ibps|clerk|po/.test(combined)) {
    prepTips = [
      { title: 'Quantitative Aptitude', desc: 'Data Interpretation and Arithmetic carry the most weight — prioritise these topics.', icon: '📊' },
      { title: 'English Language', desc: 'Reading Comprehension, Error Detection, and Cloze Test appear in almost every bank exam.', icon: '📖' },
      { title: 'Reasoning Ability', desc: 'Puzzles and Seating Arrangement are time-consuming — build speed through consistent daily practice.', icon: '🔍' },
      { title: 'Current Affairs & Banking', desc: 'A 6-month capsule plus Banking Awareness is essential, especially for Mains stage.', icon: '🏦' },
    ]
  } else if (/police|constable|sub\s*inspector|\bsi\b/.test(combined)) {
    prepTips = [
      { title: 'Physical Fitness', desc: 'PET / PST eliminates many candidates — begin running and physical training at least 3 months early.', icon: '🏃' },
      { title: 'State-specific GK', desc: 'Each state exam includes questions on local history, geography, and current events.', icon: '🗺️' },
      { title: 'General Knowledge & Reasoning', desc: 'Practise SSC-level material for the written examination.', icon: '🧩' },
      { title: 'Know the Exam Stages', desc: 'Written → PET → Medical. Clear each stage fully before focusing on the next.', icon: '🎯' },
    ]
  } else if (/teacher|tet|ctet|kvs|nvs/.test(combined)) {
    prepTips = [
      { title: 'Child Development & Pedagogy', desc: 'Highest-weightage section — study Piaget, Vygotsky, and learning theories in depth.', icon: '👶' },
      { title: 'NCERT Mastery', desc: 'Deep knowledge of subject NCERT books (6th–12th) is essential for the Paper II subject section.', icon: '📚' },
      { title: 'Language Sections', desc: 'Both L1 and L2 are tested on grammar, comprehension, and pedagogy — do not neglect either.', icon: '🗣️' },
      { title: 'Previous Year Papers', desc: 'CTET patterns are consistent — solving 2019–2024 papers is a must for exam readiness.', icon: '📝' },
    ]
  } else if (/ssc|staff\s*selection|cgl|chsl|mts|cpo/.test(combined)) {
    prepTips = [
      { title: 'Tier I: Reasoning & GA', desc: 'Reasoning and General Awareness are the fastest to score — master these in the Tier I stage.', icon: '🧠' },
      { title: 'Quantitative Aptitude', desc: 'Arithmetic (Percentage, SI/CI, Profit-Loss, Time-Work) is tested at every level.', icon: '🔢' },
      { title: 'English Language', desc: 'Fill in the Blanks, Sentence Improvement, and One-word Substitution are high-frequency question types.', icon: '📖' },
      { title: 'Tier II Preparation', desc: 'English Language and Quantitative Ability go deeper — start Tier II prep early after clearing Tier I.', icon: '📊' },
    ]
  } else {
    prepTips = [
      { title: 'Read the Notification', desc: 'The syllabus and exam pattern are officially defined in the notification — read it fully.', icon: '📋' },
      { title: 'Topic-wise Schedule', desc: 'Make a study schedule and follow it consistently — regularity beats last-minute cramming.', icon: '🗓️' },
      { title: 'Previous Year Papers', desc: 'Solve PYQs for pattern familiarity and to identify high-weightage topics.', icon: '📝' },
      { title: 'Mock Tests', desc: 'Attempt full-length mock tests regularly to build speed, accuracy, and exam composure.', icon: '🎯' },
    ]
  }
  const examName = job.title || 'This Exam'
  return (
    <div className="mb-6">
      <Divider label="Preparation Zone" />
      <div className="rounded-2xl p-6 mb-4" style={{ background: `linear-gradient(135deg, ${C.navy} 0%, #1B3A5E 100%)` }}>
        <div className="flex items-center gap-3 mb-1.5">
          <span className="text-3xl">🚀</span>
          <div>
            <div className="font-bold text-white leading-tight" style={{ fontFamily: heading, fontSize: 20 }}>
              Start Preparing for {examName}
            </div>
            <div className="mt-1" style={{ fontFamily: body, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
              Follow this strategy to maximise your chances of selection
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {prepTips.map((tip, i) => (
          <div key={i} className="flex gap-3.5 items-start rounded-xl p-4" style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.saffron}` }}>
            <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center text-xl" style={{ background: C.saffronL }}>
              {tip.icon}
            </div>
            <div>
              <div className="font-extrabold mb-1.5" style={{ fontFamily: body, fontSize: 13, color: C.navy }}>
                <span className="inline-block text-white rounded mr-1.5 font-extrabold uppercase tracking-wide align-middle" style={{ background: C.navy, fontSize: 9, padding: '1px 7px', borderRadius: 4 }}>0{i + 1}</span>
                {tip.title}
              </div>
              <div style={{ fontFamily: body, fontSize: 12.5, color: C.sub, lineHeight: 1.65 }}>{tip.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-3 rounded-xl p-3.5" style={{ background: C.greenL, border: `1px solid #86EFAC` }}>
        <span className="text-xl flex-shrink-0">💡</span>
        <div style={{ fontFamily: body, fontSize: 13, color: C.green, lineHeight: 1.7 }}>
          <strong>Pro Tip:</strong> Dedicate at least 3–4 hours daily starting today. Split your time: 50% on your weakest subject, 30% on moderate areas, and 20% on revision and mock tests. Consistency is more important than marathon sessions.
        </div>
      </div>
    </div>
  )
}

// ── RECOMMENDED BOOKS ─────────────────────────────────────────────────────────
function RecommendedBooksSection({ job }) {
  const combined = `${job.category || ''} ${job.sectionName || ''} ${job.title || ''}`.toLowerCase()
  let books
  if (/railway|rrb|ntpc|group[\s-]*d/.test(combined)) {
    books = [
      { title: 'RRB NTPC CBT Stage-1 & 2', author: 'Arihant Publications', subject: 'Complete Guide', icon: '🚂', color: C.blue },
      { title: 'Fast Track Objective Arithmetic', author: 'Rajesh Verma', subject: 'Mathematics', icon: '🔢', color: C.green },
      { title: 'Verbal & Non-Verbal Reasoning', author: 'R.S. Aggarwal', subject: 'Reasoning', icon: '🧩', color: C.saffron },
      { title: 'General Knowledge 2025', author: 'Manohar Pandey', subject: 'GK / GS', icon: '🌐', color: C.gold },
      { title: "Lucent's General Knowledge", author: 'Lucent Publication', subject: 'Static GK', icon: '📖', color: C.navy },
      { title: 'Kiran Railway Group-D Practice Sets', author: 'Kiran Prakashan', subject: 'Practice', icon: '📝', color: C.red },
    ]
  } else if (/bank|sbi|ibps|clerk|po/.test(combined)) {
    books = [
      { title: 'Quantitative Aptitude for Competitive Exams', author: 'R.S. Aggarwal', subject: 'Quant', icon: '📊', color: C.blue },
      { title: 'Objective English for Competitive Exams', author: 'S.P. Bakshi', subject: 'English', icon: '📖', color: C.green },
      { title: 'Banking Awareness', author: 'Arihant Publications', subject: 'Banking GK', icon: '🏦', color: C.saffron },
      { title: 'High Level Data Interpretation', author: 'Disha Experts', subject: 'DI', icon: '📉', color: C.gold },
      { title: 'A Modern Approach to Verbal Reasoning', author: 'R.S. Aggarwal', subject: 'Reasoning', icon: '🧩', color: C.navy },
      { title: 'IBPS / SBI Practice Sets', author: 'Kiran Prakashan', subject: 'Practice', icon: '📝', color: C.red },
    ]
  } else if (/police|constable/.test(combined)) {
    books = [
      { title: 'Constable / Sub-Inspector Guide', author: 'Arihant Publications', subject: 'Complete Guide', icon: '👮', color: C.blue },
      { title: 'Objective General Knowledge', author: 'S. Chand', subject: 'GK', icon: '🌐', color: C.green },
      { title: 'Verbal & Non-Verbal Reasoning', author: 'R.S. Aggarwal', subject: 'Reasoning', icon: '🧩', color: C.saffron },
      { title: "Lucent's General Knowledge", author: 'Lucent Publication', subject: 'Static GK', icon: '📖', color: C.gold },
    ]
  } else if (/teacher|tet|ctet|kvs|nvs/.test(combined)) {
    books = [
      { title: 'Child Development & Pedagogy', author: 'Disha Experts', subject: 'CDP', icon: '👶', color: C.blue },
      { title: 'CTET & TETs English Language', author: 'Pearson Education', subject: 'English', icon: '📖', color: C.green },
      { title: 'NCERT Mathematics Class 6–8', author: 'NCERT', subject: 'Maths (Paper II)', icon: '🔢', color: C.saffron },
      { title: 'CTET 15 Practice Papers (Paper I)', author: 'Arihant Publications', subject: 'Practice', icon: '📝', color: C.gold },
      { title: 'CTET Social Studies (Class VI–VIII)', author: 'S. Chand', subject: 'SST', icon: '🗺️', color: C.navy },
    ]
  } else if (/ssc|cgl|chsl|mts|cpo/.test(combined)) {
    books = [
      { title: 'SSC CGL Tier I & II (Chapter-wise Solved Papers)', author: 'Kiran Prakashan', subject: 'Practice', icon: '📝', color: C.blue },
      { title: 'Quantitative Aptitude for Competitive Exams', author: 'R.S. Aggarwal', subject: 'Quant', icon: '🔢', color: C.green },
      { title: 'A Mirror of Common Errors', author: 'A.K. Singh', subject: 'English Grammar', icon: '📖', color: C.saffron },
      { title: "Lucent's General Knowledge", author: 'Lucent Publication', subject: 'GK', icon: '🌐', color: C.gold },
      { title: 'Analytical Reasoning', author: 'M.K. Pandey', subject: 'Reasoning', icon: '🧩', color: C.navy },
      { title: 'SSC English by Kiran', author: 'Kiran Prakashan', subject: 'English', icon: '✍️', color: C.red },
    ]
  } else {
    books = [
      { title: 'Quantitative Aptitude for Competitive Exams', author: 'R.S. Aggarwal', subject: 'Mathematics', icon: '🔢', color: C.blue },
      { title: 'Verbal & Non-Verbal Reasoning', author: 'R.S. Aggarwal', subject: 'Reasoning', icon: '🧩', color: C.green },
      { title: "Lucent's General Knowledge", author: 'Lucent Publication', subject: 'GK', icon: '🌐', color: C.saffron },
      { title: 'Objective English for Competitive Exams', author: 'S.P. Bakshi', subject: 'English', icon: '📖', color: C.gold },
      { title: 'General Studies — Paper I', author: 'Disha Experts', subject: 'GS', icon: '📚', color: C.navy },
      { title: 'Previous Year Solved Papers', author: 'Arihant Publications', subject: 'Practice', icon: '📝', color: C.red },
    ]
  }
  return (
    <div className="mb-6">
      <SectionHeader icon="📚" title="Recommended Books" accent={C.gold} />
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {books.map((book, i) => (
          <div key={i} className="flex gap-3 items-start rounded-xl p-3.5 relative overflow-hidden" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
            <div className="absolute left-0 top-0 bottom-0 w-1" style={{ background: book.color }} />
            <div className="w-11 h-14 rounded-md flex-shrink-0 flex items-center justify-center text-2xl" style={{ background: book.color + '18', boxShadow: `inset 0 0 0 1px ${book.color}22` }}>
              {book.icon}
            </div>
            <div className="min-w-0">
              <div className="font-extrabold uppercase tracking-widest mb-1" style={{ fontFamily: body, fontSize: 9, color: book.color, letterSpacing: '0.12em' }}>{book.subject}</div>
              <div className="font-bold leading-snug mb-1.5" style={{ fontFamily: body, fontSize: 13, color: C.ink }}>{book.title}</div>
              <div className="font-semibold" style={{ fontFamily: body, fontSize: 11.5, color: C.muted }}>by {book.author}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 px-4 py-2.5 rounded-lg" style={{ background: C.goldL, border: `1px solid #DDB84A`, fontFamily: body, fontSize: 11.5, color: '#7A4F00' }}>
        📌 <strong>Note:</strong> Books listed are based on exam category. Always check the latest edition. Official NCERT books are recommended alongside these.
      </div>
    </div>
  )
}

// ── Strip duplicate scraped sections ─────────────────────────────────────────
function stripDuplicateSections(html, patterns) {
  if (!html || !patterns.length) return html
  const headingRe = /<(h[1-6])(?:\s[^>]*)?>[\s\S]*?<\/h[1-6]>/gi
  const headings = []
  let hm
  while ((hm = headingRe.exec(html)) !== null) {
    headings.push({ start: hm.index, end: hm.index + hm[0].length, level: parseInt(hm[0][2]), text: hm[0].replace(/<[^>]+>/g, '').trim() })
  }
  const toRemove = []
  for (let i = 0; i < headings.length; i++) {
    const h = headings[i]
    if (!patterns.some(p => p.test(h.text))) continue
    let end = html.length
    for (let j = i + 1; j < headings.length; j++) { if (headings[j].level <= h.level) { end = headings[j].start; break } }
    toRemove.push([h.start, end])
  }
  let result = html
  for (let i = toRemove.length - 1; i >= 0; i--) { result = result.slice(0, toRemove[i][0]) + result.slice(toRemove[i][1]) }
  return result
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
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

  // Strip duplicate sections — including human content block types to avoid duplication
  const humanBlockTypes = (job.humanContent?.blocks || []).map(b => b.type)
  const humanDupePatterns = []
  if (humanBlockTypes.includes('how-to'))           humanDupePatterns.push(/how\s*to\s*apply/i)
  if (humanBlockTypes.includes('documents'))        humanDupePatterns.push(/documents?\s*required/i)
  if (humanBlockTypes.includes('vacancy-insight'))  humanDupePatterns.push(/vacancy\s*(?:insight|detail)/i)
  if (humanBlockTypes.includes('who-should-apply')) humanDupePatterns.push(/who\s*should\s*apply/i)

  const stripPatterns = [
    /short\s+details/i,
    /pay\s+scale/i,
    ...(importantDates && Object.keys(importantDates).length ? [/important\s+dates?/i] : []),
    ...(job.applicationFee ? [/application\s+fee/i, /fee\s+(?:details?|payment)/i] : []),
    ...((job.ageLimit?.min || job.ageLimit?.max || job.ageLimit?.byCategory?.length) ? [/age\s+limit/i, /age\s+relaxation/i] : []),
    ...(vacancyTable.length > 0 ? [/vacancy\s+(?:details?|break)/i, /post[\s-]*wise\s+vacancy/i] : []),
    ...(job.eligibility?.length ? [/educational\s+qualif/i] : []),
    ...(job.selectionProcess?.length ? [/selection\s+process/i] : []),
    ...humanDupePatterns,
  ]
  const cleanedHtml  = stripDuplicateSections(contentHtml, stripPatterns)
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
        <div className="sa-inner">
          {/* Breadcrumb */}
          <nav aria-label="breadcrumb" className="sa-breadcrumb">
            <Link href="/" className="sa-bc-link">Home</Link>
            <span aria-hidden>›</span>
            <Link href="/jobs" className="sa-bc-link">Jobs</Link>
            <span aria-hidden>›</span>
            <span className="sa-bc-curr">{job.title}</span>
          </nav>

          {/* Badges */}
          <div className="flex gap-2 flex-wrap mb-3.5">
            {job.sectionName && <span className="sa-tag sa-tag-gold">{job.sectionName}</span>}
            {job.category    && <span className="sa-tag sa-tag-ghost">{job.category}</span>}
            <span className={`sa-tag ${job.isActive ? 'sa-tag-green' : 'sa-tag-red'}`}>
              {job.isActive ? '● Active' : '● Closed'}
            </span>
            {job.updatedAt && (
              <time dateTime={new Date(job.updatedAt).toISOString()} className="sa-tag sa-tag-blue">
                ↻ Updated {new Date(job.updatedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
              </time>
            )}
          </div>

          {/* Title */}
          <h1 className="sa-title">{job.title}</h1>

          {/* Author */}
          {job.author?.name && (
            <div className="mb-4" style={{ fontFamily: body, fontSize:11.5, color:'rgba(255,255,255,0.4)' }}
              itemScope itemType="https://schema.org/Person">
              By <span itemProp="name">{job.author.name}</span>
            </div>
          )}

          {/* Meta row */}
          <div className="sa-meta-row">
            <div className="sa-meta-pill">
              <span className="sa-meta-label">📅 Posted</span>
              <span className="sa-meta-val">{postedDate}</span>
            </div>
            <div className="sa-meta-pill sa-meta-pill--accent">
              <span className="sa-meta-label">⏰ Last Date</span>
              <span className="sa-meta-val">{applyDate}</span>
            </div>
            {job.conductingAuthority && (
              <div className="sa-meta-pill">
                <span className="sa-meta-label">🏢 Authority</span>
                <span className="sa-meta-val">{job.conductingAuthority}</span>
              </div>
            )}
            {job.totalVacancies && (
              <div className="sa-meta-pill sa-meta-pill--green">
                <span className="sa-meta-label">👥 Vacancies</span>
                <span className="sa-meta-val">{String(job.totalVacancies)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ══ BODY ══ */}
      <main className="sa-body">
        {/* Back */}
        <Link href="/jobs" className="sa-back">← All Jobs</Link>

        {/* Top Ad */}
        <div className="sa-ad-wrap mb-6">
          <AdsenseUnit placement="detail-top" className="w-full" />
        </div>

        {/* Apply button — full width at top */}
        <ApplyButton href={job.officialWebsite} />

        {/* Overview strip */}
        <OverviewStrip job={job} />

        {/* Dates + Fee side by side */}
        <DatesFeeRow dates={importantDates} fee={job.applicationFee} />

        {/* Age limit */}
        <AgeLimitSection ageLimit={job.ageLimit} />

        {/* Vacancy table */}
        <VacancySection vacancyTable={vacancyTable} totalVacancies={job.totalVacancies} />

        {/* Eligibility */}
        <EligibilitySection eligibility={job.eligibility} />

        {/* Selection process */}
        <SelectionProcessSection steps={job.selectionProcess} />

        {/* Important Links */}
        <ImportantLinksSection links={importantLinks} />

        {/* Mid Ad */}
        <div className="sa-ad-wrap mb-6">
          <AdsenseUnit placement="detail-inarticle" className="w-full" />
        </div>

        {/* Scraped full content */}
        {annotatedHtml && (
          <div className="mb-6">
            <Divider label="Full Details" />
            <div className="sa-content" dangerouslySetInnerHTML={{ __html: annotatedHtml }} />
          </div>
        )}

        {/* FAQ */}
        <FaqSection faq={structuredFaq} />

        {/* ★ Start Preparing */}
        <StartPreparingSection job={job} />

        {/* ★ Recommended Books */}
        <RecommendedBooksSection job={job} />

        {/* How to Apply + Documents — plain listing */}
        <DynamicEditorialSection job={job} />

        {/* ★ Human Content Blocks — MOVED TO BOTTOM, plain list style */}
        <HumanContentSection humanContent={job.humanContent} />

        {/* Bottom Apply button */}
        <ApplyButton href={job.officialWebsite} />

        {/* Bottom Ad */}
        <div className="sa-ad-wrap mt-2.5">
          <AdsenseUnit placement="detail-bottom" className="w-full" />
        </div>
      </main>

      {/* ══ GLOBAL CSS ══ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700;800&family=Roboto+Slab:wght@600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .sa-root { background: ${C.bg}; min-height: 100vh; font-family: ${body}; }

        /* Hero */
        .sa-hero {
          background: linear-gradient(160deg, ${C.navyD} 0%, ${C.navy} 60%, #1B3A5E 100%);
          border-bottom: 4px solid ${C.saffron};
        }
        .sa-inner { max-width: 860px; margin: 0 auto; padding: 24px 20px 28px; }

        /* Breadcrumb */
        .sa-breadcrumb {
          display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
          font-family: ${body}; font-size: 11px; color: rgba(255,255,255,0.35);
          margin-bottom: 16px;
        }
        .sa-bc-link { color: rgba(255,255,255,0.4); text-decoration: none; }
        .sa-bc-link:hover { color: rgba(255,255,255,0.75); }
        .sa-bc-curr { color: ${C.gold}; font-weight: 600; }

        /* Tags */
        .sa-tag {
          font-family: ${body}; font-size: 10px; font-weight: 700;
          padding: 3px 11px; border-radius: 20px;
          letter-spacing: 0.04em; white-space: nowrap;
        }
        .sa-tag-gold  { background: rgba(201,149,42,0.2);  color: ${C.gold};   border: 1px solid rgba(201,149,42,0.35); }
        .sa-tag-ghost { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.55); border: 1px solid rgba(255,255,255,0.12); }
        .sa-tag-green { background: rgba(26,122,74,0.25);  color: #4ADE80;     border: 1px solid rgba(74,222,128,0.3); }
        .sa-tag-red   { background: rgba(192,57,43,0.25);  color: #F87171;     border: 1px solid rgba(248,113,113,0.3); }
        .sa-tag-blue  { background: rgba(27,79,138,0.3);   color: #93C5FD;     border: 1px solid rgba(147,197,253,0.3); }

        /* Title */
        .sa-title {
          font-family: ${heading};
          font-size: clamp(20px, 3.5vw, 28px);
          font-weight: 800; color: #fff;
          line-height: 1.22; margin-bottom: 10px;
        }

        /* Meta row */
        .sa-meta-row {
          display: flex; gap: 10px; flex-wrap: wrap;
          padding-top: 18px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        .sa-meta-pill {
          display: flex; flex-direction: column; gap: 3px;
          padding: 10px 16px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 8px; min-width: 110px; flex: 1;
        }
        .sa-meta-pill--accent { border-color: rgba(252,211,77,0.35); background: rgba(252,211,77,0.08); }
        .sa-meta-pill--green  { border-color: rgba(74,222,128,0.3);  background: rgba(26,122,74,0.15); }
        .sa-meta-label { font-family: ${body}; font-size: 9.5px; color: rgba(255,255,255,0.4); font-weight: 600; }
        .sa-meta-val   { font-family: ${body}; font-size: 13px; font-weight: 700; color: #fff; }
        .sa-meta-pill--accent .sa-meta-val { color: #FCD34D; }
        .sa-meta-pill--green  .sa-meta-val { color: #6EE7B7; }

        /* Body */
        .sa-body { max-width: 860px; margin: 0 auto; padding: 24px 20px 56px; }

        /* Back link */
        .sa-back {
          display: inline-flex; align-items: center; gap: 5px;
          font-family: ${body}; font-size: 12px; font-weight: 700;
          color: ${C.sub}; text-decoration: none; margin-bottom: 20px;
          padding: 6px 14px; border-radius: 6px;
          background: ${C.surface}; border: 1px solid ${C.border};
        }
        .sa-back:hover { border-color: ${C.saffron}; color: ${C.saffron}; }

        /* Ad wrapper */
        .sa-ad-wrap {
          border: 1px solid ${C.border}; border-radius: 8px;
          background: ${C.surface}; padding: 4px; overflow: hidden;
        }

        /* Dates + Fee side by side */
        .dates-fee-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* Scraped content */
        .sa-content { font-family: ${body}; font-size: 13.5px; color: #3A3530; line-height: 1.8; }
        .sa-content h1 { font-family: ${heading}; font-size: 20px; font-weight: 700; color: ${C.navy}; margin: 0 0 14px; }
        .sa-content h2 {
          font-family: ${body}; font-size: 11px; font-weight: 800;
          letter-spacing: 0.16em; text-transform: uppercase; color: ${C.sub};
          margin: 22px 0 10px; padding: 8px 14px;
          background: ${C.bg}; border-left: 4px solid ${C.saffron};
          border-radius: 0 6px 6px 0;
        }
        .sa-content ul { padding-left: 20px; margin: 10px 0; }
        .sa-content li { margin-bottom: 6px; }
        .sa-content table { width: 100%; border-collapse: collapse; margin: 14px 0; font-size: 13px; border-radius: 8px; overflow: hidden; border: 1px solid ${C.border}; }
        .sa-content table td, .sa-content table th { padding: 9px 13px; border: 1px solid ${C.border}; vertical-align: top; }
        .sa-content table tr:first-child td, .sa-content table thead th { background: ${C.navy}; font-weight: 700; color: #fff; border-color: ${C.navyD}; }
        .sa-content table tr:nth-child(even) td { background: ${C.bg}; }
        .sa-content p { margin: 9px 0; }

        /* FAQ */
        details summary::-webkit-details-marker { display: none; }
        details[open] summary span:last-child { transform: rotate(45deg); display: inline-block; }

        /* Responsive */
        @media (max-width: 640px) {
          .dates-fee-row { grid-template-columns: 1fr; }
          .sa-meta-pill  { min-width: calc(50% - 5px); }
          .sa-inner, .sa-body { padding-left: 14px; padding-right: 14px; }
          .sa-title { font-size: 20px; }
        }
        @media (max-width: 400px) {
          .sa-meta-pill { min-width: 100%; }
          .sa-tag { font-size: 9px; padding: 2px 8px; }
        }
      `}</style>
    </div>
  )
}