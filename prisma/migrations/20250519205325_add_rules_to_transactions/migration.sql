-- CreateTable
CREATE TABLE "_TransactionRules" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TransactionRules_A_fkey" FOREIGN KEY ("A") REFERENCES "Rule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TransactionRules_B_fkey" FOREIGN KEY ("B") REFERENCES "Transaction" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "_TransactionRules_AB_unique" ON "_TransactionRules"("A", "B");

-- CreateIndex
CREATE INDEX "_TransactionRules_B_index" ON "_TransactionRules"("B");
