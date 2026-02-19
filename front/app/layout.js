import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import Breadcrumbs from "./component/layout/Breadcrumbs";
import ExternalLinkGuard from "./component/layout/ExternalLinkGuard";
import Footer from "./component/layout/Footer";
import Header from "./component/layout/Header";
import { getTickerUpdates } from "./lib/server-home-data";
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE,
  DEFAULT_KEYWORDS,
  DEFAULT_TITLE,
  SITE_BASE_URL,
  SITE_EMAIL,
  SITE_NAME,
} from "./lib/site-config";
import "./globals.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = SITE_BASE_URL.toString();
const adsenseClient = String(process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "").trim();
const hasAdsenseClient = adsenseClient.startsWith("ca-pub-");

export const metadata = {
  metadataBase: SITE_BASE_URL,
  title: {
    default: DEFAULT_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  keywords: DEFAULT_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: DEFAULT_IMAGE,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} logo`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [DEFAULT_IMAGE],
  },
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon_io/apple-touch-icon.png",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: siteUrl,
  logo: DEFAULT_IMAGE,
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: SITE_EMAIL,
  },
};

export default async function RootLayout({ children }) {
  const tickerUpdates = await getTickerUpdates();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {hasAdsenseClient ? (
          <Script
            id="adsense-auto-ads"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
            crossOrigin="anonymous"
          />
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <ExternalLinkGuard />
        <Header initialTickerUpdates={tickerUpdates} />
        <Breadcrumbs />
        {children}
        <Footer />
      </body>
    </html>
  );
}
