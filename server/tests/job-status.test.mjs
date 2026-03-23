import test from "node:test";
import assert from "node:assert/strict";
import { buildHumanStatus, isGenericStatus } from "../utils/job-status.mjs";

test("isGenericStatus detects terse machine-like job statuses", () => {
  assert.equal(isGenericStatus("Form Open", "job"), true);
  assert.equal(isGenericStatus("Admit Card", "admit_card"), true);
  assert.equal(isGenericStatus("Result Out", "result"), true);
});

test("buildHumanStatus expands terse job statuses into human-written text", () => {
  const status = buildHumanStatus({
    postType: "job",
    applyLastDate: "2026-05-01T18:30:00.000Z",
    currentStatus: "Form Open",
    title: "UPTET 2026",
  });

  assert.match(status, /Applications for UPTET 2026 are currently open/i);
});

test("buildHumanStatus preserves already human-written statuses", () => {
  const status = buildHumanStatus({
    postType: "result",
    currentStatus: "Result has been published on the official portal for all shortlisted candidates.",
  });

  assert.equal(
    status,
    "Result has been published on the official portal for all shortlisted candidates."
  );
});

test("buildHumanStatus rewrites canned notice statuses into title-aware text", () => {
  const status = buildHumanStatus({
    postType: "notice",
    title:
      "List of candidates considered as UR due to invalid category certificate uploaded for Junior Resident July 2025 Session",
    currentStatus: "An official notice has been published for this post.",
  });

  assert.match(status, /category or shortlist update/i);
  assert.equal(isGenericStatus("An official notice has been published for this post.", "notice"), true);
});
