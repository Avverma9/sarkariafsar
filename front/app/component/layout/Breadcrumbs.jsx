"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SEGMENT_LABELS = {
  jobs: "Jobs",
  results: "Results",
  schemes: "Schemes",
  yojana: "Yojana",
  post: "Post",
  blog: "Blog",
  about: "About",
  "contact-us": "Contact Us",
  "privacy-policy": "Privacy Policy",
  "terms-and-conditions": "Terms and Conditions",
  "terms-condition": "Terms and Conditions",
  disclaimer: "Disclaimer",
  "cookie-policy": "Cookie Policy",
  "admit-cards": "Admit Cards",
  "full-content": "Full Content",
};

function formatSegmentLabel(segment) {
  const normalized = String(segment || "").trim().toLowerCase();

  if (!normalized) {
    return "";
  }

  if (SEGMENT_LABELS[normalized]) {
    return SEGMENT_LABELS[normalized];
  }

  return decodeURIComponent(normalized)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildCrumbs(pathname = "/") {
  const segments = String(pathname || "/")
    .split("/")
    .filter(Boolean);

  const crumbs = [{ label: "Home", href: "/" }];
  let currentPath = "";

  segments.forEach((segment) => {
    currentPath = `${currentPath}/${segment}`;
    crumbs.push({
      label: formatSegmentLabel(segment),
      href: currentPath,
    });
  });

  return crumbs;
}

export default function Breadcrumbs({ className = "", showOnHome = true }) {
  const pathname = usePathname() || "/";
  const crumbs = buildCrumbs(pathname);

  if (!showOnHome && crumbs.length === 1) {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className={`rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm ${className}`.trim()}
    >
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 sm:text-sm">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li key={crumb.href} className="inline-flex items-center gap-2">
              {index > 0 ? <span className="text-slate-400">/</span> : null}
              {isLast ? (
                <span aria-current="page" className="text-slate-900">
                  {crumb.label}
                </span>
              ) : (
                <Link className="text-slate-600 hover:text-indigo-700" href={crumb.href}>
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
