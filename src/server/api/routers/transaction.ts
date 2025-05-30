import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type PrismaClient, Prisma } from "@prisma/client";
import { Mode } from "@/domain/Date";

const transactionSchema = z.object({
  date: z.date(),
  amount: z.number(),
  name: z.string(),
  categoryId: z.string().nullable().optional(),
  subcategoryId: z.string().nullable().optional(),
  isDiscarded: z.boolean().optional(),
});

type TransactionInput = z.infer<typeof transactionSchema>;

interface DuplicateTransaction {
  name: string;
  amount: Prisma.Decimal;
  date: Date;
}

export interface PeriodSummary {
  periodLabel: string;
  income: number;
  expenses: number;
  balance: number;
  fromDate: Date;
  toDate: Date;
}

async function findDuplicateTransactions(
  ctx: { db: PrismaClient },
  transactions: TransactionInput[]
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

async function getDateOfOldestTransaction(ctx: { db: PrismaClient }): Promise<Date | null> {
  const oldestTransaction = await ctx.db.transaction.findFirst({
    orderBy: {
      date: "asc",
    },
  });

  return oldestTransaction?.date ?? null;
}

const getAllInputSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(100).default(50),
});

const getSummaryInputSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
});

const getPeriodSummariesInputSchema = z.object({
  numberOfPeriods: z.number().min(1).default(6),
  periodMode: z.nativeEnum(Mode),
  customPeriodBegin: z.date().optional(),
  customPeriodEnd: z.date().optional(),
  offset: z.number().min(0).optional().default(0),
});

const getBudgetStreakInputSchema = z.object({
  periodMode: z.nativeEnum(Mode),
  currentPeriodBeginDate: z.date(),
});

