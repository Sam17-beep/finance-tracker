import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import type { PrismaClient, Rule, Transaction } from "@prisma/client";

type RuleWithRelations = Rule & {
  appliedTransactions: Transaction[];
};

const ruleSchema = z.object({
  matchType: z.enum(["exact", "contains"]),
  matchString: z.string(),
  categoryId: z.string().optional(),
  subcategoryId: z.string().optional(),
  isDiscarded: z.boolean().optional(),
});

const applyRuleOnAllTransactions = async (
  transactions: Transaction[],
  rules: RuleWithRelations[],
  ctx: {
    headers: Headers;
    db: PrismaClient<{
      log: "error"[];
    }>;
  }
) => {
      for (const rule of rules) {
        for (const transaction of transactions) {
          const matches = rule.matchType === "exact"
          ? transaction.name === rule.matchString
          : transaction.name.toLowerCase().includes(rule.matchString.toLowerCase());

        if (matches) {
          await ctx.db.transaction.update({
            where: { id: transaction.id },
            data: {
              categoryId: rule.categoryId ?? null,
              subcategoryId: rule.subcategoryId ?? null,
              isDiscarded: rule.isDiscarded ?? false,
              appliedRules: {
                connect: { id: rule.id },
              },
            },
          });
        } else if (rule?.appliedTransactions.some(t => t.id === transaction.id)) {
          await ctx.db.transaction.update({
            where: { id: transaction.id },
            data: {
              categoryId: null,
              subcategoryId: null,
              isDiscarded: false,
              appliedRules: {
                disconnect: { id: rule.id },
              },
            },
          });
        }
      }
  }
};

export const rulesRouter = createTRPCRouter({
  create: publicProcedure
    .input(ruleSchema)
    .mutation(async ({ ctx, input }) => {
      const rule = await ctx.db.rule.create({
        data: input,
        include: {
          appliedTransactions: true,
        },
      });

      const transactions = await ctx.db.transaction.findMany();
      void applyRuleOnAllTransactions(transactions, [rule], ctx);
      return rule;
    }),

  getAll: publicProcedure
    .input(z.object({
      categoryId: z.string().optional(),
      subcategoryId: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input?.categoryId && { categoryId: input.categoryId }),
        ...(input?.subcategoryId && { subcategoryId: input.subcategoryId }),
      };

      return ctx.db.rule.findMany({
        where,
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


  reapplyAllRules: publicProcedure
    .mutation(async ({ ctx }) => {
      const transactions = await ctx.db.transaction.findMany();
      const rules = await ctx.db.rule.findMany({
        include: {
          appliedTransactions: true,
        },
      });

      await applyRuleOnAllTransactions(transactions, rules, ctx);
      return { success: true };
    }),

  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: ruleSchema,
    }))
    .mutation(async ({ ctx, input: { id, data } }) => {
      const updatedRule = await ctx.db.rule.update({
        where: { id: id },
        data: data,
        include: {
          appliedTransactions: true,
        },
      });

      const transactions = await ctx.db.transaction.findMany();
      await applyRuleOnAllTransactions(transactions, [updatedRule], ctx);
      return updatedRule;
    }),

  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const transactions = await ctx.db.transaction.findMany({
        where: {
          appliedRules: {
            some: { id: input },
          },
        },
      });

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

      return ctx.db.rule.delete({
        where: { id: input },
      });
    }),

  applyRules: publicProcedure
    .input(z.array(z.object({
      id: z.string().optional(),
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

          if (transaction.id) {
            if (matchingRule) {
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
