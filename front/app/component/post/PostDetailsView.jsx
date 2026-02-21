"use client";

import {
  BellRing,
  CalendarDays,
  CheckSquare,
  ChevronRight,
  ClipboardCheck,
  ExternalLink,
  FileImage,
  FileText,
  Globe2,
  HelpCircle,
  IdCard,
  Info,
  IndianRupee,
  Link2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buildSectionHref, resolveSectionRoute } from "../../lib/sectionRouting";
import PostDetailsSkeleton from "./PostDetailsSkeleton";
import { buildPublicApiUrl, fetchJsonWithFallback } from "@/app/lib/clientApi";

const SECTION_CARD_CLASS =
  "mb-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm";
const SECTION_HEADER_CLASS =
  "flex items-center border-b border-slate-200 bg-slate-50 px-5 py-3 font-semibold text-slate-700";
const BLOCKED_EXTERNAL_HOSTS = ["sarkariresult.com.cm", "sarkariexam.com", "rojgarresult.com"];
const INLINE_PREVIEW_IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
const EMPTY_TEXT_VALUES = new Set([
  "not specified",
  "not available",
  "na",
  "n/a",
  "nil",
  "null",
  "undefined",
  "--",
]);
const GENERIC_LINK_TEXTS = new Set([
  "click here",
  "link active",
  "available soon",
  "coming soon",
  "download here",
  "view here",
  "check here",
  "apply here",
]);

const DATE_LABELS = [
  ["notificationDate", "Notification Date"],
  ["postDate", "Post Date"],
  ["applicationStartDate", "Application Begin"],
  ["applicationLastDate", "Last Date For Apply"],
  ["feePaymentLastDate", "Last Date Fee Payment"],
  ["correctionDate", "Correction Date"],
  ["preExamDate", "Pre Exam Date"],
  ["mainsExamDate", "Mains Exam Date"],
  ["examDate", "Exam Date"],
  ["admitCardDate", "Admit Card Date"],
  ["resultDate", "Result Date"],
  ["answerKeyReleaseDate", "Answer Key Date"],
  ["finalAnswerKeyDate", "Final Answer Key Date"],
  ["documentVerificationDate", "Document Verification Date"],
  ["counsellingDate", "Counselling Date"],
  ["meritListDate", "Merit List Date"],
  ["examCityDetailsDate", "Exam City Details Date"],
  ["petAdmitCardAvailable", "PET Admit Card Available"],
  ["petExamStartDate", "PET Exam Start Date"],
];

const FEE_LABELS = [
  ["general", "General"],
  ["ewsObc", "EWS / OBC"],
  ["scSt", "SC / ST"],
  ["female", "Female"],
  ["ph", "PH"],
  ["correctionCharge", "Correction Charge"],
];

const LINK_CONFIG = {
  applyOnline: {
    label: "Apply Online",
    icon: CheckSquare,
    className: "bg-indigo-600 text-white hover:bg-indigo-700",
  },
  officialNotification: {
    label: "Official Notification",
    icon: FileText,
    className: "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  },
  syllabus: {
    label: "Syllabus",
    icon: ClipboardCheck,
    className: "border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
  },
  examPattern: {
    label: "Exam Pattern",
    icon: ClipboardCheck,
    className: "border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100",
  },
  admitCard: {
    label: "Admit Card",
    icon: IdCard,
    className: "border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
  },
  resultLink: {
    label: "Result",
    icon: Trophy,
    className: "border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
  },
  answerKey: {
    label: "Answer Key",
    icon: FileText,
    className: "border border-cyan-200 bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
  },
  documentVerificationNotice: {
    label: "Document Verification Notice",
    icon: FileText,
    className: "border border-pink-200 bg-pink-50 text-pink-700 hover:bg-pink-100",
  },
  faq: {
    label: "FAQ",
    icon: HelpCircle,
    className: "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
  },
  officialWebsite: {
    label: "Official Website",
    icon: Globe2,
    className: "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100",
  },
};
const WATCHED_POSTS_STORAGE_KEY = "watched-posts-v1";

function readMaybeJson(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }
  return null;
}

function normalizePostDetails(payload) {
  let base = payload?.data ?? payload?.result ?? payload?.response ?? payload?.post ?? payload;
  if (Array.isArray(base)) base = base[0] || {};
  const parsedBase = readMaybeJson(base) || base || {};
  const parsedFormatted = readMaybeJson(parsedBase?.formattedData) || parsedBase?.formattedData;

  const recruitment =
    parsedBase?.recruitment ||
    parsedFormatted?.recruitment ||
    parsedBase?.content?.recruitment ||
    (parsedBase?.importantDates ? parsedBase : null) ||
    {};

  return { raw: parsedBase, recruitment };
}

function normalizeText(value) {
  return String(value || "")
    .replace(/â‚¹/g, "Rs.")
    .replace(/\uFFFD/g, "")
    .trim();
}

function hasValue(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") return Object.keys(value).length > 0;
  return true;
}

function isMeaningfulValue(value) {
  if (!hasValue(value)) return false;
  if (typeof value === "string") {
    const normalized = normalizeText(value).toLowerCase();
    return normalized && !EMPTY_TEXT_VALUES.has(normalized);
  }
  if (Array.isArray(value)) return value.some((item) => isMeaningfulValue(item));
  if (typeof value === "object") return Object.values(value).some((item) => isMeaningfulValue(item));
  return true;
}

function formatDisplayValue(value) {
  if (Array.isArray(value)) return value.map((item) => formatDisplayValue(item)).filter(Boolean).join(", ");
  if (typeof value === "string") return normalizeText(value);
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value && typeof value === "object") return JSON.stringify(value);
  return "";
}

function toMeaningfulList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => formatDisplayValue(item)).filter((item) => isMeaningfulValue(item));
}

