export const metadata = {
  title: "All Jobs & Updates — Section Wise",
  description:
    "View all government job posts organized by section — admit cards, latest govt jobs, results, and admission notifications at SarkariAfsar.",
  keywords: [
    "govt job sections",
    "admit card updates",
    "sarkari result",
    "latest gov jobs",
    "admission notification",
  ],
  alternates: {
    canonical: "/post",
  },
  openGraph: {
    title: "All Jobs & Updates — SarkariAfsar",
    description:
      "View all government job posts organized by section — admit cards, latest govt jobs, results, and admission notifications.",
    url: "/post",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "All Jobs & Updates — SarkariAfsar",
    description:
      "Government job posts organized by section — admit cards, latest govt jobs, results, and admission.",
  },
};

export default function PostLayout({ children }) {
  return children;
}
