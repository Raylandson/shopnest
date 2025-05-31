-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Specification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "productId" INTEGER NOT NULL,
    CONSTRAINT "Specification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Specification" ("id", "name", "productId", "value") SELECT "id", "name", "productId", "value" FROM "Specification";
DROP TABLE "Specification";
ALTER TABLE "new_Specification" RENAME TO "Specification";
CREATE UNIQUE INDEX "Specification_productId_name_key" ON "Specification"("productId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
