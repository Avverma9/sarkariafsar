import { Suspense } from 'react'
import SearchClient from './SearchClient'

export const metadata = {
  title: 'Search — Sarkari Afsar',
  description: 'Search government jobs, sarkari schemes, and blog posts on Sarkari Afsar.',
  robots: { index: false, follow: true },
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading...</div>}>
      <SearchClient />
    </Suspense>
  )
}
