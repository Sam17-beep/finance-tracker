/*
  Warnings:

  - You are about to alter the column `ammout` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Float`.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Transaction" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ammout" REAL NOT NULL DEFAULT 0,
    "date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "category" TEXT,
    "description" TEXT NOT NULL,
    "toReview" BOOLEAN NOT NULL DEFAULT true
);
INSERT INTO "new_Transaction" ("ammout", "category", "date", "description", "id", "toReview") SELECT "ammout", "category", "date", "description", "id", "toReview" FROM "Transaction";
DROP TABLE "Transaction";
ALTER TABLE "new_Transaction" RENAME TO "Transaction";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
