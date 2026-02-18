import axios from "axios";
import * as cheerio from "cheerio";
import { Worker } from "node:worker_threads";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { AggregatorSite } from "../models/aggregator.model.mjs";
import MegaSection from "../models/megaSection.model.mjs";
import MegaPost from "../models/megaPost.model.mjs";
import logger from "../utils/logger.mjs";
import { buildDedupeKeys } from "../utils/dedupe.mjs";
import { scrapePostDetails } from "./postscrape.service.mjs";
import {
  acquireJobLock,
  releaseJobLock,
  renewJobLock,
} from "./jobLock.service.mjs";

/* ------------------ helpers ------------------ */

const clean = (t) =>
  String(t || "")
    .replace(/\s+/g, " ")
    .trim();

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";
const DEFAULT_MEGA_SYNC_INTERVAL_MINUTES = Math.max(
  1,
  Number(process.env.MEGA_SYNC_INTERVAL_MINUTES || 30),
);
const DEFAULT_MEGA_SYNC_POST_DELAY_MS = Math.max(
  0,
  Number(process.env.MEGA_SYNC_POST_DELAY_MS || 60000),
);
const DEFAULT_MEGA_SYNC_LOCK_TTL_MS = Math.max(
  60 * 1000,
  Number(process.env.MEGA_SYNC_LOCK_TTL_MS || 90 * 60 * 1000),
);
const MEGA_SYNC_LOCK_KEY = "mega-sync";
const WORKER_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../workers/megaSync.worker.mjs",
);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    timeout: 25000,
    maxRedirects: 5,
    headers: {
      "User-Agent": UA,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });
  return data;
}

/**
 * title ko normalize karke dedupe key banate hain
 * - year remove (2025/2026/2027)
 * - extra words remove
 * - symbols normalize
 */
