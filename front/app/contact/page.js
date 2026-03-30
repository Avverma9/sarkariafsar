import Link from 'next/link'
import ContactForm from './ContactForm'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'Contact Us | Sarkari Afsar - 24/7 Support for Job Seekers',
  description: 'Get in touch with the Sarkari Afsar support team. We are here to help you with queries regarding government jobs, admit cards, exam results, and welfare schemes.',
  alternates: { canonical: `${SITE_URL}/contact` },
}

export default function ContactPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-blue-200 selection:text-[#1e3a5f]">
      <div className="relative bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white py-24 px-4 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <nav className="text-sm font-medium text-blue-200 mb-6 tracking-wide uppercase">
            <Link href="/" className="hover:text-white transition-colors duration-300">Home</Link> &rsaquo; <span className="text-white">Contact Us</span>
          </nav>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white drop-shadow-lg">
            Get in Touch With Us
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-light max-w-3xl mt-4 leading-relaxed border-l-4 border-[#f59e0b] pl-4">
            Whether you have a question about a recent job notification, need technical assistance, or want to report incorrect information, our dedicated team at Sarkari Afsar is strictly committed to assisting you.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          <div className="lg:col-span-7 space-y-8">
            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 md:p-12 transform transition-all duration-300 hover:shadow-2xl hover:shadow-blue-900/10">
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-2">Send Us a Direct Message</h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                Fill out the form below with your precise query. Our support representatives typically respond within 24 to 48 working hours. Please ensure your email address is correct so we can reach back to you effectively.
              </p>
              <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                <ContactForm />
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8 md:p-12">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 flex items-center gap-3">
                <svg className="w-7 h-7 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Frequently Asked Questions
              </h2>
              <div className="space-y-6">
                {[
                  { q: 'How quickly do you update job notifications?', a: 'Our dedicated research team monitors official government portals 24/7. Updates are typically pushed to our platform within minutes of an official release, accompanied by an AI-generated summary for quick reading.' },
                  { q: 'Can you help me fill out my application form?', a: 'While we provide comprehensive, step-by-step guides and direct official links to apply, we do not fill out applications on behalf of candidates. We highly recommend candidates fill their forms personally to avoid any data entry errors.' },
                  { q: 'Is the information on Sarkari Afsar completely free?', a: 'Yes, absolutely. Our core mission is to democratize employment information. Accessing job updates, downloading admit cards, checking results, and reading our scheme summaries will always remain 100% free for our users.' },
                  { q: 'I found a broken link or incorrect information. What should I do?', a: 'We heavily prioritize accuracy. If you spot an error or a dead link, please select "Report an Error" in the contact form or email us directly at support@sarkariafsar.com. We will rectify it immediately.' }
                ].map((faq, idx) => (
                  <div key={idx} className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                    <h3 className="text-lg font-bold text-[#1e3a5f] mb-3">{faq.q}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-8">
            <div className="bg-gradient-to-br from-[#1e3a5f] to-[#152844] rounded-3xl shadow-2xl p-8 md:p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <h2 className="text-2xl font-bold mb-8 relative z-10 flex items-center gap-3">
                <svg className="w-7 h-7 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                Contact Information
              </h2>
              
              <div className="space-y-8 relative z-10">
                <div className="flex items-start gap-5 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#f59e0b] group-hover:text-white transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm text-blue-200 uppercase tracking-widest font-semibold mb-1">Phone Support</h3>
                    <a href="tel:+919153630507" className="text-xl font-bold hover:text-[#f59e0b] transition-colors block">+91 91536 30507</a>
                    <p className="text-xs text-blue-100/70 mt-2">Available Mon-Sat, 10:00 AM - 6:00 PM (IST)</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#f59e0b] group-hover:text-white transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm text-blue-200 uppercase tracking-widest font-semibold mb-1">Email Address</h3>
                    <a href="mailto:support@sarkariafsar.com" className="text-lg font-bold hover:text-[#f59e0b] transition-colors block">support@sarkariafsar.com</a>
                    <p className="text-xs text-blue-100/70 mt-2">We aim to reply within 24 hours.</p>
                  </div>
                </div>

                <div className="flex items-start gap-5 group">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#f59e0b] group-hover:text-white transition-all duration-300">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-sm text-blue-200 uppercase tracking-widest font-semibold mb-1">Headquarters</h3>
                    <p className="text-base font-medium leading-relaxed">
                      Bakhtiyarpur Purani Bazar<br />
                      Pin Code: 803212<br />
                      Patna, Bihar, India
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4 border-b-2 border-gray-100 pb-4">Why Contact Us?</h2>
              <ul className="space-y-4">
                {[
                  { title: 'Technical Issues', desc: 'Facing problems loading admit cards or results? Let our dev team know.' },
                  { title: 'Content Corrections', desc: 'Found a discrepancy in a job post? We value your vigilant corrections.' },
                  { title: 'Advertising & Partnerships', desc: 'Looking to advertise educational materials or coaching services? Reach out for our media kit.' },
                  { title: 'General Feedback', desc: 'Your suggestions help us build a better platform for all Indian aspirants.' }
                ].map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span className="text-[#f59e0b] mt-1">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    </span>
                    <div>
                      <strong className="block text-gray-800 text-sm">{item.title}</strong>
                      <span className="text-gray-500 text-xs leading-relaxed block mt-1">{item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl border border-amber-200 p-8 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-amber-500/10">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
              </div>
              <h3 className="font-bold text-amber-900 text-xl mb-4 flex items-center gap-2 relative z-10">
                <span className="text-2xl">⚠️</span> Important Disclaimer
              </h3>
              <div className="space-y-4 text-sm text-amber-800/90 leading-relaxed relative z-10 text-justify">
                <p>
                  <strong>Sarkari Afsar is an entirely independent, privately-owned educational information portal.</strong> We are strictly not affiliated, associated, authorized, endorsed by, or in any way officially connected with the Government of India, any State Governments, or any of their agencies, departments, or subsidiaries. 
                </p>
                <p>
                  While our editorial and research teams strive relentlessly to provide highly accurate, completely up-to-date, and thoroughly verified information, we cannot guarantee absolute absolute precision. All content provided on our platform is intended for informational and immediate reference purposes only. 
                </p>
                <p>
                  For any highly specific, official, or legally binding queries regarding recruitment processes, application statuses, or specific scheme enrollments, we strongly advise our users to visit and contact the respective official government portals directly. We will not be held liable for any decisions made based on the provided data.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}