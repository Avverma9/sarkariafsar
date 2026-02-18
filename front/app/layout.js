import { Geist, Geist_Mono } from "next/font/google";
import Breadcrumbs from "./component/layout/Breadcrumbs";
import ExternalLinkGuard from "./component/layout/ExternalLinkGuard";
import Footer from "./component/layout/Footer";
import Header from "./component/layout/Header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SarkariAfsar - Govt Jobs Portal",
  description: "SarkariAfsar - Govt Jobs Portal",
  openGraph: {
    title: "SarkariAfsar - Govt Jobs Portal",
    description: "SarkariAfsar - Govt Jobs Portal",
  },
  twitter: {
    card: "summary",
    title: "SarkariAfsar - Govt Jobs Portal",
    description: "SarkariAfsar - Govt Jobs Portal",
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ExternalLinkGuard />
        <Header />
        <Breadcrumbs />
        {children}
        <Footer />
      </body>
    </html>
  );
}
