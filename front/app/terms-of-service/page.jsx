import React from 'react';
import { Scale, FileText, AlertTriangle, ExternalLink, ShieldCheck, Gavel, MapPin } from 'lucide-react';
import { buildMetadata } from "../lib/seo";

export const metadata = buildMetadata({
  title: "Terms and Conditions",
  description:
    "Read SarkariAfsar terms, non-government disclaimer, liability scope, and user responsibilities.",
  path: "/terms-of-service",
  type: "WebPage",
  keywords: ["terms and conditions", "user agreement", "non government disclaimer"],
});

const TermsPage = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-700">
      <div className="max-w-5xl mx-auto">
        
        {/* --- Header Section --- */}
        <div className="bg-white rounded-t-2xl shadow-sm border border-gray-100 p-8 sm:p-12 border-b-4 border-blue-600">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Scale className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Terms and Conditions</h1>
              <p className="text-gray-500 mt-1">Last Updated: January 20, {currentYear}</p>
            </div>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            Welcome to <strong>SarkariAfsar</strong>. By accessing this website (https://sarkariafsar.com), we assume you accept these terms and conditions in full. Do not continue to use SarkariAfsar if you do not agree to all of the terms and conditions stated on this page.
          </p>
        </div>

        {/* --- Main Content --- */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-10">

          {/* 1. Vital Disclaimer (Most Important for Job Sites) */}
          <section className="bg-red-50 p-6 rounded-xl border border-red-100">
            <h2 className="text-xl font-bold text-red-700 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              1. Non-Government Affiliation Disclaimer
            </h2>
            <p className="text-gray-800 font-medium mb-2">
              SarkariAfsar is a privately owned information portal and is NOT affiliated with the Government of India, any State Government, or any Public Sector Undertaking (PSU).
            </p>
            <p className="text-gray-700 text-sm leading-relaxed">
              We aggregate information from official government sources (websites, employment gazettes, and press releases) to facilitate easy access for students. While we strive for accuracy, we do not claim to represent any government body. Users are strictly advised to verify all details (dates, fees, eligibility) from the official notification links provided in our posts before applying.
            </p>
          </section>

          {/* 2. Intellectual Property */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. Intellectual Property Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Unless otherwise stated, SarkariAfsar and/or its licensors own the intellectual property rights for all material on SarkariAfsar. All intellectual property rights are reserved. You may access this from SarkariAfsar for your own personal use subjected to restrictions set in these terms and conditions.
              </p>
              <p className="font-semibold text-gray-700 mb-2">You must not:</p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li>Republish material from SarkariAfsar on other websites or apps.</li>
                <li>Sell, rent, or sub-license material from SarkariAfsar.</li>
                <li>Reproduce, duplicate, or copy material from SarkariAfsar for commercial gain.</li>
                <li>Redistribute content from SarkariAfsar (unless content is specifically made for redistribution).</li>
              </ul>
            </div>
          </section>

          {/* 3. Accuracy & Liability */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <ShieldCheck className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Accuracy of Information & Liability</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                The information provided on SarkariAfsar is for general informational purposes only. While we endeavor to keep the information up to date and correct, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability with respect to the website.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 border-l-4 border-gray-400">
                <strong>Limitation of Liability:</strong> In no event shall SarkariAfsar be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website. If a user misses a deadline or pays a fee to a fake entity due to confusion, SarkariAfsar shall not be held responsible.
              </div>
            </div>
          </section>

          {/* 4. External Links */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <ExternalLink className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">4. External Links & Third Parties</h2>
              <p className="text-gray-600 leading-relaxed">
                Through this website, you are able to link to other websites (e.g., upsc.gov.in, ibps.in) which are not under the control of SarkariAfsar. We have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorse the views expressed within them.
              </p>
            </div>
          </section>

          {/* 5. Governing Law */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <Gavel className="w-6 h-6 text-gray-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Governing Law & Jurisdiction</h2>
              <p className="text-gray-600 leading-relaxed">
                These terms and conditions are governed by and construed in accordance with the laws of India. Any dispute arising out of or related to the use of this website shall be subject to the exclusive jurisdiction of the courts located in <strong>Patna, Bihar</strong>.
              </p>
            </div>
          </section>

          {/* Contact Footer */}
          <section className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Contact for Legal Notices</h2>
            <div className="flex flex-col md:flex-row gap-8 text-gray-600 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                <address className="not-italic">
                  <strong>SarkariAfsar Legal Dept.</strong><br />
                  Bakhtiyarpur, Patna<br />
                  Bihar, India - 803212
                </address>
              </div>
              <div>
                <p><strong>Phone:</strong> +91 91536 30507</p>
                <p><strong>Email:</strong> support@sarkariafsar.com</p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsPage;
