export const metadata = {
  title: "Blog & Guides",
  description:
    "Read in-depth guides, tips and articles about government jobs, exam preparation, sarkari yojana benefits and career advice on SarkariAfsar.",
  keywords: [
    "sarkari naukri blog",
    "govt job preparation",
    "exam tips",
    "government career guide",
    "sarkari yojana guide",
  ],
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog & Guides — SarkariAfsar",
    description:
      "In-depth guides, tips and articles about government jobs, exam preparation and sarkari yojana benefits.",
    url: "/blog",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Blog & Guides — SarkariAfsar",
    description:
      "Guides, tips and articles about government jobs, exam preparation and sarkari yojana.",
  },
};

export default function BlogLayout({ children }) {
  return children;
}