export function canonicalizeTitleForDedupe(title) {
  let t = (title || "").toLowerCase();
  t = t.replace(/\b(20\d{2})\b/g, ""); // remove years
  t = t.replace(/[\[\]\(\)\{\}]/g, " ");
  t = t.replace(/[^a-z0-9\s]/g, " "); // remove punctuation
  t = t.replace(
    /\b(apply|online|download|notification|new|latest|recruitment|vacancy)\b/g,
    " ",
  );
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

/* ------------------ YOUR EXISTING SECTION SCRAPER ------------------ */
/* Tumhare scrapeSectionsFromSite(siteUrl) ko as-is rakho. */
/* yahan import karke use karenge. */
import { scrapeSectionsFromSite } from "./section.service.mjs";

/* ------------------ MEGA SECTION RULES ------------------ */

const MEGA = [
  {
    slug: "latest-gov-jobs",
    title: "Latest Gov Jobs",
    match: [
      /latest\s*job/i, // sarkariresult
      /hot\s*job/i, // sarkariexam
      /top\s*online\s*form/i, // sarkariexam
      /recruitments?/i, // rojgarresult
      /latest\s*form/i, // rojgarresult (year changes handled in posts not in section)
    ],
  },
  {
    slug: "admit-cards",
    title: "Admit Cards",
    match: [/admit\s*card/i],
  },
  {
    slug: "recent-results",
    title: "Recent Results",
    match: [/^result$/i, /exam\s*result/i, /latest\s*result/i],
  },
  {
    slug: "admission-form",
    title: "Admission Form",
    match: [/admission/i],
  },
  {
    slug: "answer-keys",
    title: "Answer Keys",
    match: [/answer\s*key/i],
  },
  {
    slug: "previous-year-paper",
    title: "Previous Year Paper",
    match: [], // manual
    manual: true,
  },
];

/**
 * Given site sections, map them into 5 mega sections (6th is manual)
 */
export function mapToMegaSections(sitesWithSections) {
  const megaMap = new Map();

  // init mega buckets
  for (const m of MEGA) {
    megaMap.set(m.slug, {
      slug: m.slug,
      title: m.title,
      manual: !!m.manual,
      sources: [],
    });
  }

  for (const siteObj of sitesWithSections) {
    const { siteId, name, url, sections } = siteObj;

    for (const sec of sections || []) {
      const secTitle = clean(sec.title);
      const secUrl = sec.url;

      // find mega match
      const matched = MEGA.find((m) =>
        (m.match || []).some((rgx) => rgx.test(secTitle)),
      );

      if (!matched) continue;
      if (matched.manual) continue;

      const bucket = megaMap.get(matched.slug);
      bucket.sources.push({
        siteId,
        siteName: name,
        siteUrl: url,
        sectionTitle: secTitle,
        sectionUrl: secUrl,
      });
    }
  }

  // ensure manual section exists
  const manualBucket = megaMap.get("previous-year-paper");
  manualBucket.sources = []; // no sources

  return Array.from(megaMap.values());
}

/* ------------------ POSTS SCRAPER (SECTION -> POST LIST) ------------------ */

/**
 * per-site better selectors (fallback included)
 * ye 3 sites mostly WP / custom structure use karte hain.
 */
const SELECTORS_BY_HOST = {
  "sarkariresult.com.cm": [
    ".post-title a",
    ".entry-title a",
    "h2 a",
    "h3 a",
    ".content a",
    "a",
  ],
  "sarkariexam.com": [
    ".entry-title a",
    "h2 a",
    "h3 a",
    "article a",
    ".content a",
    "a",
  ],
  "rojgarresult.com": [
    ".entry-title a",
    "h2 a",
    "h3 a",
    "article a",
    ".content a",
    "a",
  ],
};

function isJunkPostTitle(title) {
  const t = (title || "").toLowerCase();
  if (!t) return true;
  if (t.length < 10) return true;
  if (
    t.includes("privacy") ||
    t.includes("disclaimer") ||
    t.includes("contact")
  )
    return true;
  return false;
}

export async function scrapePostsFromSection(sectionUrl, siteBaseUrl) {
  const html = await fetchHTML(sectionUrl);
  const $ = cheerio.load(html);

  const baseHost = new URL(siteBaseUrl).hostname.replace("www.", "");
  const selectors = SELECTORS_BY_HOST[baseHost] || [
    "h2 a",
    "h3 a",
    "article a",
    "a",
  ];

  const items = [];
  const seen = new Set();

  for (const sel of selectors) {
    $(sel).each((_, a) => {
      const title = clean($(a).text());
      let href = $(a).attr("href");
      if (isJunkPostTitle(title) || !href) return;

      try {
        href = new URL(href, sectionUrl).toString();
      } catch {
        return;
      }

      // same domain only
      try {
        const host = new URL(href).hostname.replace("www.", "");
        if (host !== baseHost) return;
      } catch {
        return;
      }

      // de-dupe by url
      const key = href.replace(/\/+$/, "");
      if (seen.has(key)) return;
      seen.add(key);

      items.push({ title, postUrl: href });
    });

    // No hard cap: let all matched posts from selector pass.
  }

  return items;
}

/* ------------------ DB SYNC: MEGA SECTIONS + MEGA POSTS ------------------ */

export async function syncMegaSectionsAndPosts(options = {}) {
  const postDelayMs = Math.max(
    0,
    Number(options.postDelayMs ?? DEFAULT_MEGA_SYNC_POST_DELAY_MS),
  );
  const sites = await AggregatorSite.find({ status: "active" }).lean();
  if (!sites.length) {
    return { megaSaved: 0, postsInserted: 0, report: [] };
  }

  const results = await Promise.allSettled(
    sites.map(async (s) => {
      const sections = await scrapeSectionsFromSite(s.url);
      return { siteId: s._id, name: s.name, url: s.url, sections };
    }),
  );

  const sitesWithSections = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      sitesWithSections.push(r.value);
    } else {
      logger.error(`Section scrape failed: ${r.reason?.message || r.reason}`);
    }
  }

  const megaSections = mapToMegaSections(sitesWithSections);

  let megaSaved = 0;
  for (const m of megaSections) {
    await MegaSection.updateOne(
      { slug: m.slug },
      {
        $set: {
          title: m.title,
          sources: m.sources,
          isManual: m.manual,
        },
      },
      { upsert: true },
    );
    megaSaved++;
  }

  let postsInserted = 0;
  const report = [];

  for (const m of megaSections) {
    if (m.manual) {
      report.push({
        mega: m.title,
        slug: m.slug,
        sources: 0,
        inserted: 0,
        note: "manual section",
      });
      continue;
    }

    let insertedInMega = 0;

    for (const src of m.sources) {
      let insertedForThisSource = 0;

      try {
        const posts = await scrapePostsFromSection(src.sectionUrl, src.siteUrl);

        for (const p of posts) {
          const { canonicalKey, altKeys } = buildDedupeKeys(p.title, p.postUrl);
          if (!canonicalKey) continue;

          const matchOr = [
            { canonicalKey },
            ...(altKeys.idKey ? [{ altIdKey: altKeys.idKey }] : []),
            ...(altKeys.tokenKey ? [{ altTokenKey: altKeys.tokenKey }] : []),
            ...(altKeys.urlKey ? [{ altUrlKey: altKeys.urlKey }] : []),
          ];

          let existing = await MegaPost.findOne({
            megaSlug: m.slug,
            $or: matchOr,
          })
            .select("_id megaSlug canonicalKey originalUrl contentHtml contentText")
            .lean();

          // If post moved across section/slugs, keep same document identity by URL/id fallback.
          if (!existing && altKeys.urlKey) {
            existing = await MegaPost.findOne({ altUrlKey: altKeys.urlKey })
              .sort({ updatedAt: -1 })
              .select("_id megaSlug canonicalKey originalUrl contentHtml contentText")
              .lean();
          }
          if (!existing && altKeys.idKey) {
            const idFallbackOr = [{ megaTitle: m.title }];
            if (src.siteId) idFallbackOr.push({ sourceSiteId: src.siteId });
            existing = await MegaPost.findOne({
              altIdKey: altKeys.idKey,
              $or: idFallbackOr,
            })
              .sort({ updatedAt: -1 })
              .select("_id megaSlug canonicalKey originalUrl contentHtml contentText")
              .lean();
          }

          if (existing) {
            const currentUrl = String(existing.originalUrl || "").trim().replace(/\/+$/, "");
            const nextUrl = String(p.postUrl || "").trim().replace(/\/+$/, "");
            const metadataChanged =
              String(existing.megaSlug || "") !== String(m.slug || "") ||
              String(existing.canonicalKey || "") !== String(canonicalKey || "") ||
              currentUrl !== nextUrl;
            const contentMissing =
              !String(existing.contentHtml || "").trim() &&
              !String(existing.contentText || "").trim();

            let refreshedHtml = "";
            let refreshedText = "";
            let refreshedContent = false;
            if (metadataChanged || contentMissing) {
              try {
                const raw = await scrapePostDetails(p.postUrl);
                refreshedHtml = String(raw?.contentHtml || "").trim();
                refreshedText = String(raw?.contentText || "").trim();
                refreshedContent = !!(refreshedHtml || refreshedText);
              } catch (err) {
                logger.warn(
                  `Existing post refresh failed (${m.slug} / ${src.siteName}): ${p.postUrl} :: ${err.message}`,
                );
              } finally {
                if (postDelayMs > 0) {
                  await sleep(postDelayMs);
                }
              }
            }

            const setFields = {
              megaSlug: m.slug,
              megaTitle: m.title,
              title: p.title,
              canonicalKey,
              originalUrl: p.postUrl,
              altIdKey: altKeys.idKey || "",
              altTokenKey: altKeys.tokenKey || "",
              altUrlKey: altKeys.urlKey || "",
              sourceSiteId: src.siteId,
              sourceSiteName: src.siteName,
              sourceSectionUrl: src.sectionUrl,
            };
            if (refreshedContent) {
              setFields.contentHtml = refreshedHtml;
              setFields.contentText = refreshedText;
              setFields.aiScraped = false;
              setFields.aiScrapedAt = null;
              setFields.lastEventProcessedAt = null;
            }

            try {
              await MegaPost.updateOne({ _id: existing._id }, { $set: setFields });
            } catch (err) {
              if (err?.code === 11000) {
                logger.warn(
                  `Duplicate-key while refreshing existing MegaPost ${existing._id}; skipped merge for ${p.postUrl}`,
                );
              } else {
                throw err;
              }
            }
            continue;
          }

          let contentHtml = "";
          let contentText = "";
          try {
            const raw = await scrapePostDetails(p.postUrl);
            contentHtml = String(raw?.contentHtml || "").trim();
            contentText = String(raw?.contentText || "").trim();
            if (postDelayMs > 0) {
              await sleep(postDelayMs);
            }
          } catch (err) {
            logger.warn(
              `Post details scrape failed (${m.slug} / ${src.siteName}): ${p.postUrl} :: ${err.message}`,
            );
            if (postDelayMs > 0) {
              await sleep(postDelayMs);
            }
          }

          await MegaPost.updateOne(
            { megaSlug: m.slug, canonicalKey },
            {
              $setOnInsert: {
                megaSlug: m.slug,
                megaTitle: m.title,
                title: p.title,
                canonicalKey,
                originalUrl: p.postUrl,
                altIdKey: altKeys.idKey || "",
                altTokenKey: altKeys.tokenKey || "",
                altUrlKey: altKeys.urlKey || "",
                sourceSiteId: src.siteId,
                sourceSiteName: src.siteName,
                sourceSectionUrl: src.sectionUrl,
                contentHtml,
                contentText,
                aiScraped: false,
              },
            },
            { upsert: true },
          );

          insertedForThisSource++;
        }

        insertedInMega += insertedForThisSource;

        report.push({
          mega: m.title,
          slug: m.slug,
          site: src.siteName,
          section: src.sectionTitle,
          sectionUrl: src.sectionUrl,
          inserted: insertedForThisSource,
        });
      } catch (err) {
        logger.error(`Post scrape failed (${m.slug} / ${src.siteName}): ${err.message}`);
      }
    }

    postsInserted += insertedInMega;
  }

  await AggregatorSite.updateMany(
    { status: "active" },
    { $set: { lastChecked: new Date() } },
  );

  return { megaSaved, postsInserted, report };
}

