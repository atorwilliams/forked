/*
  Warnings:

  - You are about to drop the column `ingredients` on the `Version` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "IngredientCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "parentId" TEXT,
    CONSTRAINT "IngredientCategory_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "IngredientCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Ingredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nameNormalized" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "aliases" TEXT NOT NULL DEFAULT '[]',
    "addedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Ingredient_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "IngredientCategory" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ingredient_addedBy_fkey" FOREIGN KEY ("addedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VersionIngredient" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "ingredientId" TEXT,
    "rawText" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "quantity" REAL,
    "unit" TEXT,
    "unitTier" TEXT NOT NULL DEFAULT 'measured',
    "packageCount" REAL,
    "packageSize" REAL,
    "packageSizeUnit" TEXT,
    "packageType" TEXT,
    "isToTaste" BOOLEAN NOT NULL DEFAULT false,
    "isUnresolved" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "VersionIngredient_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "VersionIngredient_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Version" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recipeId" TEXT NOT NULL,
    "parentVersionId" TEXT,
    "forkedFromVersionId" TEXT,
    "forkedFromWorkspaceId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isProduction" BOOLEAN NOT NULL DEFAULT false,
    "commitMessage" TEXT,
    "contentMode" TEXT NOT NULL DEFAULT 'freetext',
    "contentRaw" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "yield" TEXT,
    "prepTime" TEXT,
    "cookTime" TEXT,
    "tags" TEXT,
    "procedure" TEXT,
    "materials" TEXT,
    "notes" TEXT,
    CONSTRAINT "Version_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Version_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Version_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "Version" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Version" ("commitMessage", "contentMode", "contentRaw", "cookTime", "createdAt", "createdBy", "description", "forkedFromVersionId", "forkedFromWorkspaceId", "id", "isProduction", "materials", "notes", "parentVersionId", "prepTime", "procedure", "recipeId", "tags", "title", "yield") SELECT "commitMessage", "contentMode", "contentRaw", "cookTime", "createdAt", "createdBy", "description", "forkedFromVersionId", "forkedFromWorkspaceId", "id", "isProduction", "materials", "notes", "parentVersionId", "prepTime", "procedure", "recipeId", "tags", "title", "yield" FROM "Version";
DROP TABLE "Version";
ALTER TABLE "new_Version" RENAME TO "Version";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "IngredientCategory_slug_key" ON "IngredientCategory"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Ingredient_nameNormalized_key" ON "Ingredient"("nameNormalized");
