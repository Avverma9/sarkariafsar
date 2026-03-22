import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import "../utils/loadEnv.mjs";
import connectDatabase, { disconnectDatabase } from "../db/config.mjs";
import JobDetails from "../models/jobdetails.model.mjs";
import JobSection from "../models/section.model.mjs";
import { syncSingleJobPost } from "../utils/job-sync.mjs";

const runId = Date.now();
const baseAdvertisementNumber = `ZZ-PIPELINE-${runId}`;
const baseTitle = `Codex Pipeline Recruitment ${runId}`;
const authority = "Codex Testing Board";

const cleanupByAdvertisementNumber = async (advertisementNumber) => {
  await JobDetails.deleteMany({
    $or: [
      { advertisement_number: advertisementNumber },
      { advertisementNumber },
    ],
  });
};

before(async () => {
  await connectDatabase();

  await Promise.all([
    JobSection.updateOne(
      { canonicalUrl: "latest-gov-jobs" },
      {
        $set: { name: "Latest Gov Jobs", status: "active", canonicalUrl: "latest-gov-jobs" },
      },
      { upsert: true }
    ),
    JobSection.updateOne(
      { canonicalUrl: "recent-admit-cards" },
      {
        $set: {
          name: "Recent Admit Cards",
          status: "active",
          canonicalUrl: "recent-admit-cards",
        },
      },
      { upsert: true }
    ),
    JobSection.updateOne(
      { canonicalUrl: "results" },
      {
        $set: { name: "Results", status: "active", canonicalUrl: "results" },
      },
      { upsert: true }
    ),
  ]);

  await cleanupByAdvertisementNumber(baseAdvertisementNumber);
  await cleanupByAdvertisementNumber(`${baseAdvertisementNumber}-OLD`);
});

after(async () => {
  await cleanupByAdvertisementNumber(baseAdvertisementNumber);
  await cleanupByAdvertisementNumber(`${baseAdvertisementNumber}-OLD`);
  await disconnectDatabase();
});

test("syncSingleJobPost dry-run predicts creation without writing to DB", async () => {
  const advertisementNumber = `${baseAdvertisementNumber}-DRY`;

  await cleanupByAdvertisementNumber(advertisementNumber);

  const dryRunResult = await syncSingleJobPost(
    {
      title: `${baseTitle} Dry Run`,
      jobtitle: `${baseTitle} Dry Run`,
      advertisement_number: advertisementNumber,
      conducting_authority: authority,
      official_links: {
        heading: "Official Website & Links",
        official_website: "https://example.org/recruitment",
      },
      direct_links: {
        apply_link: "https://example.org/recruitment/dry-run",
      },
      sourceUrl: "https://example.org/recruitment/dry-run",
      applyLastDate: "2026-04-15T18:30:00.000Z",
      status: "Form Open",
    },
    { dryRun: true }
  );

  assert.equal(dryRunResult.action, "created");
  assert.equal(dryRunResult.dryRun, true);
  assert.equal(dryRunResult.persisted, false);
  assert.equal(
    await JobDetails.countDocuments({
      $or: [
        { advertisement_number: advertisementNumber },
        { advertisementNumber },
      ],
    }),
    0
  );
});

