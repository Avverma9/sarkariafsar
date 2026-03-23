import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCandidateFromAnchor,
  getNonPostCandidateReason,
  normalizeUrl,
  normalizeHostname,
  resolveSourceProfile,
  summarizeOfficialSyncResults,
} from "../utils/official-source-sync.mjs";

test("normalizeUrl handles absolute and relative URLs safely", () => {
  assert.equal(normalizeUrl("https://upsssc.gov.in"), "https://upsssc.gov.in/");
  assert.equal(
    normalizeUrl("/recruitment/apply", "https://example.org/jobs"),
    "https://example.org/recruitment/apply"
  );
});

test("normalizeHostname resolves official portal domains", () => {
  assert.equal(normalizeHostname("https://www.ssc.nic.in"), "ssc.nic.in");
  assert.equal(normalizeHostname("https://upsconline.nic.in"), "upsconline.nic.in");
});

test("resolveSourceProfile maps known portals to the right parser family", () => {
  assert.equal(resolveSourceProfile("https://upsssc.gov.in"), "upsssc");
  assert.equal(resolveSourceProfile("https://aiimsexams.ac.in"), "aiims");
  assert.equal(resolveSourceProfile("https://oldwebsite.aiimsexams.ac.in"), "aiims");
  assert.equal(resolveSourceProfile("https://www.ssc.nic.in"), "ssc");
  assert.equal(resolveSourceProfile("https://upsconline.nic.in"), "upsc");
  assert.equal(resolveSourceProfile("https://rrbcdg.gov.in"), "rrb");
});

test("summarizeOfficialSyncResults counts dry-run and actions", () => {
  const summary = summarizeOfficialSyncResults([
    {
      candidateCount: 2,
      dryRun: true,
      results: [
        { action: "created", dryRun: true },
        { action: "updated", dryRun: true },
      ],
    },
    {
      candidateCount: 1,
      error: "boom",
      results: [
        { action: "ignored_non_post" },
        { action: "ignored_closed" },
        { action: "ignored_expired" },
      ],
    },
  ]);

  assert.equal(summary.sources, 2);
  assert.equal(summary.candidates, 3);
  assert.equal(summary.created, 1);
  assert.equal(summary.updated, 1);
  assert.equal(summary.ignored_non_post, 1);
  assert.equal(summary.ignored_closed, 1);
  assert.equal(summary.ignored_expired, 1);
  assert.equal(summary.errors, 1);
  assert.equal(summary.dryRunSources, 1);
  assert.equal(summary.dryRunActions, 2);
});

test("buildCandidateFromAnchor rejects utility downloads and tender-style links", () => {
  assert.equal(
    buildCandidateFromAnchor({
      sourceUrl: "https://esb.mp.gov.in/",
      baseUrl: "https://esb.mp.gov.in/",
      officialWebsite: "https://esb.mp.gov.in/",
      href: "https://esb.mp.gov.in/Hindi/hindi_fonts.rar",
      text: "Download Hindi Fonts",
    }),
    null
  );

  assert.equal(
    buildCandidateFromAnchor({
      sourceUrl: "https://example.org/",
      baseUrl: "https://example.org/",
      officialWebsite: "https://example.org/",
      href: "https://example.org/tender.pdf",
      text: "EOI work Hiring of 10 nos. Multi utility Vehicles",
    }),
    null
  );

  assert.notEqual(
    buildCandidateFromAnchor({
      sourceUrl: "https://upsssc.gov.in/",
      baseUrl: "https://upsssc.gov.in/",
      officialWebsite: "https://upsssc.gov.in/",
      href: "https://upsssc.gov.in/Online_App/Results.aspx?ID=89",
      text: "CLICK HERE TO DOWNLOAD RESULT FOR 01-Exam/2025 - Preliminary Eligibility Test (PET) 2025 through website.",
    }),
    null
  );
});

test("getNonPostCandidateReason flags junk candidates before sync or AI", () => {
  assert.equal(
    getNonPostCandidateReason({
      title: "Download Hindi Fonts",
      sourceUrl: "https://esb.mp.gov.in/Hindi/hindi_fonts.rar",
    }),
    "non_post_utility_or_tender"
  );

  assert.equal(
    getNonPostCandidateReason({
      title: "Tender Notification",
      sourceUrl: "https://tenders.bhel.com/tenders",
    }),
    "non_post_utility_or_tender"
  );

  assert.equal(
    getNonPostCandidateReason({
      title: "13 Mar 2026 11:07AM",
      sourceUrl: "https://indianairforce.nic.in/notification-detail?notiid=test",
    }),
    "non_post_utility_or_tender"
  );

  assert.equal(
    getNonPostCandidateReason({
      title: "IAF Doctrine",
      sourceUrl: "https://indianairforce.nic.in/Resources/pdf/utilities/latest-Doctrine.pdf",
    }),
    "non_post_utility_or_tender"
  );

  assert.equal(
    getNonPostCandidateReason({
      title: "Export of Goods and Services- Realisation and Repatriation of Export Proceeds-Relaxation",
      sourceUrl: "https://www.rbi.org.in/Scripts/NotificationUser.aspx?Id=11855&Mode=0",
    }),
    "non_post_utility_or_tender"
  );

  assert.equal(
    getNonPostCandidateReason({
      title: "Notice to Locker Hirers",
      sourceUrl: "https://www.idbibank.in/pdf/Notice-to-Locker-Hirer.pdf",
    }),
    "non_post_utility_or_tender"
  );

  assert.equal(
    getNonPostCandidateReason({
      title: "Notice: Change the Examination date for AIIMS B.Sc. Paramedical Courses August-2025 session",
      sourceUrl: "https://docs.aiimsexams.ac.in/sites/notice_11.pdf",
    }),
    ""
  );
});
