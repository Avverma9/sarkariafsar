import HomePage from "./components/home/home-page";

export const metadata = {
  title: "SarkariAfsar — Sarkari Naukri, Govt Jobs, Schemes & Updates",
  description:
    "Get real-time updates on government jobs, admit cards, results, sarkari yojana and recruitment notifications across India. SSC, UPSC, Railway, Banking & more.",
  keywords: [
    "sarkari naukri",
    "government jobs",
    "sarkari result",
    "admit card",
    "sarkari yojana",
    "govt schemes",
    "latest govt jobs",
    "sarkari afsar",
    "free job alert",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "SarkariAfsar — Sarkari Naukri, Govt Jobs, Schemes & Updates",
    description:
      "Real-time updates on government jobs, admit cards, results and sarkari yojana across India.",
    url: "/",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SarkariAfsar — Sarkari Naukri, Govt Jobs & Schemes",
    description:
      "Real-time updates on government jobs, admit cards, results and sarkari yojana across India.",
  },
};

export default function Page() {
  return <HomePage />;
}
