import {z} from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const decimalSchema = z.number().positive().multipleOf(0.01).max(99999999.99);

export const budgetRouter = createTRPCRouter({
  // Category operations
  createCategory: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(50),
      isIncome: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.create({
        data: input,
      });
    }),

  getCategories: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.category.findMany({
        include: {
          subcategories: true,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }),

  updateCategory: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(50),
      isIncome: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.category.update({
        where: { id },
        data,
      });
    }),

  deleteCategory: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.category.delete({
        where: { id: input },
      });
    }),

  // Subcategory operations
  createSubcategory: publicProcedure
    .input(z.object({
      name: z.string().min(1).max(50),
      targetAmount: decimalSchema,
      categoryId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify category exists
      const category = await ctx.db.category.findUnique({
        where: { id: input.categoryId },
      });
      
      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Category not found',
        });
      }

      return ctx.db.subcategory.create({
        data: input,
      });
    }),

  updateSubcategory: publicProcedure
    .input(z.object({
      id: z.string(),
      name: z.string().min(1).max(50),
      targetAmount: decimalSchema,
      categoryId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.subcategory.update({
        where: { id },
        data,
      });
    }),

  deleteSubcategory: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      return ctx.db.subcategory.delete({
        where: { id: input },
      });
    }),
});

