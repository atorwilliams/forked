import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

export async function PATCH(req: Request) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `password:${ip}`, limit: 2, window: 900 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { currentPassword: string; newPassword: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both fields are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "This account uses social login and has no password." }, { status: 400 });
  }

  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await db.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } });

  return NextResponse.json({ ok: true });
}
