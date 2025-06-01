import { type DuplicateTransaction, type TransactionSchema } from "@/domain/Transaction";
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
