'use client'
import dynamic from 'next/dynamic'

const StateFilterSection = dynamic(() => import('./StateFilterSection'), { ssr: false })

export default function StateFilterSectionClient(props) {
  return <StateFilterSection {...props} />
}
