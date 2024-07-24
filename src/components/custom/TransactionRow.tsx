import {TableCell, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";

interface Transaction {
  id: number
  amount: number
  date: Date
  category: string
  description: string
}

export function TransactionRow({transaction}: { transaction: Transaction }) {
  return (
    <TableRow className='bg-accent'>
      <TableCell className='table-cell'>{transaction.date.toISOString()}</TableCell>
      <TableCell className='table-cell'>{transaction.description}</TableCell>
      <TableCell className='table-cell'>
        <Badge className='text-xs' variant='outline'>
          {transaction.category}
        </Badge>
      </TableCell>
      <TableCell className='table-cell'>${transaction.amount}</TableCell>
    </TableRow>
  )
}