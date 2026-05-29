import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { parseIngredientLine, singularize } from "@/lib/ingredient-parser";

function slugify(title: string): string {
  return title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") || "recipe";
}

function parseAliases(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return raw.split(",").map((s) => s.trim()).filter(Boolean); }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not authenticated." }, { status: 401 });

  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { id: true, username: true } });
  if (!user?.username) return NextResponse.json({ error: "Set a username before creating recipes." }, { status: 400 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { title, description, yield: yieldStr, prepTime, cookTime, tags, ingredientText, procedure, materials, notes, commitMessage, isProduction, contentMode, contentRaw } = body;

  if (!title?.trim()) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  // Get or create personal workspace
  let workspace = await db.workspace.findUnique({ where: { slug: user.username } });
  if (!workspace) {
    workspace = await db.workspace.create({ data: { name: user.username, slug: user.username, ownerId: user.id, type: "public" } });
  }

  // Unique slug
  const base = slugify(title);
  let slug = base;
  let n = 2;
  while (await db.recipe.findFirst({ where: { workspaceId: workspace.id, slug } })) slug = `${base}-${n++}`;

  const tagsArray: string[] = typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : Array.isArray(tags) ? tags : [];

  // Parse ingredient lines and resolve against library
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
      rawText: line,
      order,
      ingredientId,
      quantity: parsed.quantity,
      unit: parsed.unit,
      unitTier: parsed.unitDef?.tier ?? "measured",
      isToTaste: parsed.isToTaste,
      isUnresolved: !ingredientId,
      packageCount: parsed.packageInfo?.count ?? null,
      packageSize: parsed.packageInfo?.size ?? null,
      packageSizeUnit: parsed.packageInfo?.sizeUnit ?? null,
      packageType: parsed.packageInfo?.containerType ?? null,
    };
  });

  const recipe = await db.recipe.create({
    data: {
      slug,
      workspaceId: workspace.id,
      createdBy: user.id,
      title: title.trim(),
      description: description?.trim() || null,
      tags: JSON.stringify(tagsArray),
      isProduction: !!isProduction,
      versions: {
        create: {
          createdBy: user.id,
          isProduction: !!isProduction,
          commitMessage: commitMessage?.trim() || "Initial commit",
          contentMode: contentMode ?? "structured",
          contentRaw: contentRaw ?? procedure ?? "",
          title: title.trim(),
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
      },
    },
    include: { versions: { take: 1 } },
  });

  if (isProduction && recipe.versions[0]) {
    await db.recipe.update({ where: { id: recipe.id }, data: { currentProductionVersionId: recipe.versions[0].id } });
  }

  return NextResponse.json({ username: user.username, slug });
}
