"use client";

import { Hourglass } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const REQUEST_BODY = {
  days: 5,
  page: 1,
  limit: 50,
};

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

export default function ReminderCard() {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDeadlineAlerts = async () => {
      if (mounted) setIsLoading(true);
      try {
        const response = await fetch("/api/deadline-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(REQUEST_BODY),
          cache: "no-store",
        });
        const payload = await response.json().catch(() => null);

        const data = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.result)
            ? payload.result
            : [];

        if (mounted) {
          setItems(data.map(mapReminderItem).filter((item) => item.title));
        }
      } catch {
        if (mounted) setItems([]);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadDeadlineAlerts();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = items.slice(0, 3);

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
        {isLoading &&
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`deadline-loading-${index}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <div className="skeleton-shimmer mb-2 h-4 w-3/4 rounded-md" aria-hidden="true" />
                <div className="skeleton-shimmer h-3 w-2/3 rounded-md" aria-hidden="true" />
              </div>
              <div className="skeleton-shimmer ml-3 h-8 w-14 rounded-md" aria-hidden="true" />
            </div>
          ))}

        {!isLoading && visibleItems.length === 0 && (
          <div className="md:col-span-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
            No deadline alerts available right now.
          </div>
        )}

        {!isLoading &&
          visibleItems.map((item) => (
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
