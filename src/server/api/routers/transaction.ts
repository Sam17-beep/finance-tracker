import {createTRPCRouter, publicProcedure} from "@/server/api/trpc";
import {z} from "zod";
import {type Transaction} from "@/components/custom/TransactionRow";


export const transactionRouter = createTRPCRouter({
  getTransactions: publicProcedure.query(async ({ctx}) => {
    return await ctx.db.transaction.findMany({
      where: {
        toReview: false,
        category: {not: null}
      }
    }) as Transaction[];

  }),
  deleteTransaction: publicProcedure.input(z.object({id: z.number()})).mutation(async ({ctx, input}) => {
    return ctx.db.transaction.delete({
      where: {
        id: input.id
      }
    });
  }),
});

