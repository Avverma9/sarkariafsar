'use client'

const TOKEN_KEY = 'sa_token'
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.sarkariafsar.com/api'
// SERVER_BASE = API_BASE without trailing /api  (works for both dev and prod)
const SERVER_BASE = API_BASE.replace(/\/api\/?$/, '')

export function getToken() {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function authHeaders() {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/**
 * Fetch current user from /auth/me
 */
export async function fetchMe() {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) { clearToken(); return null }
    const data = await res.json()
    return data?.data || null
  } catch {
    return null
  }
}

/**
 * Redirect browser to backend Google OAuth
 */
export function loginWithGoogle() {
  window.location.href = `${SERVER_BASE}/api/auth/google`
}

/**
 * Request OTP for email login
 */
export async function requestOtp(email) {
  const res = await fetch(`${API_BASE}/auth/send-otp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email }),
  })
  return res.json()
}

/**
 * Verify OTP and get JWT
 */
export async function verifyOtp(email, otp) {
  const res = await fetch(`${API_BASE}/auth/verify-otp`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ email, otp }),
  })
  return res.json()
}

/**
 * Fetch which auth methods are enabled
 */
export async function fetchAuthMethods() {
  try {
    const res = await fetch(`${API_BASE}/auth/methods`)
    const data = await res.json()
    return data?.data || { google: true, emailOtp: false }
  } catch {
    return { google: true, emailOtp: false }
  }
}

export { SERVER_BASE, API_BASE }
