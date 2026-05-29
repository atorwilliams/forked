import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUser, unauthorized } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const apiUser = await getApiUser(req);
  if (!apiUser) return unauthorized();

  const { id } = await params;

  // Accept either a recipe ID or "username/slug" format
  let recipe;
  if (id.includes(":")) {
    const [username, slug] = id.split(":");
    recipe = await db.recipe.findFirst({
      where: { slug, workspace: { slug: username } },
      include: recipeInclude,
    });
  } else {
    recipe = await db.recipe.findUnique({ where: { id }, include: recipeInclude });
  }

  if (!recipe) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const latest = recipe.versions[0];

  return NextResponse.json({
    id: recipe.id,
    slug: recipe.slug,
    title: recipe.title,
    description: recipe.description,
    tags: JSON.parse(recipe.tags ?? "[]"),
    forkCount: recipe.forkCount,
    snapCount: recipe.snapCount,
    isProduction: recipe.isProduction,
    updatedAt: recipe.updatedAt,
    createdAt: recipe.createdAt,
    forkedFromRecipeId: recipe.forkedFromRecipeId,
    forkedFromUserName: recipe.forkedFromUserName,
    author: {
      username: recipe.creator.username,
      name: recipe.creator.name,
      image: recipe.creator.image,
    },
    workspace: recipe.workspace.slug,
    currentVersion: latest ? {
      id: latest.id,
      title: latest.title,
      commitMessage: latest.commitMessage,
      yield: latest.yield,
      prepTime: latest.prepTime,
      cookTime: latest.cookTime,
      procedure: latest.procedure,
      materials: latest.materials,
      notes: latest.notes,
      contentMode: latest.contentMode,
      contentRaw: latest.contentRaw,
      isProduction: latest.isProduction,
      createdAt: latest.createdAt,
      ingredients: latest.ingredients.map((i) => ({
        rawText: i.rawText,
        quantity: i.quantity,
        unit: i.unit,
        isToTaste: i.isToTaste,
      })),
    } : null,
    versionCount: recipe.versions.length,
    history: recipe.versions.map((v, i) => ({
      id: v.id,
      commitMessage: v.commitMessage,
      isProduction: v.isProduction,
      isCurrent: i === 0,
      createdAt: v.createdAt,
      author: v.author.username ?? v.author.name,
    })),
    forks: recipe.forks.map((f) => ({
      id: f.id,
      slug: f.slug,
      workspace: f.workspace.slug,
      title: f.title,
      isProduction: f.isProduction,
      updatedAt: f.updatedAt,
    })),
  });
}

const recipeInclude = {
  creator: { select: { username: true, name: true, image: true } },
  workspace: { select: { slug: true } },
  versions: {
    orderBy: { createdAt: "desc" as const },
    include: {
      author: { select: { username: true, name: true } },
      ingredients: {
        orderBy: { order: "asc" as const },
        select: { rawText: true, quantity: true, unit: true, isToTaste: true },
      },
    },
  },
  forks: {
    select: { id: true, slug: true, title: true, isProduction: true, updatedAt: true, workspace: { select: { slug: true } } },
    orderBy: { updatedAt: "desc" as const },
  },
} as const;
