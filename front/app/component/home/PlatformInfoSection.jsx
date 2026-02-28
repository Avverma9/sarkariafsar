import { BellRing, DatabaseZap, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

const sections = [
 {
  key: "why-we-are",
  title: "Why We Are",
  icon: Sparkles,
  iconClass: "text-indigo-600",
  badgeClass: "bg-indigo-50 border-indigo-200 text-indigo-700",
  description:
    "SarkariAfsar ka focus ek hi cheez par clear hai: aapko sarkari updates ko simple, readable aur fast format me dena, bina unnecessary noise ke. Result day ho ya form last date, users sabse zyada confusion tab feel karte hain jab information alag-alag jagah bikri hoti hai—kisi site par old notice, kisi Telegram channel par half screenshot, aur kisi group me wrong link. Hum isi gap ko fill karte hain by making updates structured, scannable, aur practical. Hamara goal “sirf news” dena nahi hai; goal hai aapko action-ready info dena—kya naya aaya, aapke liye relevant hai ya nahi, aur next step kya hai.\n\nHum content ko is tarah write karte hain ki aap 30–60 seconds me core point samajh jao: important dates, eligibility highlights, fees, selection process, aur official links. Long paragraphs me ghumane ke bajay hum short sections, checklists, aur clearly labeled categories use karte hain. Isse first-time candidates ko bhi clarity milti hai, aur experienced candidates ka time save hota hai. Sarkari ecosystem me ek aur real issue hota hai fake mirrors aur phishing links—especially results, admit card aur “fast download” type pages me. Isliye hum safety-first approach follow karte hain: official source emphasis, link hygiene reminders, aur steps jo users ko scam traps se bachate hain.\n\nSarkariAfsar ko design karte waqt humne ye maana ki India me user contexts different hain—kisi ke paas fast internet hai, kisi ke paas slow network; koi mobile par check karta hai, koi cyber-cafe se; koi Hindi comfortable hai, koi Hinglish. Isliye hamara writing style plain language me hota hai, with practical cues. Jahan possible ho, hum state-wise filtering aur category structure se “irrelevant clutter” reduce karte hain. Agar aap Bihar me ho, to aapko Bihar-specific alerts aur relevant national updates easily dikhne chahiye; agar aap Rajasthan me ho, to feed uske hisaab se useful feel honi chahiye. Same logic schemes par bhi apply hota hai, kyunki yojana eligibility often state + income + category based hoti hai.\n\nSpeed bhi ek core promise hai. Official portals slow ho sakte hain, notices late-night update ho sakte hain, aur candidates last day par panic me hote hain. Hum updates ko fast, clean formatting me publish karne ki koshish karte hain, taaki aapko basic info ke liye 10 tabs open na karne pade. Saath hi, hum “readability over hype” choose karte hain—clickbait titles, fake urgency, ya misleading claims se trust break hota hai. SarkariAfsar me emphasis verification par rehta hai: official notification/notice as primary reference, aur user ko clear next action.\n\nFinally, hum community problems ko bhi samajhte hain: form rejection due to small mistakes, payment debited but status failed, OTP issues, photo/signature size mismatch, correction window confusion, admit card mismatch, DV document kit—ye sab real pain points hain jo preparation se directly connected hain. Isliye hum sirf updates nahi, guides aur checklists bhi publish karte hain. Aapko ek aisa platform milta hai jahan update bhi hai aur “how-to” bhi, so that you can move from information to execution without delay. SarkariAfsar ka simple promise ye hai: aapko confusion se nikal kar clarity me lana, aur clarity se action me.",
  points: [
    "Single place par jobs, results, admit cards aur schemes: Aapko alag-alag sites, channels aur forwarded screenshots par depend nahi rehna padta. SarkariAfsar me updates ko structured categories me rakha jata hai, jisse aap quickly decide kar sako ki aapke exam/post/scheme se related kya naya aaya hai. Is approach ka main benefit time saving aur consistency hai—same style, same layout, aur clear next-step cues.",
    "Clear category structure aur state-wise filtering: Har update sabke kaam ka nahi hota, aur isi wajah se users feed me lost feel karte hain. Hum categories (Guides, Applications, Exam Prep, Schemes) aur state-wise relevance ko priority dete hain taaki content purposeful rahe. Aapko Bihar/UP/Delhi ya apne preferred states ke updates ko scan karna easy hota hai, aur unnecessary noise automatically kam ho jata hai.",
    "Important links tak quick pahunch: Result, admit card, application, answer key, objection window—sab me official link ka role critical hota hai. Hum quick access mindset se content arrange karte hain taaki aapko official source pe pahunchne me extra steps na lene pade. Saath hi, hum link-safety reminders ko include karte hain (lookalike domains, popups, shortened URLs) jisse aap fake pages aur wrong downloads se bache rahen."
  ]
}
,
  {
    key: "how-we-collect-information",
    title: "How We Collect Information",
    icon: DatabaseZap,
    iconClass: "text-emerald-600",
    badgeClass: "bg-emerald-50 border-emerald-200 text-emerald-700",
    description:
      "Hum public portals aur official sources se updates track karke unhe structured aur easy-to-scan format me present karte hain.",
    points: [
      "Notifications ko category ke hisab se map kiya jata hai.",
      "Important details ko readable sections me break kiya jata hai.",
      "Final verification ke liye official source refer karne ki recommendation di jati hai.",
    ],
  },
  {
    key: "how-sarkariafsar-is-useful",
    title: "How SarkariAfsar Is Useful",
    icon: ShieldCheck,
    iconClass: "text-sky-600",
    badgeClass: "bg-sky-50 border-sky-200 text-sky-700",
    description:
      "Time bachane ke liye updates ko actionable format me diya jata hai, jisse users quickly decide kar saken ki kis update par focus karna hai.",
    points: [
      "Search bar se relevant post tak fast pahunch.",
      "Section-wise browsing: Jobs, Results, Admit Cards, Schemes.",
      "User-friendly navigation with breadcrumbs and quick links.",
    ],
  },
  {
    key: "how-to-get-updated",
    title: "How To Get Updated",
    icon: BellRing,
    iconClass: "text-rose-600",
    badgeClass: "bg-rose-50 border-rose-200 text-rose-700",
    description:
      "Regularly updated rehne ke liye aapko basic routine follow karna chahiye, especially exam ya application season me.",
    points: [
      "Daily ek baar Jobs aur Results section check karein.",
      "Important posts ko bookmark karke deadline note karein.",
      "Guides aur updates ke liye Blog section follow karein.",
    ],
    cta: {
      label: "Open Blog Guides",
      href: "/blog",
    },
  },
];

export default function PlatformInfoSection() {
  return (
    <section id="platform-info" className="mt-16">
      <div className="mb-8 px-2">
        <h2 className="text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          SarkariAfsar Information Hub
        </h2>
        <p className="mt-1 font-medium text-slate-500">
          Platform kaam kaise karta hai aur aapko latest updates kaise milenge.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {sections.map((section) => {
          const Icon = section.icon;

          return (
            <article
              key={section.key}
              className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 shadow-inner">
                  <Icon className={`h-7 w-7 ${section.iconClass}`} />
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-black tracking-widest uppercase ${section.badgeClass}`}
                >
                  Info
                </span>
              </div>

              <h3 className="text-xl font-black tracking-tight text-slate-900">
                {section.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed font-medium text-slate-600">
                {section.description}
              </p>

              <ul className="mt-4 list-disc space-y-1.5 pl-5 text-sm font-medium text-slate-700">
                {section.points.map((point) => (
                  <li key={`${section.key}-${point}`}>{point}</li>
                ))}
              </ul>

              {section.cta ? (
                <Link
                  href={section.cta.href}
                  className="mt-6 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-700 transition-colors hover:bg-indigo-100"
                >
                  {section.cta.label}
                </Link>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
