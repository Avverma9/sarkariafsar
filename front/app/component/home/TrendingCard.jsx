import { Flame, GraduationCap, PenLine, ShieldUser, TrainFront } from "lucide-react";
import Link from "next/link";

const ICONS = [TrainFront, ShieldUser, GraduationCap, PenLine];

function normalizeTitle(value) {
  return String(value || "").trim();
}

function formatPostDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getTagFromItem(item) {
  const rawTag = String(item?.jobType || item?.tag || "").trim();
  if (rawTag) return rawTag;

  const normalized = String(item?.title || "").toLowerCase();
  if (normalized.includes("admit")) return "Admit Card";
  if (normalized.includes("result")) return "Result";
  if (normalized.includes("answer key")) return "Answer Key";
  return "Active";
}

function getTagClass(tag) {
  const value = String(tag || "").toLowerCase();
  if (value.includes("admit")) return "bg-blue-100 text-blue-700";
  if (value.includes("result")) return "bg-purple-100 text-purple-700";
  if (value.includes("answer")) return "bg-teal-100 text-teal-700";
  return "bg-green-100 text-green-700";
}

function toCardItem(item, index) {
  const title = normalizeTitle(item?.title || item?.postTitle || item?.jobTitle || "Untitled Job");
  const canonicalKey = String(item?.canonicalKey || item?.canonical || "").trim();
  const postDate = formatPostDate(item?.postDate || item?.createdAt || item?.updatedAt);
  const tag = getTagFromItem(item);

  return {
    id: String(item?._id || item?.id || canonicalKey || `${title}-${index}`),
    href: canonicalKey ? `/post/${encodeURIComponent(canonicalKey)}` : "",
    tag,
    title,
    subtitle: postDate ? `Posted: ${postDate}` : "Latest update",
    tagClass: getTagClass(tag),
    icon: ICONS[index % ICONS.length],
    accentColor: ["#f97316", "#3b82f6", "#a855f7", "#14b8a6"][index % 4],
  };
}

export default function TrendingCard({ items = [] }) {
  const visibleItems = items.map(toCardItem).filter((item) => item.title).slice(0, 4);

  return (
    <section>
      <h2 className="mb-4 flex items-center text-lg font-bold text-slate-800">
        <span className="mr-2 rounded-md bg-orange-100 p-1.5 text-orange-600">
          <Flame className="h-4 w-4" aria-hidden="true" />
        </span>
        Trending Now
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {visibleItems.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm md:col-span-2 lg:col-span-4">
            No trending jobs available right now.
          </div>
        )}

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const cardClass =
            "hover-accent-card group block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50/30";

          const cardBody = (
            <>
              <div className="mb-2 flex items-start justify-between">
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${item.tagClass}`}>
                  {item.tag}
                </span>
                <Icon className="h-5 w-5 text-indigo-500 transition group-hover:scale-110" aria-hidden="true" />
              </div>
              <h3 className="mb-1 text-sm font-bold text-slate-800 group-hover:text-indigo-700">{item.title}</h3>
              <p className="text-xs text-slate-500">{item.subtitle}</p>
            </>
          );

          if (!item.href) {
            return (
              <div key={item.id} className={cardClass} style={{ "--hover-accent": item.accentColor }}>
                {cardBody}
              </div>
            );
          }

          return (
            <Link key={item.id} href={item.href} className={cardClass} style={{ "--hover-accent": item.accentColor }}>
                {cardBody}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
