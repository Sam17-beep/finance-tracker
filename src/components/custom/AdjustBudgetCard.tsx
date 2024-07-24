'use client'

import {BudgetSection} from './BudgetSection'
import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {api} from "@/trpc/react";
import {toast} from "@/components/ui/use-toast";

interface Budget {
  id?: number,
  income: number,
  savings: number,
  housing: number,
  food: number,
  education: number,
  recreation: number,
  clothing: number,
  communications: number,
  personalCare: number,
  insurance: number,
  transportation: number,
  medical: number,
  fees: number
}

const initialBudget: Budget = {
  income: 0,
  savings: 0,
  housing: 0,
  food: 0,
  education: 0,
  recreation: 0,
  clothing: 0,
  communications: 0,
  personalCare: 0,
  insurance: 0,
  transportation: 0,
  medical: 0,
  fees: 0,
}

export function AdjustBudgetCard({initBudget}: { initBudget: Budget | null }) {
  const [budget, setBudget] = useState<Budget>(initBudget ?? initialBudget)

  const utils = api.useUtils();
  const createPost = api.budget.upsert.useMutation({
    onSuccess: async (budget) => {
      await utils.post.invalidate();
      setBudget(budget);
    },
    onError: (error) => {
      toast({
        title: "Error while saving budget",
        description: error.message,
      })
    }
  });

  const updateTotal = (newTotal: Partial<Budget>) => {
    setBudget((prevBudget) => ({
      ...prevBudget,
      ...newTotal,
    }))
  }

  return (
    <div className='flex flex-col gap-4'>
      <BudgetSection
        sectionName={'Income'}
        total={budget.income}
        setTotal={(total: number) => updateTotal({income: total})}
      />
      <BudgetSection
        sectionName={'Savings'}
        total={budget.savings}
        setTotal={(total: number) => updateTotal({savings: total})}
      />
      <BudgetSection
        sectionName={'Housing'}
        total={budget.housing}
        setTotal={(total: number) => updateTotal({housing: total})}
      />
      <BudgetSection
        sectionName={'Food'}
        total={budget.food}
        setTotal={(total: number) => updateTotal({food: total})}
      />
      <BudgetSection
        sectionName={'Education'}
        total={budget.education}
        setTotal={(total: number) => updateTotal({education: total})}
      />
      <BudgetSection
        sectionName={'Recreation'}
        total={budget.recreation}
        setTotal={(total: number) => updateTotal({recreation: total})}
      />
      <BudgetSection
        sectionName={'Clothing'}
        total={budget.clothing}
        setTotal={(total: number) => updateTotal({clothing: total})}
      />
      <BudgetSection
        sectionName={'Communications'}
        total={budget.communications}
        setTotal={(total: number) => updateTotal({communications: total})}
      />
      <BudgetSection
        sectionName={'Personal Care'}
        total={budget.personalCare}
        setTotal={(total: number) => updateTotal({personalCare: total})}
      />
      <BudgetSection
        sectionName={'Insurance'}
        total={budget.insurance}
        setTotal={(total: number) => updateTotal({insurance: total})}
      />
      <BudgetSection
        sectionName={'Transportation'}
        total={budget.transportation}
        setTotal={(total: number) => updateTotal({transportation: total})}
      />
      <BudgetSection
        sectionName={'Medical'}
        total={budget.medical}
        setTotal={(total: number) => updateTotal({medical: total})}
      />
      <BudgetSection
        sectionName={'Fees'}
        total={budget.fees}
        setTotal={(total: number) => updateTotal({fees: total})}
      />
      <Button onClick={() => createPost.mutate(budget)}>Submit</Button>
    </div>
  )
}
