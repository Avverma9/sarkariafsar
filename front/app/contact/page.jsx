import Header from '../components/header';
import Footer from '../components/footer';
import Link from 'next/link';
import Breadcrumb from '../components/Breadcrumb';

export const metadata = {
  title: 'Contact',
  description:
    'Contact SarkariAfsar for corrections, support, advertising inquiries, and editorial feedback.',
  alternates: { canonical: '/contact' },
  openGraph: {
    title: 'Contact - SarkariAfsar',
    description:
      'Contact SarkariAfsar for corrections, support, advertising inquiries, and editorial feedback.',
    url: '/contact',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Contact - SarkariAfsar',
    description:
      'Reach the SarkariAfsar editorial team for support and corrections.',
  },
};

export default function ContactPage() {
  return (
    <>
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-r from-slate-800 via-slate-900 to-indigo-900 text-white py-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Breadcrumb 
              theme="dark" 
              items={[
                { label: "Home", href: "/" }, 
                { label: "Contact" }
              ]} 
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
            Get In Touch
          </h1>
          <p className="text-xl text-slate-300">
            Questions about jobs, feedback, or suggestions? We're here to help.
          </p>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          
          {/* Contact Details */}
          <div className="space-y-6 md:space-y-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
                Contact Information
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed">
                Reach out for job updates, report issues, advertising, or just to say hello.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { 
                  icon: "📍", 
                  title: "Address", 
                  info: "Bakhtiyarpur, Patna, Bihar - 803212"
                },
                { 
                  icon: "📞", 
                  title: "Phone", 
                  info: "+91 9153630507",
                  extra: "Call and WhatsApp support"
                },
                { 
                  icon: "✉️", 
                  title: "Email", 
                  info: "support@sarkariafsar.com"
                },
                { 
                  icon: "🕒", 
                  title: "Hours", 
                  info: "Mon–Sat: 9 AM – 6 PM IST"
                },
              ].map((item) => (
                <div key={item.title} className="flex items-start gap-4 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200 hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg mt-1 flex-shrink-0">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800 text-base mb-1">{item.title}</h3>
                    <p className="font-bold text-slate-700 text-sm">{item.info}</p>
                    {item.extra && <p className="text-xs text-slate-500 mt-1">{item.extra}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Links */}
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 md:p-10 border border-slate-200 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Quick Support</h2>
            
            <div className="space-y-4 mb-8">
              <div className="p-5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
                <h3 className="font-bold text-emerald-800 mb-2 flex items-center gap-2">
                  🚀 Report Job Update
                </h3>
                <p className="text-sm text-emerald-700">
                  Found a new notification? Share the official link with us.
                </p>
              </div>
              
              <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <h3 className="font-bold text-blue-800 mb-2 flex items-center gap-2">
                  📢 Advertising
                </h3>
                <p className="text-sm text-blue-700">
                  Promote coaching, books, or apps to 50K+ job seekers daily.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200">
              <a 
                href="mailto:support@sarkariafsar.com?subject=Job%20Query"
                className="block p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold text-center rounded-xl hover:shadow-lg hover:from-violet-700 hover:to-indigo-700 transition-all text-sm"
              >
                Email Editorial Desk
              </a>
              <a 
                href="https://wa.me/919153630507?text=Hi%20SarkariAfsar%2C%20I%20have%20a%20question%20about..."
                className="block p-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold text-center rounded-xl hover:shadow-lg hover:from-green-700 hover:to-emerald-700 transition-all text-sm"
              >
                WhatsApp Now
              </a>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-200 text-center text-sm space-y-2">
              <p className="text-slate-600">
                Legal and privacy requests: <a href="mailto:support@sarkariafsar.com" className="font-semibold text-violet-700 hover:underline">support@sarkariafsar.com</a>
              </p>
              <div className="flex flex-wrap gap-4 justify-center text-xs pt-2">
                <Link href="/privacy-policy" className="text-slate-700 font-medium hover:underline">Privacy Policy</Link>
                <Link href="/terms" className="text-slate-700 font-medium hover:underline">Terms</Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