let megaSyncSchedulerTask = null;
let megaSyncWorker = null;
let megaSyncLockOwner = "";
let megaSyncHeartbeatTimer = null;
let megaSyncIntervalTimer = null;

function stopMegaSyncHeartbeat() {
  if (megaSyncHeartbeatTimer) {
    clearInterval(megaSyncHeartbeatTimer);
    megaSyncHeartbeatTimer = null;
  }
}

function startMegaSyncHeartbeat() {
  stopMegaSyncHeartbeat();
  megaSyncHeartbeatTimer = setInterval(async () => {
    if (!megaSyncLockOwner) return;
    try {
      await renewJobLock({
        key: MEGA_SYNC_LOCK_KEY,
        owner: megaSyncLockOwner,
        ttlMs: DEFAULT_MEGA_SYNC_LOCK_TTL_MS,
      });
    } catch (err) {
      logger.warn(`Mega sync lock renew failed: ${err.message}`);
    }
  }, 60 * 1000);
}

export async function triggerMegaSyncRun(options = {}) {
  const postDelayMs = Math.max(
    0,
    Number(options.postDelayMs ?? DEFAULT_MEGA_SYNC_POST_DELAY_MS),
  );
  const reason = String(options.reason || "manual");

  if (megaSyncWorker) {
    return { accepted: false, reason: "already-running-local" };
  }

  const owner = `pid:${process.pid}:${Date.now()}`;
  const lockResult = await acquireJobLock({
    key: MEGA_SYNC_LOCK_KEY,
    owner,
    ttlMs: DEFAULT_MEGA_SYNC_LOCK_TTL_MS,
  });

  if (!lockResult.acquired) {
    return { accepted: false, reason: "already-running-distributed" };
  }

  megaSyncLockOwner = owner;

  const worker = new Worker(WORKER_PATH, {
    workerData: { postDelayMs, reason },
  });
  megaSyncWorker = worker;
  startMegaSyncHeartbeat();

  worker.on("message", (msg) => {
    if (msg?.ok) {
      logger.info(
        `Mega sync worker completed. reason=${reason}, megaSaved=${msg.result?.megaSaved || 0}, postsInserted=${msg.result?.postsInserted || 0}`,
      );
      return;
    }
    logger.error(`Mega sync worker failed: ${msg?.error || "unknown error"}`);
  });

  worker.on("error", (err) => {
    logger.error(`Mega sync worker crashed: ${err.message}`);
  });

  worker.on("exit", async () => {
    megaSyncWorker = null;
    stopMegaSyncHeartbeat();
    if (megaSyncLockOwner) {
      await releaseJobLock({
        key: MEGA_SYNC_LOCK_KEY,
        owner: megaSyncLockOwner,
      });
      megaSyncLockOwner = "";
    }
  });

  return {
    accepted: true,
    reason,
    workerThreadId: worker.threadId,
  };
}

