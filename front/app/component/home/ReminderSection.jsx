"use client";

import { AlarmClockCheck, ArrowRight, CalendarClock, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buildPostDetailsHref } from "../../lib/postLink";
import { getJobReminders } from "../../lib/siteApi";

const DAY_OPTIONS = [3, 7, 15, 30];

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function getDaysLeft(value) {
  if (!value) {
    return "";
  }

  const deadline = new Date(value);

  if (Number.isNaN(deadline.getTime())) {
    return "";
  }

  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) {
    return "Deadline passed";
  }

  if (daysLeft === 0) {
    return "Last date today";
  }

  if (daysLeft === 1) {
    return "1 day left";
  }

  return `${daysLeft} days left`;
}

export default function ReminderSection({
  initialDays = 7,
  initialJobs = [],
  initialTotal = 0,
  initialLoaded = false,
}) {
  const [selectedDays, setSelectedDays] = useState(initialDays);
  const [jobs, setJobs] = useState(() => asArray(initialJobs));
  const [total, setTotal] = useState(() =>
    Number.isFinite(initialTotal) ? initialTotal : asArray(initialJobs).length,
  );
  const [loading, setLoading] = useState(!initialLoaded);
  const [error, setError] = useState("");
  const shouldSkipInitialFetchRef = useRef(initialLoaded);

  useEffect(() => {
    if (shouldSkipInitialFetchRef.current && selectedDays === initialDays) {
      shouldSkipInitialFetchRef.current = false;
      setLoading(false);
      return;
    }

    let active = true;

    async function loadReminderJobs() {
      try {
        if (active) {
          setLoading(true);
          setError("");
        }

        const payload = await getJobReminders({ days: selectedDays });
        const nextJobs = asArray(payload?.jobs);

        if (!active) {
          return;
        }

        setJobs(nextJobs);
        setTotal(Number(payload?.total) || nextJobs.length);
      } catch (fetchError) {
        if (!active) {
          return;
        }

        setJobs([]);
        setTotal(0);
        setError(fetchError?.message || "Reminder jobs load nahi ho paaye.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReminderJobs();

    return () => {
      active = false;
    };
  }, [initialDays, selectedDays]);

  return (
    <section className="mb-14" aria-labelledby="job-reminder-heading">
      <div className="overflow-hidden rounded-[2rem] border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-rose-50 shadow-[0_18px_45px_-28px_rgba(120,53,15,0.35)]">
        <div className="border-b border-amber-100/80 px-5 py-5 sm:px-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2
                id="job-reminder-heading"
                className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 md:text-3xl"
              >
                <AlarmClockCheck className="h-8 w-8 rounded-lg bg-amber-100 p-1.5 text-amber-600" />
                Apply Last Date Reminders
              </h2>
              <p className="mt-1 font-medium text-slate-500">
                Jaldi close hone wali jobs ko din ke hisaab se track kijiye.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {DAY_OPTIONS.map((days) => {
                const isActive = selectedDays === days;

                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSelectedDays(days)}
                    className={`rounded-full border px-4 py-2 text-sm font-black transition-all ${
                      isActive
                        ? "border-amber-500 bg-amber-500 text-white shadow-sm"
                        : "border-amber-200 bg-white text-amber-700 hover:border-amber-300 hover:bg-amber-50"
                    }`}
                  >
                    {days} Days
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/80 px-3 py-1.5 text-xs font-black tracking-wide text-amber-700 uppercase">
            <CalendarClock className="h-4 w-4" />
            {total} job{total === 1 ? "" : "s"} expiring within {selectedDays} day
            {selectedDays === 1 ? "" : "s"}
          </div>
        </div>

        <div className="p-5 sm:p-7">
          {loading ? (
            <div className="flex min-h-40 items-center justify-center rounded-[1.5rem] border border-dashed border-amber-200 bg-white/70 text-sm font-semibold text-slate-500">
              Loading reminder jobs...
            </div>
          ) : error ? (
            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
              {error}
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {jobs.map((job, index) => {
                const href = buildPostDetailsHref({
                  title: job?.title,
                  slug: job?.slug,
                  jobUrl: job?.jobUrl,
                });
                const key = job?.id || job?.slug || `${job?.title || "job"}-${index}`;

                return (
                  <Link
                    key={key}
                    href={href}
                    className="group rounded-[1.5rem] border border-slate-200/80 bg-white p-5 shadow-[0_12px_30px_-24px_rgba(15,23,42,0.55)] transition-all hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_18px_32px_-20px_rgba(217,119,6,0.28)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-black tracking-wide text-amber-700 uppercase">
                        {job?.sectionName || "Job"}
                      </span>
                      <span className="text-[11px] font-black tracking-wide text-rose-500 uppercase">
                        {getDaysLeft(job?.applyLastDate)}
                      </span>
                    </div>

                    <h3 className="mt-4 text-lg leading-7 font-black text-slate-900 transition-colors group-hover:text-amber-700">
                      {job?.title || "Untitled job"}
                    </h3>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <p className="text-sm font-semibold text-slate-500">
                        Last date: {formatDate(job?.applyLastDate) || "Will be updated"}
                      </p>
                      <span className="inline-flex items-center gap-1 text-sm font-black text-amber-700">
                        View Job <ArrowRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-slate-200 bg-white/70 px-6 text-center">
              <Search className="h-8 w-8 text-slate-300" />
              <h3 className="mt-3 text-xl font-black text-slate-900">
                No expiring jobs found
              </h3>
              <p className="mt-1 max-w-xl font-medium text-slate-500">
                Agle {selectedDays} din me close hone wali jobs abhi available nahi hain.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
