import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `forgot-password:${ip}`, limit: 3, window: 3600 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { email } = body;

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  // Always return 200 so we don't reveal whether an account exists
  const user = await db.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  // Delete any existing token for this user
  await db.passwordResetToken.deleteMany({ where: { userId: user.id } });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await db.passwordResetToken.create({
    data: { userId: user.id, token, expires },
  });

  await sendPasswordResetEmail(user.email, token);

  return NextResponse.json({ ok: true });
}
