import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseIngredientLine, singularize } from "@/lib/ingredient-parser";

function parseAliases(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return raw.split(",").map((s) => s.trim()).filter(Boolean); }
}

// POST /api/recipes/versions — add a new version to an existing recipe
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, username: true } });
  if (!user?.username) return NextResponse.json({ error: "Username required." }, { status: 400 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { recipeId, title, description, yield: yieldStr, prepTime, cookTime, tags, ingredientText, procedure, materials, notes, commitMessage, isProduction, contentMode, contentRaw } = body;

  if (!recipeId) return NextResponse.json({ error: "recipeId required." }, { status: 400 });

  const recipe = await db.recipe.findUnique({ where: { id: recipeId }, select: { id: true, createdBy: true, workspaceId: true, workspace: { select: { slug: true } } } });
  if (!recipe) return NextResponse.json({ error: "Recipe not found." }, { status: 404 });
  if (recipe.createdBy !== user.id) return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  // Find latest version to set as parent
  const parent = await db.version.findFirst({ where: { recipeId }, orderBy: { createdAt: "desc" }, select: { id: true } });

  const tagsArray: string[] = typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : Array.isArray(tags) ? tags : [];

  // Parse and resolve ingredients
  const ingredientLines: string[] = typeof ingredientText === "string"
    ? ingredientText.split("\n").map((l: string) => l.trim()).filter(Boolean)
    : [];

  const allIngredients = ingredientLines.length > 0
    ? await db.ingredient.findMany({ select: { id: true, nameNormalized: true, aliases: true } })
    : [];

  const resolvedIngredients = ingredientLines.map((line, order) => {
    const parsed = parseIngredientLine(line);
    let ingredientId: string | null = null;
    if (parsed.status === "ok" || parsed.isToTaste) {
      const name = parsed.ingredientName;
      const singular = singularize(name);
      const match = allIngredients.find(
        (i) => i.nameNormalized === name || i.nameNormalized === singular ||
          parseAliases(i.aliases).some((a) => a.toLowerCase() === name || a.toLowerCase() === singular)
      );
      ingredientId = match?.id ?? null;
    }
    return {
      rawText: line, order, ingredientId,
      quantity: parsed.quantity, unit: parsed.unit, unitTier: parsed.unitDef?.tier ?? "measured",
      isToTaste: parsed.isToTaste, isUnresolved: !ingredientId,
      packageCount: parsed.packageInfo?.count ?? null, packageSize: parsed.packageInfo?.size ?? null,
      packageSizeUnit: parsed.packageInfo?.sizeUnit ?? null, packageType: parsed.packageInfo?.containerType ?? null,
    };
  });

  const version = await db.version.create({
    data: {
      recipeId,
      parentVersionId: parent?.id ?? null,
      createdBy: user.id,
      isProduction: !!isProduction,
      commitMessage: commitMessage?.trim() || "Update",
      contentMode: contentMode ?? "structured",
      contentRaw: contentRaw ?? procedure ?? "",
      title: title?.trim() || null,
      description: description?.trim() || null,
      yield: yieldStr || null,
      prepTime: prepTime || null,
      cookTime: cookTime || null,
      tags: JSON.stringify(tagsArray),
      procedure: procedure || null,
      materials: materials || null,
      notes: notes || null,
      ingredients: { create: resolvedIngredients },
    },
  });

  // Update denormalized fields on recipe
  const updates: Record<string, unknown> = { updatedAt: new Date(), title: title?.trim() || undefined, description: description?.trim() || null, tags: JSON.stringify(tagsArray) };
  if (isProduction) { updates.isProduction = true; updates.currentProductionVersionId = version.id; }

  await db.recipe.update({ where: { id: recipeId }, data: updates });

  return NextResponse.json({ username: user.username, slug: recipe.workspace.slug, recipeId });
}
