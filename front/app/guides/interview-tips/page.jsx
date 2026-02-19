// app/guides/interview-tips/page.jsx
import Link from "next/link";
import { buildMetadata } from "../../lib/seo";

export const metadata = buildMetadata({
  title: "Interview Tips for Government Jobs",
  description:
    "Practical interview preparation tips with document-verification checklist and question practice framework.",
  path: "/guides/interview-tips",
  type: "Article",
  keywords: ["government job interview tips", "document verification checklist", "interview questions"],
});

function Badge({ children }) {
  return (
    <span className="text-xs bg-white border border-slate-200 px-3 py-1 rounded-full text-slate-700">
      {children}
    </span>
  );
}

function Card({ title, desc, children }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="mb-3">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {desc ? <p className="text-sm text-slate-600 mt-1">{desc}</p> : null}
      </div>
      {children}
    </section>
  );
}

function List({ items }) {
  return (
    <ul className="list-disc pl-5 text-sm text-slate-700 space-y-2">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

function NumList({ items }) {
  return (
    <ol className="list-decimal pl-5 text-sm text-slate-700 space-y-2">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ol>
  );
}

function Q({ q, children }) {
  return (
    <details className="group bg-slate-50 border border-slate-200 rounded-xl p-4">
      <summary className="cursor-pointer list-none flex items-start justify-between gap-4">
        <span className="text-sm font-semibold text-slate-900">{q}</span>
        <span className="text-slate-500 group-open:rotate-180 transition">⌄</span>
      </summary>
      <div className="mt-3 text-sm text-slate-700 leading-6">{children}</div>
    </details>
  );
}

function TwoCol({ leftTitle, rightTitle, leftItems, rightItems }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="text-sm font-bold text-slate-900 mb-2">{leftTitle}</div>
        <List items={leftItems} />
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
        <div className="text-sm font-bold text-slate-900 mb-2">{rightTitle}</div>
        <List items={rightItems} />
      </div>
    </div>
  );
}

export default function InterviewTips() {
  const quickBadges = [
    "HR + Panel",
    "DV Ready",
    "Confidence",
    "Answer Structure",
    "Role Fit",
    "Common Mistakes",
  ];

  const doItems = [
    "Official notification + job role ko 2 baar read karo (eligibility, selection stages, documents).",
    "Apne profile ka 60-sec intro ready rakho (education, skills, goal, why this role).",
    "Certificate/ID details match karo: name, DOB, category, marks, year.",
    "2–3 mock interviews karo (friend ya camera ke saamne).",
    "Calm pace me bolo, short + clear answers do, over-explain mat karo.",
  ];

  const dontItems = [
    "Guesswork me facts mat bolo (organization, rules, dates) — “I’m not sure, I will verify” better hai.",
    "Documents last day par arrange mat karo.",
    "Too casual body language (slouching, phone on, chewing gum) avoid.",
    "Salary/benefits pe aggressive focus at start avoid (govt interview me role + duty first).",
    "Negative talk about previous attempts, teachers, or system avoid.",
  ];

  const dvChecklist = [
    "Photo ID: Aadhaar/Driving License/PAN (jo allowed ho).",
    "Educational certificates + mark sheets (10th/12th/Graduation as applicable).",
    "Category certificate (SC/ST/OBC/EWS) if applicable.",
    "Domicile/Residence proof (jahan required ho).",
    "Passport-size photos (same as application style, extra copies).",
    "Application form print + fee receipt print (agar portal se milta ho).",
    "Admit card/call letter print.",
    "Experience certificate (if required) + NOC (if employed).",
    "Any special documents mentioned in notification (disability certificate, ex-serviceman, etc.).",
  ];

  const introTemplate = [
    "Start: “Good morning, my name is ___.”",
    "Education: “I have completed ___ from ___ in ___ year.”",
    "Strength: “My strengths are ___ (2 points) with a small proof.”",
    "Why role: “I am interested in this role because ___ (public service, responsibility, stability, learning).”",
    "Close: “I’m ready to learn and follow rules/procedures with discipline.”",
  ];

  const starTemplate = [
    "S (Situation): Context 1 line.",
    "T (Task): Tumhari responsibility 1 line.",
    "A (Action): Tumne kya steps liye 2–3 lines.",
    "R (Result): Outcome numbers/impact 1 line.",
    "Learning: 1 line (what improved).",
  ];

  const commonQuestions = [
    "Tell me about yourself.",
    "Why do you want this government job?",
    "Why should we select you?",
    "Your strengths and weaknesses?",
    "Describe a challenge you faced and how you handled it.",
    "Have you applied/appeared earlier? What did you learn?",
    "How do you handle pressure and deadlines?",
    "Are you comfortable with posting/location/shift duties (as per role)?",
    "What do you know about the department/organization?",
    "Any questions for us?",
  ];

  const roleWise = [
    { role: "Clerk / Assistant", q: "Accuracy, typing/computer basics, file handling, public dealing." },
    { role: "Constable / Defence", q: "Discipline, fitness routine, stress handling, teamwork, duty mindset." },
    { role: "Teacher / TET", q: "Subject basics, pedagogy, classroom management, inclusive teaching." },
    { role: "Railway / Technical", q: "Safety mindset, SOPs, basic technical concepts, shift readiness." },
    { role: "Banking", q: "Customer handling, basic banking terms, honesty, target pressure handling." },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        {/* Header */}
        <header className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
            Interview Tips for Govt Jobs
          </h1>
          <p className="text-sm text-slate-600 leading-6">
            Ye guide tumhe HR/panel interview + DV (document verification) ke liye practical preparation
            karne me help karega—without overthinking.
          </p>

          <div className="flex flex-wrap gap-2">
            {quickBadges.map((b) => (
              <Badge key={b}>{b}</Badge>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/blog"
              className="text-sm underline text-slate-700 hover:text-slate-900"
            >
              Blog posts →
            </Link>
            <Link
              href="/guides"
              className="text-sm underline text-slate-700 hover:text-slate-900"
            >
              All guides →
            </Link>
          </div>
        </header>

        {/* Section 1: Core strategy */}
        <Card
          title="1) Interview prep ka simple roadmap"
          desc="Interview ko 3 parts me tod do: Research → Practice → Verification."
        >
          <NumList
            items={[
              "Notification + role duties ko highlight karo (selection stages, required docs, rules).",
              "Organization basics: department ka purpose, service nature, public dealing level.",
              "Apna profile summary likho: education, skills, experience/learning, achievements.",
              "Common questions ke 10–12 answers short format me likho (1–2 minutes max).",
              "DV folder ready: originals + photocopies + extra photos + printouts.",
            ]}
          />

          <div className="mt-4">
            <TwoCol
              leftTitle="Do (best practices)"
              rightTitle="Don’t (common mistakes)"
              leftItems={doItems}
              rightItems={dontItems}
            />
          </div>
        </Card>

        {/* Section 2: Answer structure */}
        <Card
          title="2) Answers ko high-quality kaise banaye"
          desc="Panel ko clarity chahiye: short + structured + honest answers."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-bold text-slate-900 mb-2">
                60-sec Intro Template
              </div>
              <List items={introTemplate} />
              <p className="text-xs text-slate-600 mt-3">
                Tip: intro me “extra personal story” avoid; job-related points rakho.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-bold text-slate-900 mb-2">
                STAR Method (situation-based answers)
              </div>
              <List items={starTemplate} />
              <p className="text-xs text-slate-600 mt-3">
                Use when they ask: “example do”, “challenge”, “teamwork”, “leadership”.
              </p>
            </div>
          </div>

          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-bold text-slate-900 mb-2">
              Sample (short) answer style
            </div>
            <p className="text-sm text-slate-700 leading-6">
              Q: “Why do you want this government job?”<br />
              A: “I want a role where I can work with discipline and responsibility in public service.
              I’m comfortable following procedures, maintaining accuracy, and learning continuously.
              This job matches my strengths in consistency and problem-solving, and I’m ready to perform
              duties as per rules and timelines.”
            </p>
          </div>
        </Card>

        {/* Section 3: Questions bank + role focus */}
        <Card
          title="3) Most-asked questions (practice list)"
          desc="In questions ko 2–3 rounds me practice karo: write → speak → mock."
        >
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-bold text-slate-900 mb-2">
              Common interview questions
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {commonQuestions.map((q) => (
                <div
                  key={q}
                  className="text-sm text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2"
                >
                  {q}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-bold text-slate-900 mb-2">
              Role-wise focus (what panel checks)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {roleWise.map((x) => (
                <div
                  key={x.role}
                  className="bg-white border border-slate-200 rounded-xl p-4"
                >
                  <div className="text-sm font-bold text-slate-900">{x.role}</div>
                  <p className="text-sm text-slate-600 mt-1">{x.q}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Section 4: DV + day plan */}
        <Card
          title="4) DV (Document Verification) + Interview day plan"
          desc="Govt recruitment me DV errors se candidature risk ho sakti hai—folder system best hai."
        >
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="text-sm font-bold text-slate-900 mb-2">
              DV checklist (minimum)
            </div>
            <List items={dvChecklist} />
            <p className="text-xs text-slate-600 mt-3">
              Tip: Originals + 2 sets photocopies; ek transparent file + ek backup envelope.
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-bold text-slate-900 mb-2">Day before</div>
              <List
                items={[
                  "Route/center timing plan karo (late risk mat lo).",
                  "Clothes decide: simple formal/clean (as per role).",
                  "All documents + stationery pack kar do.",
                  "2 mock answers: intro + why role + strength/weakness.",
                  "Proper sleep + light food.",
                ]}
              />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-sm font-bold text-slate-900 mb-2">Interview day</div>
              <List
                items={[
                  "Reach early (buffer time).",
                  "Phone silent, posture straight, eye contact balanced.",
                  "Answer slow and clear; unknown ho to politely admit.",
                  "Documents handle carefully; asked order me present.",
                  "End me: “Thank you” + calm exit.",
                ]}
              />
            </div>
          </div>
        </Card>

        {/* Section 5: FAQs (accordion) */}
        <Card title="FAQs (quick solutions)" desc="Most common confusions yahin clear kar lo.">
          <div className="space-y-3">
            <Q q="अगर कोई question नहीं आता तो क्या बोलें?">
              Guess mat karo. Seedha bolo: “I’m not fully sure about this; I will verify and share the correct
              information.” Phir related area ka jo sure knowledge ho, short me add kar sakte ho.
            </Q>

            <Q q="Weakness कैसे बताएं बिना negative लगे?">
              Weakness ko “improvement plan” ke saath bolo. Example: “I used to rush in calculations, so I
              maintain an error-log and do daily accuracy drills.”
            </Q>

            <Q q="Gap / multiple attempts पूछें तो?">
              Honest raho, blame game avoid. Focus on learning: consistency, better strategy, skills gained,
              and how you’re now more prepared.
            </Q>

            <Q q="Documents में name mismatch हो तो?">
              Panic mat karo. Supporting proof ready rakho (affidavit/gazette as applicable, or relevant
              correction documents). Interview/DV me calmly explain karo.
            </Q>

            <Q q="End में ‘Any questions?’ बोले तो क्या पूछें?">
              1–2 simple questions: training timeline, joining process, posting policy (as per notification),
              or role responsibilities. Salary/leave pe aggressive questioning start me avoid.
            </Q>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge>Practice</Badge>
            <Badge>Clarity</Badge>
            <Badge>DV Safety</Badge>
            <Badge>Discipline</Badge>
          </div>
        </Card>
      </div>
    </div>
  );
}
  
