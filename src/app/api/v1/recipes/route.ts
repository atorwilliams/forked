import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUser, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const apiUser = await getApiUser(req);
  if (!apiUser) return unauthorized();

  const { searchParams } = req.nextUrl;
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20")));
  const tag = searchParams.get("tag") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const username = searchParams.get("username") ?? undefined;

  const where: Record<string, unknown> = {};
  if (tag) where.tags = { contains: tag };
  if (q) where.title = { contains: q, mode: "insensitive" };
  if (username) where.workspace = { slug: username };

  const [recipes, total] = await Promise.all([
    db.recipe.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        creator: { select: { username: true, name: true, image: true } },
        workspace: { select: { slug: true } },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { title: true, yield: true, prepTime: true, cookTime: true, tags: true, createdAt: true },
        },
      },
    }),
    db.recipe.count({ where }),
  ]);

  return NextResponse.json({
    recipes: recipes.map((r) => {
      const latest = r.versions[0];
      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        description: r.description,
        tags: JSON.parse(r.tags ?? "[]"),
        forkCount: r.forkCount,
        snapCount: r.snapCount,
        isProduction: r.isProduction,
        updatedAt: r.updatedAt,
        author: {
          username: r.creator.username,
          name: r.creator.name,
          image: r.creator.image,
        },
        workspace: r.workspace.slug,
        latestVersion: latest ? {
          title: latest.title,
          yield: latest.yield,
          prepTime: latest.prepTime,
          cookTime: latest.cookTime,
          createdAt: latest.createdAt,
        } : null,
      };
    }),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}
