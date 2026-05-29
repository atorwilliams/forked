import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: recipeId } = await params;

  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { versions: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } } },
  });

  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versionId = recipe.versions[0]?.id;
  if (!versionId) return NextResponse.json([]);

  const comments = await db.comment.findMany({
    where: { versionId, parentCommentId: null },
    include: {
      author: { select: { username: true, name: true, image: true } },
      replies: {
        include: { author: { select: { username: true, name: true, image: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `comment:${ip}`, limit: 15, window: 1800 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: recipeId } = await params;
  let body: { content: string; parentCommentId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const content = body.content?.trim();

  if (!content) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });
  if (content.length > 2000) return NextResponse.json({ error: "Comment too long." }, { status: 400 });

  const recipe = await db.recipe.findUnique({
    where: { id: recipeId },
    select: { versions: { orderBy: { createdAt: "desc" }, take: 1, select: { id: true } } },
  });

  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const versionId = recipe.versions[0]?.id;
  if (!versionId) return NextResponse.json({ error: "No version found." }, { status: 400 });

  const comment = await db.comment.create({
    data: {
      versionId,
      authorId: session.user.id,
      content,
      parentCommentId: body.parentCommentId ?? null,
    },
    include: {
      author: { select: { username: true, name: true, image: true } },
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // In this context id is the recipe id but we need a comment id
  // This route is a stub — see /api/comments/[commentId] for per-comment deletion
  return NextResponse.json({ error: "Use /api/comments/[commentId]" }, { status: 400 });
}
