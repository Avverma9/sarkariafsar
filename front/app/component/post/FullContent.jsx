import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { ArrowLeft, FileText } from "lucide-react";

const purifyConfig = {
  ALLOWED_TAGS: [
    "a",
    "article",
    "b",
    "blockquote",
    "br",
    "div",
    "em",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "hr",
    "i",
    "img",
    "li",
    "ol",
    "p",
    "span",
    "strong",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "u",
    "ul",
  ],
  ALLOWED_ATTR: [
    "alt",
    "class",
    "colspan",
    "datetime",
    "href",
    "rel",
    "rowspan",
    "src",
    "target",
    "title",
  ],
  ADD_ATTR: ["target"],
};

export default function FullContent({ formattedHtml, title, backHref }) {
  if (!formattedHtml) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-sm">
          Loading Job Details...
        </div>
      </div>
    );
  }

  const cleanAndSafeHtml = DOMPurify.sanitize(formattedHtml, purifyConfig);

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-col gap-4 rounded-[28px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 p-6 text-white shadow-xl sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide uppercase backdrop-blur-sm">
              <FileText className="h-3.5 w-3.5" />
              Full Detail View
            </div>
            <h1 className="max-w-3xl text-2xl font-black tracking-tight sm:text-4xl">
              {title || "Job Details"}
            </h1>
          </div>

          {backHref ? (
            <Link
              href={backHref}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/20"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Summary
            </Link>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <article
            className="max-w-none px-5 py-8 text-[15px] leading-7 text-slate-700 sm:px-8 lg:px-12 [&_a]:break-all [&_a]:font-semibold [&_a]:text-indigo-700 [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_h1]:mt-8 [&_h1]:text-3xl [&_h1]:font-black [&_h1]:text-slate-950 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h2]:text-slate-900 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-slate-900 [&_img]:rounded-2xl [&_img]:border [&_img]:border-slate-200 [&_img]:shadow-sm [&_li]:mb-2 [&_ol]:my-4 [&_ol]:pl-5 [&_p]:my-4 [&_strong]:font-bold [&_table]:my-6 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-2xl [&_tbody_tr:nth-child(even)]:bg-slate-50 [&_td]:border [&_td]:border-slate-200 [&_td]:px-3 [&_td]:py-2 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-100 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: cleanAndSafeHtml }}
          />
        </div>
      </div>
    </div>
  );
}
