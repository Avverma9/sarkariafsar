import React from 'react';

export const metadata = {
  title: "About SarkariAfsar | India's Trusted Employment News & Sarkari Result Portal",
  description:
    "SarkariAfsar is a premier job portal for Sarkari Naukri, Competitive Exams, Admit Cards, and Private Vacancies. Learn about our verification process and mission to help Indian job seekers.",
};

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-700">
      {/* --- Header Section --- */}
      <div className="bg-blue-700 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            About SarkariAfsar
          </h1>
          <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
            Bridging the gap between ambition and opportunity. We are India&apos;s fastest-growing hub for Sarkari Naukri and Private Career updates.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-12">
        
        {/* --- Introduction Card --- */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 sm:p-10 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Who We Are</h2>
          <div className="prose prose-blue max-w-none text-gray-600 leading-relaxed">
            <p className="mb-4">
              Founded in 2025, <span className="font-bold text-blue-700">SarkariAfsar</span> was established with a singular vision: to democratize access to employment news in India. In an era of information overload, finding accurate, timely, and verified job notifications can be overwhelming.
            </p>
            <p>
              We are not just a job aggregator; we are a career companion. From fresh graduates looking for their first break in the private sector to aspirants preparing for rigorous government examinations (UPSC, SSC, Banking), SarkariAfsar provides the digital infrastructure to keep you ahead of the competition.
            </p>
          </div>
        </div>

        {/* --- What We Cover (Keyword Rich Grid) --- */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-600">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Coverage</h3>
            <p className="text-sm text-gray-600 mb-4">We provide end-to-end updates for recruitment cycles:</p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <strong>Central Govt Jobs:</strong> UPSC, SSC (CGL, CHSL), Railways (RRB).
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <strong>Banking & PSU:</strong> IBPS PO/Clerk, SBI, LIC, and Public Sector Units.
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <strong>Defence services:</strong> Army, Navy, Airforce, and Police recruitment.
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                <strong>State Exams:</strong> State PSCs, TET, and regional police vacancies.
              </li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Student Resources</h3>
            <p className="text-sm text-gray-600 mb-4">Beyond job postings, we equip you with necessary tools:</p>
            <ul className="space-y-2 text-gray-700 text-sm">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <strong>Admit Cards:</strong> Direct download links as soon as they are released.
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <strong>Results & Cut-offs:</strong> Real-time updates on merit lists.
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <strong>Syllabus & Answer Keys:</strong> Detailed PDF downloads.
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                <strong>Private Sector:</strong> Walk-ins, IT jobs, and off-campus drives.
              </li>
            </ul>
          </div>
        </div>

        {/* --- Trust & Methodology (E-E-A-T) --- */}
        <div className="bg-white rounded-2xl shadow-md p-8 sm:p-10 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Our Verification Process</h2>
          <p className="text-gray-600 mb-6">
            At SarkariAfsar, reliability is our core metric. We understand that a wrong notification can cost a student their career. Here is how we ensure quality:
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-bold text-lg text-gray-800 mb-2">1. Source Tracking</div>
              <p className="text-sm text-gray-600">We monitor over 500+ official government websites and employment gazettes daily.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-bold text-lg text-gray-800 mb-2">2. Fact Checking</div>
              <p className="text-sm text-gray-600">Our content team cross-verifies dates, eligibility criteria, and fee details before publishing.</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="font-bold text-lg text-gray-800 mb-2">3. Simplification</div>
              <p className="text-sm text-gray-600">We convert complex official PDF jargon into easy-to-read tables and bullet points.</p>
            </div>
          </div>
        </div>

        {/* --- FAQ Section (Great for SEO Snippets) --- */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <details className="group bg-white rounded-lg shadow-sm p-4 cursor-pointer">
              <summary className="font-medium text-gray-800 flex justify-between items-center">
                Is SarkariAfsar a government website?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                No, SarkariAfsar is a private informational entity. We are not affiliated with the Government of India or any State Government. We aggregate information from official sources to help job seekers.
              </p>
            </details>
            <details className="group bg-white rounded-lg shadow-sm p-4 cursor-pointer">
              <summary className="font-medium text-gray-800 flex justify-between items-center">
                Do you charge money for job updates?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                Absolutely not. All information on SarkariAfsar is free of cost for students and job seekers.
              </p>
            </details>
            <details className="group bg-white rounded-lg shadow-sm p-4 cursor-pointer">
              <summary className="font-medium text-gray-800 flex justify-between items-center">
                How can I contact the SarkariAfsar team?
                <span className="text-gray-400 group-open:rotate-180 transition-transform">&darr;</span>
              </summary>
              <p className="mt-3 text-gray-600 text-sm">
                You can reach out to us via our Contact Us page or email us at support@sarkariafsar.com for queries regarding advertisements, content corrections, or partnerships.
              </p>
            </details>
          </div>
        </div>

        {/* --- Vital Disclaimer (Required for AdSense/Policy) --- */}
        <div className="bg-red-50 border border-red-100 rounded-xl p-6 text-center">
          <h3 className="text-red-800 font-bold mb-2 uppercase text-sm tracking-wide">Disclaimer</h3>
          <p className="text-red-700 text-xs sm:text-sm leading-relaxed">
            SarkariAfsar represents an independent informational platform. While we strive for absolute accuracy, readers are requested to verify details from the official websites linked in our posts before applying. We are not responsible for any inadvertent errors or selection processes.
          </p>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;
