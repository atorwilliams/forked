import { auth } from "@/auth";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { NextResponse } from "next/server";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";
import crypto from "crypto";

export async function POST(req: Request) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `send-verification:${ip}`, limit: 2, window: 3600 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, emailVerified: true },
  });

  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ error: "Email already verified." }, { status: 400 });

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  // Replace any existing tokens for this user, then create a fresh one
  await db.verificationToken.deleteMany({ where: { identifier: user.email } });
  await db.verificationToken.create({ data: { identifier: user.email, token, expires } });

  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ ok: true });
}
