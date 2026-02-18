"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS = {
  "admit-card": "Admit Card",
  "answer-key": "Answer Key",
  "latest-jobs": "Latest Jobs",
  results: "Results",
  post: "Post",
};

function segmentToLabel(segment) {
  const decoded = decodeURIComponent(String(segment || "").trim());
  if (!decoded) return "";
  if (SEGMENT_LABELS[decoded]) return SEGMENT_LABELS[decoded];
  return decoded
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function Breadcrumbs() {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) return null;
  if (segments[0] === "post") return null;

  const items = [
    { href: "/", label: "Home" },
    ...segments.map((segment, index) => {
      return {
        href: `/${segments.slice(0, index + 1).join("/")}`,
        label: segmentToLabel(segment),
      };
    }),
  ];

  return (
    <nav aria-label="Breadcrumb" className="border-b border-slate-200 bg-white/80">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <ol className="flex flex-wrap items-center gap-1 text-xs text-slate-600">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={`${item.href}-${item.label}`} className="inline-flex items-center gap-1">
                {isLast ? (
                  <span className="font-semibold text-slate-800">{item.label}</span>
                ) : (
                  <Link href={item.href} className="transition hover:text-indigo-600 hover:underline">
                    {item.label}
                  </Link>
                )}
                {!isLast ? <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" /> : null}
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}