function rowsFromObject(obj) {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return [];
  return Object.entries(obj).filter(([, value]) => isMeaningfulValue(value));
}

function humanLabel(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
}

function isLikelyUrl(value) {
  return /^https?:\/\//i.test(String(value || "").trim());
}

function getUrlPathname(value) {
  if (!isLikelyUrl(value)) return "";
  try {
    const url = new URL(String(value).trim());
    return String(url.pathname || "").toLowerCase();
  } catch {
    return "";
  }
}

function isPdfUrl(value) {
  return getUrlPathname(value).endsWith(".pdf");
}

function isInlinePreviewImageUrl(value) {
  const pathname = getUrlPathname(value);
  if (!pathname) return false;
  return INLINE_PREVIEW_IMAGE_EXTENSIONS.some((ext) => pathname.endsWith(ext));
}

function isAttachmentUrl(value) {
  return isPdfUrl(value) || isInlinePreviewImageUrl(value);
}

function isBlockedExternalUrl(value) {
  if (!isLikelyUrl(value)) return false;
  try {
    const url = new URL(String(value).trim());
    const host = String(url.hostname || "").toLowerCase();
    return BLOCKED_EXTERNAL_HOSTS.some(
      (blocked) => host === blocked || host === `www.${blocked}` || host.endsWith(`.${blocked}`),
    );
  } catch {
    return false;
  }
}

function shouldBlockExternalUrl(value) {
  return isBlockedExternalUrl(value) && !isAttachmentUrl(value);
}

function buildPdfDownloadUrl(rawUrl) {
  return `/api/pdf-proxy?download=1&url=${encodeURIComponent(rawUrl)}`;
}

