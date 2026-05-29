-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "currentProductionVersionId" TEXT,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "snapCount" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "tags" TEXT NOT NULL DEFAULT '[]',
    "isProduction" BOOLEAN NOT NULL DEFAULT false,
    "forkedFromRecipeId" TEXT,
    CONSTRAINT "Recipe_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recipe_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recipe_forkedFromRecipeId_fkey" FOREIGN KEY ("forkedFromRecipeId") REFERENCES "Recipe" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Recipe" ("createdAt", "createdBy", "currentProductionVersionId", "description", "forkCount", "id", "isProduction", "slug", "snapCount", "tags", "title", "updatedAt", "workspaceId") SELECT "createdAt", "createdBy", "currentProductionVersionId", "description", "forkCount", "id", "isProduction", "slug", "snapCount", "tags", "title", "updatedAt", "workspaceId" FROM "Recipe";
DROP TABLE "Recipe";
ALTER TABLE "new_Recipe" RENAME TO "Recipe";
CREATE UNIQUE INDEX "Recipe_workspaceId_slug_key" ON "Recipe"("workspaceId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
