-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerifiedAt" DATETIME,
    "accountType" TEXT NOT NULL DEFAULT 'free',
    "bio" TEXT,
    "avatarUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'public',
    "ownerId" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentProductionVersionId" TEXT,
    "forkCount" INTEGER NOT NULL DEFAULT 0,
    "snapCount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Recipe_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Recipe_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Version" (
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
    "ingredients" TEXT,
    "procedure" TEXT,
    "materials" TEXT,
    "notes" TEXT,
    CONSTRAINT "Version_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Version_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Version_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "Version" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Media" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "stepIndex" INTEGER,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Media_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "versionId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentCommentId" TEXT,
    CONSTRAINT "Comment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "Version" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentCommentId_fkey" FOREIGN KEY ("parentCommentId") REFERENCES "Comment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SnapPointer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "newRecipeId" TEXT NOT NULL,
    "originalRecipeId" TEXT NOT NULL,
    "originalVersionId" TEXT NOT NULL,
    "snapCreatorId" TEXT NOT NULL,
    "originalAuthorId" TEXT NOT NULL,
    "snappedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "displayNote" TEXT,
    CONSTRAINT "SnapPointer_newRecipeId_fkey" FOREIGN KEY ("newRecipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SnapPointer_originalRecipeId_fkey" FOREIGN KEY ("originalRecipeId") REFERENCES "Recipe" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SnapPointer_snapCreatorId_fkey" FOREIGN KEY ("snapCreatorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SnapPointer_originalAuthorId_fkey" FOREIGN KEY ("originalAuthorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
