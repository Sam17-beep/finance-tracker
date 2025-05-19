import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";

const ruleSchema = z.object({
  matchType: z.enum(["exact", "contains"]),
  matchString: z.string(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  isDiscarded: z.boolean().optional(),
});

export const rulesRouter = createTRPCRouter({
  // Create a new rule
  create: publicProcedure
    .input(ruleSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.rule.create({
        data: input,
      });
    }),

  // Get all rules
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.rule.findMany({
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }),

  // Get a single rule by ID
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      return ctx.db.rule.findUnique({
        where: { id: input },
        include: {
          category: true,
          subcategory: true,
        },
      });
    }),

  // Update a rule
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: ruleSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.rule.update({
        where: { id: input.id },
        data: input.data,
      });
    }),

  // Delete a rule
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.rule.delete({
        where: { id: input },
      });
    }),

  // Apply rules to transactions
  applyRules: publicProcedure
    .input(z.array(z.object({
      date: z.date(),
      name: z.string(),
      amount: z.number(),
      categoryId: z.string().optional(),
      subcategoryId: z.string().optional(),
      isDiscarded: z.boolean(),
    })))
    .mutation(async ({ ctx, input: transactions }) => {
      const rules = await ctx.db.rule.findMany({
        include: {
          category: true,
          subcategory: true,
        },
      });

      const updatedTransactions = transactions.map(transaction => {
        for (const rule of rules) {
          const matches = rule.matchType === "exact" 
            ? transaction.name === rule.matchString
            : transaction.name.toLowerCase().includes(rule.matchString.toLowerCase());

          if (matches) {
            const updated = {
              ...transaction,
              categoryId: rule.categoryId ?? undefined,
              subcategoryId: rule.subcategoryId ?? undefined,
              isDiscarded: rule.isDiscarded,
            };
            return updated;
          }
        }
        return transaction;
      });

      return updatedTransactions;
    }),
});
