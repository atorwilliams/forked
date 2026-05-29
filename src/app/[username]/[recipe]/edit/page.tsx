import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { EditRecipeClient } from "./EditRecipeClient";

export default async function EditRecipePage({ params }: { params: Promise<{ username: string; recipe: string }> }) {
  const { username, recipe: recipeSlug } = await params;

  const session = await auth();
  if (session?.user?.username !== username) notFound();

  const [recipeData, ingredients, categories] = await Promise.all([
    db.recipe.findFirst({
      where: { slug: recipeSlug, workspace: { slug: username } },
      include: {
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            ingredients: { orderBy: { order: "asc" }, select: { rawText: true } },
          },
        },
      },
    }),
    db.ingredient.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { nameNormalized: "asc" },
    }),
    db.ingredientCategory.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    }),
  ]);

  if (!recipeData) notFound();

  const latest = recipeData.versions[0];

  const initial = {
    recipeId: recipeData.id,
    title: latest?.title ?? recipeData.title,
    description: recipeData.description ?? "",
    yield: latest?.yield ?? "",
    prepTime: latest?.prepTime ?? "",
    cookTime: latest?.cookTime ?? "",
    tags: (JSON.parse(recipeData.tags ?? "[]") as string[]).join(", "),
    ingredientText: latest?.ingredients.map((i) => i.rawText).join("\n") ?? "",
    procedure: latest?.procedure ?? "",
    materials: latest?.materials ?? "",
    notes: latest?.notes ?? "",
  };

  return (
    <EditRecipeClient
      username={username}
      recipeSlug={recipeSlug}
      initial={initial}
      ingredients={ingredients.map((i) => ({ id: i.id, nameNormalized: i.nameNormalized, displayName: i.displayName, aliases: i.aliases, category: i.category }))}
      categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parentId: c.parentId }))}
    />
  );
}
