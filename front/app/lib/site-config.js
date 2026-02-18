const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://sarkariafsar.com").replace(/\/$/, "");

export const SITE_NAME = "SarkariAfsar";
export const SITE_BASE_URL = new URL(SITE_URL);
export const DEFAULT_TITLE = "SarkariAfsar - Latest Sarkari Result & Govt Jobs";
export const DEFAULT_DESCRIPTION =
  "SarkariAfsar brings verified Sarkari Naukri updates, admit cards, answer keys, and results for SSC, Railway, Bank, UPSC, and state government exams.";
export const DEFAULT_IMAGE = `${SITE_URL}/app-logo.png`;
export const DEFAULT_KEYWORDS = [
  "sarkari result",
  "govt jobs",
  "sarkari naukri",
  "latest govt jobs",
  "admit card",
  "answer key",
  "job alerts",
  "railway jobs",
  "bank jobs",
  "ssc jobs",
  "upsc exam",
  "state govt jobs",
  "government exam results",
  "sarkari exam",
  "exam date",
  "syllabus",
  "notification",
  "vacancy",
  "application form",
  "eligibility",
];

export const SITE_EMAIL = "support@sarkariafsar.com";
