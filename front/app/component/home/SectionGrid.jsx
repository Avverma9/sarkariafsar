"use client";

import {
  BriefcaseBusiness,
  FileKey2,
  FileSearch,
  GraduationCap,
  GripVertical,
  IdCard,
  Search,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { normalizeSectionsData } from "@/app/lib/sections";

const STYLE_VARIANTS = [
  {
    icon: Trophy,
    headerBg: "bg-rose-50/80",
    headerBorder: "border-rose-100",
    headerText: "text-rose-700",
    iconText: "text-rose-500",
    linkText: "text-rose-600",
    hoverText: "hover:text-rose-600",
  },
  {
    icon: IdCard,
    headerBg: "bg-blue-50/80",
    headerBorder: "border-blue-100",
    headerText: "text-blue-700",
    iconText: "text-blue-500",
    linkText: "text-blue-600",
    hoverText: "hover:text-blue-600",
  },
  {
    icon: BriefcaseBusiness,
    headerBg: "bg-emerald-50/80",
    headerBorder: "border-emerald-100",
    headerText: "text-emerald-700",
    iconText: "text-emerald-500",
    linkText: "text-emerald-600",
    hoverText: "hover:text-emerald-600",
  },
  {
    icon: GraduationCap,
    headerBg: "bg-violet-50/80",
    headerBorder: "border-violet-100",
    headerText: "text-violet-700",
    iconText: "text-violet-500",
    linkText: "text-violet-600",
    hoverText: "hover:text-violet-600",
  },
  {
    icon: FileKey2,
    headerBg: "bg-cyan-50/80",
    headerBorder: "border-cyan-100",
    headerText: "text-cyan-700",
    iconText: "text-cyan-500",
    linkText: "text-cyan-600",
    hoverText: "hover:text-cyan-600",
  },
  {
    icon: FileSearch,
    headerBg: "bg-amber-50/80",
    headerBorder: "border-amber-100",
    headerText: "text-amber-700",
    iconText: "text-amber-500",
    linkText: "text-amber-600",
    hoverText: "hover:text-amber-600",
  },
];

const INITIAL_VISIBLE_ITEMS = 12;
const ORDER_STORAGE_KEY = "section-grid-order-v1";
const TOUCH_HOLD_MS = 280;
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});
const HIDDEN_POST_TITLES = new Set([
  "lets update",
  "answer key",
  "admit card",
  "latest job",
  "sarkari result",
  "skip to content",
]);

function formatPostDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor((today.getTime() - target.getTime()) / 86400000);

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return dateFormatter.format(date);
}

function normalizeTitle(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function normalizeSectionLabel(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isPreviousYearPaperSection(value) {
  const normalized = normalizeSectionLabel(value);
  return normalized.includes("previous year") && normalized.includes("paper");
}

function getPostDisplayTitle(post) {
  const postName = String(post?.postName || "").trim();
  if (postName) return postName;
  const title = String(post?.title || "").trim();
  if (title) return title;
  return "Untitled Post";
}

function toSafeHttpUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return "";
    return parsed.toString();
  } catch {
    return "";
  }
}

function resolvePreviousPaperUrl(post, sectionTitle) {
  if (!isPreviousYearPaperSection(sectionTitle)) return "";
  return toSafeHttpUrl(post?.url || post?.sourceUrl);
}

function isHiddenPostTitle(title) {
  return HIDDEN_POST_TITLES.has(normalizeTitle(title));
}

function reorderCards(list, sourceId, targetId) {
  if (!sourceId || !targetId || sourceId === targetId) return list;

  const sourceIndex = list.findIndex((card) => card.id === sourceId);
  const targetIndex = list.findIndex((card) => card.id === targetId);

  if (sourceIndex < 0 || targetIndex < 0) return list;

  const next = [...list];
  const [moved] = next.splice(sourceIndex, 1);
  next.splice(targetIndex, 0, moved);
  return next;
}

function parseSavedOrderRaw(raw) {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
}

function subscribeSavedOrder(callback) {
  if (typeof window === "undefined") return () => {};
  const onStorage = (event) => {
    if (event.key === ORDER_STORAGE_KEY) callback();
  };
  window.addEventListener("storage", onStorage);
  return () => window.removeEventListener("storage", onStorage);
}

function getSavedOrderSnapshot() {
  if (typeof window === "undefined") return "[]";
  return window.localStorage.getItem(ORDER_STORAGE_KEY) || "[]";
}

function getSavedOrderServerSnapshot() {
  return "[]";
}

function applySavedOrder(cards, savedOrder) {
  if (!Array.isArray(savedOrder) || savedOrder.length === 0) return cards;

  const byId = new Map(cards.map((card) => [card.id, card]));
  const ordered = savedOrder.map((id) => byId.get(id)).filter(Boolean);
  const remaining = cards.filter((card) => !savedOrder.includes(card.id));
  return [...ordered, ...remaining];
}

