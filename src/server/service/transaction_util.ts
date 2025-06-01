import { getPeriodTitle, type Mode } from "@/domain/Date";
import { getSummaryBalance, type PeriodSummary, type DuplicateTransaction, type TransactionSchema } from "@/domain/Transaction";
import { type PrismaClient } from "@prisma/client";
import { type z } from "zod";

export async function findDuplicateTransactions(
  ctx: { db: PrismaClient },
  transactions: z.infer<typeof TransactionSchema>[]
): Promise<DuplicateTransaction[]> {
  const duplicates = await ctx.db.transaction.findMany({
    where: {
      OR: transactions.map(t => ({
        AND: [
          { name: t.name },
          { amount: t.amount },
          { date: t.date }
        ]
      }))
    },
    select: {
      name: true,
      amount: true,
      date: true
    }
  });

  return duplicates;
}

export async function getDateOfOldestTransaction(ctx: { db: PrismaClient }): Promise<Date | null> {
  const oldestTransaction = await ctx.db.transaction.findFirst({
    orderBy: {
      date: "asc",
    },
  });

  return oldestTransaction?.date ?? null;
}

export async function getSummaryOfPeriod(ctx: { db: PrismaClient }, from: Date, to: Date, periodMode: Mode, categoryId?: string, subcategoryId?: string): Promise<PeriodSummary> {
      const transactions = await ctx.db.transaction.findMany({
        where: {
          date: {
            gte: from,
            lte: to,
          },
          isDiscarded: false,
          ...(categoryId && { categoryId }),
          ...(subcategoryId && { subcategoryId }),
        },
        select: {
          amount: true,
        },
      });


      return {
        ...getSummaryBalance(transactions),
        periodTitle: getPeriodTitle(from, to, periodMode),
        fromDate: from,
        toDate: to,
      } ;
}
