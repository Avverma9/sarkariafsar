import Link from 'next/link'

export const metadata = {
  title: 'About Us - Sarkari Afsar',
  description: 'Learn about Sarkari Afsar, India\'s trusted portal for government jobs, schemes, results and admit cards.',
}

export default function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">About</span>
          </nav>
          <h1 className="text-3xl font-bold">About Sarkari Afsar</h1>
          <p className="text-blue-200 mt-2">सरकारी खबर, सबसे पहले</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">Who We Are</h2>
            <p className="text-gray-600 leading-relaxed">
              <strong>Sarkari Afsar</strong> is India's most trusted online portal for government job seekers and citizens looking for government welfare schemes. We provide timely, accurate, and comprehensive information about:
            </p>
            <ul className="mt-3 space-y-2 text-gray-600">
              {['Latest government job notifications', 'Exam results and answer keys', 'Admit cards and hall tickets', 'Government welfare schemes (Yojana)', 'State and central government job updates'].map(item => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-[#f59e0b] font-bold mt-0.5">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">
              Our mission is to bridge the information gap between government job notifications and job seekers across India. We believe every eligible Indian deserves timely information about government employment opportunities and welfare schemes — presented clearly, accurately, and in a user-friendly manner.
            </p>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">AI-Powered Assistance</h2>
            <p className="text-gray-600 leading-relaxed">
              We use cutting-edge Google Gemini AI technology to provide instant summaries and FAQs for every job post and government scheme, helping you understand complex notifications quickly and easily.
            </p>
          </div>

          <div className="bg-blue-50 rounded-xl p-5">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">Our Team</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { name: 'Editorial Team', role: 'Content & Research', desc: 'Our team of expert researchers monitors official government websites 24/7 to bring you the latest updates.' },
                { name: 'Tech Team', role: 'Platform & AI', desc: 'Our developers ensure fast, reliable, and accurate delivery of information using modern AI technologies.' },
              ].map(member => (
                <div key={member.name} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="w-12 h-12 bg-[#1e3a5f] rounded-full flex items-center justify-center text-white font-bold text-lg mb-3">
                    {member.name[0]}
                  </div>
                  <h3 className="font-semibold text-gray-800">{member.name}</h3>
                  <p className="text-xs text-[#f59e0b] font-medium mb-2">{member.role}</p>
                  <p className="text-xs text-gray-500">{member.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-3">Coverage</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: '10,000+', label: 'Job Posts' },
                { value: '500+', label: 'Gov. Schemes' },
                { value: '28+', label: 'States' },
                { value: '1 Lakh+', label: 'Daily Visitors' },
              ].map(s => (
                <div key={s.label} className="text-center bg-blue-50 rounded-xl p-4">
                  <div className="text-2xl font-bold text-[#1e3a5f]">{s.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
