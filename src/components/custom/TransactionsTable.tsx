'use client'
import {type Transaction, TransactionRow} from "@/components/custom/TransactionRow";
import {api} from "@/trpc/react";

export function TransactionsTable() {
  const [transactions] = api.transaction.getTransactions.useSuspenseQuery();

  if (!transactions) {
    return <div>Loading...</div>
  }

  return (
    <>
      {transactions.map((transaction: Transaction) => (
        <TransactionRow transaction={transaction} key={transaction.id}/>
      ))}
    </>
  )
}