import {createTRPCRouter, publicProcedure} from "@/server/api/trpc";


export const transactionRouter = createTRPCRouter({
  getTransactions: publicProcedure.query(async ({ctx}) => {
    return await ctx.db.transaction.findMany({
      where: {
        toReview: true
      }
    });
  }),
});

