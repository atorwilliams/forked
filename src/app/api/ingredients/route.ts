import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { nameNormalized: string; displayName?: string; categoryId: string; aliases?: string };
  const nameNormalized = body.nameNormalized?.toLowerCase().trim();
  const categoryId = body.categoryId?.trim();

  if (!nameNormalized) return NextResponse.json({ error: "nameNormalized is required." }, { status: 400 });
  if (!categoryId) return NextResponse.json({ error: "categoryId is required." }, { status: 400 });

  const category = await db.ingredientCategory.findUnique({ where: { id: categoryId } });
  if (!category) return NextResponse.json({ error: "Category not found." }, { status: 404 });

  const existing = await db.ingredient.findUnique({ where: { nameNormalized } });
  if (existing) return NextResponse.json({ error: "Ingredient already exists.", ingredient: existing }, { status: 409 });

  const aliases = body.aliases?.trim()
    ? JSON.stringify(body.aliases.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean))
    : "[]";

  const displayName = body.displayName?.trim() || nameNormalized.replace(/\b\w/g, (c) => c.toUpperCase());

  const ingredient = await db.ingredient.create({
    data: {
      nameNormalized,
      displayName,
      categoryId,
      aliases,
      addedBy: session.user.id,
    },
  });

  return NextResponse.json(ingredient, { status: 201 });
}
