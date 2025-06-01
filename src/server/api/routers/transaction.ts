import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Prisma } from "@prisma/client";
import { getNextPeriodFromLastPeriod, getPreviousPeriodFromLastPeriod, Mode } from "@/domain/Date";
import { type DuplicateTransaction, TransactionSchema, type PeriodSummary, getSummaryBalance } from "@/domain/Transaction";
import { findDuplicateTransactions, getDateOfOldestTransaction, getSummaryOfPeriod } from "@/server/service/transaction_util";


export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      dateRange: z.object({
        from: z.date(),
        to: z.date(),
      }),
      categoryId: z.string().optional(),
      subcategoryId: z.string().optional(),
      page: z.number().min(1).default(1),
      pageSize: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ ctx, input }) => {
      const { dateRange, categoryId, subcategoryId, page, pageSize } = input;
      const skip = (page - 1) * pageSize;

      const where = {
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
        ...(categoryId && { categoryId }),
        ...(subcategoryId && { subcategoryId }),
      };

      const transactions = await
        ctx.db.transaction.findMany({
          where,
          include: {
            category: true,
            subcategory: true,
            appliedRules: true,
          },
          orderBy: {
            date: "desc",
          },
          skip,
          take: pageSize,
        });

      return {
        transactions: transactions.map(t => ({
          ...t,
          amount: Number(t.amount),
        })),
        total: transactions.length,
      };
    }),
  getPeriodSummary: publicProcedure
    .input(z.object({
      dateRange: z.object({
        from: z.date(),
        to: z.date(),
      }),
      categoryId: z.string().optional(),
      subcategoryId: z.string().optional(),
      periodMode: z.nativeEnum(Mode),
    }))
    .query(async ({ ctx, input }) => {
      const { dateRange, categoryId, subcategoryId } = input;

      return getSummaryOfPeriod(ctx, dateRange.from, dateRange.to, input.periodMode, categoryId, subcategoryId);
    }),
  getPeriodSummaries: publicProcedure
    .input(z.object({
      numberOfPeriods: z.number().min(1).default(6),
      dateRange: z.object({
        from: z.date(),
        to: z.date(),
      }),
      periodMode: z.nativeEnum(Mode),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ ctx, input }) => {
      const { numberOfPeriods, dateRange, periodMode, offset } = input;
      const summaries: PeriodSummary[] = [];

      let currentFrom = dateRange.from;
      let currentTo = dateRange.to;

      for (let i = 0; i < offset; i++) {
        const nextPeriod = getPreviousPeriodFromLastPeriod(currentFrom, currentTo, periodMode);
        currentFrom = nextPeriod.from;
        currentTo = nextPeriod.to;
      }

      const dateOfLastTransaction = await getDateOfOldestTransaction(ctx) ?? new Date();

      for (let i = 0; i < numberOfPeriods; i++) {
        if (currentFrom < dateOfLastTransaction) {
          break;
        }

        const summary = await getSummaryOfPeriod(ctx, currentFrom, currentTo, periodMode);
        summaries.push(summary);
        const nextPeriod = getPreviousPeriodFromLastPeriod(currentFrom, currentTo, periodMode);
        currentFrom = nextPeriod.from;
        currentTo = nextPeriod.to;
      }
      
      return {
        summaries,
        nextPageOffset: summaries.length,
        hasMore: summaries.length === numberOfPeriods,
      };
    }),

  getBudgetStreak: publicProcedure
    .input(
      z.object({
        dateRange: z.object({
          from: z.date(),
          to: z.date(),
        }),
        periodMode: z.nativeEnum(Mode),
      }))
    .query(async ({ ctx, input }) => {
      const { dateRange : { from, to } } = input;

      const checkIfPositiveBalanceInPeriod = async (from: Date, to: Date) => {
        const transactions = await ctx.db.transaction.findMany({
          where: { date: { gte: from, lte: to }, isDiscarded: false },
          select: { amount: true },
        });
        const { balance } = getSummaryBalance(transactions);
        return balance > 0;
      }

      let streak = 0;
      let currentFrom = from;
      let currentTo = to;

      while (await checkIfPositiveBalanceInPeriod(currentFrom, currentTo)) {
        streak++;
        const nextPeriod = getNextPeriodFromLastPeriod(from, to, input.periodMode);
        currentFrom = nextPeriod.from;
        currentTo = nextPeriod.to;
      }

      return { streak };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: TransactionSchema
    }))
    .mutation(async ({ ctx, input: { id, data } }) => {
      const updated = await ctx.db.transaction.update({
        where: { id: id },
        data: {
          ...data,
          amount: new Prisma.Decimal(data.amount.toString()),
        },
        include: {
          category: true,
          subcategory: true,
          appliedRules: true,
        },
      });

      return {
        ...updated,
        amount: Number(updated.amount),
      };
    }),

  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction.delete({
        where: { id: input },
      });
    }),

  bulkCreate: publicProcedure
    .input(z.array(TransactionSchema))
    .mutation(async ({ ctx, input }) => {
      const duplicates = await findDuplicateTransactions(ctx, input);
      if (duplicates.length > 0) {
        const uniqueTransactions = input.filter(transaction =>
          !duplicates.some((dup: DuplicateTransaction) =>
            dup.name === transaction.name &&
            Number(dup.amount) === transaction.amount &&
            dup.date.getTime() === transaction.date.getTime()
          )
        );

        if (uniqueTransactions.length === 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'All transactions are duplicates',
          });
        }

        const result = await ctx.db.transaction.createMany({
          data: uniqueTransactions,
        });

        return {
          created: result.count,
          skipped: input.length - uniqueTransactions.length,
          duplicates: duplicates.length,
        };
      }

      const result = await ctx.db.transaction.createMany({
        data: input,
      });

      return {
        created: result.count,
        skipped: 0,
        duplicates: 0,
      };
    }),
});
