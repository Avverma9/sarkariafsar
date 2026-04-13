'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://sarkariafsar.com/api'

function PaymentStatusContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('loading')
  const [orderData, setOrderData] = useState(null)
  const [error, setError] = useState(null)

  const cfOrderId = searchParams.get('order_id')

  useEffect(() => {
    if (!cfOrderId) {
      setError('Invalid payment link. Missing order ID.')
      setStatus('error')
      return
    }

    let isMounted = true
    let intervalId = null
    let timeoutId = null

    async function checkStatus() {
      try {
        const res = await fetch(`${API}/payment/status/${cfOrderId}`)
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.message || 'Failed to check payment status')
        }

        if (isMounted) {
          setStatus(data.status)
          setOrderData(data.data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message)
          setStatus('error')
        }
      }
    }

    checkStatus()

    // Poll every 3 seconds for up to 30 seconds if pending
    intervalId = setInterval(() => {
      checkStatus()
    }, 3000)

    timeoutId = setTimeout(() => {
      if (intervalId) clearInterval(intervalId)
      if (isMounted && (status === 'pending' || status === 'loading')) {
        setStatus('timeout')
      }
    }, 30000)

    return () => {
      isMounted = false
      if (intervalId) clearInterval(intervalId)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [cfOrderId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Checking payment status...</p>
        </div>
      </div>
    )
  }

  if (status === 'error' || status === 'timeout') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Payment Status Unknown</h2>
          <p className="text-gray-600 mb-6">
            {status === 'timeout' 
              ? 'Payment verification timed out. If you completed payment, please check your email or contact support.'
              : error || 'Could not verify payment status.'}
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/books" className="w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white font-semibold py-3 rounded-xl transition-colors">
              Back to Books
            </Link>
            <button onClick={() => window.location.reload()} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'paid') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h2>
          <p className="text-gray-600 mb-4">
            You have successfully purchased {orderData?.itemTitle || 'this resource'}
          </p>
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>Amount Paid:</strong> ₹{orderData?.amount || 0}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {orderData?.itemType === 'resource' && orderData?.itemId && (
              <Link 
                href={`/books/${orderData.itemId}`}
                className="w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Access Your Resource
              </Link>
            )}
            <Link href="/books" className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors">
              Browse More Books
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Pending, failed, expired
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">
          {status === 'pending' ? '⏳' : status === 'failed' ? '❌' : '⏰'}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {status === 'pending' ? 'Payment Pending' : status === 'failed' ? 'Payment Failed' : 'Payment Expired'}
        </h2>
        <p className="text-gray-600 mb-6">
          {status === 'pending' 
            ? 'Your payment is being processed. This page will update automatically.'
            : status === 'failed'
            ? 'Payment could not be completed. Please try again.'
            : 'This payment link has expired. Please initiate a new payment.'}
        </p>
        <div className="flex flex-col gap-3">
          {status === 'pending' && (
            <div className="animate-pulse bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-800">Checking payment status...</p>
            </div>
          )}
          <Link href="/books" className="w-full bg-[#1e3a5f] hover:bg-[#1d4ed8] text-white font-semibold py-3 rounded-xl transition-colors">
            Back to Books
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  )
}
