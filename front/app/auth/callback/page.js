'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setToken } from '@/lib/auth'
import { useAuth } from '@/context/AuthContext'

const Spinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-600 font-medium">Logging you in...</p>
    </div>
  </div>
)

function CallbackHandler() {
  const router       = useRouter()
  const params       = useSearchParams()
  const { refresh }  = useAuth()

  useEffect(() => {
    const token = params.get('token')
    const error = params.get('error')

    if (token) {
      setToken(token)
      refresh().then(() => {
        router.replace('/dashboard')
      })
    } else {
      console.error('[Auth] callback error:', error)
      router.replace('/?auth_error=1')
    }
  }, [params, refresh, router])

  return <Spinner />
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <CallbackHandler />
    </Suspense>
  )
}
