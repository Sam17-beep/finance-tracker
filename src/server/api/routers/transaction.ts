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

// Helper function to check for duplicate transactions
async function findDuplicateTransactions(
  ctx: { db: PrismaClient },
  transactions: TransactionInput[]
): Promise<DuplicateTransaction[]> {
  if (transactions.length === 0) {
    return [];
  }

  // Create a more flexible query that uses OR conditions for each transaction
  const whereConditions = transactions.map(t => ({
    AND: [
      { name: t.name },
      { 
        amount: {
          gte: new Prisma.Decimal((t.amount - 0.01).toString()),
          lte: new Prisma.Decimal((t.amount + 0.01).toString()),
        }
      },
      { 
        date: {
          gte: new Date(t.date.getTime() - 60000), // 1 minute before
          lte: new Date(t.date.getTime() + 60000), // 1 minute after
        }
      }
    ]
  }));

  const duplicates = await ctx.db.transaction.findMany({
    where: {
      OR: whereConditions
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

const getDashboardDataInputSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

const getLastMonthSpendingInputSchema = z.object({
  dateRange: z.object({
    from: z.date(),
    to: z.date(),
  }),
});

export const transactionRouter = createTRPCRouter({
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
        transactions: transactions.map(t => ({
          ...t,
          amount: Number(t.amount.toString()),
        })),
        total,
      };
    }),

  // Get dashboard data - all transactions in date range without pagination
  getDashboardData: publicProcedure
    .input(getDashboardDataInputSchema)
    .query(async ({ ctx, input }) => {
      const { dateRange } = input;

      const where = {
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
      };

      const transactions = await ctx.db.transaction.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
          appliedRules: true,
        },
        orderBy: {
          date: "desc",
        },
      });

      return {
        transactions: transactions.map(t => ({
          ...t,
          amount: Number(t.amount.toString()),
        })),
      };
    }),

  // Get last month's spending by category and subcategory
  getLastMonthSpending: publicProcedure
    .input(getLastMonthSpendingInputSchema)
    .query(async ({ ctx, input }) => {
      const { dateRange } = input;

      const where = {
        date: {
          gte: dateRange.from,
          lte: dateRange.to,
        },
        isDiscarded: false,
      };

      const transactions = await ctx.db.transaction.findMany({
        where,
        include: {
          category: true,
          subcategory: true,
        },
      });

      // Group spending by category and subcategory
      const spendingByCategory: Record<string, number> = {};
      const spendingBySubcategory: Record<string, number> = {};

      transactions.forEach(transaction => {
        const amount = Math.abs(Number(transaction.amount.toString()));
        
        if (transaction.categoryId) {
          spendingByCategory[transaction.categoryId] = (spendingByCategory[transaction.categoryId] || 0) + amount;
        }
        
        if (transaction.subcategoryId) {
          spendingBySubcategory[transaction.subcategoryId] = (spendingBySubcategory[transaction.subcategoryId] || 0) + amount;
        }
      });

      return {
        spendingByCategory,
        spendingBySubcategory,
      };
    }),

  // Update a transaction
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
        amount: Number(updated.amount.toString()),
      };
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
      console.log(`Attempting to create ${input.length} transactions`);
      
      // Check for duplicates
      const duplicates = await findDuplicateTransactions(ctx, input);
      console.log(`Found ${duplicates.length} potential duplicates`);
      
      if (duplicates.length > 0) {
        // Filter out duplicate transactions
        const uniqueTransactions = input.filter(transaction => 
          !duplicates.some((dup: DuplicateTransaction) => 
            dup.name === transaction.name &&
            Math.abs(Number(dup.amount) - transaction.amount) < 0.01 && // Use tolerance for floating point comparison
            Math.abs(dup.date.getTime() - transaction.date.getTime()) < 60000 // Allow 1 minute tolerance for date comparison
          )
        );

        console.log(`After filtering, ${uniqueTransactions.length} transactions remain`);

        if (uniqueTransactions.length === 0) {
          console.log('All transactions were filtered out as duplicates');
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'All transactions are duplicates',
          });
        }

        // Save only unique transactions
        const result = await ctx.db.transaction.createMany({
          data: uniqueTransactions.map(t => ({
            ...t,
            amount: new Prisma.Decimal(t.amount.toString()),
          })),
        });

        console.log(`Successfully created ${result.count} transactions`);

        // Return information about skipped duplicates
        return {
          created: result.count,
          skipped: input.length - uniqueTransactions.length,
          duplicates: duplicates.length,
        };
      }

      // If no duplicates, save all transactions
      const result = await ctx.db.transaction.createMany({
        data: input.map(t => ({
          ...t,
          amount: new Prisma.Decimal(t.amount.toString()),
        })),
      });

      console.log(`Successfully created ${result.count} transactions (no duplicates found)`);

      return {
        created: result.count,
        skipped: 0,
        duplicates: 0,
      };
    }),

  deleteAll: publicProcedure
    .mutation(async ({ ctx }) => {
      const deletedCount = await ctx.db.transaction.deleteMany({});
      
      return { deletedCount: deletedCount.count };
    }),
});
