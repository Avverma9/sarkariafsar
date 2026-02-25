"use client";

import { BellRing, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { buildSectionHref, resolveSectionRoute } from "../../lib/sectionRouting";
import PostDetailsSkeleton from "./PostDetailsSkeleton";
import { buildPublicApiUrl, fetchJsonWithFallback } from "@/app/lib/clientApi";
import { normalizePostDetails } from "@/app/lib/post-details";

const WATCHED_POSTS_STORAGE_KEY = "watched-posts-v1";
const SA_FONT_LINKS = `
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
`;
const TAILWIND_LAYOUT_OVERRIDE_STYLE = `
<style id="sa-tailwind-layout-override">
:root {
  --sa-bg: #edf4ff;
  --sa-card: #ffffff;
  --sa-ink: #10243d;
  --sa-muted: #4e6880;
  --sa-line: #d6e3f2;
  --sa-brand: #0f66d0;
  --sa-brand-strong: #084f9c;
  --sa-accent: #0ca37d;
  --sa-soft: #f2f8ff;
  --sa-radius: 18px;
  --sa-shadow: 0 28px 42px -34px rgba(10, 34, 66, 0.55);
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
html {
  font-size: 16px;
}
html,
body {
  margin: 0 !important;
  width: 100% !important;
}
body {
  font-family: "Manrope", "Segoe UI", Tahoma, sans-serif !important;
  color: var(--sa-ink) !important;
  background:
    radial-gradient(1200px 520px at 0% 0%, rgba(116, 182, 255, 0.24), transparent 58%),
    radial-gradient(900px 460px at 100% 0%, rgba(255, 197, 116, 0.2), transparent 52%),
    var(--sa-bg) !important;
  line-height: 1.72;
  padding: 18px 12px 56px !important;
}
main,
.mx-auto {
  width: min(1100px, calc(100vw - 24px)) !important;
  max-width: 1100px !important;
  margin-left: auto !important;
  margin-right: auto !important;
}
main {
  display: flex !important;
  flex-direction: column !important;
  gap: 18px !important;
}
main > * {
  animation: sa-rise 0.55s ease both;
}
main > *:nth-child(2) {
  animation-delay: 0.06s;
}
main > *:nth-child(3) {
  animation-delay: 0.12s;
}
main > section:first-of-type {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.36) !important;
  border-radius: 24px !important;
  background: linear-gradient(125deg, #0b2c4c 0%, #0f66d0 56%, #0ca37d 100%) !important;
  padding: 26px 24px !important;
  box-shadow: var(--sa-shadow);
}
main > section:first-of-type::before {
  content: "";
  position: absolute;
  inset: auto -50px -110px auto;
  width: 240px;
  height: 240px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.26) 0%, rgba(255, 255, 255, 0) 68%);
}
main > section:first-of-type h1 {
  margin: 10px 0 10px !important;
  color: #f5fbff !important;
  font-family: "Fraunces", Georgia, "Times New Roman", serif !important;
  font-size: clamp(1.55rem, 2.35vw, 2.2rem) !important;
  line-height: 1.3 !important;
  letter-spacing: 0.01em;
}
main > section:first-of-type > div:first-child {
  border-radius: 999px !important;
  border: 1px solid rgba(255, 255, 255, 0.34) !important;
  background: rgba(255, 255, 255, 0.16) !important;
  color: #f3fbff !important;
  font-size: 0.68rem !important;
  letter-spacing: 0.08em !important;
  padding: 6px 12px !important;
}
main > section:first-of-type a {
  color: #d4f6ff !important;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
main > section:nth-of-type(2) {
  border: 1px solid #a4e2c7 !important;
  border-radius: 16px !important;
  background: linear-gradient(90deg, #e8fff3 0%, #f4fff9 100%) !important;
}
main > section:nth-of-type(2) p {
  margin: 0 !important;
  color: #16543f !important;
  font-weight: 500 !important;
}
main > div,
.inside-article {
  border: 1px solid var(--sa-line) !important;
  border-radius: 22px !important;
  background: var(--sa-card) !important;
  box-shadow: var(--sa-shadow);
}
main > div > div:first-child {
  border-bottom: 1px solid var(--sa-line) !important;
  background: linear-gradient(90deg, #f2f8ff 0%, #ffffff 65%) !important;
  padding: 14px 18px !important;
}
main > div > div:first-child h2 {
  margin: 0 !important;
  color: #0f3458 !important;
  font-family: "Fraunces", Georgia, "Times New Roman", serif !important;
  font-size: 1.3rem !important;
}
.p-5 {
  padding: 1.25rem !important;
}
.prose,
.prose.prose-slate {
  max-width: none !important;
  color: var(--sa-ink) !important;
  font-size: 0.975rem !important;
  line-height: 1.74 !important;
}
.prose > div > header {
  display: none !important;
}
.prose h1,
.prose h2,
.prose h3,
.prose h4,
.prose h5,
.prose h6 {
  color: #0f3458 !important;
  font-family: "Fraunces", Georgia, "Times New Roman", serif !important;
  line-height: 1.34 !important;
  margin: 1.08em 0 0.48em !important;
}
.prose h1 {
  font-size: clamp(1.36rem, 2vw, 1.8rem) !important;
}
.prose h2 {
  font-size: clamp(1.22rem, 1.8vw, 1.55rem) !important;
}
.prose h3 {
  font-size: clamp(1.07rem, 1.48vw, 1.25rem) !important;
}
.prose p,
p {
  margin: 0 0 0.86em !important;
  color: var(--sa-ink) !important;
}
p:empty {
  display: none !important;
}
p > br:only-child {
  display: none !important;
}
ul,
ol {
  margin: 0 0 1em !important;
  padding-left: 1.12rem !important;
}
li {
  margin: 0.24em 0 !important;
}
li::marker {
  color: #2187db;
}
a {
  color: var(--sa-brand) !important;
  text-decoration: underline;
  text-decoration-color: rgba(15, 102, 208, 0.34);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
a:hover {
  color: var(--sa-brand-strong) !important;
  text-decoration-color: rgba(15, 102, 208, 0.62);
}
div[class*="overflow-x-auto"] {
  margin: 14px 0 !important;
  border: 1px solid var(--sa-line) !important;
  border-radius: 16px !important;
  background: #fff !important;
  overflow-x: auto !important;
  box-shadow: inset 0 1px 0 #fff;
}
table {
  width: 100% !important;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  min-width: 540px !important;
  font-size: 0.9rem !important;
  background: #fff !important;
}
th,
td {
  border: 1px solid var(--sa-line) !important;
  padding: 11px 13px !important;
  vertical-align: top !important;
  color: var(--sa-ink) !important;
}
tr:first-child td,
tr:first-child th {
  background: #edf5ff !important;
  color: #10395f !important;
  font-weight: 700 !important;
}
tr:nth-child(even) td {
  background: #f9fcff !important;
}
td[colspan] {
  background: #e8f3ff !important;
  font-weight: 700 !important;
  text-align: center !important;
}
.inside-article h2 a,
.inside-article h3 a,
.inside-article h4 a {
  display: inline-flex !important;
  align-items: center !important;
  gap: 0.34rem !important;
  border-radius: 999px !important;
  border: 1px solid rgba(15, 102, 208, 0.24) !important;
  background: linear-gradient(135deg, #0f66d0 0%, #0ca37d 100%) !important;
  color: #f8fdff !important;
  text-decoration: none !important;
  padding: 0.38rem 0.82rem !important;
  font-size: 0.78rem !important;
  font-weight: 700 !important;
  box-shadow: 0 8px 16px -10px rgba(10, 55, 107, 0.7);
}
footer[aria-label="Entry meta"] {
  margin-top: 1rem !important;
  border-top: 1px dashed var(--sa-line) !important;
  padding-top: 0.82rem !important;
  color: var(--sa-muted) !important;
  font-size: 0.78rem !important;
}
@keyframes sa-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 768px) {
  body {
    padding: 12px 8px 40px !important;
  }
  main,
  .mx-auto {
    width: min(1100px, calc(100vw - 12px)) !important;
  }
  main > section:first-of-type {
    padding: 18px 16px !important;
    border-radius: 18px !important;
  }
  main > div,
  .inside-article {
    border-radius: 16px !important;
  }
  table {
    min-width: 360px !important;
    font-size: 0.85rem !important;
  }
}
</style>`;
const LEGACY_SECTION_HEADINGS = [
  {
    heading: "Important Dates",
    keys: ["important dates", "key dates", "exam dates", "schedule", "timeline"],
  },
  {
    heading: "Application Fee",
    keys: ["application fee", "fee details", "fee structure", "application fees", "fee payment"],
  },
  {
    heading: "Age Limit",
    keys: ["age limit", "age criteria", "age as on", "age relaxation"],
  },
  {
    heading: "Total Posts / Vacancy",
    keys: ["total post", "total posts", "vacancy details", "post details", "vacancies", "post wise"],
  },
  {
    heading: "Eligibility / Qualification",
    keys: ["eligibility", "qualification", "educational qualification", "education criteria"],
  },
  {
    heading: "Selection Process",
    keys: ["selection process", "selection criteria", "selection procedure", "merit list"],
  },
  {
    heading: "How to Apply",
    keys: ["how to apply", "application process", "apply process", "apply online"],
  },
  {
    heading: "Important Links",
    keys: ["important links", "useful links", "direct links", "official links", "apply link"],
  },
];
const NEW_HTML_FALLBACK_STYLE = `
:root {
  --sa-bg: #edf4ff;
  --sa-card: #ffffff;
  --sa-ink: #10243d;
  --sa-muted: #4f6782;
  --sa-line: #d7e3f2;
  --sa-brand: #0f66d0;
  --sa-brand-strong: #0a509d;
  --sa-accent: #0ca37d;
  --sa-radius: 18px;
  --sa-shadow: 0 26px 38px -34px rgba(11, 36, 69, 0.52);
}
*,
*::before,
*::after {
  box-sizing: border-box;
}
html {
  font-size: 16px;
}
body {
  margin: 0;
  font-family: "Manrope", "Segoe UI", Tahoma, sans-serif;
  color: var(--sa-ink);
  background:
    radial-gradient(1200px 520px at 0% 0%, rgba(116, 182, 255, 0.24), transparent 58%),
    radial-gradient(900px 460px at 100% 0%, rgba(255, 197, 116, 0.2), transparent 52%),
    var(--sa-bg);
  line-height: 1.72;
  padding: 18px 12px 56px;
}
.sa-shell {
  width: min(1100px, calc(100vw - 24px));
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.sa-shell > * {
  animation: sa-rise 0.52s ease both;
}
.sa-shell > *:nth-child(2) {
  animation-delay: 0.06s;
}
.sa-shell > *:nth-child(3) {
  animation-delay: 0.12s;
}
.sa-hero {
  border: 1px solid rgba(255, 255, 255, 0.36);
  border-radius: 24px;
  padding: 26px 24px;
  color: #f4fbff;
  background: linear-gradient(125deg, #0b2c4c 0%, #0f66d0 56%, #0ca37d 100%);
  box-shadow: var(--sa-shadow);
}
.sa-hero-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.34);
  background: rgba(255, 255, 255, 0.16);
  color: #f3fbff;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  padding: 6px 12px;
  text-transform: uppercase;
}
.sa-hero h1 {
  margin: 12px 0 10px;
  color: #f5fbff;
  font-family: "Fraunces", Georgia, "Times New Roman", serif;
  font-size: clamp(1.55rem, 2.35vw, 2.2rem);
  line-height: 1.3;
}
.sa-hero-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.8rem;
  color: #d7f4ff;
}
.sa-hero-meta a {
  color: #d7f4ff;
  text-decoration: underline;
  text-decoration-color: rgba(215, 244, 255, 0.45);
  text-underline-offset: 0.18em;
}
.sa-card,
.sa-section-card,
.sa-source-bar {
  border: 1px solid var(--sa-line);
  border-radius: 22px;
  background: var(--sa-card);
  box-shadow: var(--sa-shadow);
}
.sa-card-header {
  border-bottom: 1px solid var(--sa-line);
  background: linear-gradient(90deg, #f2f8ff 0%, #ffffff 65%);
  padding: 14px 18px;
}
.sa-card-icon {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  background: #deedff;
  color: #0f66d0;
  display: grid;
  place-items: center;
}
.sa-card-header h2 {
  margin: 0;
  color: #0f3458;
  font-family: "Fraunces", Georgia, "Times New Roman", serif;
  font-size: 1.3rem;
}
.sa-card-body {
  padding: 1.25rem;
}
.sa-content {
  color: var(--sa-ink);
  line-height: 1.74;
}
.sa-content h1,
.sa-content h2,
.sa-content h3,
.sa-content h4,
.sa-content h5,
.sa-content h6 {
  color: #0f3458;
  font-family: "Fraunces", Georgia, "Times New Roman", serif;
  line-height: 1.34;
  margin: 1.08em 0 0.48em;
}
.sa-content p {
  margin: 0 0 0.86em;
}
.sa-content ul,
.sa-content ol {
  margin: 0 0 1em;
  padding-left: 1.12rem;
}
.sa-content li {
  margin: 0.24em 0;
}
.sa-content li::marker {
  color: #2187db;
}
.sa-content a {
  color: var(--sa-brand);
  text-decoration: underline;
  text-decoration-color: rgba(15, 102, 208, 0.34);
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}
.sa-content a:hover {
  color: var(--sa-brand-strong);
}
.sa-front-legacy {
  margin: 0 0 12px;
}
.sa-front-legacy > p {
  margin: 0 0 8px;
}
.sa-front-section {
  margin: 14px 0 0;
  border: 1px solid var(--sa-line);
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}
.sa-front-section h3 {
  margin: 0;
  color: #f4fbff;
  background: linear-gradient(90deg, #0f66d0 0%, #0ca37d 100%);
  font-size: 0.86rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  padding: 10px 14px;
}
.sa-front-section ul {
  margin: 0;
  padding: 12px 16px 14px 30px;
}
.sa-front-section li:last-child {
  margin-bottom: 0;
}
.sa-table-wrap,
.sa-side-wrap,
.newtable1,
.newtable2 {
  margin: 14px 0;
  border: 1px solid var(--sa-line);
  border-radius: 16px;
  background: #fff;
  overflow-x: auto;
}
table,
table.sa-table,
.sa-side-table,
.newtable1 table,
.newtable2 table,
.entry-content table {
  width: 100% !important;
  min-width: 540px;
  border-collapse: separate !important;
  border-spacing: 0 !important;
  font-size: 0.9rem;
  background: #fff;
}
th,
td,
table.sa-table th,
table.sa-table td,
.sa-side-th,
.sa-side-td,
.newtable1 th,
.newtable1 td,
.newtable2 th,
.newtable2 td,
.entry-content th,
.entry-content td {
  border: 1px solid var(--sa-line);
  padding: 11px 13px;
  vertical-align: top;
  color: var(--sa-ink);
  word-break: break-word;
}
tr:first-child td,
tr:first-child th {
  background: #edf5ff;
  color: #10395f;
  font-weight: 700;
}
tr:nth-child(even) td {
  background: #f9fcff;
}
td[colspan] {
  background: #e8f3ff !important;
  font-weight: 700;
  text-align: center;
}
a.sa-pdf-btn {
  display: inline-flex !important;
  align-items: center;
  gap: 6px;
  border-radius: 999px !important;
  border: 1px solid rgba(15, 102, 208, 0.22) !important;
  background: linear-gradient(135deg, #0f66d0 0%, #0ca37d 100%) !important;
  color: #f8fdff !important;
  font-size: 0.78rem !important;
  font-weight: 700 !important;
  text-decoration: none !important;
  padding: 0.38rem 0.82rem !important;
  box-shadow: 0 8px 16px -10px rgba(10, 55, 107, 0.7);
}
.sa-source-bar {
  padding: 12px 16px;
  color: var(--sa-muted);
  font-size: 0.78rem;
}
.sa-source-bar a {
  color: var(--sa-brand);
}
.sa-footer {
  margin-top: 1rem;
  border-top: 1px dashed var(--sa-line);
  padding-top: 0.82rem;
  color: var(--sa-muted);
  font-size: 0.78rem;
}
.has-small-font-size {
  border-radius: 10px;
  border-left: 3px solid #a8bfd8;
  background: #f5f9ff;
  color: #4b6078;
  font-size: 0.78rem;
  padding: 10px 12px;
}
@keyframes sa-rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@media (max-width: 768px) {
  body {
    padding: 12px 8px 40px;
  }
  .sa-shell {
    width: min(1100px, calc(100vw - 12px));
  }
  .sa-hero {
    border-radius: 18px;
    padding: 18px 16px;
  }
  .sa-card,
  .sa-section-card,
  .sa-source-bar {
    border-radius: 16px;
  }
  table,
  table.sa-table,
  .sa-side-table {
    min-width: 360px;
    font-size: 0.85rem;
  }
}
`;

function normalizeObjectId(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const oid = String(value.$oid || value.oid || value.id || value._id || "").trim();
    if (oid) return oid;
  }
  return "";
}