export const transactionRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(getAllInputSchema)
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

      const [transactions, total] = await Promise.all([
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
        }),
        ctx.db.transaction.count({ where }),
      ]);

      return {
        transactions: transactions.map(t => ({
          ...t,
          amount: Number(t.amount),
        })),
        total,
      };
    }),

  getSummary: publicProcedure
    .input(getSummaryInputSchema)
    .query(async ({ ctx, input }) => {
      const { dateRange, categoryId, subcategoryId } = input;

      const transactions = await ctx.db.transaction.findMany({
        where: {
          date: {
            gte: dateRange.from,
            lte: dateRange.to,
          },
          isDiscarded: false,
          ...(categoryId && { categoryId }),
          ...(subcategoryId && { subcategoryId }),
        },
        select: {
          amount: true,
        },
      });

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
        periodLabel: `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(dateRange.from)} ${dateRange.from.getFullYear()}`,
        income,
        expenses,
        balance: income - expenses,
        fromDate: dateRange.from,
        toDate: dateRange.to,
      } satisfies PeriodSummary;
    }),

  getPeriodSummaries: publicProcedure
    .input(getPeriodSummariesInputSchema)
    .query(async ({ ctx, input }) => {
      const { numberOfPeriods, periodMode, customPeriodBegin, customPeriodEnd, offset } = input;
      const summaries: PeriodSummary[] = [];
      const today = new Date();

      if (periodMode === Mode.Custom) {
        if (!customPeriodBegin || !customPeriodEnd) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'customPeriodBegin and customPeriodEnd are required for custom periodMode.',
          });
        }
        
        for (let i = 0; i < numberOfPeriods; i++) {
          const currentConceptualIndex = offset + i;
          let from: Date, to: Date, periodLabel: string;
          let year: number;

          if (currentConceptualIndex === 0) {
            from = customPeriodBegin;
            to = customPeriodEnd;
            periodLabel = `Custom: ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(from)} - ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(to)}`;
          } else {
            const monthOffsetPrior = currentConceptualIndex;
            const baseDate = new Date(customPeriodBegin);
            baseDate.setDate(1);
            baseDate.setMonth(baseDate.getMonth() - monthOffsetPrior);
            
            year = baseDate.getFullYear();
            const month = baseDate.getMonth();
            from = new Date(year, month, 1);
            to = new Date(year, month + 1, 0);
            periodLabel = `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(from)} ${year}`;
          }

          const transactions = await ctx.db.transaction.findMany({
            where: { date: { gte: from, lte: to }, isDiscarded: false },
            select: { amount: true },
          });

          let income = 0;
          let expenses = 0;
          for (const transaction of transactions) {
            const amount = Number(transaction.amount);
            if (amount > 0) income += amount; else expenses += Math.abs(amount);
          }
          summaries.push({
            periodLabel,
            income,
            expenses,
            balance: income - expenses,
            fromDate: from,
            toDate: to,
          });
        }
      } else {
        for (let i = 0; i < numberOfPeriods; i++) {
          const actualPeriodPastIndex = offset + i;
          let from: Date, to: Date, year: number, periodLabel: string;

          if (periodMode === Mode.Monthly) {
            const targetDate = new Date(today.getFullYear(), today.getMonth() - actualPeriodPastIndex, 1);
            year = targetDate.getFullYear();
            const month = targetDate.getMonth();
            from = new Date(year, month, 1);
            to = new Date(year, month + 1, 0);
            periodLabel = `${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(targetDate)} ${year}`;
          } else {
            year = today.getFullYear() - actualPeriodPastIndex;
            from = new Date(year, 0, 1);
            to = new Date(year, 11, 31);
            periodLabel = `${year}`;
          }

          const transactions = await ctx.db.transaction.findMany({
            where: { date: { gte: from, lte: to }, isDiscarded: false },
            select: { amount: true },
          });

          let income = 0;
          let expenses = 0;
          for (const transaction of transactions) {
            const amount = Number(transaction.amount);
            if (amount > 0) income += amount; else expenses += Math.abs(amount);
          }
          summaries.push({
            periodLabel,
            income,
            expenses,
            balance: income - expenses,
            fromDate: from,
            toDate: to,
          });
        }
      }
      return {
        summaries,
        nextPageOffset: summaries.length === numberOfPeriods ? offset + summaries.length : undefined,
        hasMore: summaries.length === numberOfPeriods,
      };
    }),

  getBudgetStreak: publicProcedure
    .input(getBudgetStreakInputSchema)
    .query(async ({ ctx, input }) => {
      const { periodMode, currentPeriodBeginDate } = input;
      let streak = 0;
      const dateToCheck = new Date(currentPeriodBeginDate);

      while (true) {
        let from: Date, to: Date;

        if (periodMode === Mode.Yearly) {
          dateToCheck.setFullYear(dateToCheck.getFullYear() - 1);
          dateToCheck.setMonth(0, 1);
          from = new Date(dateToCheck.getFullYear(), 0, 1);
          to = new Date(dateToCheck.getFullYear(), 11, 31);
        } else {
          dateToCheck.setDate(1);
          dateToCheck.setMonth(dateToCheck.getMonth() - 1);
          from = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth(), 1);
          to = new Date(dateToCheck.getFullYear(), dateToCheck.getMonth() + 1, 0);
        }
        
        if (currentPeriodBeginDate.getFullYear() - dateToCheck.getFullYear() > 10 && periodMode !== Mode.Yearly) {
            break;
        }
        if (currentPeriodBeginDate.getFullYear() - dateToCheck.getFullYear() > 100 && periodMode === Mode.Yearly) {
            break;
        }

        const transactions = await ctx.db.transaction.findMany({
          where: { date: { gte: from, lte: to }, isDiscarded: false },
          select: { amount: true },
        });

        if (transactions.length === 0) {
          break;
        }

        let income = 0;
        let expenses = 0;
        for (const transaction of transactions) {
          const amount = Number(transaction.amount);
          if (amount > 0) income += amount; else expenses += Math.abs(amount);
        }

        if (expenses <= income) {
          streak++;
        } else {
          break;
        }
      }
      return { streak, unit: periodMode === Mode.Yearly ? "year" : "month" };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: transactionSchema,
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
    .input(z.array(transactionSchema))
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
