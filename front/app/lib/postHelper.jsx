"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────

/** Strip markdown-style bold (**text**) and return plain string */
const stripMd = (str = "") => String(str).replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1");

/** Safely coerce any value to a display string */
const toStr = (v) => (v == null ? "" : String(v));

// ─────────────────────────────────────────────
// Small reusable primitives
// ─────────────────────────────────────────────

const Badge = ({ text, color = "blue" }) => {
  const colors = {
    blue: "bg-blue-100 text-blue-800 border-blue-200",
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    purple: "bg-purple-100 text-purple-800 border-purple-200",
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    orange: "bg-orange-100 text-orange-800 border-orange-200",
  };
  return (
    <span className={`inline-block text-xs font-semibold px-3 py-1 rounded border ${colors[color] || colors.gray}`}>
      {stripMd(text)}
    </span>
  );
};

const SectionHeader = ({ title, icon }) => (
  <h2 className="mb-5 mt-10 text-xl sm:text-2xl font-bold text-white bg-slate-800 px-4 py-3 uppercase tracking-wide flex items-center gap-2">
    {icon && <span>{icon}</span>}
    {title}
  </h2>
);

const StatusTag = ({ status }) => {
  if (!status) return null;
  const lower = status.toLowerCase();
  const isSuccess = lower.includes("released") || lower.includes("out") || lower.includes("✅");
  
  return (
    <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded border ${
      isSuccess ? "bg-green-100 border-green-300" : "bg-yellow-50 border-yellow-200"
    }`}>
      {isSuccess && <CheckCircle2 className="h-5 w-5 text-green-700" />}
      <span className={`text-sm sm:text-base font-bold uppercase tracking-wide ${
        isSuccess ? "text-green-800" : "text-yellow-800"
      }`}>
        {stripMd(status)}
      </span>
    </div>
  );
};

// ─────────────────────────────────────────────
// Section renderers (Flat Design)
// ─────────────────────────────────────────────

/** Introduction */
const IntroSection = ({ intro }) => {
  if (!intro) return null;
  const { heading, content } = typeof intro === "string" ? { content: intro } : intro;
  return (
    <section>
      <SectionHeader title={heading ? stripMd(heading) : "Brief Information"} icon="📋" />
      <p className="text-[16px] sm:text-[17px] leading-relaxed text-gray-800 text-justify whitespace-pre-line">
        {stripMd(toStr(content))}
      </p>
    </section>
  );
};

/** Important Dates */
const DatesSection = ({ dates }) => {
  if (!dates) return null;
  const { heading, dates: list } = typeof dates === "object" && !Array.isArray(dates) ? dates : { dates };
  const items = Array.isArray(list) ? list : [];

  if (items.length === 0) return null;

  return (
    <section>
      <SectionHeader title={heading ? stripMd(heading) : "Important Dates"} icon="📅" />
      <div className="w-full overflow-x-auto border border-gray-300">
        <table className="min-w-full border-collapse text-left text-sm sm:text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 w-[50%]">Event</th>
              <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 w-[50%]">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d, i) => {
              const event = stripMd(toStr(d.event || d.stage || d.name || d.Event));
              const date = stripMd(toStr(d.date || d.Date || d.description || ""));
              return (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 font-semibold text-blue-900">{event}</td>
                  <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800">{date || "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/** Vacancy Details */
const VacancySection = ({ vacancy }) => {
  if (!vacancy) return null;
  const { heading, total_posts, vacancies, post_name, eligibility, requirements, human_note } = typeof vacancy === "object" ? vacancy : {};
  const list = Array.isArray(vacancies) ? vacancies : Array.isArray(requirements) ? requirements : post_name ? [{ post_name, posts: total_posts, eligibility }] : [];

  return (
    <section>
      <SectionHeader title={heading ? stripMd(heading) : "Vacancy Details"} icon="💼" />
      {total_posts && (
        <div className="mb-4 bg-blue-50 border border-blue-200 px-4 py-2 inline-block">
          <span className="text-gray-700 font-semibold mr-2">Total Vacancies:</span>
          <span className="font-bold text-blue-700 text-lg">{toStr(total_posts)}</span>
        </div>
      )}
      
      {list.length > 0 && (
        <div className="w-full overflow-x-auto border border-gray-300">
          <table className="min-w-full border-collapse text-left text-sm sm:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Post Name</th>
                <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 whitespace-nowrap">Total Posts</th>
                <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Eligibility / Qualification</th>
              </tr>
            </thead>
            <tbody>
              {list.map((v, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 font-bold text-blue-900">
                    {stripMd(toStr(v.post_name || v.post || v.Post || "—"))}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 font-black text-green-700 text-center">
                    {toStr(v.posts || v.Posts || "—")}
                  </td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-800 leading-relaxed">
                    {stripMd(toStr(v.eligibility || v.qual || v.qualification || v.Eligibility || "—"))}
                    {v.pay && <div className="text-blue-700 mt-1 font-semibold text-sm">Pay: {stripMd(v.pay)}</div>}
                    {v.pay_scale && <div className="text-blue-700 mt-1 font-semibold text-sm">Pay Scale: {stripMd(v.pay_scale)}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {human_note && (
        <p className="mt-4 text-sm sm:text-base text-gray-700 italic border-l-4 border-amber-400 bg-amber-50 px-4 py-3 leading-relaxed">
          {stripMd(human_note)}
        </p>
      )}
    </section>
  );
};

/** Selection Process */
const SelectionSection = ({ selection }) => {
  if (!selection) return null;
  const { heading, stages } = typeof selection === "object" ? selection : { stages: [] };
  const list = Array.isArray(stages) ? stages : [];
  if (list.length === 0) return null;

  return (
    <section>
      <SectionHeader title={heading ? stripMd(heading) : "Selection Process"} icon="🎯" />
      <ul className="space-y-3 list-inside list-disc text-[16px] sm:text-[17px] text-gray-800 pl-4">
        {list.map((s, i) => {
          const name = stripMd(toStr(s.name || s.stage || s.Stage || s));
          const desc = stripMd(toStr(s.description || ""));
          return (
            <li key={i} className="leading-relaxed marker:text-blue-600">
              <strong className="text-gray-900">{name}</strong> {desc && <span>— {desc}</span>}
            </li>
          );
        })}
      </ul>
    </section>
  );
};

/** FAQ */
const FAQSection = ({ faq }) => {
  if (!faq) return null;
  const { heading, questions, qa } = typeof faq === "object" ? faq : {};
  const rawList = Array.isArray(questions) ? questions : Array.isArray(qa) ? qa : [];

  if (rawList.length === 0) return null;

  return (
    <section>
      <SectionHeader title={heading ? stripMd(heading) : "Frequently Asked Questions"} icon="❓" />
      <div className="space-y-4">
        {rawList.map((q, i) => {
          const question = stripMd(toStr(q.question || q.q || q));
          const answer = stripMd(toStr(q.answer || q.a || ""));
          return (
            <div key={i} className="border border-gray-300 bg-gray-50 p-4">
              <h3 className="mb-2 text-base sm:text-lg font-bold text-gray-900">{question}</h3>
              {answer && <p className="text-gray-800 text-sm sm:text-base leading-relaxed">{answer}</p>}
            </div>
          );
        })}
      </div>
    </section>
  );
};

/** How To Download / Check Result (Flat List) */
const HowToSection = ({ howTo }) => {
  if (!howTo) return null;
  const { heading, steps, methods, note, pro_tip } = typeof howTo === "object" ? howTo : { steps: howTo };

  return (
    <section>
      <SectionHeader title={heading ? stripMd(heading) : "How To Apply / Download"} icon="📥" />
      {Array.isArray(steps) && steps.length > 0 && (
        <ol className="list-decimal list-outside pl-6 space-y-2 text-[16px] sm:text-[17px] text-gray-800 mb-4">
          {steps.map((s, i) => {
            const text = stripMd(toStr(typeof s === "string" ? s : s.action || s.step || s.method || JSON.stringify(s)));
            return <li key={i} className="leading-relaxed marker:font-bold marker:text-blue-700">{text}</li>;
          })}
        </ol>
      )}
      
      {Array.isArray(methods) && methods.length > 0 && (
        <div className="space-y-4">
          {methods.map((m, i) => (
            <div key={i} className="border border-gray-300 p-4 bg-gray-50">
              <div className="font-bold text-gray-900 mb-2">{stripMd(toStr(m.method || m.name || ""))}</div>
              {m.steps && Array.isArray(m.steps) && (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {m.steps.map((s, j) => <li key={j}>{stripMd(toStr(s))}</li>)}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
      
      {note && (
        <div className="mt-4 text-sm sm:text-base text-gray-800 bg-amber-50 border-l-4 border-amber-400 p-4 italic">
          {stripMd(note)}
        </div>
      )}
      {pro_tip && (
        <div className="mt-4 text-sm sm:text-base text-gray-800 bg-green-50 border-l-4 border-green-400 p-4 italic">
          💡 {stripMd(pro_tip)}
        </div>
      )}
    </section>
  );
};

/** Official Links (Click Here Button Layout) */
const ClickHereLinksSection = ({ links }) => {
  if (!links) return null;
  const list = Array.isArray(links) ? links : links.links || [];
  if (!list.length) return null;

  return (
    <section>
      <SectionHeader title="Important Official Links" icon="🔗" />
      <div className="w-full overflow-x-auto border border-gray-300">
        <table className="min-w-full border-collapse text-left text-sm sm:text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 w-[50%]">Link Details</th>
              <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Status</th>
              <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item, index) => {
              const label = stripMd(toStr(item?.label || item?.Label || "Link"));
              const status = stripMd(toStr(item?.status || ""));
              const url = toStr(item?.url || item?.URL || "#");
              const isClosed = status.toLowerCase().includes("closed") || status.toLowerCase().includes("done");
              const hasValidUrl = Boolean(url) && url !== "#";

              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="border border-gray-300 px-4 py-4 font-bold text-gray-900">{label}</td>
                  <td className="border border-gray-300 px-4 py-4 font-semibold text-gray-700">{status || "-"}</td>
                  <td className="border border-gray-300 px-4 py-4 text-center whitespace-nowrap">
                    {hasValidUrl && !isClosed ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block bg-blue-600 px-6 py-2 text-sm font-bold text-white uppercase tracking-wide hover:bg-blue-800 transition-colors shadow-sm"
                      >
                        Click Here
                      </a>
                    ) : (
                      <span className="inline-block bg-gray-200 px-6 py-2 text-sm font-bold text-gray-500 uppercase tracking-wide">
                        Link Soon
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
};

/** Application Fee */
const FeeSection = ({ fee }) => {
  if (!fee) return null;
  const { heading, fees, payment_modes } = typeof fee === "object" ? fee : {};
  if (!Array.isArray(fees)) return null;

  return (
    <section>
      <SectionHeader title={heading ? stripMd(heading) : "Application Fee"} icon="💰" />
      <div className="w-full overflow-x-auto mb-4 border border-gray-300">
        <table className="min-w-full border-collapse text-left text-sm sm:text-base">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 w-[50%]">Category</th>
              <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Fee Amount</th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f, i) => {
              const category = stripMd(toStr(f.post || f.category || f.Category || ""));
              const amount = f.amount != null ? `₹${f.amount}` : f.general_obc_ews != null && f.general_obc_ews !== "N/A" ? `₹${f.general_obc_ews}` : f.sc_st_ph != null && f.sc_st_ph !== "N/A" ? `₹${f.sc_st_ph}` : "—";
              return (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 font-semibold text-blue-900">{category}</td>
                  <td className="border border-gray-300 px-4 py-3 font-bold text-red-600">{stripMd(amount)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {Array.isArray(payment_modes) && payment_modes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4">
          <p className="text-sm sm:text-base text-gray-800">
            <strong className="font-bold text-black">Payment Modes: </strong> 
            {payment_modes.join(" | ")}
          </p>
        </div>
      )}
    </section>
  );
};

/** Age Limit */
const AgeSection = ({ age }) => {
  if (!age) return null;
  const { minimum_age, maximum_age, calculated_as_on, relaxation_note, min_age, max_age, age_table, limits } = typeof age === "object" ? age : {};

  return (
    <section>
      <SectionHeader title="Age Limit Details" icon="🎂" />
      {Array.isArray(age_table) ? (
        <div className="w-full overflow-x-auto border border-gray-300 mb-4">
          <table className="min-w-full border-collapse text-left text-sm sm:text-base">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Category / Post</th>
                <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Min Age</th>
                <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Max Age</th>
              </tr>
            </thead>
            <tbody>
              {age_table.map((row, i) => (
                <tr key={i} className="hover:bg-blue-50 transition-colors">
                  <td className="border border-gray-300 px-4 py-3 font-semibold text-gray-800">{stripMd(toStr(row.post || row.category || row.Category))}</td>
                  <td className="border border-gray-300 px-4 py-3 text-gray-800">{toStr(row.min_age)}</td>
                  <td className="border border-gray-300 px-4 py-3 text-red-600 font-bold">{toStr(row.max_age)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : Array.isArray(limits) ? (
        <ul className="list-disc list-inside space-y-2 text-[16px] sm:text-[17px] text-gray-800 mb-4">
          {limits.map((l, i) => <li key={i}>{stripMd(l)}</li>)}
        </ul>
      ) : (
        <div className="flex gap-8 mb-4 border border-gray-300 p-6 bg-gray-50">
          {(minimum_age || min_age) && (
            <div>
              <span className="text-gray-600 uppercase tracking-wide text-sm font-semibold">Minimum Age</span><br />
              <span className="font-black text-2xl text-blue-900">{toStr(minimum_age || min_age)}</span>
            </div>
          )}
          {(maximum_age || max_age) && (
            <div>
              <span className="text-gray-600 uppercase tracking-wide text-sm font-semibold">Maximum Age</span><br />
              <span className="font-black text-2xl text-red-600">{stripMd(toStr(maximum_age || max_age))}</span>
            </div>
          )}
          {calculated_as_on && (
            <div>
              <span className="text-gray-600 uppercase tracking-wide text-sm font-semibold">Calculated As On</span><br />
              <span className="font-bold text-lg text-gray-800">{calculated_as_on}</span>
            </div>
          )}
        </div>
      )}
      {relaxation_note && (
        <div className="text-sm sm:text-base text-gray-800 bg-amber-50 border-l-4 border-amber-400 p-4 italic">
          {stripMd(relaxation_note)}
        </div>
      )}
    </section>
  );
};

/** Disclaimer */
const DisclaimerSection = ({ text }) => {
  if (!text) return null;
  return (
    <div className="mt-12 text-sm text-gray-500 border border-gray-200 p-4 bg-gray-50 leading-relaxed text-justify">
      <strong className="font-bold text-gray-700">Disclaimer: </strong>
      {stripMd(text)}
    </div>
  );
};

// ─────────────────────────────────────────────
// Main exported component
// ─────────────────────────────────────────────

const PostHelper = ({ post }) => {
  if (!post || typeof post !== "object") {
    return <div className="text-center py-20 text-gray-500 font-medium">Loading Post Data...</div>;
  }

  const {
    jobtitle, title, status, category, conductingAuthority, advertisementNumber, postDate,
    introduction, important_dates, selection_process, vacancy_details,
    how_to_download, how_to_check_result, how_to_check_answer_key, how_to_check_exam_date, how_to_check_result: how2,
    faq, official_links, application_fee, age_limit, tags,
    disclaimer, vacancy_note,
  } = post;

  const displayTitle = jobtitle || title || "Official Details";
  const howToSection = how_to_download || how_to_check_result || how_to_check_answer_key || how_to_check_exam_date || how2;

  // Deriving Color
  const catColorMap = {
    "Bank Result": "blue", "Police Result": "red", "Civil Services Result": "purple",
    "Entrance Exam Result": "green", "Railway Result": "orange", "Board Results": "yellow",
  };
  const catColor = catColorMap[category] || "blue";

  return (
    <div className="w-full font-sans bg-white pb-16">
      
      {/* Top Meta Info */}
      <div className="flex flex-wrap gap-3 items-center mb-6">
        {category && <Badge text={category} color={catColor} />}
        {advertisementNumber && <Badge text={`Advt: ${advertisementNumber}`} color="gray" />}
        {postDate && (
          <span className="text-sm font-semibold text-gray-500">
            Updated: {new Date(postDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        )}
      </div>

      {/* Main Title */}
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 leading-snug tracking-tight mb-4">
        {stripMd(displayTitle)}
      </h1>

      {conductingAuthority && (
        <p className="text-base sm:text-lg font-semibold text-gray-600 mb-2">
          Organization: <span className="text-blue-800">{conductingAuthority}</span>
        </p>
      )}

      {status && <StatusTag status={status} />}

      <hr className="my-10 border-gray-200" />

      {/* Structured Sections */}
      <div className="w-full space-y-2">
        
      
        <IntroSection intro={introduction} />
        <DatesSection dates={important_dates} />
        <VacancySection vacancy={vacancy_details} />
        
        {vacancy_note && (
          <div className="mt-4 text-sm sm:text-base text-gray-800 bg-blue-50 border-l-4 border-blue-600 p-4">
            <strong className="text-blue-900">Note: </strong> {stripMd(toStr(vacancy_note.content || vacancy_note))}
          </div>
        )}

 
        <AgeSection age={age_limit} />
        <FeeSection fee={application_fee} />
        <SelectionSection selection={selection_process} />
        <HowToSection howTo={howToSection} />
        <FAQSection faq={faq} />
        
       
        {/* Table Links with "Click Here" */}
        <ClickHereLinksSection links={official_links?.links || official_links} />
        
        <DisclaimerSection text={disclaimer} />

      
      </div>
    </div>
  );
};

export default PostHelper;
