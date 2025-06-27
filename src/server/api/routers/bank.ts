import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

const bankSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  dateFormat: z.string().min(1),
  dateColumnIndex: z.number().int().min(0),
  nameColumnIndex: z.number().int().min(0),
  amountColumnIndex: z.number().int().min(0),
  hasSeparateIncomeExpenseColumns: z.boolean().default(false),
  incomeColumnIndex: z.number().int().min(0).optional(),
  expenseColumnIndex: z.number().int().min(0).optional(),
  skipFirstRow: z.boolean().default(true),
  amountIsNegative: z.boolean().default(false),
  isCreditCard: z.boolean().default(false),
});

export const bankRouter = createTRPCRouter({
  // Get all banks
  getAll: publicProcedure
    .query(async ({ ctx }) => {
      return ctx.db.bank.findMany({
        orderBy: {
          name: "asc",
        },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });
    }),

  // Get a single bank by ID
  getById: publicProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const bank = await ctx.db.bank.findUnique({
        where: { id: input },
      });

      if (!bank) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank not found",
        });
      }

      return bank;
    }),

  // Create a new bank
  create: publicProcedure
    .input(bankSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if bank name already exists
      const existingBank = await ctx.db.bank.findUnique({
        where: { name: input.name },
      });

      if (existingBank) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A bank with this name already exists",
        });
      }

      return ctx.db.bank.create({
        data: input,
      });
    }),

  // Update a bank
  update: publicProcedure
    .input(z.object({
      id: z.string(),
      data: z.object({
        name: z.string().min(1).max(100),
        description: z.string().optional(),
        dateFormat: z.string().min(1),
        dateColumnIndex: z.number().int().min(0),
        nameColumnIndex: z.number().int().min(0),
        amountColumnIndex: z.number().int().min(0),
        hasSeparateIncomeExpenseColumns: z.boolean().default(false),
        incomeColumnIndex: z.number().int().min(0).optional(),
        expenseColumnIndex: z.number().int().min(0).optional(),
        skipFirstRow: z.boolean().default(true),
        amountIsNegative: z.boolean().default(false),
        isCreditCard: z.boolean().default(false),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, data } = input;
      return ctx.db.bank.update({
        where: { id },
        data,
      });
    }),

  // Delete a bank
  delete: publicProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // Check if bank has any transactions
      const transactionCount = await ctx.db.transaction.count({
        where: { bankId: input },
      });

      if (transactionCount > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Cannot delete bank. It has ${transactionCount} associated transactions.`,
        });
      }

      return ctx.db.bank.delete({
        where: { id: input },
      });
    }),

  // Parse CSV with bank configuration
  parseCsv: publicProcedure
    .input(z.object({
      bankId: z.string(),
      csvData: z.array(z.array(z.string())),
    }))
    .mutation(async ({ ctx, input }) => {
      const { bankId, csvData } = input;

      const bank = await ctx.db.bank.findUnique({
        where: { id: bankId },
      });

      if (!bank) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Bank configuration not found",
        });
      }

      const transactions = [];
      const startRow = bank.skipFirstRow ? 1 : 0;

      for (let i = startRow; i < csvData.length; i++) {
        const row = csvData[i];
        
        if (!row || row.length === 0) continue;

        try {
          const dateStr = row[bank.dateColumnIndex];
          const name = row[bank.nameColumnIndex];
          let amount = 0;

          if (!dateStr || !name) {
            continue; // Skip rows with missing required data
          }

          // Parse date based on bank's date format
          let date: Date;
          try {
            date = parseDate(dateStr, bank.dateFormat);
          } catch (error) {
            console.error(`Failed to parse date: ${dateStr} with format: ${bank.dateFormat}`);
            continue;
          }

          // Determine if this is income or expense
          let isIncome = false;
          
          if (bank.hasSeparateIncomeExpenseColumns && bank.incomeColumnIndex !== null && bank.expenseColumnIndex !== null) {
            // Use separate income/expense columns
            const incomeStr = row[bank.incomeColumnIndex] || "0";
            const expenseStr = row[bank.expenseColumnIndex] || "0";
            const incomeAmount = parseFloat(incomeStr.replace(/[^\d.-]/g, "")) || 0;
            const expenseAmount = parseFloat(expenseStr.replace(/[^\d.-]/g, "")) || 0;
            
            if (incomeAmount > 0) {
              amount = incomeAmount;
              isIncome = true;
            } else if (expenseAmount > 0) {
              amount = expenseAmount;
              isIncome = false;
            } else {
              continue; // Skip rows with no amounts
            }
          } else {
            // Use single amount column
            const amountStr = row[bank.amountColumnIndex] || "0";
            amount = parseFloat(amountStr.replace(/[^\d.-]/g, "")) || 0;
            
            if (amount === 0) continue; // Skip rows with no amount
            
            // For credit cards: positive = expense, negative = income
            if (bank.isCreditCard) {
              isIncome = amount < 0;
              amount = Math.abs(amount);
            } else {
              // For regular accounts: use the existing logic
              if (bank.amountIsNegative) {
                isIncome = amount > 0;
              } else {
                isIncome = amount > 0;
              }
              amount = Math.abs(amount);
            }
          }

          // Create transaction
          const transaction = await ctx.db.transaction.create({
            data: {
              date: date,
              name: name.trim(),
              amount: (isIncome ? amount : -amount).toString(), // Convert to string for Decimal field
              bankId: bank.id,
            },
          });

          transactions.push(transaction);
        } catch (error) {
          console.error(`Error processing row ${i}:`, error);
          continue;
        }
      }

      return {
        transactions,
        bank,
        totalRows: csvData.length,
        processedRows: transactions.length,
      };
    }),
});

// Helper function to parse dates based on format
function parseDate(dateStr: string, format: string): Date {
  const cleanDateStr = dateStr.trim();
  
  // Handle common date formats
  if (format === "YYYY-MM-DD") {
    const parts = cleanDateStr.split("-");
    if (parts.length !== 3) {
      throw new Error(`Invalid YYYY-MM-DD format: ${dateStr}`);
    }
    const [year, month, day] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  if (format === "MM/DD/YYYY") {
    const parts = cleanDateStr.split("/");
    if (parts.length !== 3) {
      throw new Error(`Invalid MM/DD/YYYY format: ${dateStr}`);
    }
    const [month, day, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  if (format === "DD-MM-YYYY") {
    const parts = cleanDateStr.split("-");
    if (parts.length !== 3) {
      throw new Error(`Invalid DD-MM-YYYY format: ${dateStr}`);
    }
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  if (format === "MM-DD-YYYY") {
    const parts = cleanDateStr.split("-");
    if (parts.length !== 3) {
      throw new Error(`Invalid MM-DD-YYYY format: ${dateStr}`);
    }
    const [month, day, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  if (format === "DD/MM/YYYY") {
    const parts = cleanDateStr.split("/");
    if (parts.length !== 3) {
      throw new Error(`Invalid DD/MM/YYYY format: ${dateStr}`);
    }
    const [day, month, year] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  if (format === "YYYYMMDD") {
    if (cleanDateStr.length !== 8) {
      throw new Error(`Invalid YYYYMMDD format: ${dateStr}`);
    }
    const year = parseInt(cleanDateStr.slice(0, 4));
    const month = parseInt(cleanDateStr.slice(4, 6));
    const day = parseInt(cleanDateStr.slice(6, 8));
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new Error(`Invalid date values in YYYYMMDD format: ${dateStr}`);
    }
    
    return new Date(year, month - 1, day);
  }
  
  if (format === "YYYY/MM/DD") {
    const parts = cleanDateStr.split("/");
    if (parts.length !== 3) {
      throw new Error(`Invalid YYYY/MM/DD format: ${dateStr}`);
    }
    const [year, month, day] = parts;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try to parse as ISO date
  const parsed = new Date(cleanDateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed;
  }
  
  throw new Error(`Unsupported date format: ${format} for date: ${dateStr}`);
} 