function mapSectionsToCards(sections, postsByMegaTitle) {
  return sections.map((section, index) => {
    const variant = STYLE_VARIANTS[index % STYLE_VARIANTS.length];
    const megaTitle = String(section?.megaTitle || section?.title || "").trim();
    const displayTitle = String(section?.title || section?.megaTitle || section?.slug || "Section").trim();
    const rawPosts = Array.isArray(postsByMegaTitle[megaTitle]) ? postsByMegaTitle[megaTitle] : [];
    const posts = rawPosts
      .map((post) => {
        const title = getPostDisplayTitle(post);
        return {
          ...post,
          title,
          externalUrl: resolvePreviousPaperUrl(post, megaTitle || displayTitle),
        };
      })
      .filter((post) => !isHiddenPostTitle(post.title));

    return {
      id: String(section?._id || section?.slug || megaTitle || index),
      megaTitle,
      title: displayTitle || "Section",
      items: posts,
      initialItems: posts.slice(0, INITIAL_VISIBLE_ITEMS),
      ...variant,
    };
  });
}

function SectionModal({ section, onClose }) {
  const [query, setQuery] = useState("");

  if (!section) return null;

  const normalizedQuery = query.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? section.items.filter((item) => String(item.title || "").toLowerCase().includes(normalizedQuery))
    : section.items;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/55 p-4" onClick={onClose}>
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b p-4 ${section.headerBg} ${section.headerBorder}`}>
          <h3 className={`text-lg font-bold ${section.headerText}`}>{section.title}</h3>
          <button
            type="button"
            className="rounded-md bg-white/80 p-1.5 text-slate-700 transition hover:bg-white"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-white px-4 py-3">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search posts in this section..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-500 focus:border-indigo-400 focus:bg-white focus:outline-none"
            />
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Showing {filteredItems.length} of {section.items.length}
          </p>
        </div>

        <div className="max-h-[70vh] overflow-y-auto">
          {section.items.length === 0 && <p className="p-4 text-sm text-slate-500">No posts found.</p>}
          {section.items.length > 0 && filteredItems.length === 0 && (
            <p className="p-4 text-sm text-slate-500">
              No posts match <span className="font-medium text-slate-700">{query.trim()}</span>.
            </p>
          )}
          {filteredItems.map((item) => {
            const canonicalKey = String(item.canonicalKey || "").trim();
            const externalUrl = String(item.externalUrl || "").trim();
            const row = (
              <>
                <h4 className={`min-w-0 flex-1 text-sm font-medium text-slate-700 ${section.hoverText}`}>
                  {item.title}
                </h4>
                {item.postDate && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                    {formatPostDate(item.postDate)}
                  </span>
                )}
              </>
            );

            if (externalUrl) {
              return (
                <a
                  key={`${section.id}-${item.canonicalKey || item.title}`}
                  href={externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50"
                >
                  {row}
                </a>
              );
            }

            if (!canonicalKey) {
              return (
                <div
                  key={`${section.id}-${item.canonicalKey || item.title}`}
                  className="flex items-start justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50"
                >
                  {row}
                </div>
              );
            }

            return (
              <Link
                key={`${section.id}-${item.canonicalKey || item.title}`}
                href={`/post/${encodeURIComponent(canonicalKey)}`}
                className="flex items-start justify-between gap-3 border-b border-slate-100 p-3 last:border-b-0 hover:bg-slate-50"
              >
                {row}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function SectionGrid({ initialSections = [], initialPostsByMegaTitle = {} }) {
  const normalizedSections = useMemo(
    () => normalizeSectionsData(initialSections),
    [initialSections],
  );
  const initialCards = useMemo(
    () => mapSectionsToCards(normalizedSections, initialPostsByMegaTitle),
    [normalizedSections, initialPostsByMegaTitle],
  );
  const savedOrder = useSyncExternalStore(
    subscribeSavedOrder,
    getSavedOrderSnapshot,
    getSavedOrderServerSnapshot,
  );
  const parsedSavedOrder = useMemo(() => parseSavedOrderRaw(savedOrder), [savedOrder]);
  const [manualOrderIds, setManualOrderIds] = useState([]);
  const [activeSectionId, setActiveSectionId] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const touchHoldTimerRef = useRef(null);
  const lastTouchTargetIdRef = useRef("");
  const orderIds = manualOrderIds.length > 0 ? manualOrderIds : parsedSavedOrder;
  const cards = useMemo(() => applySavedOrder(initialCards, orderIds), [initialCards, orderIds]);

  const clearTouchHold = () => {
    if (touchHoldTimerRef.current) {
      clearTimeout(touchHoldTimerRef.current);
      touchHoldTimerRef.current = null;
    }
  };

  const updateOrder = (sourceId, targetId) => {
    setManualOrderIds((prevOrder) => {
      const baseOrder = prevOrder.length > 0 ? prevOrder : savedOrder;
      const baseCards = applySavedOrder(initialCards, baseOrder);
      const nextCards = reorderCards(baseCards, sourceId, targetId);
      const nextOrder = nextCards.map((card) => card.id);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(nextOrder));
      }
      return nextOrder;
    });
  };

  const handleDragStart = (event, sourceId) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", sourceId);
    setDraggingId(sourceId);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const handleDrop = (event, targetId) => {
    event.preventDefault();
    const sourceId = event.dataTransfer.getData("text/plain") || draggingId;
    if (!sourceId) return;
    updateOrder(sourceId, targetId);
    setDraggingId("");
  };

  const handleDragEnd = () => {
    setDraggingId("");
  };

  const handleTouchStart = (sourceId) => {
    clearTouchHold();
    touchHoldTimerRef.current = setTimeout(() => {
      setDraggingId(sourceId);
      lastTouchTargetIdRef.current = sourceId;
    }, TOUCH_HOLD_MS);
  };

  const handleTouchMove = (event) => {
    if (!draggingId) return;
    event.preventDefault();
    const touch = event.touches?.[0];
    if (!touch) return;

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const targetCard = element?.closest("[data-section-card-id]");
    const targetId = targetCard?.getAttribute("data-section-card-id");

    if (!targetId || targetId === draggingId || targetId === lastTouchTargetIdRef.current) {
      return;
    }

    lastTouchTargetIdRef.current = targetId;
    updateOrder(draggingId, targetId);
  };

  const handleTouchEnd = () => {
    clearTouchHold();
    setDraggingId("");
    lastTouchTargetIdRef.current = "";
  };

  useEffect(() => {
    return () => {
      clearTouchHold();
    };
  }, []);

  const activeSection = cards.find((card) => card.id === activeSectionId) || null;

  if (cards.length === 0) {
    return (
      <section className="py-10">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-sm">
          No sections available right now.
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="py-10">
        <div className="section-grid-list grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 2xl:grid-cols-3">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.id}
                data-section-card-id={card.id}
                className={`section-grid-card flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  draggingId === card.id ? "ring-2 ring-indigo-300" : ""
                }`}
                onDragOver={handleDragOver}
                onDrop={(event) => handleDrop(event, card.id)}
              >
                <div
                  className={`flex items-center justify-between border-b px-4 py-3 ${card.headerBg} ${card.headerBorder}`}
                >
                  <h3 className={`flex items-center text-[15px] font-bold ${card.headerText}`}>
                    <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-md bg-white/80">
                      <Icon className={`h-4 w-4 ${card.iconText}`} aria-hidden="true" />
                    </span>
                    {card.title}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition hover:bg-white/80 hover:underline ${card.linkText}`}
                      onClick={() => setActiveSectionId(card.id)}
                    >
                      View All
                    </button>
                    <button
                      type="button"
                      aria-label="Hold and drag to reorder"
                      title="Hold and drag to reorder"
                      className="cursor-grab rounded-md p-1.5 text-slate-500 transition hover:bg-white/80 hover:text-slate-700 active:cursor-grabbing"
                      draggable
                      onDragStart={(event) => handleDragStart(event, card.id)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={() => handleTouchStart(card.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      onTouchCancel={handleTouchEnd}
                    >
                      <GripVertical className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {card.initialItems.length === 0 && <p className="p-4 text-sm text-slate-500">No posts found.</p>}
                  {card.initialItems.map((item) => {
                    const canonicalKey = String(item.canonicalKey || "").trim();
                    const externalUrl = String(item.externalUrl || "").trim();
                    const row = (
                      <>
                        <h4 className={`min-w-0 flex-1 text-sm font-medium text-slate-700 ${card.hoverText}`}>
                          {item.title}
                        </h4>
                        {item.postDate && (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                            {formatPostDate(item.postDate)}
                          </span>
                        )}
                      </>
                    );

                    if (externalUrl) {
                      return (
                        <a
                          key={`${card.id}-${item.canonicalKey || item.title}`}
                          href={externalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
                        >
                          {row}
                        </a>
                      );
                    }

                    if (!canonicalKey) {
                      return (
                        <div
                          key={`${card.id}-${item.canonicalKey || item.title}`}
                          className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
                        >
                          {row}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={`${card.id}-${item.canonicalKey || item.title}`}
                        href={`/post/${encodeURIComponent(canonicalKey)}`}
                        className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-slate-50"
                      >
                        {row}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <SectionModal
        key={activeSection ? activeSection.id : "no-section"}
        section={activeSection}
        onClose={() => setActiveSectionId("")}
      />
    </>
  );
}
