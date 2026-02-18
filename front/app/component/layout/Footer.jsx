import {
  BookOpen,
  BriefcaseBusiness,
  Calculator,
  ChevronRight,
  Download,
  FileText,
  Facebook,
  Instagram,
  Keyboard,
  Mail,
  MessageCircle,
  Send,
  Twitter,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { buildSectionHref } from "../../lib/sectionRouting";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Latest Jobs", href: buildSectionHref("Latest Gov Jobs") },
  { label: "Results", href: buildSectionHref("Recent Results") },
  { label: "Admit Card", href: buildSectionHref("Admit Cards") },
  { label: "Answer Key", href: buildSectionHref("Answer Keys") },
];

const infoLinks = [
  { label: "About Us", href: "/about" },
  { label: "Contact Us", href: "/contact" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-of-service" },
  { label: "Blogs", href: "/blog" },
  { label: "Guides", href: "/guides" },

];

const toolLinks = [
  { label: "Image Resizer", href: "/guides", icon: Wrench },
  { label: "Resume Maker", href: "/guides", icon: FileText },
  { label: "Typing Test", href: "/mock-test", icon: Keyboard },
  { label: "Age Calculator", href: "/guides", icon: Calculator },
  { label: "Mock Tests", href: "/mock-test", icon: BookOpen },
];

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: Facebook,
    hover: "hover:bg-blue-600",
  },
  {
    label: "Twitter",
    href: "https://x.com",
    icon: Twitter,
    hover: "hover:bg-sky-500",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: Instagram,
    hover: "hover:bg-pink-600",
  },
  {
    label: "Telegram",
    href: "https://t.me",
    icon: Send,
    hover: "hover:bg-blue-500",
  },
  {
    label: "WhatsApp",
    href: "https://wa.me/919153630507",
    icon: MessageCircle,
    hover: "hover:bg-green-500",
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t-4 border-indigo-600 bg-slate-900 pb-8 pt-16 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="rounded-lg bg-indigo-600 p-2 text-white">
                <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="text-2xl font-bold text-white">
                Sarkari<span className="text-indigo-400">Afsar</span>
              </span>
            </div>

            <p className="text-sm leading-relaxed text-slate-400">
              India&apos;s most trusted portal for Sarkari Naukri, Admit Cards,
              Results, and Exam Preparation tools. We provide the fastest and
              most accurate updates.
            </p>

            <div className="flex space-x-4 pt-2">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className={`flex h-8 w-8 items-center justify-center rounded bg-slate-800 transition hover:text-white ${item.hover}`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </a>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="mb-6 border-l-4 border-indigo-500 pl-3 text-lg font-semibold text-white">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              {quickLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center transition hover:text-indigo-400"
                  >
                    <ChevronRight
                      className="mr-2 h-3 w-3 text-slate-600"
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 border-l-4 border-indigo-500 pl-3 text-lg font-semibold text-white">
              Student Tools
            </h3>
            <ul className="space-y-3 text-sm">
              {toolLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center transition hover:text-indigo-400"
                    >
                      <Icon
                        className="mr-2 h-3.5 w-3.5 text-slate-600"
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h3 className="mb-6 border-l-4 border-indigo-500 pl-3 text-lg font-semibold text-white">
              Info
            </h3>

            <ul className="space-y-3 text-sm">
              {infoLinks.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="flex items-center transition hover:text-indigo-400"
                  >
                    <ChevronRight
                      className="mr-2 h-3 w-3 text-slate-600"
                      aria-hidden="true"
                    />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-white">Support</h4>
              <a
                href="mailto:support@sarkariafsar.com"
                className="flex items-center text-sm text-indigo-400 transition hover:text-white"
              >
                <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
                support@sarkariafsar.com
              </a>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between border-t border-slate-800 pt-8 text-xs text-slate-500 md:flex-row">
          <p>&copy; {currentYear} SarkariAfsar. All rights reserved.</p>
          <div className="mt-4 flex space-x-6 md:mt-0">
            <Link
              href="/privacy-policy"
              className="transition hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms-and-condition"
              className="transition hover:text-white"
            >
              Terms of Service
            </Link>
            <Link href="/about" className="transition hover:text-white">
              Disclaimer
            </Link>
            <Link href="/sitemap.xml" className="transition hover:text-white">
              Sitemap
            </Link>
          </div>
        </div>

        <div className="mt-4 text-center text-[10px] text-slate-600">
          Disclaimer: SarkariAfsar is not affiliated with any government
          organization. All information is gathered from official sources.
        </div>
      </div>
    </footer>
  );
}
