import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "recipe";
}

export async function POST(req: NextRequest) {
  try {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, username: true } });
  if (!user?.username) return NextResponse.json({ error: "Set a username before forking." }, { status: 400 });

  const { sourceRecipeId, sourceVersionId, title, commitMessage } = await req.json();
  if (!sourceRecipeId || !sourceVersionId) return NextResponse.json({ error: "sourceRecipeId and sourceVersionId required." }, { status: 400 });
  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const sv = await db.version.findUnique({
    where: { id: sourceVersionId },
    include: { ingredients: { orderBy: { order: "asc" } } },
  });
  if (!sv) return NextResponse.json({ error: "Source version not found." }, { status: 404 });

  const sr = await db.recipe.findUnique({ where: { id: sourceRecipeId }, select: { tags: true, description: true } });
  if (!sr) return NextResponse.json({ error: "Source recipe not found." }, { status: 404 });

  let workspace = await db.workspace.findUnique({ where: { slug: user.username } });
  if (!workspace) {
    workspace = await db.workspace.create({ data: { name: user.username, slug: user.username, ownerId: user.id, type: "public" } });
  }

  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (await db.recipe.findFirst({ where: { workspaceId: workspace.id, slug } })) slug = `${base}-${n++}`;

  const forked = await db.recipe.create({
    data: {
      slug, workspaceId: workspace.id, createdBy: user.id,
      title: title.trim(), description: sr.description, tags: sr.tags,
      isProduction: false, forkedFromRecipeId: sourceRecipeId,
      versions: {
        create: {
          createdBy: user.id, isProduction: false,
          commitMessage: commitMessage?.trim() || `Fork of ${title}`,
          forkedFromVersionId: sourceVersionId,
          contentMode: sv.contentMode, contentRaw: sv.contentRaw,
          title: title.trim(), description: sv.description,
          yield: sv.yield, prepTime: sv.prepTime, cookTime: sv.cookTime,
          tags: sv.tags, procedure: sv.procedure, materials: sv.materials, notes: sv.notes,
          ingredients: {
            create: sv.ingredients.map((ing) => ({
              rawText: ing.rawText, order: ing.order, ingredientId: ing.ingredientId,
              quantity: ing.quantity, unit: ing.unit, unitTier: ing.unitTier,
              isToTaste: ing.isToTaste, isUnresolved: ing.isUnresolved,
              packageCount: ing.packageCount, packageSize: ing.packageSize,
              packageSizeUnit: ing.packageSizeUnit, packageType: ing.packageType,
            })),
          },
        },
      },
    },
  });

  await db.recipe.update({ where: { id: sourceRecipeId }, data: { forkCount: { increment: 1 } } });

  return NextResponse.json({ username: user.username, slug: forked.slug });
  } catch (e) {
    console.error("[fork]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
