'use client'
import dynamic from 'next/dynamic'

const AdsenseUnit = dynamic(() => import('./AdsenseUnit'), { ssr: false })

export default AdsenseUnit
