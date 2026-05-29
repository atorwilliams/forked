import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { username } = body;
  const clean = username?.toLowerCase().trim();

  if (!clean || !/^[a-z0-9_-]{2,32}$/.test(clean)) {
    return NextResponse.json(
      { error: "Username must be 2–32 characters: letters, numbers, hyphens, underscores." },
      { status: 400 }
    );
  }

  const existing = await db.user.findUnique({ where: { username: clean } });
  if (existing) {
    return NextResponse.json({ error: "This username is taken." }, { status: 409 });
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { username: clean },
  });

  return NextResponse.json({ ok: true });
}