function buildWatchLocalKey({ postDetailId = "", megaPostId = "", canonicalKey = "", megaSlug = "" }) {
  const postDetail = String(postDetailId || "").trim();
  const megaPost = String(megaPostId || "").trim();
  const canonical = String(canonicalKey || "").trim().toLowerCase();
  const mega = String(megaSlug || "").trim().toLowerCase();

  if (canonical) return `ck:${canonical}${mega ? `|ms:${mega}` : ""}`;
  if (postDetail) return `pd:${postDetail}`;
  if (megaPost) return `mp:${megaPost}`;
  return "";
}

function readWatchedPostsMap() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(WATCHED_POSTS_STORAGE_KEY);
    const parsed = JSON.parse(raw || "{}");
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function markPostAsWatched(localKey, data = {}) {
  if (typeof window === "undefined" || !localKey) return;
  const prev = readWatchedPostsMap();
  const next = {
    ...prev,
    [localKey]: {
      enabled: true,
      savedAt: new Date().toISOString(),
      ...data,
    },
  };
  window.localStorage.setItem(WATCHED_POSTS_STORAGE_KEY, JSON.stringify(next));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function formatDisplayDate(value = "") {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return raw;
}

function looksTailwindRichHtml(value) {
  return /class=["'][^"']*(\bprose\b|\bbg-[^"'\s]+|\btext-[^"'\s]+|\bborder-[^"'\s]+|\bpx-[^"'\s]+|\bpy-[^"'\s]+|\brounded-[^"'\s]+|\bshadow-[^"'\s]+|\bmin-w-\[[^"']+\]|\bmax-w-\[[^"']+\]|\bw-full\b)[^"']*["']/i.test(
    String(value || ""),
  );
}

function normalizeUtilityClassList(rawClassValue = "", isTailwindDoc = false) {
  const input = String(rawClassValue || "").trim();
  if (!input) return "";

  const seen = new Set();
  let tokens = input
    .split(/\s+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((token) => {
      if (seen.has(token)) return false;
      seen.add(token);
      return true;
    });

  if (!isTailwindDoc) return tokens.join(" ");

  const hasSlateText = tokens.some((token) => /^text-slate-\d{2,3}$/.test(token));
  const hasBgWhite = tokens.includes("bg-white");
  const darkBgTokens = new Set(["bg-slate-800", "bg-slate-900", "bg-slate-950"]);

  if (hasSlateText || hasBgWhite) {
    tokens = tokens.filter((token) => !darkBgTokens.has(token));
  }
  if (hasSlateText) {
    tokens = tokens.filter((token) => token !== "text-white");
  }

  return tokens.join(" ");
}

function normalizeHtmlClassAttributes(docHtml = "", isTailwindDoc = false) {
  const html = String(docHtml || "");
  if (!html) return "";

  return html.replace(/class=(["'])([\s\S]*?)\1/gi, (fullMatch, quote, classValue) => {
    const normalized = normalizeUtilityClassList(classValue, isTailwindDoc);
    if (!normalized) return "";
    return `class=${quote}${normalized}${quote}`;
  });
}

function normalizeLegacyInlineLine(value = "") {
  let line = String(value || "").trim();
  if (!line) return "";
  line = line
    .replace(/^<p[^>]*>/i, "")
    .replace(/<\/p>$/i, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/^\s*(?:[-*.:]+)\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
  return line;
}

function stripHtmlTags(value = "") {
  return String(value || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectLegacySectionHeading(value = "") {
  const line = String(value || "").toLowerCase();
  if (!line) return "";
  for (const section of LEGACY_SECTION_HEADINGS) {
    if (section.keys.some((key) => line.includes(key))) return section.heading;
  }
  return "";
}

function enhanceLegacyLeadBlock(rawHtml = "") {
  const html = String(rawHtml || "").trim();
  if (!html) return "";
  if (/sa-shell|sa-hero|sa-card-header/i.test(html)) return html;

  const firstTableIndex = html.search(/<table[\s>]/i);
  if (firstTableIndex < 0) return html;

  const lead = html.slice(0, firstTableIndex);
  const rest = html.slice(firstTableIndex);
  if (!/<br\s*\/?>/i.test(lead)) return html;

  const lines = lead
    .split(/<br\s*\/?>/gi)
    .map((line) => normalizeLegacyInlineLine(line))
    .filter(Boolean);

  if (lines.length < 6) return html;

  const headingHits = lines.reduce((count, line) => {
    const text = stripHtmlTags(line).replace(/[:\-–—]+$/g, "").trim();
    return count + (detectLegacySectionHeading(text) ? 1 : 0);
  }, 0);
  if (headingHits < 2) return html;

  const introLines = [];
  const sections = [];
  let activeSection = null;

  const flushActive = () => {
    if (!activeSection) return;
    const filteredItems = activeSection.items.filter(Boolean);
    if (filteredItems.length) {
      sections.push({ heading: activeSection.heading, items: filteredItems });
    }
    activeSection = null;
  };

  for (const rawLine of lines) {
    const line = normalizeLegacyInlineLine(rawLine);
    if (!line) continue;

    const asText = stripHtmlTags(line).replace(/[:\-–—]+$/g, "").trim();
    const heading = detectLegacySectionHeading(asText);
    if (heading) {
      flushActive();
      activeSection = { heading, items: [] };
      continue;
    }

    if (activeSection) activeSection.items.push(line);
    else introLines.push(line);
  }
  flushActive();

  if (!sections.length) return html;

  const introHtml = introLines.map((line) => `<p>${line}</p>`).join("");
  const sectionHtml = sections
    .map(
      (section) => `
<section class="sa-front-section">
  <h3>${section.heading}</h3>
  <ul>${section.items.map((item) => `<li>${item}</li>`).join("")}</ul>
</section>`,
    )
    .join("");

  return `<div class="sa-front-legacy">${introHtml}${sectionHtml}</div>${rest}`;
}

function removeEmptyParagraphBreaks(rawHtml = "") {
  return String(rawHtml || "")
    .replace(/<p[^>]*>\s*(?:<br\s*\/?>\s*)+<\/p>/gi, "")
    .replace(/(<br\s*\/?>\s*){3,}/gi, "<br /><br />");
}

function stripForeignStyles(rawDoc = "") {
  let doc = String(rawDoc || "");
  if (!doc) return doc;

  const hasPreparedLayout = /sa-shell|sa-hero|sa-card-header|sa-fallback-style/i.test(doc);
  if (hasPreparedLayout) return doc;

  doc = doc
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, "")
    .replace(/\sstyle=(["'])(?:(?!\1).)*\1/gi, "");

  return doc;
}

function buildPostSrcDoc(newHtml) {
  const inputHtml = String(newHtml || "").trim();
  if (!inputHtml) return "";
  const html = removeEmptyParagraphBreaks(enhanceLegacyLeadBlock(inputHtml));

  const rawDocBase = /<\s*html[\s>]/i.test(html)
    ? html
    : `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>${html}</body>
</html>`;
  const rawDoc = stripForeignStyles(rawDocBase);
  const isTailwindDoc = looksTailwindRichHtml(rawDoc);
  const baseDoc = normalizeHtmlClassAttributes(rawDoc, isTailwindDoc);

  const hasFallbackStyle = /id=["']sa-fallback-style["']/i.test(baseDoc);
  const hasTailwindLayoutOverride = /id=["']sa-tailwind-layout-override["']/i.test(baseDoc);
  const hasEmbeddedStyle = /<style[\s>]/i.test(baseDoc);
  const hasTailwindRuntime = /cdn\.tailwindcss\.com/i.test(baseDoc);
  const hasBrandFontLinks = /family=Fraunces|family=Manrope/i.test(baseDoc);
  const needsTailwindRuntime = isTailwindDoc && !hasTailwindRuntime;

  const injections = [];
  if (!hasBrandFontLinks) {
    injections.push(SA_FONT_LINKS);
  }

  if (needsTailwindRuntime) {
    injections.push(
      `<script>window.tailwind = window.tailwind || {}; window.tailwind.config = { corePlugins: { preflight: false } };</script>`,
      `<script src="https://cdn.tailwindcss.com?plugins=typography"></script>`,
    );
  }
  if (isTailwindDoc && !hasTailwindLayoutOverride) {
    injections.push(TAILWIND_LAYOUT_OVERRIDE_STYLE);
  }

  if (!isTailwindDoc && !hasFallbackStyle && !hasEmbeddedStyle) {
    injections.push(`<style id="sa-fallback-style">${NEW_HTML_FALLBACK_STYLE}</style>`);
  }

  if (injections.length === 0) return baseDoc;

  const headPayload = injections.join("\n");
  if (/<\/head>/i.test(baseDoc)) {
    return baseDoc.replace(/<\/head>/i, `${headPayload}\n</head>`);
  }
  if (/<\s*body[\s>]/i.test(baseDoc)) {
    return baseDoc.replace(/<\s*body[\s>]/i, `<head>${headPayload}</head><body>`);
  }

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  ${headPayload}
</head>
<body>${baseDoc}</body>
</html>`;
}

function EmptyCanonicalKey() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        canonicalKey missing. Please open this page from Header search or SectionGrid post click.
      </div>
    </div>
  );
}

function ErrorState({ message }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
      {message || "Unable to load post details."}
    </div>
  );
}

export default function PostDetailsView({
  canonicalKey = "",
  initialDetails = null,
  initialErrorMessage = "",
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(initialErrorMessage || "");
  const [details, setDetails] = useState(initialDetails || null);

  const [watchModalOpen, setWatchModalOpen] = useState(false);
  const [watchEmail, setWatchEmail] = useState("");
  const [watchSubmitting, setWatchSubmitting] = useState(false);
  const [watchFeedback, setWatchFeedback] = useState({ type: "", text: "" });
  const [watchEnabledForPost, setWatchEnabledForPost] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const contentFrameRef = useRef(null);
  const [contentFrameHeight, setContentFrameHeight] = useState(1200);

  useEffect(() => {
    if (!canonicalKey) return;

    let isMounted = true;
    const controller = new AbortController();

    const fetchDetails = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const localEndpoint = "/api/post-details-by-canonicalkey";
        const publicBaseUrl = String(process.env.NEXT_PUBLIC_BASE_URL || "")
          .trim()
          .replace(/\/+$/, "");
        const upstreamFallbackEndpoint = publicBaseUrl ? `${publicBaseUrl}/post/scrape` : "";

        let response = await fetch(localEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ canonicalKey }),
          signal: controller.signal,
          cache: "no-store",
        });
        let payload = await response.json().catch(() => null);

        const shouldTryUpstreamFallback =
          Boolean(upstreamFallbackEndpoint) &&
          (response.status === 404 || !response.ok || !payload || payload?.success === false);

        if (shouldTryUpstreamFallback) {
          response = await fetch(upstreamFallbackEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ canonicalKey }),
            signal: controller.signal,
            cache: "no-store",
          });
          payload = await response.json().catch(() => null);
        }

        if (!response.ok || !payload || payload?.success === false) {
          const upstreamStatus = payload?.upstream?.status;
          const upstreamType = payload?.upstream?.contentType;
          const upstreamMeta = upstreamStatus
            ? ` (upstream ${upstreamStatus}${upstreamType ? `, ${upstreamType}` : ""})`
            : "";
          throw new Error(`${payload?.message || "Unable to load post details"}${upstreamMeta}`);
        }

        const normalized = normalizePostDetails(payload);
        if (isMounted) setDetails(normalized);
      } catch (error) {
        if (error?.name !== "AbortError" && isMounted) {
          setErrorMessage(error?.message || "Unable to load post details");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [canonicalKey]);

  useEffect(() => {
    setWatchModalOpen(false);
    setWatchEmail("");
    setWatchSubmitting(false);
    setWatchFeedback({ type: "", text: "" });
  }, [canonicalKey]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const recruitment = details?.recruitment || {};
  const post = details?.raw || {};
  const postHtmlPayload = useMemo(
    () => String(post?.reactHtml || post?.newHtml || "").trim(),
    [post?.reactHtml, post?.newHtml],
  );
  const postSrcDoc = useMemo(
    () => buildPostSrcDoc(postHtmlPayload),
    [postHtmlPayload],
  );

  const displayTitle = recruitment.title || post.postTitle || post.megaTitle || "Recruitment Details";
  const rawSectionTitle = String(post.megaTitle || post.megaSlug || recruitment.megaTitle || "").trim();
  const sectionRoute = resolveSectionRoute(rawSectionTitle || "Latest Gov Jobs");
  const breadcrumbSectionLabel = sectionRoute.label || "Latest Gov Jobs";
  const breadcrumbSectionHref = buildSectionHref(sectionRoute.megaTitle);
  const breadcrumbTitle = recruitment.advertisementNumber || displayTitle;

  const postDetailWatchId = normalizeObjectId(
    post._id || post.postDetailId || post.postId || post.id,
  );
  const megaPostWatchId = normalizeObjectId(post.megaPostId);
  const canonicalWatchKey = String(post.canonicalKey || post.canonical || canonicalKey || "").trim();
  const megaSlugForWatch = String(post.megaSlug || "").trim();
  const postWatchId = postDetailWatchId || megaPostWatchId;

  const hasWatchTarget = Boolean(
    postWatchId || postDetailWatchId || megaPostWatchId || canonicalWatchKey,
  );
  const watchLocalKey = buildWatchLocalKey({
    postDetailId: postDetailWatchId,
    megaPostId: megaPostWatchId,
    canonicalKey: canonicalWatchKey,
    megaSlug: megaSlugForWatch,
  });

  useEffect(() => {
    if (!watchLocalKey) {
      setWatchEnabledForPost(false);
      return;
    }
    const watchedMap = readWatchedPostsMap();
    setWatchEnabledForPost(Boolean(watchedMap[watchLocalKey]?.enabled));
  }, [watchLocalKey]);

  const openWatchModal = () => {
    if (!hasWatchTarget || watchEnabledForPost) return;
    setWatchFeedback({ type: "", text: "" });
    setWatchEmail("");
    setWatchModalOpen(true);
  };

  const closeWatchModal = () => {
    if (watchSubmitting) return;
    setWatchModalOpen(false);
  };

  const resizeContentFrame = () => {
    const frame = contentFrameRef.current;
    if (!frame) return;
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const bodyHeight = doc.body?.scrollHeight || 0;
      const docHeight = doc.documentElement?.scrollHeight || 0;
      const nextHeight = Math.max(bodyHeight, docHeight);
      if (nextHeight > 0) {
        setContentFrameHeight(Math.max(720, nextHeight + 8));
      }
    } catch {
      // Ignore resize errors for cross-origin-like edge cases.
    }
  };

  useEffect(() => {
    setContentFrameHeight(1200);
  }, [postSrcDoc]);

  const submitWatchRequest = async (event) => {
    event.preventDefault();

    if (!hasWatchTarget) {
      setWatchFeedback({
        type: "error",
        text: "No valid identifier found for this post.",
      });
      return;
    }

    const email = String(watchEmail || "").trim().toLowerCase();
    if (!isValidEmail(email)) {
      setWatchFeedback({ type: "error", text: "Please enter a valid email address." });
      return;
    }

    setWatchSubmitting(true);
    setWatchFeedback({ type: "", text: "" });

    try {
      const body = JSON.stringify({
        email,
        ...(postWatchId ? { postId: postWatchId } : {}),
        ...(postDetailWatchId ? { postDetailId: postDetailWatchId } : {}),
        ...(megaPostWatchId ? { megaPostId: megaPostWatchId } : {}),
        ...(canonicalWatchKey ? { canonicalKey: canonicalWatchKey } : {}),
        ...(megaSlugForWatch ? { megaSlug: megaSlugForWatch } : {}),
        enabled: true,
        priority: 10,
        channels: {
          email: true,
          whatsapp: false,
        },
      });

      const { response, payload } = await fetchJsonWithFallback({
        localUrl: "/api/watch",
        fallbackUrl: buildPublicApiUrl("/watch"),
        init: {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          cache: "no-store",
        },
      });

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Unable to enable notification for this post.");
      }

      if (watchLocalKey) {
        markPostAsWatched(watchLocalKey, {
          postId: postWatchId,
          postDetailId: postDetailWatchId,
          megaPostId: megaPostWatchId,
          canonicalKey: canonicalWatchKey,
          megaSlug: megaSlugForWatch,
        });
      }

      setWatchEnabledForPost(true);
      setWatchEmail("");
      setWatchFeedback({ type: "", text: "" });
      setWatchModalOpen(false);
    } catch (error) {
      setWatchFeedback({
        type: "error",
        text: error?.message || "Unable to enable notification for this post.",
      });
    } finally {
      setWatchSubmitting(false);
    }
  };

  const sourceHost = (() => {
    const raw = String(post?.sourceUrl || "").trim();
    if (!raw) return "";
    try {
      return new URL(raw).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  const publishedLabel = formatDisplayDate(
    recruitment?.importantDates?.postDate || post?.postDate || "",
  );
  const deadlineLabel = formatDisplayDate(
    recruitment?.importantDates?.applicationLastDate || post?.applicationLastDate || "",
  );

  if (!canonicalKey) return <EmptyCanonicalKey />;
  if (isLoading && !details) return <PostDetailsSkeleton />;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#edf4ff] text-slate-800">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,_rgba(110,179,255,0.22),transparent_64%)]" />
      <div className="pointer-events-none absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#8ec9ff]/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-14 h-64 w-64 rounded-full bg-[#ffd097]/30 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1240px] px-3 pt-4 sm:px-4 lg:px-6">
        <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-white/60 bg-white/80 px-3 py-1.5 text-[11px] text-slate-600 shadow-sm backdrop-blur-sm sm:text-xs">
          <Link href="/" className="font-semibold transition hover:text-sky-700 hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
          <Link href={breadcrumbSectionHref} className="font-semibold transition hover:text-sky-700 hover:underline">
            {breadcrumbSectionLabel}
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
          <span className="max-w-[55ch] truncate font-semibold text-slate-700">{breadcrumbTitle}</span>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-[1240px] px-3 pb-14 sm:px-4 lg:px-6">
        {errorMessage && !details && <ErrorState message={errorMessage} />}

        {details && (
          <div className="space-y-4 pt-2">
            <section className="overflow-hidden rounded-[24px] border border-white/40 bg-gradient-to-r from-[#0b2c4c] via-[#0f66d0] to-[#0ca37d] p-5 text-white shadow-[0_30px_45px_-35px_rgba(9,41,78,0.9)] sm:p-6">
              <div className="flex flex-col gap-5">
                <div className="min-w-0">
                  <h1 className="max-w-4xl text-[1.52rem] font-semibold leading-tight text-white sm:text-[1.85rem]">
                    {displayTitle}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] sm:text-xs">
                    {sourceHost ? (
                      <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-1 text-sky-50">
                        Source: {sourceHost}
                      </span>
                    ) : null}
                    {publishedLabel ? (
                      <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-1 text-sky-50">
                        Published: {publishedLabel}
                      </span>
                    ) : null}
                    {deadlineLabel ? (
                      <span className="rounded-full border border-white/25 bg-white/12 px-2.5 py-1 text-sky-50">
                        Last Date: {deadlineLabel}
                      </span>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={openWatchModal}
                    disabled={!hasWatchTarget || watchEnabledForPost}
                    className={`mt-4 inline-flex min-w-[172px] items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold tracking-wide transition disabled:cursor-not-allowed ${
                      watchEnabledForPost
                        ? "border border-emerald-300/60 bg-emerald-100/90 text-emerald-900"
                        : "border border-white/35 bg-white/16 text-white hover:bg-white/24 disabled:border-white/20 disabled:bg-white/10 disabled:text-white/55"
                    }`}
                    title={
                      watchEnabledForPost
                        ? "Notification already enabled for this post"
                        : hasWatchTarget
                          ? "Enable notification for this post"
                          : "Post identifier not available"
                    }
                  >
                    <BellRing className="h-3.5 w-3.5" />
                    {watchEnabledForPost ? "Notification Enabled" : "Notify Me"}
                  </button>
                </div>
              </div>
            </section>

            <section className="overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/95 shadow-[0_24px_36px_-30px_rgba(10,34,66,0.65)] backdrop-blur">
              {!hasMounted ? (
                <div className="m-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600 sm:m-6">
                  Loading recruitment details...
                </div>
              ) : postSrcDoc ? (
                <iframe
                  ref={contentFrameRef}
                  title={displayTitle}
                  srcDoc={postSrcDoc}
                  className="block w-full border-0 bg-transparent"
                  style={{ height: `${contentFrameHeight}px` }}
                  onLoad={() => {
                    resizeContentFrame();
                    setTimeout(resizeContentFrame, 180);
                    setTimeout(resizeContentFrame, 640);
                    setTimeout(resizeContentFrame, 1400);
                    setTimeout(resizeContentFrame, 2400);
                  }}
                />
              ) : (
                <div className="m-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 sm:m-6">
                  Content not available.
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {watchModalOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#082340]/55 p-4 backdrop-blur-[2px]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeWatchModal();
          }}
        >
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_34px_54px_-30px_rgba(11,36,69,0.8)]">
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Get Post Notification</h3>
                <p className="text-xs text-slate-500">Enter your email to get alerts for this post.</p>
              </div>
              <button
                type="button"
                onClick={closeWatchModal}
                disabled={watchSubmitting}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Close
              </button>
            </div>

            <form onSubmit={submitWatchRequest} className="space-y-3">
              <div>
                <label htmlFor="watch-email" className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Email Address
                </label>
                <input
                  id="watch-email"
                  type="email"
                  value={watchEmail}
                  onChange={(event) => setWatchEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  required
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-sky-600 focus:outline-none"
                />
              </div>

              {watchFeedback.text && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                  {watchFeedback.text}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={closeWatchModal}
                  disabled={watchSubmitting}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={watchSubmitting}
                  className="rounded-lg bg-gradient-to-r from-[#0f66d0] to-[#0ca37d] px-3 py-2 text-xs font-semibold text-white hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {watchSubmitting ? "Saving..." : "Enable Notification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
