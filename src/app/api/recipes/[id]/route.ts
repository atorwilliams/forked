import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const recipe = await db.recipe.findUnique({
    where: { id },
    select: { createdBy: true, creator: { select: { username: true, name: true } } },
  });

  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (recipe.createdBy !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const versions = await db.version.findMany({ where: { recipeId: id }, select: { id: true } });
  const versionIds = versions.map((v) => v.id);
  const authorName = recipe.creator.username ?? recipe.creator.name ?? null;

  await db.$transaction(async (tx) => {
    // Null self-referential version FKs
    if (versionIds.length > 0) {
      await tx.version.updateMany({
        where: { id: { in: versionIds } },
        data: { parentVersionId: null, forkedFromVersionId: null },
      });
    }

    // Null currentProductionVersionId before deleting versions
    await tx.recipe.update({ where: { id }, data: { currentProductionVersionId: null } });

    // Ghost-link: direct forks keep attribution but lose the recipe link
    await tx.recipe.updateMany({
      where: { forkedFromRecipeId: id },
      data: {
        forkedFromRecipeId: null,
        // forkedFromUserId and forkedFromUserName already set at fork time — no change needed
      },
    });

    // Delete version contents
    if (versionIds.length > 0) {
      await tx.versionIngredient.deleteMany({ where: { versionId: { in: versionIds } } });
      await tx.media.deleteMany({ where: { versionId: { in: versionIds } } });
      await tx.comment.deleteMany({ where: { versionId: { in: versionIds }, parentCommentId: { not: null } } });
      await tx.comment.deleteMany({ where: { versionId: { in: versionIds } } });
    }

    // Delete snap pointers
    await tx.snapPointer.deleteMany({ where: { newRecipeId: id } });
    await tx.snapPointer.deleteMany({ where: { originalRecipeId: id } });

    // Delete versions then recipe
    if (versionIds.length > 0) {
      await tx.version.deleteMany({ where: { id: { in: versionIds } } });
    }

    await tx.recipe.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
