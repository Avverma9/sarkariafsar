import test from "node:test";
import assert from "node:assert/strict";
import {
  buildRecruitmentKey,
  getIgnoredJobAction,
  inferPostType,
  normalizeDirectLinks,
} from "../utils/job-family.mjs";
import { extractAdvertisementNumber, parseLooseDate } from "../utils/job-normalize.mjs";

test("recruitment key stays stable across lifecycle stages when advertisement number is same", () => {
  const base = {
    title: "Bihar Police Constable Operator Recruitment 2026",
    advertisement_number: "02/2026",
    conducting_authority: "Central Selection Board of Constable",
    official_links: {
      official_website: "https://csbc.bihar.gov.in/",
    },
  };

  const admitCard = {
    ...base,
    title: "Bihar Police Constable Operator Recruitment 2026 Admit Card Released",
    postType: "admit_card",
  };

  assert.equal(buildRecruitmentKey(base), buildRecruitmentKey(admitCard));
});

test("post type inference detects lifecycle-specific titles", () => {
  assert.equal(
    inferPostType({ title: "UPTET 2026 Admit Card Download" }),
    "admit_card"
  );
  assert.equal(
    inferPostType({ title: "UPTET 2026 Result Declared" }),
    "result"
  );
  assert.equal(
    inferPostType({ title: "UPTET 2026 Answer Key Released" }),
    "answer_key"
  );
  assert.equal(
    inferPostType({
      title: "Recruitment update",
      sourceUrl: "https://upsssc.gov.in/Online_App/Download_InterviewLetter_Exam.aspx?ID=DV",
    }),
    "admit_card"
  );
  assert.equal(
    inferPostType({ title: "Open Round Seat Allocation for Session 2025" }),
    "admission"
  );
});

test("direct link normalization preserves admission links and official website", () => {
  const normalized = normalizeDirectLinks({
    sourceUrl: "https://example.com/admissions",
    direct_links: {
      admission_link: "https://example.com/admissions/apply?ref=home#top",
    },
  });

  assert.equal(
    normalized.admission_link,
    "https://example.com/admissions/apply?ref=home"
  );
  assert.equal(normalized.official_website, "https://example.com/admissions");
});

test("advertisement number extraction supports CEN identifiers", () => {
  assert.equal(
    extractAdvertisementNumber({
      title: "CEN 01/2025 - Assistant Loco-Pilot",
    }),
    "CEN 01/2025"
  );
});

test("parseLooseDate supports day-first dates used by official notices", () => {
  assert.equal(
    parseLooseDate("31/03/2026 - 6:00pm")?.toISOString(),
    new Date(2026, 2, 31, 18, 0).toISOString()
  );
  assert.equal(
    parseLooseDate("18-03-2026")?.toISOString(),
    new Date(2026, 2, 18).toISOString()
  );
});

test("closed jobs are ignored for new creation while active jobs are not", () => {
  assert.equal(
    getIgnoredJobAction({
      title: "Example Recruitment 2026",
      postType: "job",
      status: "Application Closed on the official portal.",
    }),
    "ignored_closed"
  );

  assert.equal(
    getIgnoredJobAction({
      title: "Example Recruitment 2026",
      postType: "job",
      status: "Online application window is currently open on the official portal.",
      applyLastDate: "2026-12-31T00:00:00.000Z",
    }),
    ""
  );
});
