import { buildMetadata } from "../lib/seo";

export const metadata = buildMetadata({
  title: "Mock Test Practice",
  description:
    "Practice mock tests for government exams with timed sessions, section-wise analysis, and score insights.",
  path: "/mock-test",
  type: "WebPage",
  keywords: ["mock test", "government exam mock test", "online practice test"],
});

export default function MockTestLayout({ children }) {
  return children;
}
