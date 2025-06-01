import { type Prisma } from "@prisma/client";
import { z } from "zod";

export const TransactionSchema = z.object({
  date: z.date(),
  amount: z.number(),
  name: z.string(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  isDiscarded: z.boolean().optional(),
});

export interface PeriodSummary {
  periodLabel: string;
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

