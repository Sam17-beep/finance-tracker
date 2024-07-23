'use client'
import { useState } from 'react'
import { BudgetInput } from '@/components/custom/BudgetInput'
import { Button } from '@/components/ui/button'
import { CirclePlus } from 'lucide-react'

interface Props {
  sectionName: string
  total: number
  setTotal: (total: number) => void
}

export function BudgetSection({ sectionName, setTotal, total }: Props) {
  const [inputs, setInputs] = useState([{ id: Date.now(), value: 0 }])

  const addInput = () => {
    setInputs([...inputs, { id: Date.now(), value: 0 }])
  }

  const removeInput = (id: number) => {
    const filteredInputs = inputs.filter((input) => input.id !== id)
    setInputs(filteredInputs)
    calculateTotal(filteredInputs)
  }

  const handleChange = (id: number, newValue: string) => {
    const updatedInputs = inputs.map((input) => (input.id === id ? { ...input, value: Number(newValue) } : input))
    setInputs(updatedInputs)
    calculateTotal(updatedInputs)
  }

  const calculateTotal = (inputs: { id: number; value: number }[]) => {
    const total = inputs.reduce((acc, curr) => acc + curr.value, 0)
    setTotal(total)
  }

  return (
    <>
      <div className='flex flex-col gap-4'>
        <h2 className='text-2xl flex items-center gap-4'>
          {sectionName}: <h3 className={'text-xl'}>{total}$</h3>
        </h2>
        {inputs.map((input, index) => (
          <BudgetInput key={index} input={input} handleChange={handleChange} removeInput={removeInput} />
        ))}
        <Button onClick={addInput} variant={'ghost'} className={'flex gap-2'}>
          <CirclePlus color={'green'} />
          Add Input
        </Button>
      </div>
    </>
  )
}
