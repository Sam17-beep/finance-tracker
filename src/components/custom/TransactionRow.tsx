'use client'
import {TableCell, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {Button} from "@/components/ui/button";
import {EllipsisVertical} from "lucide-react";
import {api} from "@/trpc/react";
import {toast} from "@/components/ui/use-toast";

export interface Transaction {
  id: number
  amount: number
  date: Date
  category: string
  description: string
}

export function TransactionRow({transaction}: { transaction: Transaction }) {
  const utils = api.useUtils();
  const deleteTransaction = api.transaction.deleteTransaction.useMutation({
    onSuccess: async () => {
      await utils.transaction.invalidate();
    },
    onError: (error) => {
      toast({
        title: "Error while saving budget",
        description: error.message,
      })
    }
  });

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
      <TableCell className='table-cell'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost">
              <EllipsisVertical className='h-5 w-5'/>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator/>
            <DropdownMenuItem onClick={() => deleteTransaction.mutate({id: transaction.id})}>Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}