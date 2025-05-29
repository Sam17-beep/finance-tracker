import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { Mode, numberOfMonthsInPeriod } from "@/domain/Date";


export interface BudgetAnalysisItem {
  name: string;
  goal: number;
  spending: number;
  isIncome: boolean; 
}

export const analysisRouter = createTRPCRouter({
  getBudgetAnalysis: publicProcedure
    .input(
      z.object({
        dateRange: z.object({
          from: z.date(),
          to: z.date(),
        }),
        dateMode: z.nativeEnum(Mode),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { from: beginDate, to: endDate } = input.dateRange;

      const numberOfMonths = numberOfMonthsInPeriod(beginDate, endDate, input.dateMode);

      const categories = await ctx.db.category.findMany({
        include: {
          subcategories: true,
        },
      });

      const transactions = await ctx.db.transaction.findMany({
        where: {
          date: {
            gte: beginDate,
            lte: endDate,
          },
          isDiscarded: false, 
        },
      });

      const chartDataItems: BudgetAnalysisItem[] = categories.map((category) => {
        const monthlyGoal = category.subcategories.reduce(
          (sum, sc) => sum + Number(sc.targetAmount), 
          0,
        );

        const proratedGoal = monthlyGoal * numberOfMonths;

        const spendingForCategory = transactions
          .filter((t) => t.categoryId === category.id)
          .reduce((sum, t) => sum + Number(t.amount), 0);

        const displaySpending = category.isIncome
          ? spendingForCategory
          : Math.abs(spendingForCategory);

        return {
          name: category.name,
          goal: parseFloat(proratedGoal.toFixed(2)),
          spending: parseFloat(displaySpending.toFixed(2)),
          isIncome: category.isIncome,
        };
      });

      return chartDataItems;
    }),
}); 