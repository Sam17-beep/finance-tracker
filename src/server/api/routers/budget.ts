import {z} from "zod";

import {createTRPCRouter, publicProcedure} from "@/server/api/trpc";

const createBudgetInput = z.object({
  id: z.number().optional(),
  income: z.number(),
  savings: z.number(),
  housing: z.number(),
  food: z.number(),
  education: z.number(),
  recreation: z.number(),
  clothing: z.number(),
  communications: z.number(),
  personalCare: z.number(),
  insurance: z.number(),
  transportation: z.number(),
  medical: z.number(),
  fees: z.number(),
});


export const budgetRouter = createTRPCRouter({
  upsert: publicProcedure
    .input(createBudgetInput)
    .mutation(async ({ctx, input}) => {
      return ctx.db.budget.upsert({
        where: {
          id: input.id,
        },
        create: {
          ...input,
        },
        update: {
          ...input,
        },
      });
    }),

  getBudget: publicProcedure.query(async ({ctx}) => {
    const budget = await ctx.db.budget.findFirst();

    return budget ?? null;
  }),
});

