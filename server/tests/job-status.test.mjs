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
  });

  assert.match(status, /Online application window is currently open/i);
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
