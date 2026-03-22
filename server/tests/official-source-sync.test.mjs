import test from "node:test";
import assert from "node:assert/strict";
import {
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
      results: [{ action: "ignored_closed" }, { action: "ignored_expired" }],
    },
  ]);

  assert.equal(summary.sources, 2);
  assert.equal(summary.candidates, 3);
  assert.equal(summary.created, 1);
  assert.equal(summary.updated, 1);
  assert.equal(summary.ignored_closed, 1);
  assert.equal(summary.ignored_expired, 1);
  assert.equal(summary.errors, 1);
  assert.equal(summary.dryRunSources, 1);
  assert.equal(summary.dryRunActions, 2);
});
