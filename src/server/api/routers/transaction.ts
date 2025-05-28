import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { type PrismaClient, Prisma } from "@prisma/client";

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

      const where = {
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
        isDiscarded: false,
        ...(categoryId && { categoryId }),
        ...(subcategoryId && { subcategoryId }),
      };

      const transactions = await ctx.db.transaction.findMany({
        where,
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
        income,
        expenses,
        balance: income - expenses,
      };
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
