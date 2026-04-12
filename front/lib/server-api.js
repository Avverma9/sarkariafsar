/**
 * Server-side API base URL.
 * On EC2/production server: uses INTERNAL_API_BASE_URL (http://localhost:5000/api)
 * to avoid nginx round-trip and ECONNREFUSED issues.
 * Falls back to NEXT_PUBLIC_API_BASE_URL for client or if internal not set.
 */
export const SERVER_API_BASE =
  process.env.INTERNAL_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://sarkariafsar.com/api'
