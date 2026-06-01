import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signApiToken } from "@/lib/api-auth";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `api-oauth:${ip}`, limit: 10, window: 900 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  let body: { provider?: string; idToken?: string; code?: string; redirectUri?: string; accessToken?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { provider, idToken, code, redirectUri, accessToken } = body;

  if (!provider || !["google", "github"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider." }, { status: 400 });
  }

  let providerAccountId: string;

  if (provider === "google") {
    if (!idToken) return NextResponse.json({ error: "idToken required for Google." }, { status: 400 });

    const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!tokenRes.ok) return NextResponse.json({ error: "Invalid Google token." }, { status: 401 });
    const tokenData = await tokenRes.json();

    const validAudiences = [
      process.env.AUTH_GOOGLE_ID,
      process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
    ].filter(Boolean);

    if (!validAudiences.includes(tokenData.aud)) {
      console.error("[oauth] aud mismatch — got:", tokenData.aud, "valid:", validAudiences);
      return NextResponse.json({ error: `Invalid token audience. Got: ${tokenData.aud}` }, { status: 401 });
    }

    providerAccountId = tokenData.sub;
  } else {
    // Mobile sends accessToken directly (react-native-app-auth exchanges the code client-side).
    // Web sends code + redirectUri for server-side exchange.
    let githubAccessToken: string;

    if (accessToken) {
      githubAccessToken = accessToken;
    } else {
      if (!code) return NextResponse.json({ error: "code or accessToken required for GitHub." }, { status: 400 });

      const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          client_id: process.env.AUTH_GITHUB_ID,
          client_secret: process.env.AUTH_GITHUB_SECRET,
          code,
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenRes.ok) return NextResponse.json({ error: "GitHub token exchange failed." }, { status: 401 });
      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        return NextResponse.json({ error: tokenData.error_description ?? "Invalid GitHub code." }, { status: 401 });
      }
      githubAccessToken = tokenData.access_token;
    }

    const userRes = await fetch("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${githubAccessToken}`, "User-Agent": "Forked-App" },
    });
    if (!userRes.ok) return NextResponse.json({ error: "Failed to fetch GitHub profile." }, { status: 401 });
    const userData = await userRes.json();

    providerAccountId = String(userData.id);
  }

  const account = await db.account.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: {
      user: {
        select: { id: true, username: true, name: true, image: true },
      },
    },
  });

  if (!account) {
    return NextResponse.json(
      { error: "No account linked to this provider. Sign in on the web first." },
      { status: 404 }
    );
  }

  const user = account.user;

  if (!user.username) {
    return NextResponse.json({ error: "Account setup incomplete." }, { status: 403 });
  }

  const token = await signApiToken({ userId: user.id, username: user.username });

  return NextResponse.json({
    token,
    user: { id: user.id, username: user.username, name: user.name, image: user.image },
  });
}
