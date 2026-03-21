import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import PostHelper from "../../lib/postHelper";

const purifyConfig = {
  ALLOWED_TAGS: [
    "a", "article", "b", "blockquote", "br", "div", "em", "h1", "h2", "h3",
    "h4", "h5", "h6", "hr", "i", "img", "li", "ol", "p", "span", "strong",
    "table", "tbody", "td", "th", "thead", "tr", "u", "ul",
  ],
  ALLOWED_ATTR: [
    "alt", "class", "colspan", "datetime", "href", "rel", "rowspan", "src",
    "target", "title", "style",
  ],
  ADD_ATTR: ["target"],
};

// Component to render structured JSON data
function StructuredJobDetails({ job, backHref, backLabel }) {
  return (
    <div className="w-full bg-white px-4 py-6 sm:py-10 md:px-8 lg:px-12 font-sans text-gray-900">
      <div className="mx-auto max-w-[1200px]">
        
        {/* TOP NAVIGATION */}
        {backHref && (
          <div className="mb-6">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </div>
        )}

        {/* HEADER SECTION (Classic Title) */}
        <header className="mb-10 border-b-4 border-blue-900 pb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-snug tracking-tight">
            {job.title}
          </h1>
          {job.status && (
            <div className="mt-4 inline-flex items-center gap-2 bg-green-100 px-4 py-2 rounded border border-green-300">
              <CheckCircle2 className="h-5 w-5 text-green-700" />
              <span className="text-sm sm:text-base font-bold text-green-800 uppercase tracking-wide">
                {job.status}
              </span>
            </div>
          )}
        </header>

        {/* CONTENT SECTIONS */}
        <main className="w-full space-y-12">
          
          {/* Introduction */}
          {job.introduction && (
            <section>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white bg-slate-800 px-4 py-2 uppercase tracking-wide">
                {job.introduction.heading || "Brief Information"}
              </h2>
              <p className="text-[16px] sm:text-[17px] leading-relaxed text-gray-800 text-justify">
                {job.introduction.content}
              </p>
            </section>
          )}

          {/* Important Dates */}
          {job.important_dates?.dates && (
            <section>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white bg-slate-800 px-4 py-2 uppercase tracking-wide">
                {job.important_dates.heading || "Important Dates"}
              </h2>
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-left text-sm sm:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 w-1/2">Event</th>
                      <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.important_dates.dates.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-3 font-semibold text-blue-900">{item.event}</td>
                        <td className="border border-gray-300 px-4 py-3 font-bold text-gray-800">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Application Fee */}
          {job.application_fee?.fees && (
            <section>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white bg-slate-800 px-4 py-2 uppercase tracking-wide">
                {job.application_fee.heading || "Application Fee"}
              </h2>
              <div className="w-full overflow-x-auto mb-4">
                <table className="min-w-full border-collapse border border-gray-300 text-left text-sm sm:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 w-1/2">Category</th>
                      <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.application_fee.fees.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-3 font-semibold text-blue-900">
                          {item.category || item.post}
                        </td>
                        <td className="border border-gray-300 px-4 py-3 font-bold text-red-600">
                          {item.amount} {item.currency ? `(${item.currency})` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {job.application_fee.payment_modes && (
                <div className="bg-yellow-50 border border-yellow-200 p-4">
                  <p className="text-sm sm:text-base text-gray-800">
                    <strong className="font-bold text-black">Payment Modes: </strong> 
                    {job.application_fee.payment_modes.join(" | ")}
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Vacancy Details */}
          {job.vacancy_details?.vacancies && (
            <section>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white bg-slate-800 px-4 py-2 uppercase tracking-wide">
                {job.vacancy_details.heading || "Vacancy Details"}
              </h2>
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-left text-sm sm:text-base">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Post Name</th>
                      <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900 whitespace-nowrap">Total Posts</th>
                      <th className="border border-gray-300 px-4 py-3 font-bold text-gray-900">Eligibility Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {job.vacancy_details.vacancies.map((item, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-3 font-bold text-blue-900">{item.post_name || item.post}</td>
                        <td className="border border-gray-300 px-4 py-3 font-black text-green-700 text-center">{item.posts}</td>
                        <td className="border border-gray-300 px-4 py-3 text-gray-800 leading-relaxed">
                          {item.eligibility || item.qual || item.qualification || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Official Links (WITH CLICK HERE BUTTONS) */}
          {job.official_links?.links && (
            <section>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white bg-blue-900 px-4 py-2 uppercase tracking-wide">
                Important Official Links
              </h2>
              <div className="w-full overflow-x-auto">
                <table className="min-w-full border-collapse border border-gray-300 text-left text-sm sm:text-base">
                  <tbody>
                    {job.official_links.links.map((link, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 transition-colors">
                        <td className="border border-gray-300 px-4 py-4 font-bold text-gray-900 w-[50%] sm:w-[40%]">
                          {link.label}
                        </td>
                        <td className="border border-gray-300 px-4 py-4 font-semibold text-gray-700">
                          {link.status}
                        </td>
                        <td className="border border-gray-300 px-4 py-4 text-center sm:text-left whitespace-nowrap">
                          {link.url && link.url !== "#" ? (
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block bg-blue-600 px-6 py-2 text-sm font-bold text-white uppercase tracking-wide hover:bg-blue-800 transition-colors"
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
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* FAQs */}
          {job.faq?.questions && (
            <section>
              <h2 className="mb-4 text-xl sm:text-2xl font-bold text-white bg-slate-800 px-4 py-2 uppercase tracking-wide">
                {job.faq.heading || "Frequently Asked Questions"}
              </h2>
              <div className="space-y-4">
                {job.faq.questions.map((faq, idx) => (
                  <div key={idx} className="border border-gray-300 bg-gray-50 p-4">
                    <h3 className="mb-2 text-base sm:text-lg font-bold text-gray-900">
                      {faq.question || faq.q}
                    </h3>
                    <p className="text-gray-800 text-sm sm:text-base leading-relaxed">
                      {faq.answer || faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}

function ParsedPostDetails({ postData, backHref, backLabel }) {
  return (
    <div className="w-full bg-white px-4 py-6 font-sans text-gray-900 sm:py-10 md:px-8 lg:px-12">
      <div className="mx-auto max-w-[1200px]">
        {backHref && (
          <div className="mb-6">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 transition-colors hover:text-blue-900"
            >
              <ArrowLeft className="h-4 w-4" />
              {backLabel}
            </Link>
          </div>
        )}

        <main className="w-full overflow-hidden">
          <PostHelper post={postData} />
        </main>
      </div>
    </div>
  );
}

// Main Export Component
export default function FullContent({
  postData,
  formattedHtml,
  job,
  title,
  backHref = "",
  backLabel = "Back to Results",
}) {
  if (postData && typeof postData === "object") {
    return (
      <ParsedPostDetails
        postData={postData}
        backHref={backHref}
        backLabel={backLabel}
      />
    );
  }

  // 1. If structured JSON exists, render the Custom Responsive Layout
  if (job && typeof job === "object") {
    return <StructuredJobDetails job={job} backHref={backHref} backLabel={backLabel} />;
  }

  // 2. If raw HTML exists (Fallback)
  if (formattedHtml) {
    const cleanAndSafeHtml = DOMPurify.sanitize(formattedHtml, purifyConfig);

    return (
      <div className="w-full bg-white px-4 py-6 sm:py-10 md:px-8 lg:px-12 font-sans">
        <div className="mx-auto max-w-[1200px]">
          
          {backHref && (
            <div className="mb-6">
              <Link
                href={backHref}
                className="inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"
              >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
              </Link>
            </div>
          )}

          <header className="mb-10 border-b-4 border-blue-900 pb-6">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-snug tracking-tight">
              {title || "Official Details"}
            </h1>
          </header>

          <main className="w-full overflow-hidden">
            {/* CSS to make classic HTML tables responsive and Click Here links */}
            <article
              className="w-full max-w-none text-[16px] sm:text-[17px] leading-relaxed text-gray-800 
              
              [&_h1]:hidden 
              [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:sm:text-2xl [&_h2]:font-bold [&_h2]:bg-slate-800 [&_h2]:text-white [&_h2]:px-4 [&_h2]:py-2 [&_h2]:uppercase
              [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-blue-900 
              
              [&_p]:my-4 [&_p]:text-justify
              
              /* Responsive Table Wrapper Fix */
              [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:whitespace-nowrap [&_table]:sm:table [&_table]:sm:whitespace-normal
              
              /* Classic Table Styling */
              [&_table]:my-6 [&_table]:border-collapse [&_table]:border [&_table]:border-gray-300 
              [&_th]:border [&_th]:border-gray-300 [&_th]:bg-gray-100 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:font-bold [&_th]:text-gray-900
              [&_td]:border [&_td]:border-gray-300 [&_td]:px-4 [&_td]:py-3 [&_td]:text-gray-800
              hover:[&_tbody_tr]:bg-blue-50
              
              /* Links styling as Click Here Buttons inside Tables */
              [&_td_a]:inline-block [&_td_a]:bg-blue-600 [&_td_a]:px-6 [&_td_a]:py-2 [&_td_a]:text-sm [&_td_a]:font-bold [&_td_a]:text-white [&_td_a]:uppercase [&_td_a]:no-underline hover:[&_td_a]:bg-blue-800
              
              /* General links outside tables */
              [&_p_a]:font-bold [&_p_a]:text-blue-700 hover:[&_p_a]:underline
              
              [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-2"
              
              dangerouslySetInnerHTML={{ __html: cleanAndSafeHtml }}
            />
          </main>
        </div>
      </div>
    );
  }

  // 3. Loading State
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-900 border-t-transparent"></div>
        <p className="text-base font-bold text-gray-600">Loading Information...</p>
      </div>
    </div>
  );
}
