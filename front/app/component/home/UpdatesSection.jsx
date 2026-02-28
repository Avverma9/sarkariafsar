import {
  BellRing,
  Briefcase,
  CheckCircle,
  ChevronRight,
  FileText,
  GraduationCap,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { updateBlocks as fallbackUpdateBlocks } from "./data";
import baseUrl from "../../lib/baseUrl";
import { buildCanonicalKey } from "../../lib/postFormatter";
import { buildPostDetailsHref } from "../../lib/postLink";
import UpdatesSectionSkeleton from "../skeletons/UpdatesSectionSkeleton";

const PAGE_SIZE = 10;

const blockIcons = {
  Briefcase,
  CheckCircle,
  FileText,
  GraduationCap,
};

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeCategory(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function toCanonicalCategory(value) {
  const normalized = normalizeCategory(value);

  if (
    [
      "latestjob",
      "latestjobs",
      "newjob",
      "newjobs",
      "new_jobs",
      "latest_form",
      "toponlineform",
      "hotjob",
    ].includes(normalized)
  ) {
    return "latest-jobs";
  }

  if (
    [
      "result",
      "results",
      "examresult",
      "latestresult",
      "answerkey",
      "answerkeys",
    ].includes(normalized)
  ) {
    return "results";
  }

  if (["admitcard", "admitcards"].includes(normalized)) {
    return "admit-cards";
  }

  if (["admission", "admissions"].includes(normalized)) {
    return "admissions";
  }

  return normalized;
}

function getThemeByCategory(category) {
  if (category === "latest-jobs") {
    return {
      icon: "Briefcase",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    };
  }

  if (category === "results") {
    return {
      icon: "CheckCircle",
      color: "text-rose-600",
      bg: "bg-rose-50",
      border: "border-rose-200",
    };
  }

  if (category === "admit-cards") {
    return {
      icon: "FileText",
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    };
  }

  if (category === "admissions") {
    return {
      icon: "GraduationCap",
      color: "text-purple-600",
      bg: "bg-purple-50",
      border: "border-purple-200",
    };
  }

  return {
    icon: "FileText",
    color: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
  };
}

function mapFallbackBlocks(blocks) {
  return blocks.map((block, index) => ({
    ...block,
    id: block.id || `fallback-${index + 1}`,
    title: block.title || block.id || `Section ${index + 1}`,
    categoryKey: toCanonicalCategory(block.id || block.title),
  }));
}

function mapSectionsToBlocks(sections) {
  return asArray(sections).map((section, index) => {
    const source = section || {};
    const canonical = toCanonicalCategory(source.key || source.name);
    const theme = getThemeByCategory(canonical);

    return {
      id: source.id || source.key || `section-${index + 1}`,
      key: source.key,
      title: source.name || source.key || `Section ${index + 1}`,
      categoryKey: canonical,
      ...theme,
    };
  });
}

async function fetchStoredJobLists() {
  const response = await fetch(`${baseUrl}/fetch-stored-joblist`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load jobs (${response.status})`);
  }

  const payload = await response.json();
  return asArray(payload?.jobLists);
}

function mapStoredJobsToItems(jobs, block) {
  return asArray(jobs).map((job, index) => {
    const canonicalId =
      job?.jobUrlHash ||
      (job?.jobUrl || job?.title
        ? buildCanonicalKey({ title: job?.title, jobUrl: job?.jobUrl })
        : `job-${index + 1}`);

    return {
      id: `${block.id}-${canonicalId}`,
      title: job?.title || "Untitled Job",
      jobUrl: job?.jobUrl || "",
      fetchedAt: job?.fetchedAt || "",
      lastDate: "LIVE UPDATE",
      _fromApi: true,
    };
  });
}

function paginateItems(items, page = 1) {
  const safeItems = asArray(items);
  const start = (page - 1) * PAGE_SIZE;
  return safeItems.slice(start, start + PAGE_SIZE);
}

function buildStoredJobListLookup(jobLists) {
  return asArray(jobLists).reduce((lookup, jobList) => {
    const source = jobList || {};
    const keys = [
      source.section,
      source.sectionName,
      toCanonicalCategory(source.section),
      toCanonicalCategory(source.sectionName),
    ].filter(Boolean);

    keys.forEach((key) => {
      lookup[String(key).toLowerCase()] = asArray(source.postList);
    });

    return lookup;
  }, {});
}

function getStoredJobsForBlock(block, jobLookup) {
  const canonical = toCanonicalCategory(block?.categoryKey || block?.key || block?.title);
  const candidates = [
    block?.key,
    block?.title,
    canonical,
    canonical === "latest-jobs" ? "new_jobs" : "",
    canonical === "admit-cards" ? "admit_cards" : "",
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  for (const candidate of candidates) {
    if (candidate in jobLookup) {
      return asArray(jobLookup[candidate]);
    }
  }

  return [];
}

function getItemMeta(item) {
  if (item?.lastDate) {
    return item.lastDate;
  }

  if (item?.jobUrl) {
    return "OPEN LINK";
  }

  return "";
}

export default function UpdatesSection({ filteredUpdates, onSelectItem }) {
  const router = useRouter();
  const fallbackBlocks = useMemo(() => mapFallbackBlocks(fallbackUpdateBlocks), []);
  const [sectionBlocks, setSectionBlocks] = useState(fallbackBlocks);
  const [jobsBySection, setJobsBySection] = useState({});
  const [loadingBySection, setLoadingBySection] = useState({});
  const [viewAllModal, setViewAllModal] = useState({ open: false, block: null });
  const [modalJobs, setModalJobs] = useState([]);
  const [modalPage, setModalPage] = useState(1);
  const [modalHasMore, setModalHasMore] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSearch, setModalSearch] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadModalJobs = useCallback(
    (block, page = 1) => {
      if (!block) {
        return;
      }

      setModalLoading(true);
      setModalError("");

      try {
        const apiItems = asArray(jobsBySection[block.id]);

        if (apiItems.length > 0) {
          const paginatedItems = paginateItems(apiItems, page);
          setModalJobs(paginatedItems);
          setModalPage(page);
          setModalHasMore(page * PAGE_SIZE < apiItems.length);
          return;
        }

        const blockCategory = toCanonicalCategory(
          block.categoryKey || block.key || block.id || block.title,
        );
        const allFallbackItems = filteredUpdates
          .filter((item) => toCanonicalCategory(item.category) === blockCategory)
          .map((item, index) => ({
            ...item,
            id: item.id || `${block.id}-fallback-${index + 1}`,
          }));
        const start = (page - 1) * PAGE_SIZE;
        const paginatedItems = allFallbackItems.slice(start, start + PAGE_SIZE);

        setModalJobs(paginatedItems);
        setModalPage(page);
        setModalHasMore(start + PAGE_SIZE < allFallbackItems.length);
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error(`Failed to prepare modal jobs for section: ${block.title}`, error);
        }
        setModalJobs([]);
        setModalHasMore(false);
        setModalError("Jobs load nahi ho paaye. Please retry.");
      } finally {
        setModalLoading(false);
      }
    },
    [filteredUpdates, jobsBySection],
  );

  const openViewAllModal = useCallback(
    (block) => {
      setViewAllModal({ open: true, block });
      setModalSearch("");
      loadModalJobs(block, 1);
    },
    [loadModalJobs],
  );

  const closeViewAllModal = useCallback(() => {
    setViewAllModal({ open: false, block: null });
    setModalJobs([]);
    setModalPage(1);
    setModalHasMore(false);
    setModalSearch("");
    setModalError("");
  }, []);

  const openPostDetailsPage = useCallback(
    (item, shouldCloseModal = false) => {
      if (!item?.jobUrl) {
        return;
      }

      if (shouldCloseModal) {
        closeViewAllModal();
      }

      const href = buildPostDetailsHref({
        title: item?.title,
        jobUrl: item?.jobUrl,
      });

      router.push(href);
    },
    [closeViewAllModal, router],
  );

  const filteredModalJobs = useMemo(() => {
    const normalizedQuery = modalSearch.trim().toLowerCase();

    if (!normalizedQuery) {
      return modalJobs;
    }

    return modalJobs.filter((item) =>
      String(item?.title || "")
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [modalJobs, modalSearch]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!viewAllModal.open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEsc = (event) => {
      if (event.key === "Escape") {
        closeViewAllModal();
      }
    };

    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEsc);
    };
  }, [viewAllModal.open, closeViewAllModal]);

  useEffect(() => {
    let active = true;

    async function loadSectionsAndJobs() {
      if (active) {
        setIsInitialLoading(true);
      }

      try {
        const sectionResponse = await fetch(`${baseUrl}/job-sections`, {
          method: "GET",
          cache: "no-store",
        });

        if (!sectionResponse.ok) {
          throw new Error(`Failed to load sections (${sectionResponse.status})`);
        }

        const sectionPayload = await sectionResponse.json();
        const mappedBlocks = mapSectionsToBlocks(sectionPayload?.sections);
        const blocks = mappedBlocks.length > 0 ? mappedBlocks : fallbackBlocks;
        const initialLoadingState = blocks.reduce((result, block) => {
          result[block.id] = true;
          return result;
        }, {});

        if (!active) {
          return;
        }

        setLoadingBySection(initialLoadingState);
        setSectionBlocks(blocks);

        const jobLists = await fetchStoredJobLists();
        const jobLookup = buildStoredJobListLookup(jobLists);
        const mappedJobs = blocks.reduce((result, block) => {
          result[block.id] = mapStoredJobsToItems(
            getStoredJobsForBlock(block, jobLookup),
            block,
          );
          return result;
        }, {});

        if (!active) {
          return;
        }

        setJobsBySection(mappedJobs);
        setLoadingBySection(
          blocks.reduce((result, block) => {
            result[block.id] = false;
            return result;
          }, {}),
        );
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error("Failed to fetch job sections:", error);
        }
        if (active) {
          setJobsBySection({});
          setLoadingBySection({});
        }
      } finally {
        if (active) {
          setIsInitialLoading(false);
        }
      }
    }

    loadSectionsAndJobs();

    return () => {
      active = false;
    };
  }, [fallbackBlocks]);

  if (isInitialLoading) {
    return <UpdatesSectionSkeleton />;
  }

  return (
    <div className="mb-14">
      <div className="mb-7 px-2">
        <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 md:text-3xl">
          <BellRing className="h-8 w-8 rounded-lg bg-indigo-100 p-1.5 text-indigo-600" />
          Latest Updates
        </h2>
        <p className="mt-1 font-medium text-slate-500">
          Naukri, Result aur Admission ki taza jankari
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {sectionBlocks.map((block) => {
          const blockCategory = toCanonicalCategory(
            block.categoryKey || block.key || block.id || block.title,
          );
          const fallbackItems = filteredUpdates
            .filter((item) => toCanonicalCategory(item.category) === blockCategory)
            .slice(0, PAGE_SIZE);
          const apiItems = jobsBySection[block.id];
          const items =
            Array.isArray(apiItems) && apiItems.length > 0
              ? apiItems.slice(0, PAGE_SIZE)
              : fallbackItems;
          const isLoading = Boolean(loadingBySection[block.id]);
          const Icon = blockIcons[block.icon] || FileText;

          return (
            <div
              key={block.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_10px_30px_-22px_rgba(15,23,42,0.5)] transition-all duration-300 hover:shadow-[0_14px_34px_-20px_rgba(15,23,42,0.35)]"
            >
              <div
                className={`flex items-center gap-2 border-b px-3.5 py-2.5 ${block.bg} ${block.border}`}
              >
                <div className={`rounded-lg bg-white p-1.5 shadow-sm ${block.color}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className={`text-[1.35rem] leading-none font-black ${block.color}`}>
                  {block.title}
                </h3>
              </div>

              <div
                className="h-[500px] flex-grow space-y-1 overflow-y-auto bg-slate-50/70 p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                style={{ scrollbarWidth: "none" }}
              >
                {isLoading && (!items || items.length === 0) ? (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                      <Search className="h-5 w-5 animate-pulse text-slate-300" />
                    </div>
                    <span className="text-sm font-semibold text-slate-400">
                      Loading 10 jobs...
                    </span>
                  </div>
                ) : items.length > 0 ? (
                  items.map((item) => {
                    const metaText = getItemMeta(item);

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item._fromApi && item.jobUrl) {
                            openPostDetailsPage(item, false);
                            return;
                          }

                          onSelectItem(item);
                        }}
                        className="group/item flex w-full items-start gap-2 rounded-lg border border-transparent bg-white/90 px-2.5 py-1.5 text-left transition-all hover:border-slate-200 hover:bg-white hover:shadow-sm"
                      >
                        <ChevronRight
                          className={`mt-0.5 h-4 w-4 flex-shrink-0 opacity-0 transition-all group-hover/item:translate-x-1 group-hover/item:opacity-100 ${block.color}`}
                        />
                        <div>
                          <p className="line-clamp-2 text-[0.92rem] leading-5 font-bold text-slate-800 transition-colors group-hover/item:text-indigo-600">
                            {item.title}
                          </p>
                          {metaText ? (
                            <p className="mt-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                              {metaText}
                            </p>
                          ) : null}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center gap-2 py-12 text-center">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100">
                      <Search className="h-5 w-5 text-slate-300" />
                    </div>
                    <span className="text-sm font-semibold text-slate-400">
                      No updates found
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-100 bg-white px-3.5 py-2.5 text-center">
                <button
                  onClick={() => openViewAllModal(block)}
                  disabled={isLoading}
                  className="text-xs font-bold text-slate-500 transition-colors hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? "Loading..." : "View All →"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {isMounted && viewAllModal.open
        ? createPortal(
            <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm sm:p-6">
              <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {viewAllModal.block?.title || "Updates"}
                    </h3>
                    <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                      Page {modalPage}
                    </p>
                  </div>
                  <button
                    onClick={closeViewAllModal}
                    className="rounded-full bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="border-b border-slate-100 px-5 py-3">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                    <Search className="h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      placeholder="Search jobs..."
                      className="w-full bg-transparent text-sm font-medium text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="flex-grow space-y-2 overflow-y-auto bg-slate-50/70 p-4">
                  {modalLoading ? (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                      <Search className="h-5 w-5 animate-pulse text-slate-300" />
                      <span className="text-sm font-semibold text-slate-400">
                        Loading jobs...
                      </span>
                    </div>
                  ) : modalError ? (
                    <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-600">
                      {modalError}
                    </div>
                  ) : filteredModalJobs.length > 0 ? (
                    filteredModalJobs.map((item) => {
                      const metaText = getItemMeta(item);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            if (item._fromApi && item.jobUrl) {
                              openPostDetailsPage(item, true);
                              return;
                            }

                            closeViewAllModal();
                            onSelectItem(item);
                          }}
                          className="flex w-full items-start gap-2 rounded-xl border border-transparent bg-white px-3 py-2 text-left transition-all hover:border-slate-200 hover:shadow-sm"
                        >
                          <ChevronRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <div>
                            <p className="text-sm leading-5 font-bold text-slate-800">
                              {item.title}
                            </p>
                            {metaText ? (
                              <p className="mt-0.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                {metaText}
                              </p>
                            ) : null}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-14 text-center">
                      <Search className="h-5 w-5 text-slate-300" />
                      <span className="text-sm font-semibold text-slate-400">
                        No jobs found for this search
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 bg-white px-5 py-3">
                  <button
                    onClick={() => {
                      if (modalPage <= 1 || !viewAllModal.block || modalLoading) {
                        return;
                      }

                      loadModalJobs(viewAllModal.block, modalPage - 1);
                    }}
                    disabled={modalPage <= 1 || modalLoading}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Page {modalPage}
                  </span>

                  <button
                    onClick={() => {
                      if (!modalHasMore || !viewAllModal.block || modalLoading) {
                        return;
                      }

                      loadModalJobs(viewAllModal.block, modalPage + 1);
                    }}
                    disabled={!modalHasMore || modalLoading}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
