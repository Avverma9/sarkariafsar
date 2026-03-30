'use client'
import { useState } from 'react'

export default function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('https://formspree.io/f/support@sarkariafsar.com', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name: form.name, email: form.email, message: form.message }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        window.location.href = `mailto:support@sarkariafsar.com?subject=Message from ${encodeURIComponent(form.name)}&body=${encodeURIComponent(form.message)}%0A%0AFrom: ${encodeURIComponent(form.email)}`
        setSent(true)
      }
    } catch {
      window.location.href = `mailto:support@sarkariafsar.com?subject=Message from ${encodeURIComponent(form.name)}&body=${encodeURIComponent(form.message)}%0A%0AFrom: ${encodeURIComponent(form.email)}`
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-3">✅</div>
        <h3 className="font-semibold text-gray-800 mb-2">Message Sent!</h3>
        <p className="text-gray-500 text-sm">We'll get back to you within 24-48 hours.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Full Name</label>
        <input
          type="text" required
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
          placeholder="Your full name"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Email Address</label>
        <input
          type="email" required
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          placeholder="your@email.com"
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30"
        />
      </div>
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Message</label>
        <textarea
          required rows={4}
          value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
          placeholder="Write your message here..."
          className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/30 resize-none"
        />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-[#1e3a5f] text-white py-3 rounded-xl font-semibold hover:bg-[#153060] transition-colors disabled:opacity-60">
        {loading ? 'Sending...' : 'Send Message'}
      </button>
    </form>
  )
}
