export const metadata = {
  title: "Government Schemes & Yojana",
  description:
    "Explore all central and state government schemes (sarkari yojana) — eligibility, benefits, application process and important dates on SarkariAfsar.",
  keywords: [
    "sarkari yojana",
    "government schemes",
    "central schemes",
    "state schemes",
    "PM yojana",
    "scheme eligibility",
    "scheme benefits",
  ],
  alternates: {
    canonical: "/schemes",
  },
  openGraph: {
    title: "Government Schemes & Yojana — SarkariAfsar",
    description:
      "Explore all central and state government schemes — eligibility, benefits, application process and important dates.",
    url: "/schemes",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Government Schemes & Yojana — SarkariAfsar",
    description:
      "Central and state government schemes — eligibility, benefits, application process and dates.",
  },
};

export default function SchemesLayout({ children }) {
  return children;
}
