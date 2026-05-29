import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUser, unauthorized } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const apiUser = await getApiUser(req);
  if (!apiUser) return unauthorized();

  const { username } = await params;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      username: true,
      name: true,
      bio: true,
      image: true,
      country: true,
      city: true,
      favouriteFood: true,
      createdAt: true,
      ownedWorkspaces: {
        where: { slug: username },
        select: {
          recipes: {
            orderBy: { updatedAt: "desc" },
            select: {
              id: true,
              slug: true,
              title: true,
              description: true,
              tags: true,
              forkCount: true,
              snapCount: true,
              isProduction: true,
              updatedAt: true,
            },
          },
        },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const recipes = user.ownedWorkspaces[0]?.recipes ?? [];

  return NextResponse.json({
    username: user.username,
    name: user.name,
    bio: user.bio,
    image: user.image,
    country: user.country,
    city: user.city,
    favouriteFood: user.favouriteFood,
    createdAt: user.createdAt,
    recipes: recipes.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      tags: JSON.parse(r.tags ?? "[]"),
      forkCount: r.forkCount,
      snapCount: r.snapCount,
      isProduction: r.isProduction,
      updatedAt: r.updatedAt,
    })),
  });
}
