import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND_NAME, DEFAULT_DESCRIPTION, SITE_ICON_PATH, getSiteUrl } from "./lib/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${BRAND_NAME} - Sarkari Jobs, Results, Schemes`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: BRAND_NAME,
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.webmanifest",
  keywords: [
    "government jobs",
    "latest government jobs",
    "exam results",
    "admit cards",
    "government schemes",
  ],
  openGraph: {
    type: "website",
    url: "/",
    title: `${BRAND_NAME} - Sarkari Jobs, Results, Schemes`,
    description: DEFAULT_DESCRIPTION,
    siteName: BRAND_NAME,
    locale: "en-IN",
    images: [
      {
        url: SITE_ICON_PATH,
        width: 256,
        height: 256,
        alt: BRAND_NAME,
      },
    ],
  },
  twitter: {
    card: "summary",
    title: `${BRAND_NAME} - Sarkari Jobs, Results, Schemes`,
    description: DEFAULT_DESCRIPTION,
    images: [SITE_ICON_PATH],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: SITE_ICON_PATH, type: "image/svg+xml" }],
    shortcut: [SITE_ICON_PATH],
    apple: [{ url: SITE_ICON_PATH }],
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en-IN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
