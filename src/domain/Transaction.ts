import { type Prisma } from "@prisma/client";
import { z } from "zod";

type AmountNumber = {
  amount: number;
} | { amount: Prisma.Decimal };

export const TransactionSchema = z.object({
  date: z.date(),
  amount: z.number(),
  name: z.string(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  isDiscarded: z.boolean().optional(),
});

export interface PeriodSummary {
  periodTitle: string;
  income: number;
  expenses: number;
  balance: number;
  fromDate: Date;
  toDate: Date;
}

export interface DuplicateTransaction {
  name: string;
  amount: Prisma.Decimal;
  date: Date;
}


export const getSummaryBalance = (transactions: AmountNumber[]): { expenses: number, income: number, balance: number } => {
  let income = 0;
  let expenses = 0;

  for (const transaction of transactions) {
    const amount = Number(transaction.amount);
    if (amount > 0) {
      income += amount;
    } else {
      expenses += Math.abs(amount);
    }
  }

  return {
    income,
    expenses,
    balance: income - expenses,
  };
}
