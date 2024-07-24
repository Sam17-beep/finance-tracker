/*
  Warnings:

  - You are about to alter the column `clothing` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `communications` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `education` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `fees` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `food` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `housing` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `income` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `insurance` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `medical` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `personalCare` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `recreation` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `savings` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.
  - You are about to alter the column `transportation` on the `Budget` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- CreateTable
CREATE TABLE "Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ammout" INTEGER NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Budget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "income" REAL NOT NULL DEFAULT 0,
    "savings" REAL NOT NULL DEFAULT 0,
    "housing" REAL NOT NULL DEFAULT 0,
    "food" REAL NOT NULL DEFAULT 0,
    "education" REAL NOT NULL DEFAULT 0,
    "recreation" REAL NOT NULL DEFAULT 0,
    "clothing" REAL NOT NULL DEFAULT 0,
    "communications" REAL NOT NULL DEFAULT 0,
    "personalCare" REAL NOT NULL DEFAULT 0,
    "insurance" REAL NOT NULL DEFAULT 0,
    "transportation" REAL NOT NULL DEFAULT 0,
    "medical" REAL NOT NULL DEFAULT 0,
    "fees" REAL NOT NULL DEFAULT 0
);
INSERT INTO "new_Budget" ("clothing", "communications", "education", "fees", "food", "housing", "id", "income", "insurance", "medical", "personalCare", "recreation", "savings", "transportation") SELECT "clothing", "communications", "education", "fees", "food", "housing", "id", "income", "insurance", "medical", "personalCare", "recreation", "savings", "transportation" FROM "Budget";
DROP TABLE "Budget";
ALTER TABLE "new_Budget" RENAME TO "Budget";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
