'use client'
import {Input} from '@/components/ui/input'
import {Button} from '@/components/ui/button'
import {CircleX} from 'lucide-react'

interface Props {
  id: number
  value: number
  handleChange: (id: number, newValue: string) => void
  removeInput: (id: number) => void
}

export function BudgetInput({id, value, removeInput, handleChange}: Props) {
  return (
    <div className='flex flex-row items-center gap-2'>
      <Button onClick={() => removeInput(id)} variant='ghost'>
        <CircleX color='red'/>
      </Button>
      <Input type='text' placeholder='Income name' className='w-60'/>
      <Input
        id={`income-${id}`}
        type='number'
        placeholder='$0'
        value={value}
        onChange={(e) => handleChange(id, e.target.value)}
        className='w-60'
      />
    </div>
  )
}
