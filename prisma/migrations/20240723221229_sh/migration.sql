-- CreateTable
CREATE TABLE "Budget" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "income" INTEGER NOT NULL,
    "savings" INTEGER NOT NULL,
    "housing" INTEGER NOT NULL,
    "food" INTEGER NOT NULL,
    "education" INTEGER NOT NULL,
    "recreation" INTEGER NOT NULL,
    "clothing" INTEGER NOT NULL,
    "communications" INTEGER NOT NULL,
    "personalCare" INTEGER NOT NULL,
    "insurance" INTEGER NOT NULL,
    "transportation" INTEGER NOT NULL,
    "medical" INTEGER NOT NULL,
    "fees" INTEGER NOT NULL
);
