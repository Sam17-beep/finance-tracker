-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Bank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dateFormat" TEXT NOT NULL,
    "dateColumnIndex" INTEGER NOT NULL,
    "nameColumnIndex" INTEGER NOT NULL,
    "amountColumnIndex" INTEGER NOT NULL,
    "hasSeparateIncomeExpenseColumns" BOOLEAN NOT NULL DEFAULT false,
    "incomeColumnIndex" INTEGER,
    "expenseColumnIndex" INTEGER,
    "skipFirstRow" BOOLEAN NOT NULL DEFAULT true,
    "amountIsNegative" BOOLEAN NOT NULL DEFAULT false,
    "isCreditCard" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Bank" ("amountColumnIndex", "amountIsNegative", "createdAt", "dateColumnIndex", "dateFormat", "description", "expenseColumnIndex", "hasSeparateIncomeExpenseColumns", "id", "incomeColumnIndex", "name", "nameColumnIndex", "skipFirstRow", "updatedAt") SELECT "amountColumnIndex", "amountIsNegative", "createdAt", "dateColumnIndex", "dateFormat", "description", "expenseColumnIndex", "hasSeparateIncomeExpenseColumns", "id", "incomeColumnIndex", "name", "nameColumnIndex", "skipFirstRow", "updatedAt" FROM "Bank";
DROP TABLE "Bank";
ALTER TABLE "new_Bank" RENAME TO "Bank";
CREATE UNIQUE INDEX "Bank_name_key" ON "Bank"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
