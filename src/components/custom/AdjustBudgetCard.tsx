'use client'

import { BudgetSection } from './BudgetSection'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface BudgetSectionType {
  name: string
  total: number
}

type Budget = Record<string, BudgetSectionType>

const initialBudget: Budget = {
  income: { name: 'Income', total: 0 },
  savings: { name: 'Savings', total: 0 },
  housing: { name: 'Housing', total: 0 },
  food: { name: 'Food', total: 0 },
  education: { name: 'Education', total: 0 },
  recreation: { name: 'Recreation', total: 0 },
  clothing: { name: 'Clothing', total: 0 },
  communications: { name: 'Communications', total: 0 },
  personalCare: { name: 'Personal Care', total: 0 },
  insurance: { name: 'Insurance', total: 0 },
  transportation: { name: 'Transportation', total: 0 },
  medical: { name: 'Medical', total: 0 },
  fees: { name: 'Fees', total: 0 },
}

export function AdjustBudgetCard() {
  const [budget, setBudget] = useState<Budget>(initialBudget)

  const updateTotal = (key: keyof Budget, newTotal: number) => {
    setBudget((prevBudget) => ({
      ...prevBudget,
      [key]: {
        ...prevBudget[key],
        total: newTotal,
      },
    }))
  }

  return (
    <div className='flex flex-col gap-4'>
      {Object.keys(budget).map((key) => (
        <BudgetSection
          key={key}
          sectionName={budget[key].name}
          total={budget[key].total}
          setTotal={(total: number) => updateTotal(key as keyof Budget, total)}
        />
      ))}
      <Button onClick={() => console.log(budget)}>Submit</Button>
    </div>
  )
}
