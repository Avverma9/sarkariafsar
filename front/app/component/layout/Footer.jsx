import { Landmark, Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const socialLinks = [];

  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-20 pb-10 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-indigo-600 p-2">
                <Landmark className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight text-white">
                Sarkari<span className="text-indigo-500">Afsar</span>
              </span>
            </div>

            <p className="text-sm font-medium leading-relaxed text-slate-400">
              Reliable information on Government Jobs, Results, Admit Cards and government
              schemes — timely and accurate updates for applicants across India.
            </p>

            {socialLinks.length > 0 ? (
              <div className="flex gap-4">
                {socialLinks.map(({ href, label, Icon, className }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className={className}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black tracking-wide text-white uppercase">
              Quick Links
            </h3>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li>
                <Link href="/post" className="flex items-center gap-2 hover:text-indigo-400">
                  Latest Jobs 2026
                </Link>
              </li>
              <li>
                <Link href="/results" className="flex items-center gap-2 hover:text-indigo-400">
                  All Exam Results
                </Link>
              </li>
              <li>
                <Link
                  href="/admit-cards"
                  className="flex items-center gap-2 hover:text-indigo-400"
                >
                  Download Admit Cards
                </Link>
              </li>
              <li>
                <Link href="/schemes" className="flex items-center gap-2 hover:text-indigo-400">
                  Central Government Schemes
                </Link>
              </li>
              <li>
                <Link href="/blog" className="flex items-center gap-2 hover:text-indigo-400">
                  Latest Blogs
                </Link>
              </li>
              <li>
                <Link href="/about" className="flex items-center gap-2 hover:text-indigo-400">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact-us" className="flex items-center gap-2 hover:text-indigo-400">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black tracking-wide text-white uppercase">
              Legal Pages
            </h3>
            <ul className="space-y-4 text-sm font-medium text-slate-400">
              <li>
                <Link href="/privacy-policy" className="flex items-center gap-2 hover:text-indigo-400">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms-and-conditions"
                  className="flex items-center gap-2 hover:text-indigo-400"
                >
                  Terms and Conditions
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="flex items-center gap-2 hover:text-indigo-400">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="flex items-center gap-2 hover:text-indigo-400">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-black tracking-wide text-white uppercase">
              Contact Us
            </h3>
            <ul className="space-y-5 text-sm font-medium">
              <li className="flex items-start gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
                <Mail className="h-6 w-6 flex-shrink-0 text-indigo-500" />
                <div>
                  <span className="mb-1 block text-xs tracking-wider text-slate-500 uppercase">
                    Email Support
                  </span>
                  <a href="mailto:help@sarkariafsar.com" className="text-white hover:text-indigo-400">
                    support@sarkariafsar.com
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-center md:flex-row">
          <p className="text-sm font-medium text-slate-500">
            © 2026 Sarkariafsar.com. All Rights Reserved.
          </p>
          <div className="flex gap-6 text-sm font-medium text-slate-500">
            <Link href="/about" className="hover:text-white">
              About
            </Link>
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms-and-conditions" className="hover:text-white">
              Terms & Conditions
            </Link>
            <Link href="/blog" className="hover:text-white">
              Blogs
            </Link>
            <Link href="/disclaimer" className="hover:text-white">
              Disclaimer
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
