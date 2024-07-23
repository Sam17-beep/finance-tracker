'use client'
import { useState } from 'react'
import { ImportCard } from '@/components/custom/ImportCard'

export default function ImportSection() {
  const [columns, setColumns] = useState<string[]>([])
  const [isReview, setIsReview] = useState(false)

  return <>{isReview ? <ImportCard columns={columns} setColumns={setColumns} /> : <ReviewCard></ReviewCard>}</>
}
