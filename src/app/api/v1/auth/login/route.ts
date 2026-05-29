import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signApiToken } from "@/lib/api-auth";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `api-login:${ip}`, limit: 10, window: 900 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }

  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const user = await db.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    select: { id: true, username: true, name: true, image: true, passwordHash: true, emailVerified: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const valid = await bcrypt.compare(String(password), user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  if (!user.emailVerified) {
    return NextResponse.json({ error: "Email not verified." }, { status: 403 });
  }

  if (!user.username) {
    return NextResponse.json({ error: "Account setup incomplete." }, { status: 403 });
  }

  const token = await signApiToken({ userId: user.id, username: user.username });

  return NextResponse.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      image: user.image,
    },
  });
}
