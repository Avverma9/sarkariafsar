'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    // In real app, this would send to backend
    setSent(true)
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="bg-[#1e3a5f] text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav className="text-sm text-blue-300 mb-3">
            <Link href="/" className="hover:text-white">Home</Link> &rsaquo; <span className="text-white">Contact</span>
          </nav>
          <h1 className="text-3xl font-bold">Contact Us</h1>
          <p className="text-blue-200 mt-2">We'd love to hear from you. Reach out with any queries.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-[#1e3a5f] mb-5">Send a Message</h2>
            {sent ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-3">✅</div>
                <h3 className="font-semibold text-gray-800 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm">We'll get back to you within 24-48 hours.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
                  <input
                    type="text" required
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    placeholder="Your full name"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
                  <input
                    type="email" required
                    value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    placeholder="your@email.com"
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
                  <textarea
                    required rows={4}
                    value={form.message} onChange={e => setForm({...form, message: e.target.value})}
                    placeholder="Write your message here..."
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 resize-none"
                  />
                </div>
                <button type="submit" className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#153060] transition-colors">
                  Send Message
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-bold text-[#1e3a5f] mb-4">Contact Information</h2>
              <div className="space-y-3">
                {[
                  { icon: '📧', label: 'Email', value: 'contact@sarkariafsar.com' },
                  { icon: '🌐', label: 'Website', value: 'sarkariafsar.com' },
                  { icon: '📅', label: 'Response Time', value: 'Within 24-48 hours' },
                ].map(item => (
                  <div key={item.label} className="flex items-start gap-3">
                    <span className="text-xl">{item.icon}</span>
                    <div>
                      <div className="text-xs text-gray-500">{item.label}</div>
                      <div className="text-sm font-medium text-gray-700">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-5">
              <h3 className="font-semibold text-amber-800 mb-2">⚠️ Disclaimer</h3>
              <p className="text-sm text-amber-700">
                Sarkari Afsar is an independent information portal. We are not affiliated with any government department. For official queries, please contact the respective government department directly.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
