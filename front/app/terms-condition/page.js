import { redirect } from "next/navigation";
import { buildPageMetadata } from "../lib/seo";

export const metadata = buildPageMetadata({
  title: "Terms and Conditions",
  description: "Redirecting to the latest Terms and Conditions page.",
  path: "/terms-condition",
  noIndex: true,
});

export default function TermsConditionRedirectPage() {
  redirect("/terms-and-conditions");
}
