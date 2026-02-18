import React from 'react';
import { Shield, Lock, Eye, Server, Cookie, Globe, Mail, UserCheck, Database, AlertCircle } from 'lucide-react';

export const metadata = {
  title: "Privacy Policy | SarkariAfsar - Data Protection & Cookie Policy",
  description:
    "Read the Privacy Policy of SarkariAfsar. Understand how we handle your data, use cookies for AdSense, and protect your privacy while you search for Sarkari Naukri.",
};

const PrivacyPolicy = () => {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-700">
      <div className="max-w-5xl mx-auto">

        {/* --- Header Section --- */}
        <div className="bg-white rounded-t-2xl shadow-sm border border-gray-100 p-8 sm:p-12 border-b-4 border-blue-600">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-blue-100 text-blue-700 rounded-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Privacy Policy</h1>
              <p className="text-gray-500 mt-1">Last Updated: February 12, {currentYear}</p>
            </div>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed">
            At <strong>SarkariAfsar</strong> (accessible from <a href="https://sarkariafsar.com" className="text-blue-600 hover:underline">https://sarkariafsar.com</a>), we are committed to protecting your privacy. This Privacy Policy explains what information we collect, how we use it, and your rights regarding your personal data. By using SarkariAfsar, you agree to the collection and use of information in accordance with this policy.
          </p>
        </div>

        {/* --- Main Content --- */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-gray-100 p-8 sm:p-12 space-y-10">

          {/* 1. Information We Collect */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">1.1 Personal Information</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                When you subscribe to our job alerts, contact us, or use certain features, we may collect:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mb-4">
                <li><strong>Name:</strong> To personalize communications</li>
                <li><strong>Email Address:</strong> To send job notifications and updates</li>
                <li><strong>Phone Number:</strong> If you contact us directly (optional)</li>
                <li><strong>Resume/Documents:</strong> If you use our resume builder tool (stored locally on your device only)</li>
              </ul>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">1.2 Automatically Collected Information</h3>
              <p className="text-gray-600 leading-relaxed mb-3">
                When you visit SarkariAfsar, we automatically collect certain information through cookies and similar technologies:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600">
                <li><strong>IP Address:</strong> To understand geographic location and prevent fraud</li>
                <li><strong>Browser Type & Version:</strong> To optimize website performance</li>
                <li><strong>Device Information:</strong> Device type, operating system, screen resolution</li>
                <li><strong>Pages Visited:</strong> Which job listings, admit cards, or results you view</li>
                <li><strong>Time & Date of Visit:</strong> To analyze traffic patterns</li>
                <li><strong>Referring Website:</strong> How you found SarkariAfsar</li>
              </ul>
            </div>
          </section>

          {/* 2. How We Use Your Information */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <UserCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We use the collected information for the following purposes:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>To Provide Services:</strong> Deliver job notifications, admit card alerts, and result updates via email or SMS</li>
                <li><strong>To Improve User Experience:</strong> Analyze site usage to enhance navigation, content, and features</li>
                <li><strong>To Personalize Content:</strong> Show relevant job listings based on your preferences and browsing history</li>
                <li><strong>To Communicate:</strong> Send newsletters, important updates, and respond to your inquiries</li>
                <li><strong>To Display Advertisements:</strong> Show relevant ads through Google AdSense and other advertising partners</li>
                <li><strong>To Prevent Fraud:</strong> Detect and prevent spam, abuse, and security threats</li>
                <li><strong>To Comply with Legal Obligations:</strong> Respond to legal requests and prevent illegal activities</li>
              </ul>
            </div>
          </section>

          {/* 3. Cookies and Tracking Technologies */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <Cookie className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">3. Cookies and Tracking Technologies</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                SarkariAfsar uses cookies and similar tracking technologies to enhance your browsing experience. Cookies are small text files stored on your device that help us remember your preferences and improve site functionality.
              </p>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Types of Cookies We Use:</h3>

              <div className="space-y-3 mb-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-1">Essential Cookies (Required)</h4>
                  <p className="text-sm text-gray-600">
                    Necessary for website functionality, security, and basic features like navigation. These cannot be disabled.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-1">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600">
                    We use <strong>Google Analytics</strong> to understand how visitors interact with our site. This helps us improve content and user experience. These cookies collect anonymous data like page views, session duration, and traffic sources.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-1">Advertising Cookies (Google AdSense)</h4>
                  <p className="text-sm text-gray-600">
                    We use <strong>Google AdSense</strong> to display advertisements. Google uses cookies to serve ads based on your interests and previous visits to our site and other websites. These are called personalized or interest-based ads.
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-1">Preference Cookies</h4>
                  <p className="text-sm text-gray-600">
                    Remember your settings like language preference, theme selection, and previously viewed jobs to provide a personalized experience.
                  </p>
                </div>
              </div>

              <h3 className="font-semibold text-gray-800 mt-4 mb-2">Managing Cookies:</h3>
              <p className="text-gray-600 leading-relaxed">
                You can control and manage cookies through your browser settings. Most browsers allow you to refuse cookies or delete existing cookies. However, disabling cookies may affect website functionality and your user experience. To opt-out of personalized ads from Google, visit <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Ads Settings</a>.
              </p>
            </div>
          </section>

          {/* 4. Third-Party Services & Google AdSense */}
          <section className="bg-blue-50 p-6 rounded-xl border border-blue-100">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              4. Third-Party Services & Google AdSense
            </h2>

            <h3 className="font-semibold text-gray-800 mt-4 mb-2">4.1 Google AdSense</h3>
            <p className="text-gray-700 leading-relaxed mb-3">
              SarkariAfsar uses <strong>Google AdSense</strong>, a third-party advertising service, to display ads on our website. Google AdSense uses cookies (including the <strong>DoubleClick DART cookie</strong>) to serve ads based on your visit to SarkariAfsar and other websites across the internet.
            </p>
            <p className="text-gray-700 leading-relaxed mb-3">
              Google may collect information such as:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-3">
              <li>Your IP address</li>
              <li>Browser type and version</li>
              <li>Pages you visit on SarkariAfsar</li>
              <li>Time spent on pages</li>
              <li>Other websites you visit (to show relevant ads)</li>
            </ul>
            <p className="text-gray-700 leading-relaxed mb-3">
              <strong>You can opt-out of personalized advertising by visiting:</strong>
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-700 mb-3">
              <li><a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">Google Ads Settings</a></li>
              <li><a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">Digital Advertising Alliance Opt-Out</a></li>
              <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">European Interactive Digital Advertising Alliance</a></li>
            </ul>
            <p className="text-gray-700 leading-relaxed">
              For more information about Google&apos;s data practices, review <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">How Google uses data when you use our partners&apos; sites or apps</a>.
            </p>

            <h3 className="font-semibold text-gray-800 mt-6 mb-2">4.2 Google Analytics</h3>
            <p className="text-gray-700 leading-relaxed">
              We use Google Analytics to analyze website traffic and user behavior. Google Analytics uses cookies to collect anonymous data. You can opt-out by installing the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-blue-700 underline hover:text-blue-900">Google Analytics Opt-Out Browser Add-on</a>.
            </p>

            <h3 className="font-semibold text-gray-800 mt-6 mb-2">4.3 Other Advertising Partners</h3>
            <p className="text-gray-700 leading-relaxed">
              We may work with other advertising networks in the future. Each partner has their own privacy policy. We will update this page and notify users of any new partnerships.
            </p>
          </section>

          {/* 5. Data Sharing and Disclosure */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <Server className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                SarkariAfsar does not sell, rent, or trade your personal information to third parties. However, we may share information in the following circumstances:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>With Service Providers:</strong> We share data with trusted third parties like Google (AdSense, Analytics), email service providers, and hosting companies to operate our website</li>
                <li><strong>For Legal Compliance:</strong> If required by law, court order, or government request, we may disclose information</li>
                <li><strong>To Protect Rights:</strong> We may share data to enforce our terms, protect against fraud, or safeguard user safety</li>
                <li><strong>Business Transfers:</strong> If SarkariAfsar is acquired or merged, user data may be transferred to the new owner</li>
                <li><strong>With Your Consent:</strong> We may share information for purposes you explicitly approve</li>
              </ul>
            </div>
          </section>

          {/* 6. Data Security */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <Lock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">6. Data Security</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                We implement industry-standard security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. These measures include:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-600 mb-3">
                <li><strong>SSL/TLS Encryption:</strong> All data transmitted between your browser and our servers is encrypted</li>
                <li><strong>Secure Servers:</strong> Our website is hosted on secure, monitored servers</li>
                <li><strong>Access Controls:</strong> Only authorized personnel have access to personal data</li>
                <li><strong>Regular Security Audits:</strong> We periodically review our security practices</li>
              </ul>
              <p className="text-gray-600 leading-relaxed">
                However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </div>
          </section>

          {/* 7. Your Data Protection Rights (GDPR & CCPA Compliance) */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">7. Your Data Protection Rights (GDPR & CCPA Compliance)</h2>
              <p className="text-gray-600 leading-relaxed mb-3">
                Depending on your location, you may have the following rights regarding your personal data:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you</li>
                <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data</li>
                <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request deletion of your personal data under certain conditions</li>
                <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service provider in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to processing of your data for direct marketing or legitimate interests</li>
                <li><strong>Right to Withdraw Consent:</strong> If processing is based on consent, you can withdraw it anytime</li>
                <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                To exercise any of these rights, please contact us at <a href="mailto:support@sarkariafsar.com" className="text-blue-600 hover:underline">support@sarkariafsar.com</a>. We will respond within 30 days.
              </p>
            </div>
          </section>

          {/* 8. Data Retention */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. Data Retention</h2>
            <p className="text-gray-600 leading-relaxed mb-3">
              We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li><strong>Email Subscription Data:</strong> Until you unsubscribe or request deletion</li>
              <li><strong>Analytics & Log Data:</strong> Typically 26 months (Google Analytics default)</li>
              <li><strong>Cookies:</strong> Varies by type (session cookies expire when you close browser; persistent cookies may last up to 2 years)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed mt-3">
              After the retention period, we securely delete or anonymize your data.
            </p>
          </section>

          {/* 9. Children&apos;s Privacy */}
          <section className="flex gap-4">
            <div className="shrink-0 mt-1 hidden sm:block">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">9. Children&apos;s Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                SarkariAfsar is intended for users aged 16 and above. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately at <a href="mailto:support@sarkariafsar.com" className="text-blue-600 hover:underline">support@sarkariafsar.com</a>. We will promptly delete such information from our records.
              </p>
            </div>
          </section>

          {/* 10. International Data Transfers */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">10. International Data Transfers</h2>
            <p className="text-gray-600 leading-relaxed">
              SarkariAfsar is operated from India. If you access our website from outside India, your information may be transferred to, stored, and processed in India or other countries where our service providers operate. These countries may have different data protection laws than your jurisdiction. By using SarkariAfsar, you consent to such transfers.
            </p>
          </section>

          {/* 11. Do Not Track (DNT) Signals */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">11. Do Not Track (DNT) Signals</h2>
            <p className="text-gray-600 leading-relaxed">
              Some browsers have a &quot;Do Not Track&quot; (DNT) feature that signals websites you visit that you do not want your online activity tracked. Currently, there is no industry standard for how to respond to DNT signals. SarkariAfsar does not currently respond to DNT browser signals, but you can opt-out of tracking through cookie settings and Google Ads preferences.
            </p>
          </section>

          {/* 12. Changes to This Privacy Policy */}
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">12. Changes to This Privacy Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or service features. When we make significant changes, we will notify you by:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-600 mt-2 mb-3">
              <li>Posting the updated policy on this page with a new &quot;Last Updated&quot; date</li>
              <li>Sending an email notification to registered users (for material changes)</li>
            </ul>
            <p className="text-gray-600 leading-relaxed">
              We encourage you to review this Privacy Policy periodically. Your continued use of SarkariAfsar after changes are posted constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* 13. Contact Us */}
          <section className="border-t border-gray-200 pt-8 mt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">13. Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions, concerns, or requests regarding this Privacy Policy or how we handle your personal data, please contact us:
            </p>

            <div className="grid md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Mailing Address:</h3>
                <address className="text-gray-600 not-italic text-sm leading-relaxed">
                  SarkariAfsar - Legal & Privacy Team<br />
                  Bakhtiyarpur, Patna<br />
                  Bihar, India - 803212
                </address>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Digital Contact:</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-600" /> 
                    <a href="mailto:support@sarkariafsar.com" className="text-blue-600 hover:underline">support@sarkariafsar.com</a>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-semibold">Phone:</span> 
                    <a href="tel:+919153630507" className="text-blue-600 hover:underline">+91-9153630507</a>
                  </p>
                  <p className="text-xs text-gray-500 mt-2">
                    Response Time: We aim to respond to all privacy inquiries within 48-72 hours.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Footer Note */}
          <section className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
            <p className="text-sm text-gray-700 leading-relaxed">
              <strong>Note:</strong> This Privacy Policy is compliant with Google AdSense requirements, GDPR (General Data Protection Regulation), and CCPA (California Consumer Privacy Act). By using SarkariAfsar, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;