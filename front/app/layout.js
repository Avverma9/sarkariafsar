import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import CookieBanner from "./components/CookieBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://sarkariafsar.com";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SarkariAfsar — Sarkari Naukri, Govt Jobs, Schemes & Updates",
    template: "%s | SarkariAfsar",
  },
  description:
    "SarkariAfsar provides real-time updates on government jobs, admit cards, results, sarkari yojana and recruitment notifications across India.",
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
    "ssc",
    "upsc",
    "railway jobs",
  ],
  authors: [{ name: "SarkariAfsar Editorial" }],
  creator: "SarkariAfsar",
  publisher: "SarkariAfsar",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: SITE_URL,
    siteName: "SarkariAfsar",
    title: "SarkariAfsar — Sarkari Naukri, Govt Jobs, Schemes & Updates",
    description:
      "Real-time updates on government jobs, admit cards, results, sarkari yojana and recruitment notifications across India.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SarkariAfsar — Sarkari Naukri, Govt Jobs, Schemes & Updates",
    description:
      "Real-time updates on government jobs, admit cards, results, sarkari yojana and recruitment notifications across India.",
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <StoreProvider>{children}</StoreProvider>
        <CookieBanner />
      </body>
    </html>
  );
}
