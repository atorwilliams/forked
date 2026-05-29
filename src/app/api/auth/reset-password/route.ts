import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `reset-password:${ip}`, limit: 5, window: 900 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { token, password } = body;

  if (!token || typeof token !== "string") {
    return NextResponse.json({ error: "Invalid reset link." }, { status: 400 });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const record = await db.passwordResetToken.findUnique({ where: { token } });

  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await db.user.update({
    where: { id: record.userId },
    data: { passwordHash },
  });

  await db.passwordResetToken.delete({ where: { id: record.id } });

  return NextResponse.json({ ok: true });
}
