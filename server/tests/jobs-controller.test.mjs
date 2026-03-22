import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import "../utils/loadEnv.mjs";
import connectDatabase, { disconnectDatabase } from "../db/config.mjs";
import JobDetails from "../models/jobdetails.model.mjs";
import JobSection from "../models/section.model.mjs";
import { syncSingleJobPost } from "../utils/job-sync.mjs";
import { updateJob } from "../controller/jobs.controller.mjs";

const runId = Date.now();
const advertisementNumber = `ZZ-CONTROLLER-${runId}`;

before(async () => {
  await connectDatabase();
  await JobSection.updateOne(
    { canonicalUrl: "latest-gov-jobs" },
    {
      $set: { name: "Latest Gov Jobs", status: "active", canonicalUrl: "latest-gov-jobs" },
    },
    { upsert: true }
  );
});

after(async () => {
  await JobDetails.deleteMany({
    $or: [
      { advertisement_number: advertisementNumber },
      { advertisementNumber: advertisementNumber },
    ],
  });
  await disconnectDatabase();
});

test("updateJob deep-merges nested payloads instead of wiping existing nested fields", async () => {
  const created = await syncSingleJobPost({
    title: "Controller Patch Test Job",
    jobtitle: "Controller Patch Test Job",
    advertisement_number: advertisementNumber,
    conducting_authority: "Controller Testing Board",
    official_links: {
      heading: "Official Website & Links",
      official_website: "https://example.org",
      advertisement_number: advertisementNumber,
      links: [
        {
          label: "Notification PDF",
          url: "https://example.org/notice.pdf",
          status: "Active",
        },
      ],
    },
    direct_links: {
      apply_link: "https://example.org/apply",
    },
    status: "Online application window is currently open on the official portal.",
  });

  const req = {
    params: { id: String(created.job._id) },
    query: {},
    body: {
      official_links: {
        apply_online_portal: "https://example.org/new-portal",
      },
    },
  };

  const response = { statusCode: 0, body: null };
  const res = {
    status(code) {
      response.statusCode = code;
      return this;
    },
    json(payload) {
      response.body = payload;
      return payload;
    },
  };

  let nextError = null;
  await updateJob(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, null);
  assert.equal(response.statusCode, 200);
  assert.equal(
    response.body.job.official_links.official_website,
    "https://example.org"
  );
  assert.equal(
    response.body.job.official_links.apply_online_portal,
    "https://example.org/new-portal"
  );
  assert.equal(response.body.job.official_links.heading, "Official Website & Links");
  assert.equal(response.body.job.official_links.links.length, 1);
});

test("updateJob preserves manual editorial fields and camelCase aliases", async () => {
  const created = await syncSingleJobPost({
    title: "Manual Patch Preserve Test",
    jobtitle: "Manual Patch Preserve Test",
    advertisement_number: `${advertisementNumber}-MANUAL`,
    conducting_authority: "Manual Testing Board",
    sectionName: "Latest Gov Jobs",
    sectionCanonicalUrl: "latest-gov-jobs",
    important_dates: {
      heading: "Important Dates",
      dates: [{ event: "Last Date to Apply Online", date: "30 July 2026" }],
    },
    status: "Online application window is currently open on the official portal.",
  });

  const req = {
    params: { id: String(created.job._id) },
    query: {},
    body: {
      post: {
        title: "Manual Editorial Title",
        jobtitle: "Manual Editorial Job Title",
        advertisementNumber: "Manual Notice 42/2026",
        conductingAuthority: "Manual Authority Name",
        applyLastDate: null,
        introduction: {
          heading: "Manual Intro",
          content: "This intro should be preserved exactly as entered by admin.",
        },
        status: "Important human-written status from admin.",
      },
    },
  };

  const response = { statusCode: 0, body: null };
  const res = {
    status(code) {
      response.statusCode = code;
      return this;
    },
    json(payload) {
      response.body = payload;
      return payload;
    },
  };

  let nextError = null;
  await updateJob(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, null);
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.job.title, "Manual Editorial Title");
  assert.equal(response.body.job.jobtitle, "Manual Editorial Job Title");
  assert.equal(response.body.job.advertisement_number, "Manual Notice 42/2026");
  assert.equal(response.body.job.advertisementNumber, "Manual Notice 42/2026");
  assert.equal(response.body.job.conducting_authority, "Manual Authority Name");
  assert.equal(response.body.job.conductingAuthority, "Manual Authority Name");
  assert.equal(response.body.job.applyLastDate, null);
  assert.equal(response.body.job.introduction.heading, "Manual Intro");
  assert.equal(
    response.body.job.introduction.content,
    "This intro should be preserved exactly as entered by admin."
  );
  assert.equal(
    response.body.job.status,
    "Important human-written status from admin."
  );
});