export function startMegaSyncScheduler() {
  const enabled = String(process.env.MEGA_SYNC_SCHEDULER_ENABLED || "true")
    .trim()
    .toLowerCase();

  if (enabled === "false" || enabled === "0") {
    logger.info("Mega sync scheduler is disabled by env");
    return null;
  }

  if (megaSyncSchedulerTask) {
    return megaSyncSchedulerTask;
  }

  const runSweep = async () => {
    try {
      const result = await triggerMegaSyncRun({
        postDelayMs: DEFAULT_MEGA_SYNC_POST_DELAY_MS,
        reason: "scheduler",
      });
      if (!result.accepted) {
        logger.info(`Mega sync scheduler skipped: ${result.reason}`);
      }
    } catch (err) {
      logger.error(`Mega sync sweep failed: ${err.message}`);
    }
  };

  const intervalMs = DEFAULT_MEGA_SYNC_INTERVAL_MINUTES * 60 * 1000;
  megaSyncIntervalTimer = setInterval(() => {
    runSweep().catch((err) => logger.error(`Mega sync interval run failed: ${err.message}`));
  }, intervalMs);
  megaSyncSchedulerTask = {
    stop: () => {
      if (megaSyncIntervalTimer) {
        clearInterval(megaSyncIntervalTimer);
        megaSyncIntervalTimer = null;
      }
      megaSyncSchedulerTask = null;
    },
  };

  logger.info(
    `Mega sync scheduler started. every=${DEFAULT_MEGA_SYNC_INTERVAL_MINUTES}m, postDelayMs=${DEFAULT_MEGA_SYNC_POST_DELAY_MS}`,
  );

  runSweep().catch((err) => logger.error(`Initial mega sync sweep failed: ${err.message}`));
  return megaSyncSchedulerTask;
}