test("syncSingleJobPost creates, patches, clones lifecycle posts, and ignores truly expired jobs", async () => {
  const createResult = await syncSingleJobPost({
    title: baseTitle,
    jobtitle: baseTitle,
    advertisement_number: baseAdvertisementNumber,
    conducting_authority: authority,
    official_links: {
      heading: "Official Website & Links",
      official_website: "https://example.org/recruitment",
      advertisement_number: baseAdvertisementNumber,
    },
    direct_links: {
      apply_link: "https://example.org/recruitment/apply",
      notification_pdf: "https://example.org/recruitment/notice-v1.pdf",
    },
    sourceUrl: "https://example.org/recruitment/apply",
    applyLastDate: "2026-03-31T18:30:00.000Z",
    status: "Form Open",
  });

  assert.equal(createResult.action, "created");
  assert.ok(createResult.job);
  assert.equal(createResult.job.sectionCanonicalUrl, "latest-gov-jobs");
  assert.equal(createResult.job.postType, "job");
  assert.match(createResult.job.status, /Online application window is currently open/i);

  const updateResult = await syncSingleJobPost({
    title: baseTitle,
    jobtitle: baseTitle,
    advertisement_number: baseAdvertisementNumber,
    conducting_authority: authority,
    official_links: {
      heading: "Official Website & Links",
      official_website: "https://example.org/recruitment",
      advertisement_number: baseAdvertisementNumber,
    },
    direct_links: {
      apply_link: "https://example.org/recruitment/apply",
      notification_pdf: "https://example.org/recruitment/notice-v2.pdf",
    },
    sourceUrl: "https://example.org/recruitment/apply",
    applyLastDate: "2026-04-10T18:30:00.000Z",
    status: "Form Open",
  });

  assert.equal(updateResult.action, "updated");
  assert.equal(
    updateResult.job.direct_links.notification_pdf,
    "https://example.org/recruitment/notice-v2.pdf"
  );
  assert.equal(
    updateResult.job.applyLastDate.toISOString(),
    "2026-04-10T18:30:00.000Z"
  );

  const admitCardResult = await syncSingleJobPost({
    title: baseTitle,
    jobtitle: baseTitle,
    advertisement_number: baseAdvertisementNumber,
    conducting_authority: authority,
    postType: "admit_card",
    official_links: {
      heading: "Official Website & Links",
      official_website: "https://example.org/recruitment",
      advertisement_number: baseAdvertisementNumber,
    },
    direct_links: {
      admit_card_link: "https://example.org/recruitment/admit-card",
    },
    sourceUrl: "https://example.org/recruitment/admit-card",
  });

  assert.equal(admitCardResult.action, "cloned");
  assert.equal(admitCardResult.job.postType, "admit_card");
  assert.equal(admitCardResult.job.sectionCanonicalUrl, "recent-admit-cards");
  assert.ok(admitCardResult.job.derivedFromPostId);
  assert.match(admitCardResult.job.status, /Admit card is available/i);

  const resultStageResult = await syncSingleJobPost({
    title: baseTitle,
    jobtitle: baseTitle,
    advertisement_number: baseAdvertisementNumber,
    conducting_authority: authority,
    postType: "result",
    official_links: {
      heading: "Official Website & Links",
      official_website: "https://example.org/recruitment",
      advertisement_number: baseAdvertisementNumber,
    },
    direct_links: {
      result_link: "https://example.org/recruitment/result",
    },
    sourceUrl: "https://example.org/recruitment/result",
  });

  assert.equal(resultStageResult.action, "cloned");
  assert.equal(resultStageResult.job.postType, "result");
  assert.equal(resultStageResult.job.sectionCanonicalUrl, "results");
  assert.match(resultStageResult.job.status, /Result has been declared/i);

  const docs = await JobDetails.find({
    $or: [
      { advertisement_number: baseAdvertisementNumber },
      { advertisementNumber: baseAdvertisementNumber },
    ],
  })
    .sort({ postType: 1, createdAt: 1 })
    .lean();

  assert.equal(docs.length, 3);

  const jobDoc = docs.find((doc) => doc.postType === "job");
  const admitDoc = docs.find((doc) => doc.postType === "admit_card");
  const resultDoc = docs.find((doc) => doc.postType === "result");

  assert.ok(jobDoc);
  assert.ok(admitDoc);
  assert.ok(resultDoc);
  assert.equal(jobDoc.lifecycleStage, "application_closed");
  assert.equal(jobDoc.isActive, false);
  assert.equal(admitDoc.lifecycleStage, "admit_card_phase");
  assert.equal(resultDoc.lifecycleStage, "result_phase");
  assert.equal(String(admitDoc.derivedFromPostId), String(jobDoc._id));
  assert.equal(String(resultDoc.derivedFromPostId), String(jobDoc._id));

  const ignoredExpired = await syncSingleJobPost({
    title: `${baseTitle} Old Recruitment`,
    jobtitle: `${baseTitle} Old Recruitment`,
    advertisement_number: `${baseAdvertisementNumber}-OLD`,
    conducting_authority: authority,
    official_links: {
      heading: "Official Website & Links",
      official_website: "https://example.org/recruitment",
      advertisement_number: `${baseAdvertisementNumber}-OLD`,
    },
    direct_links: {
      apply_link: "https://example.org/recruitment/old-apply",
    },
    sourceUrl: "https://example.org/recruitment/old-apply",
    applyLastDate: "2025-01-01T00:00:00.000Z",
    status: "Form Open",
  });

  assert.equal(ignoredExpired.action, "ignored_expired");
  assert.equal(
    await JobDetails.countDocuments({
      $or: [
        { advertisement_number: `${baseAdvertisementNumber}-OLD` },
        { advertisementNumber: `${baseAdvertisementNumber}-OLD` },
      ],
    }),
    0
  );

  const ignoredClosed = await syncSingleJobPost({
    title: `${baseTitle} Closed Recruitment`,
    jobtitle: `${baseTitle} Closed Recruitment`,
    advertisement_number: `${baseAdvertisementNumber}-CLOSED`,
    conducting_authority: authority,
    official_links: {
      heading: "Official Website & Links",
      official_website: "https://example.org/recruitment",
      advertisement_number: `${baseAdvertisementNumber}-CLOSED`,
    },
    sourceUrl: "https://example.org/recruitment/closed",
    status: "Application Closed on the official portal.",
  });

  assert.equal(ignoredClosed.action, "ignored_closed");
  assert.equal(
    await JobDetails.countDocuments({
      $or: [
        { advertisement_number: `${baseAdvertisementNumber}-CLOSED` },
        { advertisementNumber: `${baseAdvertisementNumber}-CLOSED` },
      ],
    }),
    0
  );
});
