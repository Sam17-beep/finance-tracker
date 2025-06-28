import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create separate Prisma clients for each budget
const createPrismaClient = (databaseUrl: string) => {
  return new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
};

// Get the active budget from cookies or headers in server context
const getActiveBudgetFromRequest = (headers: Headers | undefined) => {
  if (!headers) return 'my-budget';
  
  const cookie = headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/activeBudgetId=([^;]+)/);
    if (match) return match[1];
  }
  
  return 'my-budget';
};

// Create a function that returns the appropriate database client
export const getDb = (headers?: Headers) => {
  const activeBudget = getActiveBudgetFromRequest(headers);
  
  if (activeBudget === 'girlfriend-budget') {
    return createPrismaClient('file:./db_girlfriend.sqlite');
  }
  
  // Default to your budget
  return createPrismaClient('file:./db.sqlite');
};

// For backward compatibility, export a default db instance
export const db = createPrismaClient('file:./db.sqlite');

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
