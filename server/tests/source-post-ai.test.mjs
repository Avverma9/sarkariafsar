import test from "node:test";
import assert from "node:assert/strict";
import { buildSchemaFallbackPost, isSchemaRichJob } from "../utils/source-post-ai.mjs";

test("isSchemaRichJob rejects sparse discovered candidates", () => {
  assert.equal(
    isSchemaRichJob({
      title: "Combined Medical Services Examination, 2026",
      jobtitle: "Combined Medical Services Examination, 2026",
      official_links: {
        official_website: "https://upsc.gov.in",
      },
    }),
    false
  );
});

test("isSchemaRichJob accepts a well-formed job-style document", () => {
  assert.equal(
    isSchemaRichJob({
      title: "Combined Medical Services Examination, 2026",
      jobtitle: "Combined Medical Services Examination, 2026",
      meta: {
        description:
          "Combined Medical Services Examination 2026 notification with important dates, eligibility, fee, and application guidance.",
      },
      introduction: {
        content:
          "The Combined Medical Services Examination 2026 is conducted by UPSC for recruitment into central government medical services. Candidates should review dates, eligibility conditions, and the official notification before applying.",
      },
      official_links: {
        official_website: "https://upsc.gov.in",
        links: [{ label: "Notification PDF", url: "https://upsc.gov.in/example.pdf" }],
      },
      disclaimer:
        "Candidates must verify all details, dates, and instructions from the official UPSC notification before applying.",
      important_dates: {
        dates: [
          { event: "Date of Notification", date: "11 March 2026" },
          { event: "Last Date for Receipt of Applications", date: "31 March 2026" },
        ],
      },
      eligibility_criteria: {
        posts: [{ post_name: "Medical Officer", academic_qualification: "MBBS degree" }],
      },
      selection_process: {
        stages: [{ step: 1, name: "Written Examination", description: "Objective paper." }],
      },
      how_to_apply: {
        steps: [{ step: 1, action: "Visit the UPSC online portal and complete registration." }],
      },
      conclusion: {
        content:
          "Applicants should complete the form well before the deadline and keep official documents ready for verification.",
      },
      tags: ["UPSC CMS 2026", "Medical Recruitment"],
    }),
    true
  );
});

test("buildSchemaFallbackPost upgrades a minimal job candidate into a schema-rich job", () => {
  const fallback = buildSchemaFallbackPost({
    candidate: {
      title: "Combined Medical Services Examination, 2026",
      jobtitle: "Combined Medical Services Examination, 2026",
      postType: "job",
      status: "Form Open",
      applyLastDate: "2026-03-31T18:30:00.000Z",
      conducting_authority: "Union Public Service Commission (UPSC)",
      official_links: {
        official_website: "https://upsc.gov.in",
      },
      direct_links: {
        apply_link: "https://upsconline.nic.in/",
        notification_pdf: "https://upsc.gov.in/example.pdf",
      },
    },
    previewJob: {
      title: "Combined Medical Services Examination, 2026",
      jobtitle: "Combined Medical Services Examination, 2026",
      postType: "job",
      applyLastDate: "2026-03-31T18:30:00.000Z",
    },
  });

  assert.equal(isSchemaRichJob(fallback, { postType: "job" }), true);
  assert.equal(fallback.how_to_apply.steps.length >= 3, true);
  assert.equal(fallback.official_links.official_website, "https://upsc.gov.in/");
  assert.equal(fallback.faq.questions.length >= 3, true);
  assert.equal(Boolean(fallback.about_exam || fallback.about_recruitment), true);
});

test("buildSchemaFallbackPost upgrades a minimal result candidate into a schema-rich result post", () => {
  const fallback = buildSchemaFallbackPost({
    candidate: {
      title: "UPSC Engineering Services Examination 2026 Result",
      jobtitle: "UPSC Engineering Services Examination 2026 Result",
      postType: "result",
      status: "Result Out",
      conducting_authority: "Union Public Service Commission (UPSC)",
      official_links: {
        official_website: "https://upsc.gov.in",
      },
      direct_links: {
        result_link: "https://upsc.gov.in/results",
      },
    },
  });

  assert.equal(isSchemaRichJob(fallback, { postType: "result" }), true);
  assert.equal(fallback.how_to_check_result.steps.length >= 3, true);
  assert.equal(Boolean(fallback.disclaimer), true);
});

test("buildSchemaFallbackPost can enrich a specific PDF notice when authority is inferable", () => {
  const fallback = buildSchemaFallbackPost({
    candidate: {
      title: "Notice on refund of Exam-Fees & re-updation of Bank Account details",
      jobtitle: "Notice on refund of Exam-Fees & re-updation of Bank Account details",
      postType: "notice",
      status: "Notice",
      official_links: {
        official_website: "https://www.rrbcdg.gov.in/",
      },
      direct_links: {
        notification_pdf:
          "https://www.rrbcdg.gov.in/uploads/2019/RRC01-LVL1/RRC012019-Refund.pdf",
      },
    },
  });

  assert.equal(isSchemaRichJob(fallback, { postType: "notice" }), true);
  assert.match(fallback.notification_details.content, /refund process|bank-account revalidation/i);
  assert.match(fallback.conducting_authority, /Railway Recruitment Board/i);
});

test("buildSchemaFallbackPost upgrades specific notice candidates into richer narrative", () => {
  const fallback = buildSchemaFallbackPost({
    candidate: {
      title:
        "List of candidates considered as UR due to invalid category certificate uploaded for Junior Resident July 2025 Session",
      jobtitle:
        "List of candidates considered as UR due to invalid category certificate uploaded for Junior Resident July 2025 Session",
      postType: "notice",
      currentStatus: "An official notice has been published for this post.",
      official_links: {
        official_website: "https://aiimsexams.ac.in/",
      },
      direct_links: {
        notification_pdf:
          "https://docs.aiimsexams.ac.in/sites/Notice%20reg%20considered%20as%20UR-JR-JL2025.pdf",
      },
      important_dates: {
        dates: [{ event: "Notice Release Date", date: "16 July 2025" }],
      },
    },
  });

  assert.equal(isSchemaRichJob(fallback, { postType: "notice" }), true);
  assert.match(fallback.introduction.content, /candidate list or category-status decision/i);
  assert.match(fallback.notification_details.content, /candidate list or category-status decision/i);
  assert.match(fallback.status, /category or shortlist update/i);
});
