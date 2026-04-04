import Link from 'next/link'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://sarkariafsar.com'

export const metadata = {
  title: 'About Us — Sarkari Afsar',
  description: 'Discover the story behind Sarkari Afsar. We are India\'s most trusted platform for accurate, lightning-fast updates on government jobs, results, admit cards, and welfare schemes.',
  alternates: { canonical: `${SITE_URL}/about` },
  openGraph: {
    title: 'About Sarkari Afsar — India\'s Government Jobs Portal',
    description: 'India\'s most trusted platform for government jobs, results, admit cards, and welfare schemes.',
    url: `${SITE_URL}/about`,
    siteName: 'Sarkari Afsar',
    images: [{ url: `${SITE_URL}/api/og?title=About+Sarkari+Afsar&type=about`, width: 1200, height: 630, alt: 'About Sarkari Afsar — India\'s Government Jobs Portal' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'About Sarkari Afsar — India\'s Government Jobs Portal', description: 'India\'s most trusted platform for government jobs, results, admit cards, and welfare schemes.', site: '@sarkariafsar' },
}

export default function AboutPage() {
  return (
    <div className="bg-[#f8fafc] min-h-screen font-sans selection:bg-blue-200 selection:text-[#1e3a5f]">
      <div className="relative bg-gradient-to-br from-[#0f2027] via-[#203a43] to-[#2c5364] text-white py-24 px-4 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <nav className="text-sm font-medium text-blue-200 mb-6 tracking-wide uppercase">
            <Link href="/" className="hover:text-white transition-colors duration-300">Home</Link> &rsaquo; <span className="text-white">About Us</span>
          </nav>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-white drop-shadow-lg">
            About Sarkari Afsar
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 font-light max-w-2xl mt-4 leading-relaxed border-l-4 border-[#f59e0b] pl-4">
            Empowering the youth of India with timely, accurate, and comprehensive government employment information. <br/>
            <strong className="text-[#f59e0b] mt-2 inline-block font-semibold">सरकारी खबर, सबसे पहले</strong>
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          <div className="lg:col-span-2 space-y-12">
            
            <section className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-10 transform hover:-translate-y-1 transition-transform duration-300">
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 flex items-center gap-3">
                <svg className="w-8 h-8 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Who We Are
              </h2>
              <div className="space-y-5 text-gray-700 leading-loose text-lg text-justify">
                <p>
                  Welcome to <strong>Sarkari Afsar</strong>, India's most trusted and technologically advanced online portal dedicated entirely to government job seekers, competitive exam aspirants, and citizens looking to benefit from central and state welfare schemes. In a vast country like India, securing a government job (Sarkari Naukri) is not just a career choice; it is a profound dream shared by millions of youths and their families. It represents stability, respect, and an opportunity to serve the nation. However, the path to achieving this dream is often hindered by scattered information, confusing notifications, and delayed updates.
                </p>
                <p>
                  Sarkari Afsar was born out of the necessity to solve this very problem. We recognized the immense struggle candidates face when navigating through poorly designed official websites, trying to decipher complex, multi-page PDF notifications, and constantly living in the fear of missing a crucial deadline. Our platform serves as a unified, highly reliable beacon of information that aggregates, simplifies, and delivers every vital piece of data directly to your screen. 
                </p>
                <p>
                  Whether you are a fresh graduate seeking an entry-level clerk position, a seasoned aspirant aiming for the UPSC civil services, or a citizen from a rural background trying to understand the eligibility criteria for a new Pradhan Mantri Yojana, Sarkari Afsar is designed to be your ultimate digital companion. We pride ourselves on turning bureaucratic jargon into accessible, actionable insights for every Indian.
                </p>
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-10">
              <h2 className="text-3xl font-bold text-[#1e3a5f] mb-6 flex items-center gap-3">
                <svg className="w-8 h-8 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" /></svg>
                What We Offer
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg mb-8">
                Our platform is meticulously categorized to ensure that you spend less time searching and more time preparing. We cover a vast spectrum of categories, making sure no stone is left unturned in your journey toward a secure future.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { title: 'Latest Govt Jobs', desc: 'Real-time updates on SSC, UPSC, Railway, Banking, Defense, and State Police recruitment drives. We provide deep insights into eligibility, age limits, and selection processes.' },
                  { title: 'Admit Cards & Hall Tickets', desc: 'Never miss an exam. We provide direct, fast-loading download links for admit cards the moment they are officially released by the respective recruitment boards.' },
                  { title: 'Exam Results & Keys', desc: 'End your anxiety with lightning-fast result updates. We also provide official and tentative answer keys so you can evaluate your performance immediately after the exam.' },
                  { title: 'Syllabus & Exam Pattern', desc: 'Preparation is half the battle. Access strictly verified, up-to-date syllabi and exam patterns to structure your studies according to the latest official guidelines.' },
                  { title: 'Government Schemes', desc: 'Comprehensive coverage of Central and State Government welfare schemes (Yojanas). We break down who is eligible, what the benefits are, and how to apply step-by-step.' },
                  { title: 'Offline Form Information', desc: 'Not all recruitments are digital. We provide vital information and downloadable application forms for offline cantonment, postal, and defense vacancies.' }
                ].map((item) => (
                  <div key={item.title} className="bg-slate-50 rounded-2xl p-6 border border-slate-100 hover:border-blue-200 transition-colors">
                    <h3 className="text-xl font-bold text-[#1e3a5f] mb-2">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gradient-to-br from-[#1e3a5f] to-[#152844] rounded-3xl shadow-2xl p-10 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
              <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 relative z-10">
                <svg className="w-8 h-8 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                AI-Powered Assistance
              </h2>
              <div className="space-y-5 text-blue-50 leading-loose text-lg relative z-10">
                <p>
                  In a pioneering move within the government job portal space, Sarkari Afsar integrates cutting-edge <strong>Google Gemini AI technology</strong> to revolutionize how you consume employment news. Official notifications are notoriously long, often running into dozens of pages filled with complex legal and administrative language.
                </p>
                <p>
                  Our advanced AI engine automatically scans, analyzes, and summarizes these exhaustive PDF documents. It instantly generates crisp, highly accurate bullet points outlining crucial dates, exact fee structures for different categories, precise educational qualifications, and physical standard requirements. Furthermore, it creates intuitive, context-aware FAQs for every job post and government scheme, preemptively answering the most common doubts candidates might have. This ensures you grasp the essence of the notification in less than two minutes, saving you hours of frustrating reading and helping you apply faster with total confidence.
                </p>
              </div>
            </section>

          </div>

          <div className="space-y-10">
            
            <section className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 border-b-2 border-gray-100 pb-4">Our Mission & Vision</h2>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-[#f59e0b] mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    The Mission
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm text-justify">
                    To completely bridge the critical information gap between government recruitment bodies and diligent job seekers across the vast geography of India. We are committed to democratizing access to employment data, ensuring that every eligible individual, regardless of their location or socioeconomic background, receives timely, accurate, and easily digestible information about government opportunities and welfare initiatives.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#f59e0b] mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                    The Vision
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-sm text-justify">
                    To be universally recognized as the absolute gold standard and the foremost digital authority for public sector employment news in India. We envision a future where Sarkari Afsar is synonymous with success in government exams, powered by relentless technological innovation, unwavering editorial integrity, and a deeply user-centric approach that continuously evolves to meet the changing dynamics of the Indian job market.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 border-b-2 border-gray-100 pb-4">Our Core Values</h2>
              <ul className="space-y-4">
                {[
                  { label: 'Accuracy Above All', desc: 'Every piece of data is cross-verified against official sources before publication.' },
                  { label: 'Lightning Speed', desc: 'We utilize advanced caching and monitoring to deliver updates the second they go live.' },
                  { label: 'Unwavering Trust', desc: 'We never promote fake news, clickbait, or unverified rumors. Your career is too important.' },
                  { label: 'Inclusivity', desc: 'Designed to work flawlessly on basic smartphones and slower network connections in rural areas.' }
                ].map((val) => (
                  <li key={val.label} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-[#1e3a5f] block mb-1">{val.label}</strong>
                    <span className="text-gray-600 text-sm leading-relaxed">{val.desc}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-white rounded-3xl shadow-xl shadow-blue-900/5 border border-gray-100 p-8">
              <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 border-b-2 border-gray-100 pb-4">Coverage & Impact</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { value: '10,000+', label: 'Active Job Posts' },
                  { value: '500+', label: 'Gov. Schemes Covered' },
                  { value: '28+', label: 'States & UTs Tracked' },
                  { value: '1 Lakh+', label: 'Daily Aspirants' },
                ].map((s) => (
                  <div key={s.label} className="text-center bg-blue-50/50 rounded-2xl p-4 border border-blue-100/50">
                    <div className="text-2xl font-extrabold text-[#1e3a5f]">{s.value}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-2 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-3xl shadow-xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-6 border-b border-white/20 pb-4 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                Connect With Us
              </h2>
              <p className="text-white/90 text-sm leading-relaxed mb-6 text-justify">
                We operate with complete transparency from our headquarters in Bihar. Our dedicated support staff is always ready to assist you with queries regarding the website, partnerships, or reporting data discrepancies. We heavily prioritize human review for all critical details, ensuring you can rely on us completely.
              </p>
              <div className="space-y-4 bg-white/10 p-5 rounded-2xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Call Us</p>
                    <a href="tel:+919153630507" className="font-bold text-lg hover:text-blue-900 transition-colors">+91 91536 30507</a>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Email Us</p>
                    <a href="mailto:support@sarkariafsar.com" className="font-bold hover:text-blue-900 transition-colors">support@sarkariafsar.com</a>
                  </div>
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/70 uppercase tracking-wider font-semibold mb-1">Headquarters</p>
                    <p className="font-medium text-sm leading-snug">
                      Bakhtiyarpur Purani Bazar<br />
                      Pin Code: 803212<br />
                      Patna, Bihar, India
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        <div className="mt-16 bg-[#1e3a5f] rounded-3xl p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 relative z-10">Ready to Start Your Sarkari Journey?</h2>
          <p className="text-blue-200 text-lg max-w-2xl mx-auto mb-8 relative z-10">
            Join hundreds of thousands of successful candidates who rely on Sarkari Afsar daily. Your dream government job is just a click away. Let us guide you to success.
          </p>
          <div className="relative z-10 flex flex-wrap justify-center gap-4">
            <Link href="/" className="bg-[#f59e0b] hover:bg-[#d97706] text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-lg">
              Explore Latest Jobs
            </Link>
            <Link href="/contact" className="bg-transparent border-2 border-white/30 hover:border-white text-white font-bold py-4 px-8 rounded-full shadow-lg transform hover:-translate-y-1 transition-all duration-300 text-lg">
              Contact Support
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}