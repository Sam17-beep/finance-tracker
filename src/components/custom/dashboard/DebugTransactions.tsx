"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { subDays, startOfDay, endOfDay } from "date-fns";

export function DebugTransactions() {
  const { data: transactionsData } = api.transaction.getDashboardData.useQuery({
    dateRange: {
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    },
  });

  if (!transactionsData?.transactions) {
    return <Card><CardContent>Loading transactions...</CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Debug: Transactions (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm">
          <p>Total transactions: {transactionsData.transactions.length}</p>
          <p>Non-discarded transactions: {transactionsData.transactions.filter(t => !t.isDiscarded).length}</p>
          <p>Transactions with categories: {transactionsData.transactions.filter(t => t.category).length}</p>
          <p>Income transactions: {transactionsData.transactions.filter(t => t.category?.isIncome && !t.isDiscarded).length}</p>
          <p>Expense transactions: {transactionsData.transactions.filter(t => !t.category?.isIncome && !t.isDiscarded).length}</p>
          <p>Uncategorized transactions: {transactionsData.transactions.filter(t => !t.category && !t.isDiscarded).length}</p>
        </div>
        
        <div className="mt-4 max-h-40 overflow-y-auto">
          <h4 className="font-medium mb-2">Transaction Details:</h4>
          {transactionsData.transactions.slice(0, 10).map((transaction, index) => (
            <div key={transaction.id || index} className="text-xs border-b py-1">
              <div>
                <strong>{transaction.name}</strong> - ${transaction.amount}
              </div>
              <div className="text-muted-foreground">
                Date: {transaction.date.toLocaleDateString()} | 
                Category: {transaction.category?.name || 'None'} | 
                isIncome: {transaction.category?.isIncome ? 'Yes' : 'No'} | 
                Discarded: {transaction.isDiscarded ? 'Yes' : 'No'}
              </div>
            </div>
          ))}
          {transactionsData.transactions.length > 10 && (
            <div className="text-xs text-muted-foreground mt-2">
              ... and {transactionsData.transactions.length - 10} more transactions
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 