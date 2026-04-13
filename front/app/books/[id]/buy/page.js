'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getToken, loginWithGoogle } from '@/lib/auth'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'
const CASHFREE_SDK_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js'

function loadCashfreeSdk() {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.Cashfree) return Promise.resolve(window.Cashfree)

  const existing = document.querySelector('script[data-cashfree-sdk="true"]')
  if (existing) {
    return new Promise((resolve, reject) => {
      const startedAt = Date.now()
      const timer = setInterval(() => {
        if (window.Cashfree) {
          clearInterval(timer)
          resolve(window.Cashfree)
          return
        }
        if (Date.now() - startedAt > 8000) {
          clearInterval(timer)
          reject(new Error('Payment gateway failed to load'))
        }
      }, 200)
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = CASHFREE_SDK_URL
    script.async = true
    script.dataset.cashfreeSdk = 'true'
    script.onload = () => {
      if (window.Cashfree) resolve(window.Cashfree)
      else reject(new Error('Payment gateway initialized incorrectly'))
    }
    script.onerror = () => reject(new Error('Payment gateway script could not be loaded. Please disable ad blocker or check CSP/domain settings.'))
    document.head.appendChild(script)
  })
}

export default function BuyResourcePage() {
  const { id } = useParams()
  const router = useRouter()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState(null)
  const [sdkReady, setSdkReady] = useState(false)

  useEffect(() => {
    async function fetchResource() {
      try {
        const res = await fetch(`${API}/resources?limit=100&isActive=true`)
        if (!res.ok) throw new Error('Failed to fetch')
        const data = await res.json()
        const found = (data.data || []).find(r => r._id === id)
        if (!found) throw new Error('Resource not found')
        setResource(found)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchResource()
  }, [id])

  useEffect(() => {
    let active = true
    loadCashfreeSdk()
      .then(() => {
        if (active) setSdkReady(true)
      })
      .catch((err) => {
        if (active) setError(err.message)
      })
    return () => {
      active = false
    }
  }, [])

  const handleBuy = async () => {
    setPaying(true)
    setError(null)
    try {
      const token = getToken()

      if (!token) {
        loginWithGoogle()
        return
      }

      const res = await fetch(`${API}/payment/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ itemType: 'resource', itemId: id }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.alreadyPurchased) {
          setError('You have already purchased this resource!')
          return
        }
        throw new Error(data.message || 'Payment failed')
      }

      const { paymentSessionId } = data.data

      if (typeof window !== 'undefined') {
        const Cashfree = window.Cashfree || await loadCashfreeSdk()

        const cashfree = Cashfree({ mode: 'production' })
        await cashfree.checkout({
          paymentSessionId,
          redirectTarget: '_self',
        })
      } else {
        setError('Payment gateway not loaded. Please refresh and try again.')
      }
    } catch (err) {
      setError(err?.message || 'Payment failed. Please try again.')
    } finally {
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <p className="text-5xl">📭</p>
        <h2 className="text-xl font-bold text-gray-700">Resource not found</h2>
        <Link href="/books" className="text-blue-600 hover:underline text-sm font-semibold">← Back to Books</Link>
      </div>
    )
  }

  const price = resource.discountedPrice ?? resource.price ?? 0
  const discount = resource.price && resource.discountedPrice
    ? Math.round(((resource.price - resource.discountedPrice) / resource.price) * 100)
    : 0
  const sampleUrl = `${API}/resources/${id}/sample`
  const hasSample = (resource.samplePages ?? 5) > 0 && resource.fileUrl

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-[#1e3a5f] to-[#1d4ed8] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-blue-300 mb-4">
            <Link href="/" className="hover:text-white">Home</Link>
            <span>›</span>
            <Link href="/books" className="hover:text-white">Books</Link>
            <span>›</span>
            <span className="text-white">Purchase</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">🔓 Complete Your Purchase</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Resource info */}
          <div className="p-6 md:p-8 border-b border-gray-100">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl flex items-center justify-center text-3xl shrink-0">
                📚
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-[#1e3a5f] mb-1">{resource.title}</h2>
                {resource.description && <p className="text-sm text-gray-500 line-clamp-2">{resource.description}</p>}
                {resource.authorityKey && <p className="text-xs text-blue-600 font-medium mt-2 uppercase">{resource.authorityKey}</p>}
              </div>
            </div>
          </div>

          {/* Sample preview */}
          {hasSample && (
            <div className="p-6 md:px-8 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-blue-800">📖 Free Sample Available</p>
                  <p className="text-xs text-blue-600 mt-0.5">Read first {resource.samplePages ?? 5} pages before buying</p>
                </div>
                <a href={sampleUrl} target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2 bg-white text-blue-700 text-sm font-semibold rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors">
                  Read Sample
                </a>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase font-medium mb-1">Price</p>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-[#1e3a5f]">₹{price}</span>
                  {discount > 0 && (
                    <>
                      <span className="text-lg text-gray-400 line-through mb-0.5">₹{resource.price}</span>
                      <span className="text-sm font-bold text-green-600 mb-0.5">{discount}% OFF</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
                {error}
              </div>
            )}

            <button onClick={handleBuy} disabled={paying || !sdkReady}
              className="w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white text-base font-bold py-3.5 rounded-xl transition-colors disabled:opacity-50 cursor-pointer">
              {paying ? 'Processing…' : !sdkReady ? 'Loading Payment Gateway…' : `Pay ₹${price} — Get Instant Access`}
            </button>

            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-400">
              <span>🔒 Secure Payment</span>
              <span>⚡ Instant Access</span>
              <span>📱 Read Anywhere</span>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link href="/books" className="text-sm text-gray-500 hover:text-[#1e3a5f] font-medium">
            ← Back to Books
          </Link>
        </div>
      </div>
    </div>
  )
}