function extractFilenameFromContentDisposition(value) {
  const header = String(value || "").trim();
  if (!header) return "";

  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].replace(/["']/g, "").trim());
    } catch {
      return utf8Match[1].replace(/["']/g, "").trim();
    }
  }

  const basicMatch = header.match(/filename="?([^\";]+)"?/i);
  return basicMatch?.[1] ? basicMatch[1].trim() : "";
}

function sanitizePdfFilename(value, fallback = "document.pdf") {
  const safe = String(value || "")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .trim();
  const base = safe || fallback;
  return /\.pdf$/i.test(base) ? base : `${base}.pdf`;
}

async function triggerPdfDownload(rawUrl) {
  if (!isLikelyUrl(rawUrl)) return;

  try {
    const response = await fetch(buildPdfDownloadUrl(rawUrl), {
      method: "GET",
      cache: "no-store",
    });
    if (!response.ok) return;

    const contentType = String(response.headers.get("content-type") || "").toLowerCase();
    if (!contentType.includes("pdf")) return;

    const disposition = response.headers.get("content-disposition") || "";
    const fallbackFromPath = String(getUrlPathname(rawUrl)).split("/").pop() || "document.pdf";
    const filename = sanitizePdfFilename(
      extractFilenameFromContentDisposition(disposition),
      sanitizePdfFilename(fallbackFromPath),
    );

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener noreferrer";
    anchor.style.display = "none";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch {
    // Ignore download failures silently to avoid breaking the page flow.
  }
}

function isGenericLinkText(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return false;
  if (GENERIC_LINK_TEXTS.has(normalized)) return true;
  return normalized === "click" || normalized === "here";
}

function isNonZeroMeaningfulValue(value) {
  if (!isMeaningfulValue(value)) return false;
  const asNumber = Number(value);
  if (!Number.isNaN(asNumber)) return asNumber !== 0;
  return true;
}

function resolveNavigableUrl(rawValue, fallbackUrls = []) {
  const tryResolve = (candidateRaw) => {
    const candidate = String(candidateRaw || "").trim();
    if (!isLikelyUrl(candidate)) return "";
    if (shouldBlockExternalUrl(candidate)) return "";
    return candidate;
  };

  const primary = tryResolve(rawValue);
  if (primary) return primary;

  for (const fallback of fallbackUrls) {
    const resolved = tryResolve(fallback);
    if (resolved) return resolved;
  }
  return "";
}

function shouldHideLinkEntry(entry) {
  const haystack = `${entry?.key || ""} ${entry?.label || ""} ${entry?.value || ""}`.toLowerCase();
  if (haystack.includes("sarkari result app")) return true;
  if (haystack.includes("sarkariresult app")) return true;
  if (haystack.includes("com.vinod.sarkarinaukri")) return true;
  if (haystack.includes("source url")) return true;
  return false;
}

function parseDateLike(value) {
  if (!isMeaningfulValue(value)) return null;
  const raw = formatDisplayValue(value);
  const direct = new Date(raw);
  if (!Number.isNaN(direct.getTime())) return direct;

  const iso = raw.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (iso) {
    const parsed = new Date(iso);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const ddMmYyyy = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (ddMmYyyy) {
    const parsed = new Date(Number(ddMmYyyy[3]), Number(ddMmYyyy[2]) - 1, Number(ddMmYyyy[1]));
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function humanDate(value) {
  if (!isMeaningfulValue(value)) return "Not specified";
  const raw = formatDisplayValue(value);
  if (/\bto\b/i.test(raw)) return raw;
  if (/\d{4}-\d{2}-\d{2}.+\d{4}-\d{2}-\d{2}/.test(raw)) return raw;
  if (/\d{1,2}[-/]\d{1,2}[-/]\d{4}.+\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(raw)) return raw;
  if (!/(\d{4}-\d{1,2}-\d{1,2})|(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})|([A-Za-z]{3,9}\s+\d{1,2},?\s+\d{4})/.test(raw)) {
    return raw;
  }
  const parsed = parseDateLike(raw);
  if (!parsed) return raw;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(parsed);
}

function valueWithCurrency(value, currency = "INR") {
  if (!isMeaningfulValue(value)) return "Not specified";
  const num = Number(value);
  if (!Number.isNaN(num)) {
    const symbol = String(currency || "INR").toUpperCase() === "INR" ? "Rs." : String(currency || "");
    return `${symbol} ${num}`;
  }
  return formatDisplayValue(value);
}

function statusClasses(status) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return { text: "Application Open", className: "bg-green-100 text-green-700" };
  if (normalized === "upcoming") return { text: "Upcoming", className: "bg-amber-100 text-amber-700" };
  if (normalized === "closed") return { text: "Closed", className: "bg-red-100 text-red-700" };
  return { text: status || "Status", className: "bg-slate-100 text-slate-700" };
}

function hasApplicationClosed(applicationLastDate) {
  const parsedDate = parseDateLike(applicationLastDate);
  if (!parsedDate) return false;
  const endOfDay = new Date(parsedDate.getFullYear(), parsedDate.getMonth(), parsedDate.getDate(), 23, 59, 59, 999);
  return Date.now() > endOfDay.getTime();
}

function normalizeObjectId(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    const oid = String(value.$oid || value.oid || value.id || value._id || "").trim();
    if (oid) return oid;
  }
  return "";
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
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

function debugPostDetails(...args) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[PostDetailsView]", ...args);
  }
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
  return <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">{message || "Unable to load post details."}</div>;
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
  const [previewImage, setPreviewImage] = useState(null);
  const [watchEmail, setWatchEmail] = useState("");
  const [watchSubmitting, setWatchSubmitting] = useState(false);
  const [watchFeedback, setWatchFeedback] = useState({ type: "", text: "" });
  const [watchEnabledForPost, setWatchEnabledForPost] = useState(false);

  useEffect(() => {
    if (!canonicalKey) {
      debugPostDetails("Skipped fetch: canonicalKey missing");
      return;
    }
    let isMounted = true;
    const controller = new AbortController();

    const fetchDetails = async () => {
      setIsLoading(true);
      setErrorMessage("");
      debugPostDetails("Fetching details for canonicalKey:", canonicalKey);
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
          (
            response.status === 404 ||
            !response.ok ||
            !payload ||
            payload?.success === false
          );

        // Some deployments proxy /api/* to backend service, so this app route may not resolve in production.
        if (shouldTryUpstreamFallback) {
          debugPostDetails("Local route returned 404, retrying upstream:", upstreamFallbackEndpoint);
          response = await fetch(upstreamFallbackEndpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ canonicalKey }),
            signal: controller.signal,
            cache: "no-store",
          });
          payload = await response.json().catch(() => null);
        }

        debugPostDetails("Raw payload:", payload);
        debugPostDetails("Fetch status:", response.status, response.statusText);

        if (!response.ok || !payload || payload?.success === false) {
          const upstreamStatus = payload?.upstream?.status;
          const upstreamType = payload?.upstream?.contentType;
          const upstreamMeta = upstreamStatus
            ? ` (upstream ${upstreamStatus}${upstreamType ? `, ${upstreamType}` : ""})`
            : "";
          throw new Error(`${payload?.message || "Unable to load post details"}${upstreamMeta}`);
        }
        const normalized = normalizePostDetails(payload);
        debugPostDetails("Normalized details:", normalized);

        if (isMounted) setDetails(normalized);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[PostDetailsView] Fetch failed:", error);
          if (isMounted) setErrorMessage(error.message || "Unable to load post details");
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
    debugPostDetails("State details changed:", details);
  }, [details]);

  useEffect(() => {
    setWatchModalOpen(false);
    setPreviewImage(null);
    setWatchEmail("");
    setWatchSubmitting(false);
    setWatchFeedback({ type: "", text: "" });
  }, [canonicalKey]);

  const recruitment = details?.recruitment || {};
  const organization = recruitment.organization || {};
  const importantDates = recruitment.importantDates || {};
  const vacancyDetails = recruitment.vacancyDetails || {};
  const applicationFee = recruitment.applicationFee || {};
  const ageLimit = recruitment.ageLimit || {};
  const eligibility = recruitment.eligibility || {};
  const physicalStandards = recruitment.physicalStandards || {};
  const physicalEfficiencyTest = recruitment.physicalEfficiencyTest || {};
  const importantLinks = recruitment.importantLinks || {};
  const content = recruitment.content || {};

  const displayTitle = recruitment.title || details?.raw?.postTitle || details?.raw?.title || "Recruitment Details";
  const rawSectionTitle = String(
    details?.raw?.megaTitle || details?.raw?.megaSlug || recruitment?.megaTitle || "",
  ).trim();
  const sectionRoute = resolveSectionRoute(rawSectionTitle || "Latest Gov Jobs");
  const breadcrumbSectionLabel = sectionRoute.label || "Latest Gov Jobs";
  const breadcrumbSectionHref = buildSectionHref(sectionRoute.megaTitle);
  const breadcrumbTitle = recruitment.advertisementNumber || displayTitle;
  const postDateText = humanDate(importantDates.postDate || details?.raw?.postDate || details?.raw?.createdAt);
  const isClosedByDate = hasApplicationClosed(importantDates.applicationLastDate);
  const status = isClosedByDate ? { text: "Application Closed", className: "bg-red-100 text-red-700" } : statusClasses(recruitment.status);

  const shortSummary = content.originalSummary || recruitment.additionalInfo || "Details are available below. Check all sections carefully before applying.";
  const keyHighlights = toMeaningfulList(content.keyHighlights);
  const whoShouldApply = toMeaningfulList(content.whoShouldApply);
  const applicationSteps = toMeaningfulList(content.applicationSteps);
  const documentsChecklist = toMeaningfulList(content.documentsChecklist);
  const importantNotes = toMeaningfulList(content.importantNotes);
  const documentationList = toMeaningfulList(recruitment.documentation);
  const selectionProcessSummary = isMeaningfulValue(content.selectionProcessSummary) ? formatDisplayValue(content.selectionProcessSummary) : "";
  const feeSummary = isMeaningfulValue(content.feeSummary) ? formatDisplayValue(content.feeSummary) : "";
  const additionalInfo = isMeaningfulValue(recruitment.additionalInfo) ? formatDisplayValue(recruitment.additionalInfo) : "";

  const metadataRows = [
    { label: "Advertisement Number", value: recruitment.advertisementNumber },
    { label: "Organization Type", value: organization.type },
    {
      label: "Official Website",
      value: organization.website,
      url:
        isLikelyUrl(organization.website) && !shouldBlockExternalUrl(organization.website)
          ? String(organization.website).trim()
          : "",
    },
  ].filter((row) => {
    if (!isMeaningfulValue(row.value)) return false;
    if (isLikelyUrl(row.value) && shouldBlockExternalUrl(row.value)) return false;
    return true;
  });

  const knownDateKeySet = new Set(DATE_LABELS.map(([key]) => key));
  const dateRows = [
    ...DATE_LABELS.filter(([key]) => isMeaningfulValue(importantDates[key])).map(([key, label]) => ({ key, label, value: importantDates[key] })),
    ...Object.entries(importantDates)
      .filter(([key, value]) => !knownDateKeySet.has(key) && isMeaningfulValue(value))
      .map(([key, value]) => ({ key, label: humanLabel(key), value })),
  ];

  const knownFeeKeys = new Set([...FEE_LABELS.map(([key]) => key), "currency", "paymentMode", "exemptions", "other"]);
  const feeRows = [
    ...FEE_LABELS.filter(([key]) => hasValue(applicationFee[key])).map(([key, label]) => ({ key, label, value: applicationFee[key] })),
    ...Object.entries(applicationFee)
      .filter(([key, value]) => !knownFeeKeys.has(key) && isMeaningfulValue(value) && typeof value !== "object" && !Array.isArray(value))
      .map(([key, value]) => ({ key, label: humanLabel(key), value })),
  ];

  const feeOtherRows = rowsFromObject(applicationFee.other).map(([key, value]) => ({ key, label: humanLabel(key), value }));
  const paymentModes = toMeaningfulList(applicationFee.paymentMode);
  const feeExemptions = isMeaningfulValue(applicationFee.exemptions) ? formatDisplayValue(applicationFee.exemptions) : "";

  const positions = Array.isArray(vacancyDetails.positions) ? vacancyDetails.positions : [];
  const totalPosts = vacancyDetails.totalPosts ?? positions.reduce((sum, row) => sum + (Number(row?.numberOfPosts) || 0), 0);

  const categoryRows = [
    ...Object.entries(vacancyDetails.categoryWise || {})
      .filter(([key]) => key !== "other")
      .filter(([, value]) => isNonZeroMeaningfulValue(value))
      .map(([key, value]) => ({ key, label: humanLabel(key), value })),
    ...rowsFromObject(vacancyDetails.categoryWise?.other)
      .filter(([, value]) => isNonZeroMeaningfulValue(value))
      .map(([key, value]) => ({ key: `other-${key}`, label: humanLabel(key), value })),
  ];
  const districtRows = Array.isArray(vacancyDetails.districtWise)
    ? vacancyDetails.districtWise.filter((item) => item && typeof item === "object" && rowsFromObject(item).length > 0)
    : [];

  const ageRelaxationRows = [
    ...Object.entries(ageLimit.ageRelaxation || {})
      .filter(([key]) => key !== "other")
      .filter(([, value]) => isMeaningfulValue(value))
      .map(([key, value]) => ({ key, label: humanLabel(key), value })),
    ...rowsFromObject(ageLimit.ageRelaxation?.other).map(([key, value]) => ({ key: `other-${key}`, label: humanLabel(key), value })),
  ];

  const ageCategoryRows = Object.entries(ageLimit.categoryWise || {})
    .filter(([, value]) => value && typeof value === "object")
    .map(([key, value]) => ({
      key,
      label: humanLabel(key).toUpperCase(),
      male: value?.male,
      female: value?.female,
      extras: Object.entries(value)
        .filter(([inner]) => inner !== "male" && inner !== "female")
        .filter(([, innerValue]) => isNonZeroMeaningfulValue(innerValue))
        .map(([inner, innerValue]) => ({ label: humanLabel(inner), value: innerValue })),
    }))
    .filter(
      (row) =>
        isNonZeroMeaningfulValue(row.male) ||
        isNonZeroMeaningfulValue(row.female) ||
        row.extras.length > 0,
    );

  const eligibilityRows = [
    { key: "educationQualification", label: "Education Qualification", value: eligibility.educationQualification },
    { key: "streamRequired", label: "Stream Required", value: eligibility.streamRequired },
    { key: "minimumPercentage", label: "Minimum Percentage", value: eligibility.minimumPercentage },
    { key: "experienceRequired", label: "Experience Required", value: eligibility.experienceRequired },
  ].filter((row) => isMeaningfulValue(row.value));
  const specialRequirements = toMeaningfulList(eligibility.specialRequirements);

  const physicalRows = [
    { label: "Male", ...(physicalStandards.male || {}), petDistance: physicalEfficiencyTest.male?.distance, petDuration: physicalEfficiencyTest.male?.duration },
    { label: "Female", ...(physicalStandards.female || {}), petDistance: physicalEfficiencyTest.female?.distance, petDuration: physicalEfficiencyTest.female?.duration },
  ];
  const showPhysicalSection = physicalRows.some((row) => Object.entries(row).some(([key, value]) => key !== "label" && isMeaningfulValue(value)));
  const selectionProcess = toMeaningfulList(recruitment.selectionProcess);
  const faqList = Array.isArray(content.faq) ? content.faq.filter((item) => item && (isMeaningfulValue(item.q) || isMeaningfulValue(item.a))) : [];

  const defaultLinkClass = "border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100";
  const knownLinkKeys = new Set(Object.keys(LINK_CONFIG));
  const officialWebsiteFallback = String(importantLinks.officialWebsite || organization.website || "").trim();
  const sourceUrlFallback = String(recruitment.sourceUrl || details?.raw?.sourceUrl || "").trim();

  const fallbackUrlsForLink = (key) => {
    if (key === "officialWebsite") return [officialWebsiteFallback];
    return [officialWebsiteFallback, sourceUrlFallback];
  };

  const linkDisplayText = (rawText, resolvedUrl) => {
    if (resolvedUrl) return "";
    if (isGenericLinkText(rawText)) return "Direct URL not provided";
    return rawText || "Not available";
  };

  const shouldSkipHiddenLinkEntry = (rawText, resolvedUrl) =>
    !resolvedUrl && isLikelyUrl(rawText) && shouldBlockExternalUrl(rawText);

  const allLinkEntries = [
    ...Object.keys(LINK_CONFIG)
      .filter((key) => isMeaningfulValue(importantLinks[key]))
      .map((key) => {
        const cfg = LINK_CONFIG[key];
        const rawText = formatDisplayValue(importantLinks[key]);
        const resolvedUrl = resolveNavigableUrl(rawText, fallbackUrlsForLink(key));
        if (shouldSkipHiddenLinkEntry(rawText, resolvedUrl)) return null;
        return {
          key,
          label: cfg.label,
          value: linkDisplayText(rawText, resolvedUrl),
          url: resolvedUrl,
          icon: cfg.icon,
          className: cfg.className,
        };
      })
      .filter(Boolean),
    ...Object.entries(importantLinks)
      .filter(([key, value]) => key !== "other" && !knownLinkKeys.has(key) && isMeaningfulValue(value))
      .map(([key, value]) => {
        const rawText = formatDisplayValue(value);
        const resolvedUrl = resolveNavigableUrl(rawText, []);
        if (shouldSkipHiddenLinkEntry(rawText, resolvedUrl)) return null;
        return {
          key: `extra-${key}`,
          label: humanLabel(key),
          value: linkDisplayText(rawText, resolvedUrl),
          url: resolvedUrl,
          icon: Link2,
          className: defaultLinkClass,
        };
      })
      .filter(Boolean),
    ...Object.entries(importantLinks.other || {})
      .filter(([, value]) => isMeaningfulValue(value))
      .map(([key, value]) => {
        const rawText = formatDisplayValue(value);
        const resolvedUrl = resolveNavigableUrl(rawText, []);
        if (shouldSkipHiddenLinkEntry(rawText, resolvedUrl)) return null;
        return {
          key: `other-${key}`,
          label: humanLabel(key),
          value: linkDisplayText(rawText, resolvedUrl),
          url: resolvedUrl,
          icon: Link2,
          className: defaultLinkClass,
        };
      })
      .filter(Boolean),
  ];

  const clickableLinks = allLinkEntries.filter((item) => item?.url && !shouldHideLinkEntry(item));
  const hasGuidanceSection = Boolean(
    whoShouldApply.length || applicationSteps.length || importantNotes.length || selectionProcessSummary || feeSummary || additionalInfo,
  );
  const postDetailWatchId = normalizeObjectId(
    details?.raw?._id || details?.raw?.postDetailId || details?.raw?.postId || details?.raw?.id,
  );
  const megaPostWatchId = normalizeObjectId(details?.raw?.megaPostId);
  const canonicalWatchKey = String(
    details?.raw?.canonicalKey || details?.raw?.canonical || canonicalKey || "",
  ).trim();
  const megaSlugForWatch = String(details?.raw?.megaSlug || "").trim();
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

  const closePreviewImage = () => {
    setPreviewImage(null);
  };

  const handleImportantLinkClick = (item) => {
    const targetUrl = String(item?.url || "").trim();
    if (!targetUrl) return;

    if (isInlinePreviewImageUrl(targetUrl)) {
      setPreviewImage({
        label: item?.label || "Image Preview",
        url: targetUrl,
      });
      return;
    }

    if (isPdfUrl(targetUrl)) {
      void triggerPdfDownload(targetUrl);
      return;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

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

  if (!canonicalKey) return <EmptyCanonicalKey />;
  if (isLoading && !details) return <PostDetailsSkeleton />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-1 text-xs text-slate-600">
          <Link href="/" className="transition hover:text-indigo-600 hover:underline">
            Home
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
          <Link href={breadcrumbSectionHref} className="transition hover:text-indigo-600 hover:underline">
            {breadcrumbSectionLabel}
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" aria-hidden="true" />
          <span className="font-semibold text-slate-800">{breadcrumbTitle}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {errorMessage && !details && <ErrorState message={errorMessage} />}

        {details && (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className={`${SECTION_CARD_CLASS} border-t-4 border-indigo-600 p-6`}>
                <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${status.className}`}>
                    {status.text}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={openWatchModal}
                      disabled={!hasWatchTarget || watchEnabledForPost}
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-semibold transition disabled:cursor-not-allowed ${
                        watchEnabledForPost
                          ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
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
                      {watchEnabledForPost ? "Notification Enabled" : "Notify"}
                    </button>
                    <span className="text-xs text-slate-500">Posted: {postDateText}</span>
                  </div>
                </div>

                <h1 className="mb-2 text-2xl font-bold text-slate-900 md:text-3xl">{displayTitle}</h1>
                <p className="mb-4 font-medium text-slate-600">
                  {organization.name ? `${organization.name}${organization.shortName ? ` (${organization.shortName})` : ""}` : "Organization not specified"}
                </p>

                <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h3 className="mb-2 flex items-center text-sm font-semibold text-blue-800">
                    <Info className="mr-2 h-4 w-4" />
                    Short Information
                  </h3>
                  <p className="text-sm leading-relaxed text-slate-700">{shortSummary}</p>
                </div>

                {keyHighlights.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {keyHighlights.map((highlight, index) => (
                      <span key={`${highlight}-${index}`} className="rounded border border-slate-200 bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-700">
                        {highlight}
                      </span>
                    ))}
                  </div>
                )}

                {metadataRows.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 text-sm md:grid-cols-2">
                    {metadataRows.map((row) => (
                      <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        {(() => {
                          const displayValue = formatDisplayValue(row.value);
                          return (
                            <>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{row.label}</p>
                              {row.url ? (
                                <button
                                  type="button"
                                  onClick={() => handleImportantLinkClick({ label: row.label, url: row.url })}
                                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline"
                                >
                                  {displayValue}
                                  <ExternalLink className="h-3.5 w-3.5" />
                                </button>
                              ) : (
                                <p className="mt-1 text-sm font-semibold text-slate-700">{displayValue}</p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className={`${SECTION_CARD_CLASS} mb-0 h-full`}>
                  <div className={SECTION_HEADER_CLASS}>
                    <CalendarDays className="mr-2 h-4 w-4 text-indigo-500" />
                    Important Dates
                  </div>
                  <div className="p-4">
                    {dateRows.length === 0 && <p className="text-sm text-slate-500">No dates available.</p>}
                    {dateRows.length > 0 && (
                      <ul className="space-y-3 text-sm">
                        {dateRows.map((row) => (
                          <li key={row.key} className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">{row.label}</span>
                            <span className={row.key === "applicationLastDate" ? "font-bold text-red-600" : "font-medium text-slate-800"}>
                              {humanDate(row.value)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className={`${SECTION_CARD_CLASS} mb-0 h-full`}>
                  <div className={SECTION_HEADER_CLASS}>
                    <IndianRupee className="mr-2 h-4 w-4 text-emerald-500" />
                    Application Fee
                  </div>
                  <div className="p-4">
                    {feeRows.length === 0 && feeOtherRows.length === 0 && <p className="text-sm text-slate-500">Fee details not available.</p>}

                    {(feeRows.length > 0 || feeOtherRows.length > 0) && (
                      <ul className="space-y-3 text-sm">
                        {feeRows.map((row) => (
                          <li key={row.key} className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">{row.label}</span>
                            <span className="font-bold text-slate-800">{valueWithCurrency(row.value, applicationFee.currency || "INR")}</span>
                          </li>
                        ))}
                        {feeOtherRows.map((row) => (
                          <li key={row.key} className="flex items-center justify-between gap-3">
                            <span className="text-slate-500">{row.label}</span>
                            <span className="font-bold text-slate-800">{formatDisplayValue(row.value)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      <p>
                        <span className="font-semibold">Currency:</span>{" "}
                        {isMeaningfulValue(applicationFee.currency) ? formatDisplayValue(applicationFee.currency) : "INR"}
                      </p>
                      <p className="mt-1">
                        <span className="font-semibold">Payment Mode:</span> {paymentModes.length > 0 ? paymentModes.join(", ") : "Not specified"}
                      </p>
                      {feeExemptions && (
                        <p className="mt-1">
                          <span className="font-semibold">Exemptions:</span> {feeExemptions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className={SECTION_CARD_CLASS}>
                <div className={`${SECTION_HEADER_CLASS} justify-between`}>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-orange-500" />
                    Vacancy Details
                  </div>
                  <span className="rounded bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700">
                    Total: {hasValue(totalPosts) ? totalPosts : 0}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-slate-50 text-xs uppercase text-slate-500">
                      <tr>
                        <th className="px-6 py-3">Post Name</th>
                        <th className="px-6 py-3">Posts</th>
                        <th className="px-6 py-3">Category</th>
                        <th className="px-6 py-3">Area Type</th>
                        <th className="px-6 py-3">Discipline</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.length === 0 && (
                        <tr>
                          <td className="px-6 py-4 text-sm text-slate-500" colSpan={5}>
                            Vacancy positions not available.
                          </td>
                        </tr>
                      )}
                      {positions.map((pos, index) => (
                        <tr key={`${pos.postName || "post"}-${index}`} className={index % 2 === 0 ? "border-b bg-white" : "border-b bg-slate-50"}>
                          <td className="px-6 py-4 font-medium text-slate-800">{isMeaningfulValue(pos.postName) ? formatDisplayValue(pos.postName) : "Not specified"}</td>
                          <td className="px-6 py-4 font-bold text-indigo-600">{hasValue(pos.numberOfPosts) ? formatDisplayValue(pos.numberOfPosts) : "NA"}</td>
                          <td className="px-6 py-4 text-slate-700">{isMeaningfulValue(pos.category) ? formatDisplayValue(pos.category) : "NA"}</td>
                          <td className="px-6 py-4 text-slate-700">{isMeaningfulValue(pos.areaType) ? formatDisplayValue(pos.areaType) : "NA"}</td>
                          <td className="px-6 py-4 text-slate-700">{isMeaningfulValue(pos.discipline) ? formatDisplayValue(pos.discipline) : "NA"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {(categoryRows.length > 0 || districtRows.length > 0) && (
                  <div className="space-y-4 border-t border-slate-100 p-4">
                    {categoryRows.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Category Wise</p>
                        <div className="flex flex-wrap gap-2">
                          {categoryRows.map((row) => (
                            <span key={row.key} className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              {row.label}: {formatDisplayValue(row.value)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {districtRows.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">District Wise</p>
                        <div className="overflow-x-auto rounded-lg border border-slate-200">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                              <tr>
                                <th className="px-4 py-2">District</th>
                                <th className="px-4 py-2">Posts</th>
                              </tr>
                            </thead>
                            <tbody>
                              {districtRows.map((row, index) => (
                                <tr key={`district-${index}`} className={index % 2 === 0 ? "border-t bg-white" : "border-t bg-slate-50"}>
                                  <td className="px-4 py-2 text-slate-700">{isMeaningfulValue(row.districtName) ? formatDisplayValue(row.districtName) : "Not specified"}</td>
                                  <td className="px-4 py-2 font-semibold text-slate-800">{hasValue(row.numberOfPosts) ? formatDisplayValue(row.numberOfPosts) : "NA"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={SECTION_CARD_CLASS}>
                <div className={SECTION_HEADER_CLASS}>
                  <ClipboardCheck className="mr-2 h-4 w-4 text-teal-500" />
                  Eligibility & Standards
                </div>
                <div className="space-y-6 p-6">
                  <div>
                    <h4 className="mb-2 text-sm font-semibold text-slate-800">
                      Age Limit <span className="text-xs font-normal text-slate-500">(as on {isMeaningfulValue(ageLimit.asOn) ? formatDisplayValue(ageLimit.asOn) : "Not specified"})</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded border border-slate-100 bg-slate-50 p-3 text-center">
                        <span className="block text-xs text-slate-500">Minimum</span>
                        <span className="font-bold text-slate-800">{hasValue(ageLimit.minimumAge) ? `${formatDisplayValue(ageLimit.minimumAge)} Years` : "Not specified"}</span>
                      </div>
                      <div className="rounded border border-slate-100 bg-slate-50 p-3 text-center">
                        <span className="block text-xs text-slate-500">Maximum</span>
                        <span className="font-bold text-slate-800">{hasValue(ageLimit.maximumAge) ? `${formatDisplayValue(ageLimit.maximumAge)} Years` : "Not specified"}</span>
                      </div>
                    </div>
                  </div>

                  {ageRelaxationRows.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-800">Age Relaxation</h4>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {ageRelaxationRows.map((row) => (
                          <div key={row.key} className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                            <span className="text-slate-600">{row.label}</span>
                            <span className="font-semibold text-slate-800">{formatDisplayValue(row.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {ageCategoryRows.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-800">Category-wise Age Limit</h4>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-4 py-2">Category</th>
                              <th className="px-4 py-2">Male</th>
                              <th className="px-4 py-2">Female</th>
                              <th className="px-4 py-2">Other</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ageCategoryRows.map((row, index) => (
                              <tr key={row.key} className={index % 2 === 0 ? "border-t bg-white" : "border-t bg-slate-50"}>
                                <td className="px-4 py-2 font-semibold text-slate-700">{row.label}</td>
                                <td className="px-4 py-2 text-slate-700">{isNonZeroMeaningfulValue(row.male) ? formatDisplayValue(row.male) : "NA"}</td>
                                <td className="px-4 py-2 text-slate-700">{isNonZeroMeaningfulValue(row.female) ? formatDisplayValue(row.female) : "NA"}</td>
                                <td className="px-4 py-2 text-slate-700">
                                  {row.extras.length === 0 ? "NA" : row.extras.map((item) => `${item.label}: ${formatDisplayValue(item.value)}`).join(", ")}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {(eligibilityRows.length > 0 || specialRequirements.length > 0) && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-800">Eligibility</h4>
                      {eligibilityRows.length > 0 && (
                        <div className="space-y-2">
                          {eligibilityRows.map((row) => (
                            <div key={row.key} className="flex items-center justify-between rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm">
                              <span className="text-slate-600">{row.label}</span>
                              <span className="font-semibold text-slate-800">{formatDisplayValue(row.value)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {specialRequirements.length > 0 && (
                        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Special Requirements</p>
                          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {specialRequirements.map((item, index) => (
                              <li key={`${item}-${index}`}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {showPhysicalSection && (
                    <div>
                      <h4 className="mb-2 text-sm font-semibold text-slate-800">Physical Standards & PET</h4>
                      <div className="overflow-x-auto rounded-lg border border-slate-200">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                            <tr>
                              <th className="px-4 py-2">Category</th>
                              <th className="px-4 py-2">Height</th>
                              <th className="px-4 py-2">Chest</th>
                              <th className="px-4 py-2">Weight</th>
                              <th className="px-4 py-2">Eyesight</th>
                              <th className="px-4 py-2">PET Distance</th>
                              <th className="px-4 py-2">PET Duration</th>
                            </tr>
                          </thead>
                          <tbody>
                            {physicalRows.map((row, index) => (
                              <tr key={row.label} className={index % 2 === 0 ? "border-t bg-white" : "border-t bg-slate-50"}>
                                <td className="px-4 py-2 font-semibold text-slate-700">{row.label}</td>
                                <td className="px-4 py-2 text-slate-700">{isMeaningfulValue(row.height) ? formatDisplayValue(row.height) : "NA"}</td>
                                <td className="px-4 py-2 text-slate-700">{isMeaningfulValue(row.chest) ? formatDisplayValue(row.chest) : "NA"}</td>
                                <td className="px-4 py-2 text-slate-700">{isMeaningfulValue(row.weight) ? formatDisplayValue(row.weight) : "NA"}</td>
                                <td className="px-4 py-2 text-slate-700">{isMeaningfulValue(row.eyesight) ? formatDisplayValue(row.eyesight) : "NA"}</td>
                                <td className="px-4 py-2 text-slate-700">{isMeaningfulValue(row.petDistance) ? formatDisplayValue(row.petDistance) : "NA"}</td>
                                <td className="px-4 py-2 text-slate-700">{isMeaningfulValue(row.petDuration) ? formatDisplayValue(row.petDuration) : "NA"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={SECTION_CARD_CLASS}>
                <div className={SECTION_HEADER_CLASS}>
                  <CheckSquare className="mr-2 h-4 w-4 text-purple-500" />
                  Selection Process
                </div>
                <div className="p-6">
                  {selectionProcess.length === 0 && <p className="text-sm text-slate-500">Selection process not specified.</p>}
                  {selectionProcess.length > 0 && (
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {selectionProcess.map((step, index) => (
                        <div key={`${step}-${index}`} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-indigo-500 bg-white text-xs font-bold text-indigo-600">
                            {index + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {hasGuidanceSection && (
                <div className={SECTION_CARD_CLASS}>
                  <div className={SECTION_HEADER_CLASS}>
                    <Sparkles className="mr-2 h-4 w-4 text-amber-500" />
                    Detailed Guidance
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                    {whoShouldApply.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Who Should Apply</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                          {whoShouldApply.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {applicationSteps.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Application Steps</h4>
                        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
                          {applicationSteps.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {importantNotes.length > 0 && (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 md:col-span-2">
                        <h4 className="mb-2 text-sm font-semibold text-rose-700">Important Notes</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-rose-700">
                          {importantNotes.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectionProcessSummary && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Selection Process Summary</h4>
                        <p className="text-sm leading-relaxed text-slate-700">{selectionProcessSummary}</p>
                      </div>
                    )}

                    {feeSummary && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Fee Summary</h4>
                        <p className="text-sm leading-relaxed text-slate-700">{feeSummary}</p>
                      </div>
                    )}

                    {additionalInfo && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Additional Information</h4>
                        <p className="text-sm leading-relaxed text-slate-700">{additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(documentationList.length > 0 || documentsChecklist.length > 0) && (
                <div className={SECTION_CARD_CLASS}>
                  <div className={SECTION_HEADER_CLASS}>
                    <ShieldCheck className="mr-2 h-4 w-4 text-indigo-500" />
                    Documentation
                  </div>
                  <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
                    {documentationList.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Required Documents</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                          {documentationList.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {documentsChecklist.length > 0 && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                        <h4 className="mb-2 text-sm font-semibold text-slate-800">Checklist</h4>
                        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                          {documentsChecklist.map((item, index) => (
                            <li key={`${item}-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                <div className={`${SECTION_CARD_CLASS} border-t-4 border-emerald-500 shadow-lg`}>
                  <div className={`${SECTION_HEADER_CLASS} bg-emerald-50 text-emerald-800`}>
                    <Link2 className="mr-2 h-4 w-4" />
                    Important Links
                  </div>
                  <div className="space-y-3 p-4">
                    {clickableLinks.length === 0 && (
                      <p className="text-sm text-slate-500">No important links available.</p>
                    )}

                    {clickableLinks.map((item) => {
                      const Icon = item.icon || Link2;
                      const isAssetLink = isAttachmentUrl(item.url);
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => handleImportantLinkClick(item)}
                          className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-left text-sm font-medium transition ${item.className || defaultLinkClass}`}
                        >
                          <span>{item.label}</span>
                          {isAssetLink ? (
                            <span className="text-[11px] font-semibold uppercase tracking-wide">Open</span>
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </button>
                      );
                    })}

                  </div>
                </div>

                <div className={SECTION_CARD_CLASS}>
                  <div className={SECTION_HEADER_CLASS}>
                    <HelpCircle className="mr-2 h-4 w-4 text-blue-500" />
                    FAQ
                  </div>
                  <div className="divide-y divide-slate-100 p-4">
                    {faqList.length === 0 && <p className="text-sm text-slate-500">FAQ not available.</p>}
                    {faqList.map((faq, index) => (
                      <div key={`${faq.q || "q"}-${index}`} className="py-3">
                        <h5 className="mb-1 text-sm font-semibold text-slate-800">
                          <span className="mr-1 text-indigo-500">Q.</span>
                          {isMeaningfulValue(faq.q) ? formatDisplayValue(faq.q) : "Not specified"}
                        </h5>
                        <p className="ml-4 text-xs text-slate-600">{isMeaningfulValue(faq.a) ? formatDisplayValue(faq.a) : "Not specified"}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 p-6 text-center text-white">
                  <FileImage className="mx-auto mb-3 h-8 w-8 opacity-80" />
                  <h3 className="mb-1 font-bold">Need to Resize Photo?</h3>
                  <p className="mb-4 text-xs text-indigo-100">Resize your image to specific KB/Pixels for this form.</p>
                  <button type="button" className="w-full rounded-lg bg-white px-4 py-2 text-sm font-bold text-indigo-700 transition hover:bg-indigo-50">
                    Open Resizer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[92] flex items-center justify-center bg-slate-900/70 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePreviewImage();
          }}
        >
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-800">{previewImage.label || "Image Preview"}</h3>
              <button
                type="button"
                onClick={closePreviewImage}
                className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto bg-slate-100 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewImage.url}
                alt={previewImage.label || "Preview"}
                className="mx-auto h-auto max-h-[70vh] w-auto rounded-lg border border-slate-200 bg-white object-contain shadow-sm"
              />
            </div>
          </div>
        </div>
      )}

      {watchModalOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeWatchModal();
          }}
        >
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl">
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
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none"
                />
              </div>

              {watchFeedback.text && (
                <p
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    watchFeedback.type === "success"
                      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border border-red-200 bg-red-50 text-red-700"
                  }`}
                >
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
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
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
