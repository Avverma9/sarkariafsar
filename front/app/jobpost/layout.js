export const metadata = {
  title: "Latest Government Jobs & Updates",
  description:
    "Browse the latest sarkari naukri notifications, admit cards, results and recruitment updates across India — SSC, UPSC, Railway, Banking & more.",
  keywords: [
    "latest govt jobs",
    "sarkari naukri",
    "government job notification",
    "admit card",
    "sarkari result",
    "SSC jobs",
    "UPSC jobs",
    "railway recruitment",
  ],
  alternates: {
    canonical: "/jobpost",
  },
  openGraph: {
    title: "Latest Government Jobs & Updates — SarkariAfsar",
    description:
      "Browse the latest sarkari naukri notifications, admit cards, results and recruitment updates across India.",
    url: "/jobpost",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Latest Government Jobs & Updates — SarkariAfsar",
    description:
      "Browse the latest sarkari naukri notifications, admit cards, results and recruitment updates across India.",
  },
};

export default function JobpostLayout({ children }) {
  return children;
}
