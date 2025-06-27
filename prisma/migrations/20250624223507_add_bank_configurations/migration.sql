-- CreateTable
CREATE TABLE "Bank" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "amount" DECIMAL NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT,
    "subcategoryId" TEXT,
    "bankId" TEXT,
    "isDiscarded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Transaction_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Transaction_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "Bank" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Transaction" ("amount", "categoryId", "createdAt", "date", "id", "isDiscarded", "name", "subcategoryId", "updatedAt") SELECT "amount", "categoryId", "createdAt", "date", "id", "isDiscarded", "name", "subcategoryId", "updatedAt" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
CREATE INDEX "Transaction_categoryId_idx" ON "Transaction"("categoryId");
CREATE INDEX "Transaction_subcategoryId_idx" ON "Transaction"("subcategoryId");
CREATE INDEX "Transaction_bankId_idx" ON "Transaction"("bankId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Bank_name_key" ON "Bank"("name");
