import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import type { PrismaClient, Prisma } from "@prisma/client";

const transactionSchema = z.object({
  date: z.date(),
  amount: z.number(),
  name: z.string(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  isDiscarded: z.boolean().optional(),
});

type TransactionInput = z.infer<typeof transactionSchema>;

interface DuplicateTransaction {
  name: string;
  amount: Prisma.Decimal;
  date: Date;
}

// Helper function to check for duplicate transactions
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

export const transactionRouter = createTRPCRouter({
  // Create a new transaction
  create: publicProcedure
    .input(transactionSchema)
    .mutation(async ({ ctx, input }) => {
      // Check for duplicate
      const duplicates = await findDuplicateTransactions(ctx, [input]);
      if (duplicates.length > 0) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A transaction with the same name, amount, and date already exists',
        });
      }

      return ctx.db.transaction.create({
        data: input,
      });
    }),

  // Get all transactions with filtering and pagination
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
        transactions,
        total,
      };
    }),

  // Get a single transaction by ID
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.db.transaction.findUnique({
        where: { id: input },
        include: {
          category: true,
          subcategory: true,
        },
      });
    }),

  // Update a transaction
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: transactionSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  // Delete a transaction
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.transaction.delete({
        where: { id: input },
      });
    }),

  // Create multiple transactions
  bulkCreate: publicProcedure
    .input(z.array(transactionSchema))
    .mutation(async ({ ctx, input }) => {
      // Check for duplicates
      const duplicates = await findDuplicateTransactions(ctx, input);
      if (duplicates.length > 0) {
        // Filter out duplicate transactions
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

        // Save only unique transactions
        const result = await ctx.db.transaction.createMany({
          data: uniqueTransactions,
        });

        // Return information about skipped duplicates
        return {
          created: result.count,
          skipped: input.length - uniqueTransactions.length,
          duplicates: duplicates.length,
        };
      }

      // If no duplicates, save all transactions
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
