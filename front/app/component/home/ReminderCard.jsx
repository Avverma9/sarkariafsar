import { Hourglass } from "lucide-react";
import Link from "next/link";

function formatDueText(item) {
  const raw =
    item?.deadlineText ||
    item?.dueText ||
    item?.lastDateText ||
    item?.applicationLastDate ||
    item?.lastDate ||
    "";
  if (raw) return String(raw).trim();
  return "Deadline approaching";
}

function mapReminderItem(item, index) {
  const canonicalKey = String(item?.canonicalKey || item?.canonical || "").trim();
  return {
    id: String(item?._id || item?.id || canonicalKey || index),
    title: String(item?.title || item?.postTitle || "Untitled").trim(),
    due: formatDueText(item),
    href: canonicalKey ? `/post/${encodeURIComponent(canonicalKey)}` : "",
  };
}

export default function ReminderCard({ items = [] }) {
  const visibleItems = items.map(mapReminderItem).filter((item) => item.title).slice(0, 3);

  return (
    <section>
      <h2 className="mb-4 flex items-center text-lg font-bold text-slate-800">
        <span className="mr-2 rounded-md bg-red-100 p-1.5 text-red-600">
          <Hourglass className="h-4 w-4" aria-hidden="true" />
        </span>
        Deadline Alerts
        <span className="ml-2 rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-normal text-red-500">
          Ending Soon
        </span>
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {visibleItems.length === 0 && (
          <div className="md:col-span-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            No deadline alerts available right now.
          </div>
        )}

        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="hover-accent-card flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:border-red-200"
            style={{ "--hover-accent": "#ef4444" }}
          >
            <div>
              <h4 className="text-sm font-bold text-slate-800">{item.title}</h4>
              <p className="text-xs font-medium text-red-600">{item.due}</p>
            </div>

            {item.href ? (
              <Link
                href={item.href}
                className="rounded border border-red-100 bg-white px-3 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-50"
              >
                Apply
              </Link>
            ) : (
              <span className="rounded border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-500">
                View
              </span>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
