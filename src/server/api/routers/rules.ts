import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

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
        appliedTransactions: true,
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
          appliedTransactions: true,
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
      const rule = await ctx.db.rule.findUnique({
        where: { id: input.id },
        include: { appliedTransactions: true },
      });

      if (!rule) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Rule not found",
        });
      }

      // Update the rule
      const updatedRule = await ctx.db.rule.update({
        where: { id: input.id },
        data: input.data,
        include: { appliedTransactions: true },
      });

      // Check each transaction that was previously affected by this rule
      for (const transaction of rule.appliedTransactions) {
        const matches = input.data.matchType === "exact"
          ? transaction.name === input.data.matchString
          : transaction.name.toLowerCase().includes(input.data.matchString.toLowerCase());

        if (matches) {
          // If the transaction still matches, update its category/subcategory
          await ctx.db.transaction.update({
            where: { id: transaction.id },
            data: {
              categoryId: input.data.categoryId ?? null,
              subcategoryId: input.data.subcategoryId ?? null,
              isDiscarded: input.data.isDiscarded ?? false,
            },
          });
        } else {
          // If the transaction no longer matches, remove the rule association
          await ctx.db.transaction.update({
            where: { id: transaction.id },
            data: {
              appliedRules: {
                disconnect: { id: rule.id },
              },
            },
          });
        }
      }

      return updatedRule;
    }),

  // Delete a rule
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // First, get all transactions with this rule
      const transactions = await ctx.db.transaction.findMany({
        where: {
          appliedRules: {
            some: { id: input },
          },
        },
      });

      // Update each transaction to remove the rule
      await ctx.db.$transaction(
        transactions.map((transaction) =>
          ctx.db.transaction.update({
            where: { id: transaction.id },
            data: {
              appliedRules: {
                disconnect: { id: input },
              },
            },
          })
        )
      );

      // Then delete the rule
      return ctx.db.rule.delete({
        where: { id: input },
      });
    }),

  // Apply rules to transactions
  applyRules: publicProcedure
    .input(z.array(z.object({
      id: z.string().optional(), // Optional for new transactions
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

      const updatedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          let matchingRule = null;
          let updatedTransaction = { ...transaction };

          // Find the first matching rule
          for (const rule of rules) {
            const matches = rule.matchType === "exact"
              ? transaction.name === rule.matchString
              : transaction.name.toLowerCase().includes(rule.matchString.toLowerCase());

            if (matches) {
              matchingRule = rule;
              updatedTransaction = {
                ...transaction,
                categoryId: rule.categoryId ?? undefined,
                subcategoryId: rule.subcategoryId ?? undefined,
                isDiscarded: rule.isDiscarded,
              };
              break;
            }
          }

          // If this is an existing transaction (has an ID)
          if (transaction.id) {
            if (matchingRule) {
              // Update the transaction and connect it to the rule
              await ctx.db.transaction.update({
                where: { id: transaction.id },
                data: {
                  ...updatedTransaction,
                  appliedRules: {
                    set: [{ id: matchingRule.id }],
                  },
                },
              });
            } else {
              // Remove any rule associations
              await ctx.db.transaction.update({
                where: { id: transaction.id },
                data: {
                  ...updatedTransaction,
                  appliedRules: {
                    set: [],
                  },
                },
              });
            }
          }

          return {
            ...updatedTransaction,
            appliedRuleId: matchingRule?.id,
          };
        })
      );

      return updatedTransactions;
    }),
});
