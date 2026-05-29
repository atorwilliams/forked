import type { Metadata } from "next";
import { db } from "@/lib/db";
import { NewRecipeClient } from "./NewRecipeClient";

export const metadata: Metadata = { title: "New recipe" };

export default async function NewRecipePage() {
  const [ingredients, categories] = await Promise.all([
    db.ingredient.findMany({
      include: { category: { select: { id: true, name: true, slug: true } } },
      orderBy: { nameNormalized: "asc" },
    }),
    db.ingredientCategory.findMany({
      orderBy: [{ parentId: "asc" }, { name: "asc" }],
    }),
  ]);

  const serializedIngredients = ingredients.map((i) => ({
    id: i.id,
    nameNormalized: i.nameNormalized,
    displayName: i.displayName,
    aliases: i.aliases,
    category: i.category,
  }));

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    parentId: c.parentId,
  }));

  return (
    <NewRecipeClient
      ingredients={serializedIngredients}
      categories={serializedCategories}
    />
  );
}
