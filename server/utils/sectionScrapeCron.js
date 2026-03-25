const cron = require("node-cron");

const JobSection = require("../models/postsection");
const { scrapePostsBySectionCanonicalUrl } = require("../scrapper/fetchAllBySection");

function cleanText(value = "") {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function runSectionScrapeCycle() {
  const startedAt = new Date();
  const summary = {
    startedAt,
    finishedAt: null,
    processedSections: 0,
    totalSections: 0,
    totalPosts: 0,
    created: 0,
    updated: 0,
    patched: 0,
    failedPosts: 0,
    failedSections: 0,
    sections: [],
  };

  const sections = await JobSection.find({ status: "active" })
    .sort({ createdAt: 1, name: 1 });

  summary.totalSections = sections.length;

  for (const section of sections) {
    const sectionResult = {
      canonicalUrl: section.canonicalUrl,
      name: section.name,
      totalPosts: 0,
      created: 0,
      updated: 0,
      patched: 0,
      failedPosts: 0,
      status: "success",
      error: "",
    };

    try {
      const scraped = await scrapePostsBySectionCanonicalUrl(section.canonicalUrl);
      sectionResult.totalPosts = scraped.totalPosts;

      for (const post of scraped.posts) {
        summary.totalPosts += 1;

        if (post.scrapeError) {
          sectionResult.failedPosts += 1;
          summary.failedPosts += 1;
          continue;
        }

        if (post.saveAction === "created") {
          sectionResult.created += 1;
          summary.created += 1;
        } else if (post.saveAction === "updated") {
          sectionResult.updated += 1;
          summary.updated += 1;
        } else if (post.saveAction === "patched") {
          sectionResult.patched += 1;
          summary.patched += 1;
        }
      }

      summary.processedSections += 1;
    } catch (error) {
      sectionResult.status = "failed";
      sectionResult.error = cleanText(error.message);
      summary.failedSections += 1;
    }

    summary.sections.push(sectionResult);
  }

  summary.finishedAt = new Date();
  return summary;
}

function startSectionScrapeCron() {
  let isRunning = false;
  const schedule = "0 * * * *";

  const execute = async (trigger) => {
    if (isRunning) {
      console.log(`[section-scrape-cron] skipped overlapping run (${trigger})`);
      return;
    }

    isRunning = true;
    console.log(`[section-scrape-cron] started (${trigger})`);

    try {
      const summary = await runSectionScrapeCycle();
      console.log("[section-scrape-cron] completed", {
        trigger,
        startedAt: summary.startedAt,
        finishedAt: summary.finishedAt,
        totalSections: summary.totalSections,
        processedSections: summary.processedSections,
        totalPosts: summary.totalPosts,
        created: summary.created,
        updated: summary.updated,
        patched: summary.patched,
        failedPosts: summary.failedPosts,
        failedSections: summary.failedSections,
      });
    } catch (error) {
      console.error("[section-scrape-cron] failed", {
        trigger,
        error: cleanText(error.message),
      });
    } finally {
      isRunning = false;
    }
  };

  const task = cron.schedule(schedule, () => {
    void execute("hourly");
  });

  console.log("[section-scrape-cron] scheduler started", {
    schedule,
    timezone: process.env.TZ || "system-default",
    runOnStartup: process.env.SECTION_SCRAPE_RUN_ON_STARTUP === "true",
  });

  if (process.env.SECTION_SCRAPE_RUN_ON_STARTUP === "true") {
    console.log("[section-scrape-cron] startup run triggered");
    void execute("startup");
  }

  return task;
}

module.exports = {
  runSectionScrapeCycle,
  startSectionScrapeCron,
};
