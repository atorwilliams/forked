import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `signup:${ip}`, limit: 2, window: 3600 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const { email, password, username, name } = body;

  // Basic validation
  if (!email || !password || !username) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const usernameClean = username.toLowerCase().trim();
  if (!/^[a-z0-9_-]{2,32}$/.test(usernameClean)) {
    return NextResponse.json(
      { error: "Username must be 2–32 characters: letters, numbers, hyphens, underscores." },
      { status: 400 }
    );
  }

  // Check uniqueness
  const [existingEmail, existingUsername] = await Promise.all([
    db.user.findUnique({ where: { email } }),
    db.user.findUnique({ where: { username: usernameClean } }),
  ]);

  if (existingEmail) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }
  if (existingUsername) {
    return NextResponse.json({ error: "This username is taken." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: {
      email,
      name: name?.trim() || usernameClean,
      username: usernameClean,
      passwordHash,
    },
  });

  // Send verification email
  const token = crypto.randomBytes(32).toString("hex");
  await db.verificationToken.create({
    data: { identifier: user.email, token, expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ ok: true });
}
