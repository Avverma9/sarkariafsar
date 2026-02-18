import React from 'react';
import { Mail, MapPin, Phone, Clock, ShieldAlert, Megaphone, FileQuestion, ExternalLink } from 'lucide-react';

export const metadata = {
  title: "Contact SarkariAfsar | Support & Office Location",
  description:
    "Contact SarkariAfsar Support in Bakhtiyarpur, Patna. Call us at +91-9153630507 for advertising, job notification corrections, or Sarkari Naukri queries.",
};

const ContactPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-700">
      <div className="max-w-7xl mx-auto">
        
        {/* --- Header Section --- */}
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
            We&apos;d Love to Hear From You
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Whether you are a student facing issues with a download, an employer wanting to post a job, or just want to say hello - our team in Patna is ready to answer.
          </p>
        </div>

        {/* --- Main Content Grid --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Left Column: Contact Details (High Visibility) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Contact Card */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4">Contact Information</h2>
              
              <div className="space-y-6">
                {/* Phone */}
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Phone & WhatsApp</p>
                    <a href="tel:+919153630507" className="text-lg text-gray-700 hover:text-blue-600 font-medium block mt-1">
                      +91 91536 30507
                    </a>
                    <p className="text-xs text-gray-500 mt-1">Mon-Sat, 10am - 7pm</p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Email Support</p>
                    <a href="mailto:support@sarkariafsar.com" className="text-gray-700 hover:text-blue-600 block mt-1 break-all">
                      support@sarkariafsar.com
                    </a>
                    <a href="mailto:ads@sarkariafsar.com" className="text-sm text-gray-500 hover:text-blue-600 block mt-1">
                      For Advertising Queries
                    </a>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-4 group">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Head Office</p>
                    <address className="text-gray-700 not-italic mt-1 leading-relaxed">
                      Bakhtiyarpur,<br />
                      Patna, Bihar - 803212<br />
                      India
                    </address>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Maps Embed Placeholder (Great for Local SEO) */}
            <div className="bg-gray-200 rounded-2xl h-64 overflow-hidden shadow-inner relative group">
              {/* Replace the src below with your actual Google Maps Embed link for Bakhtiyarpur */}
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3600.0!2d85.5!3d25.4!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3ABakhtiyarpur!5e0!3m2!1sen!2sin!4v1600000000000" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy"
                title="SarkariAfsar Office Location"
                className="opacity-80 group-hover:opacity-100 transition-opacity"
              ></iframe>
              <div className="absolute bottom-4 left-4">
                 <a 
                   href="https://maps.google.com/?q=Bakhtiyarpur,Patna,Bihar,803212" 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="inline-flex items-center gap-2 px-4 py-2 bg-white text-gray-900 text-sm font-bold rounded-lg shadow-lg hover:bg-gray-50"
                 >
                   <ExternalLink className="w-4 h-4" /> Open in Maps
                 </a>
              </div>
            </div>

          </div>

          {/* Right Column: Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 sm:p-12 h-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Send us a Message</h2>
              <p className="text-gray-500 mb-8">We usually respond within 24 hours.</p>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-bold text-gray-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="e.g. Rahul Kumar"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                    <input
                      type="email"
                      id="email"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label htmlFor="topic" className="block text-sm font-bold text-gray-700 mb-2">Purpose</label>
                    <select
                      id="topic"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-600"
                    >
                      <option>Report Error / Broken Link</option>
                      <option>Business / Advertisement</option>
                      <option>General Inquiry</option>
                      <option>Technical Issue</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-gray-700 mb-2">Your Message</label>
                  <textarea
                    id="message"
                    rows="5"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
                    placeholder="Describe your issue or inquiry here..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200 flex justify-center items-center gap-2"
                >
                  <Mail className="w-5 h-5" /> Send Message
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* --- Trust Factors (SEO Rich Snippets) --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
            <div className="bg-red-50 p-3 rounded-full text-red-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Spotted an Error?</h3>
              <p className="text-sm text-gray-600 mt-1">
                We take accuracy seriously. If a job result or admit card link is broken, report it above for a fix within 2 hours.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
            <div className="bg-green-50 p-3 rounded-full text-green-600">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Advertise in Bihar</h3>
              <p className="text-sm text-gray-600 mt-1">
                Reach lakhs of students in Bihar and across India. Call <span className="font-semibold text-gray-800">9153630507</span> for banner ad rates.
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex gap-4 items-start">
            <div className="bg-purple-50 p-3 rounded-full text-purple-600">
              <FileQuestion className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Form Filling Help</h3>
              <p className="text-sm text-gray-600 mt-1">
                Need help filling a complex form? Visit our office in Bakhtiyarpur or email us for guidance.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;
