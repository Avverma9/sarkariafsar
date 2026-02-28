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
      "SarkariAfsar par jo updates aap dekhte ho, woh randomly forward ya guesswork se nahi aate. Hum information ko public portals, official notices, press releases, recruitment boards ki notice boards, aur verified public sources se track karte hain—aur phir usko ek aise format me convert karte hain jo aap 30–60 seconds me scan karke samajh sako. Is process ka main purpose ye hai ki user ko “kya naya aaya” ke saath “mujhe kya karna chahiye” bhi clear ho, bina multiple tabs aur confusing language ke.\n\nCollection ka first step hota hai source discipline: hum official notification ko primary truth मानते hain. Agar kisi exam body ne website par notice publish kiya hai, to wahi base hota hai. Social media posts aur forwarded PDFs me misinformation ka risk high hota hai, isliye unko reference ke रूप me use nahi karte jab tak same info official notice board se match na ho. Public portals par bhi sometimes same update multiple formats me hota hai—short notice, detailed PDF, annexure, syllabus—hum unko cross-check karke ensure karte hain ki dates, eligibility, fees, aur instructions consistent hon.\n\nSecond step hota hai extraction: official PDFs/announcements me information scattered hoti hai—age cut-off date ek section me, fee details kisi table me, selection stages kisi paragraph me, aur document specs annexure me. Hum in pieces ko extract karke action-oriented blocks banate hain: “Important Dates”, “Eligibility Highlights”, “Application Steps”, “Fees”, “Selection Process”, “Document/Photo-Sign Specs”, aur “Official Links”. User ko pura notice memorise nahi karna padta; user ko bas decision-friendly summary milti hai.\n\nThird step hota hai structuring and normalization: different boards different terms use karte hain. Koi “CBT-1/CBT-2” likhta hai, koi “Tier-1/Tier-2”, koi “Stage-I/Stage-II”. Hum labels ko consistent banate hain, lekin meaning ko change nahi karte. Example: agar notification me clearly qualifying stage mention hai, to hum “qualifying” tag add karte hain. Agar marks normalization rule mentioned hai, to usko highlight karte hain. Isse aap compare kar paate ho ki aapka next step kya hoga, aur aap kis stage ko priority do.\n\nFourth step hota hai clarity writing: official language heavy hoti hai aur legal tone me hoti hai. Hum usko simple Hinglish/Hindi-friendly language me translate nahi karte (word-to-word) balki explain karte hain—without distorting the rule. Example: “as on date” ka meaning, “tentative vacancies” ka effect, “correction window” ka scope, “DV required” ka implication—ye sab users ke liye practical statements me convert hota hai. Jahan confusion ho sakta hai, hum reminder add karte hain: “final verification official source se hi karein” aur “domain spelling verify karein”.\n\nFifth step safety: results/admit cards ke time fake mirrors, wrong links, aur download prompts common hote hain. Isliye hum user ko direct ‘action link’ dene se pehle ensure karte hain ki link official domain ka hai, aur content me safe browsing reminders include karte hain. Hum kabhi bhi OTP, password, ya sensitive details maangne wali third-party flows ko promote nahi karte. Aapko information chahiye, not risk.\n\nFinally, continuous updates: official portals par updates incremental hote hain—pehle short notice, phir detailed notification, phir corrigendum, phir answer key, phir result. Hum same topic ko timeline ke hisaab se update karke user ko “latest” context dete hain. Iska matlab ye nahi ki hum ‘rumors’ publish karte hain; matlab ye hai ki official chain me jo new doc aata hai, usko existing context me connect karke present karte hain. Aapko alag-alag dates me alag-alag PDFs hunt nahi karne padte.\n\nOverall, SarkariAfsar ka collection approach 3 principles par run hota hai: official-first, structured presentation, aur user safety. Aapko quickly scan karne layak information milti hai, lekin final decision/verification ke liye official source ko always priority diya jata hai—kyunki ultimately rulebook wahi hota hai.",
    points: [
      "Notifications ko category ke hisab se map kiya jata hai: Har update ko hum ek clear bucket me place karte hain—Jobs (recruitment), Results, Admit Cards, Answer Keys/Objection, Schemes, aur Guides. Is mapping ka benefit ye hai ki user ko mixed feed me confusion nahi hota. Aap agar sirf Results dekhna chahte ho, to aapko form tips ya scheme news ke beech scroll nahi karna padega, aur agar aap application phase me ho, to aapko correction/upload/payment-type content fast mil jayega.",
      "Important details ko readable sections me break kiya jata hai: Official PDFs me key lines spread out hoti hain, lekin user ko decision lene ke liye “dates, eligibility, fees, selection” ek jagah chahiye hota hai. Hum isi liye update ko small sections me todte hain—headings, bullet points, aur short paragraphs ke saath—taaki mobile par bhi quickly read ho jaye. Is formatting ka aim ye hai ki aap screenshot culture par depend na karo; aapko clear text me information mil jaye.",
      "Final verification ke liye official source refer karne ki recommendation di jati hai: Hum summaries ko decision-support ke liye banate hain, lekin final authority official notice hi hota hai. Isliye hum official domain aur official notice link ko priority dete hain, aur user ko remind karte hain ki payment, login, ya personal details sirf official portal par hi enter karein. Ye approach misinformation aur fake-link risk dono ko reduce karta hai."
    ]
  },

  {
    key: "how-sarkariafsar-is-useful",
    title: "How SarkariAfsar Is Useful",
    icon: ShieldCheck,
    iconClass: "text-sky-600",
    badgeClass: "bg-sky-50 border-sky-200 text-sky-700",
    description:
      "SarkariAfsar useful tab banta hai jab aapko information se zyada “action” chahiye. Sarkari updates ka problem ye nahi ki information available nahi hai—problem ye hai ki information scattered hai, formats inconsistent hain, aur time-sensitive decisions (apply karna, fee pay karna, correction karna, admit card download karna, answer key challenge karna) me clarity late milti hai. Hum isi gap ko solve karte hain: updates ko actionable format me present karke.\n\nActionable format ka matlab sirf short summary nahi. Iska matlab hai: aapko quickly samajh aaye ki ye update kis stage ka hai, kiske liye relevant hai, deadline kya hai, aur next step kya hai. Example: ek notification aayi—user ko instantly clear hona chahiye: eligibility match ho rahi hai ya nahi, age cut-off date kya hai, fees kya hai, selection process me stages kya hain, aur apply link official hai ya nahi. Agar aapko ye sab 2 minutes me mil jata hai, to aap better decision lete ho. Agar aapko ye sab 20 minutes me scattered PDFs me milta hai, to chances hain ki aap last day rush me mistake kar doge.\n\nSarkariAfsar ka core benefit time saving + error reduction hai. Time saving isliye kyunki aapko multiple sources browse nahi karne padte; error reduction isliye kyunki hum recurring pain points (photo/sign size, payment pending, OTP issues, correction windows, DV checklists) ko guide format me address karte hain. Aapko sirf “kya hua” nahi, “kaise handle karein” bhi milta hai.\n\nPlatform-level usefulness ka ek aur angle hai navigation. Sarkari content me user intent clear hota hai: ya to aap job dhundh rahe ho, ya result check kar rahe ho, ya admit card download kar rahe ho, ya scheme eligibility dekh rahe ho. Hum UI/UX me isi intent ko respect karte hain: section-wise browsing, breadcrumbs, quick links, aur search-driven discovery. Aapko “back” karke dubara same page dhundhna na pade, aur aapke pass ek predictable structure ho jisse aap repeat visits me bhi quickly navigate kar sako.\n\nSearch experience is critical because users mostly 3 cheezein search karte hain: exam name, post name, ya board name. Agar search bar relevant results fast show kare, to user ka workflow smooth hota hai—especially mobile users ke liye. Similarly, category pages user ko browsing mode deti hain—jab aapko specific term nahi pata, par aap “Results” ya “Admit Card” section me latest dekhna chahte ho.\n\nSarkariAfsar ki usefulness trust ke saath linked hai. Clickbait aur fake urgency se short-term traffic mil sakta hai, lekin long-term users ko confusion milta hai. Hum writing style me neutral, clear, aur steps-based approach rakhte hain. Where possible, “official notice first” culture promote karte hain, aur suspicious patterns (shortened links, lookalike domains, app-install prompts) se caution dete hain. Isse user ko safe browsing mindset milta hai.\n\nFinally, SarkariAfsar aapko routine banane me help karta hai. Sarkari cycle me stages repeat hoti hain: notification → apply → admit card → exam → answer key → result → DV/joining. Jab platform consistent format me updates deta hai, user ko predictable workflow milta hai. Aapko har stage par “ab kya karna hai” ka mental model ready rehta hai. Isi consistency se real-world benefit aata hai: deadlines miss kam hoti hain, aur confusion kam.\n\nIn short, SarkariAfsar ka value “information repository” se aage hai—ye ek execution-support system hai, jahan aap information ko quickly understand karke action le sakte ho, without getting lost.",
    points: [
      "Search bar se relevant post tak fast pahunch: Aap exam ka naam, board ka naam, ya post name type karo aur relevant updates quickly mil jayein—ye usability ka base hai. Result day par ya last date par time precious hota hai; search aapko scrolling se bachata hai. Good search ka matlab hai fewer clicks, faster discovery, aur less chance ki aap wrong page par chale jao.",
      "Section-wise browsing: Jobs, Results, Admit Cards, Schemes: Jab aapko pata hai ki aap kis intent se aaye ho, tab section browsing sabse efficient hoti hai. Jobs section me recruitment-focused content, Results me outcome-focused content, Admit Cards me entry-pass content, aur Schemes me benefit/eligibility content. Ye separation user ko mental clarity deta hai aur content ko purpose-driven banata hai.",
      "User-friendly navigation with breadcrumbs and quick links: Breadcrumbs aapko context dete hain ki aap site me kaha ho, aur quick links aapko core actions tak le jaate hain (apply, download admit card, check result, view notice). Isse navigation friction kam hota hai, especially jab aap multiple posts compare kar rahe hote ho ya baar-baar revisit kar rahe hote ho."
    ]
  },

  {
    key: "how-to-get-updated",
    title: "How To Get Updated",
    icon: BellRing,
    iconClass: "text-rose-600",
    badgeClass: "bg-rose-50 border-rose-200 text-rose-700",
    description:
      "Updated rehna ka matlab 24x7 news dekhna nahi hota—updated rehna ka matlab ek simple routine follow karna hota hai, jisse aap important deadlines aur stage updates miss na karo. Sarkari exam ya application season me updates fast move karte hain: new notification, short notice, corrigendum, fee date extension, correction window, admit card release, answer key, objection window, result, DV schedule. Agar aap randomly kabhi-kabhi check karte ho, to chances hain ki aap “small but important” line miss kar doge—jaise fee last date, document specs, ya objection window.\n\nIsliye best system ek lightweight routine hai: daily 10 minutes scanning + weekly 30 minutes planning. Daily scanning se aap changes catch kar lete ho, weekly planning se aap apne tasks (documents, photo/sign conversion, fee payment, study plan) schedule kar lete ho. Aapko overwhelm nahi hona; aapko consistent rehna hai.\n\nRoutine ka first rule: focus on your stage. Agar aap apply stage me ho, to Jobs + Applications-related posts priority pe honi chahiye. Agar aap exam stage me ho, to Admit Cards + Exam Prep priority pe. Agar exam ho chuka hai, to Answer Key/Objection + Results priority pe. Ye stage-based focus aapko noise se bachata hai. Many candidates sab kuch check karte rehte hain, aur end me important thing miss ho jati hai.\n\nSecond rule: bookmark and note deadlines. Aap jo bhi post aapke liye relevant ho, usko bookmark karo aur 2 dates note karo: form last date (and fee last date) + correction window last date (if any). Aksar candidates last date ko hi remember karte hain, fee date alag hoti hai—ye miss ho jati hai. Bookmark + deadline note is a simple prevention mechanism.\n\nThird rule: guides ko reference manual jaisa treat karo. Har season me same problems repeat hoti hain: photo/sign size, payment pending, OTP issues, wrong details, DV folder. Agar aap guides ko time pe read kar lete ho, to last moment par cyber-cafe me panic kam hota hai. Guide ka role ye nahi ki aap sab rat lo; guide ka role ye hai ki aapke paas checklist ready ho.\n\nFourth rule: official source verification habit. Regular update routine ka matlab ye bhi hai ki aap fake links se safe rahein. Whenever something sounds urgent—“result released”, “admit card out”, “last day extended”—aap first check official domain/notice board. Don’t rely on forwarded screenshots. Aapko routine me safety built-in rakhni chahiye.\n\nFifth rule: keep a small personal tracker. A simple notes list/Google Keep/Excel me aap 5 fields maintain kar sakte ho: Exam/Recruitment name, Stage (apply/admit/exam/key/result/DV), Next deadline, Required docs pending, Link/bookmark. Is tracker se aap stable rehte ho—chahe aap 2 exams track kar rahe ho ya 6.\n\nSarkariAfsar ka intent yahi hai ki aap updated rehne ko “habit” banayein, stress nahi. Small routine, clear bookmarks, stage-wise focus, aur guide-driven checklists—isse aap season me calm aur prepared rehte ho, aur decision quality improve hoti hai.",
    points: [
      "Daily ek baar Jobs aur Results section check karein: Daily scan ka aim sab kuch read karna nahi, sirf changes catch karna hai. Aap 5–10 minutes me new notifications, date extensions, aur result updates dekh sakte ho. Agar aap apply stage me ho, Jobs ko priority do; agar exams done hain, Results/Answer Key priority do. Same routine daily keep karne se ‘miss’ probability drastically down ho jati hai.",
      "Important posts ko bookmark karke deadline note karein: Bookmark aapka personal shortcut hota hai. Har relevant post ke saath 2–3 deadlines note karo (form last date, fee last date, correction window/objection last date). Ek simple reminder system (calendar/notes) aapko last-day rush se bachata hai, aur payment/upload issues handle karne ka buffer milta hai.",
      "Guides aur updates ke liye Blog section follow karein: Updates aapko batate hain kya change hua, guides aapko batate hain kya karna hai. Photo/sign upload, payment pending, OTP issues, DV folder—ye sab repeat problems hain. Blog guides ko reference ki tarah use karo: checklist open karo, tick-mark approach me steps follow karo, aur submission ke baad receipts/acknowledgements ka backup maintain karo."
    ],
    cta: {
      label: "Open Blog Guides",
      href: "/blog"
    }
  }

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
