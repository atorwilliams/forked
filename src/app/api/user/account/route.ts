import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Fetch user display name before deletion so we can preserve it in the chain
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { username: true, name: true },
  });
  const displayName = user?.username ?? user?.name ?? null;

  const userRecipes = await db.recipe.findMany({
    where: { createdBy: userId },
    select: { id: true },
  });
  const recipeIds = userRecipes.map((r) => r.id);

  const userVersions = recipeIds.length > 0
    ? await db.version.findMany({ where: { recipeId: { in: recipeIds } }, select: { id: true } })
    : [];
  const versionIds = userVersions.map((v) => v.id);

  await db.$transaction(async (tx) => {
    // Preserve attribution chain: any recipe that was forked from the user's recipes
    // already has forkedFromUserId set. Recipes forked from recipes by this user
    // (outside their own set) need their forkedFromUserName frozen before user is deleted.
    if (displayName) {
      await tx.recipe.updateMany({
        where: { forkedFromUserId: userId },
        data: { forkedFromUserName: displayName },
      });
    }
    // Null the FK reference (user is being deleted) but leave forkedFromUserName intact
    await tx.recipe.updateMany({
      where: { forkedFromUserId: userId },
      data: { forkedFromUserId: null },
    });

    // Null out self-referential version FKs so deleteMany doesn't choke
    if (versionIds.length > 0) {
      await tx.version.updateMany({
        where: { recipeId: { in: recipeIds } },
        data: { parentVersionId: null, forkedFromVersionId: null },
      });
    }

    // Null out currentProductionVersionId before deleting versions
    if (recipeIds.length > 0) {
      await tx.recipe.updateMany({
        where: { id: { in: recipeIds } },
        data: { currentProductionVersionId: null },
      });
      // Null out forkedFromRecipeId on other users' forks of this user's recipes
      await tx.recipe.updateMany({
        where: { forkedFromRecipeId: { in: recipeIds } },
        data: { forkedFromRecipeId: null },
      });
    }

    // Detach ingredients from user
    await tx.ingredient.updateMany({ where: { addedBy: userId }, data: { addedBy: null } });

    // Delete version ingredients and media
    if (versionIds.length > 0) {
      await tx.versionIngredient.deleteMany({ where: { versionId: { in: versionIds } } });
      await tx.media.deleteMany({ where: { versionId: { in: versionIds } } });
    }

    // Delete comments — replies before top-level to avoid self-referential FK issues
    if (versionIds.length > 0) {
      await tx.comment.deleteMany({ where: { versionId: { in: versionIds }, parentCommentId: { not: null } } });
      await tx.comment.deleteMany({ where: { versionId: { in: versionIds } } });
    }
    // Delete any remaining comments authored by the user on other recipes
    await tx.comment.deleteMany({ where: { authorId: userId } });

    // Delete snap pointers
    if (recipeIds.length > 0) {
      await tx.snapPointer.deleteMany({ where: { newRecipeId: { in: recipeIds } } });
      await tx.snapPointer.deleteMany({ where: { originalRecipeId: { in: recipeIds } } });
    }
    await tx.snapPointer.deleteMany({ where: { snapCreatorId: userId } });

    // Delete versions and recipes
    if (versionIds.length > 0) {
      await tx.version.deleteMany({ where: { id: { in: versionIds } } });
    }
    if (recipeIds.length > 0) {
      await tx.recipe.deleteMany({ where: { id: { in: recipeIds } } });
    }

    // Delete all workspace members from the user's owned workspaces, then the user's own memberships
    await tx.workspaceMember.deleteMany({ where: { workspace: { ownerId: userId } } });
    await tx.workspaceMember.deleteMany({ where: { userId } });
    await tx.workspace.deleteMany({ where: { ownerId: userId } });

    // Delete verification tokens
    if (session.user.email) {
      await tx.verificationToken.deleteMany({ where: { identifier: session.user.email } });
    }

    // Delete user — Account, Session, PasswordResetToken cascade
    await tx.user.delete({ where: { id: userId } });
  });

  return NextResponse.json({ ok: true });
}
