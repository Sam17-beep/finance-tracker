'use client'
import {useState} from 'react'
import {BudgetInput} from '@/components/custom/BudgetInput'
import {Button} from '@/components/ui/button'
import {CirclePlus} from 'lucide-react'

interface Props {
  sectionName: string
  total: number
  setTotal: (total: number) => void
}

export function BudgetSection({sectionName, setTotal, total}: Props) {
  const [inputs, setInputs] = useState([total])

  const addInput = () => {
    setInputs([...inputs, 0])
  }

  const removeInput = (index: number) => {
    const updatedInputs = inputs.filter((_, i) => i !== index)
    setInputs(updatedInputs)
    calculateTotal(updatedInputs)
  }

  const handleChange = (index: number, newValue: string) => {
    const updatedInputs = inputs.map((input, mapIndex) => mapIndex === index ? Number(newValue) : input)
    setInputs(updatedInputs)
    calculateTotal(updatedInputs)
  }

  const calculateTotal = (inputs: number[]) => setTotal(inputs.reduce((acc, curr) => acc + curr, 0))

  return (
    <>
      <div className='flex flex-col gap-4'>
        <h2 className='text-2xl flex items-center gap-4'>
          {sectionName}: {total}$
        </h2>
        {inputs.map((input, index) => (
          <BudgetInput key={index} id={index} value={input} handleChange={handleChange} removeInput={removeInput}/>
        ))}
        <Button onClick={addInput} variant={'ghost'} className={'flex gap-2'}>
          <CirclePlus color={'green'}/>
          Add Input
        </Button>
      </div>
    </>
  )
}
