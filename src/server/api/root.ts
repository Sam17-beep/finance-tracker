import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { budgetRouter } from "./routers/budget";
import { transactionRouter } from "./routers/transaction";
import { rulesRouter } from "./routers/rules";
import { bankRouter } from "./routers/bank";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  budget: budgetRouter,
  transaction: transactionRouter,
  rules: rulesRouter,
  bank: bankRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
