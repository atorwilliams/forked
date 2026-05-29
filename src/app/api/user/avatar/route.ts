import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { rateLimit, getIp, tooManyRequests } from "@/lib/rate-limit";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: Request) {
  const ip = getIp(req);
  const rl = rateLimit({ key: `avatar:${ip}`, limit: 5, window: 3600 });
  if (!rl.ok) return tooManyRequests(rl.resetAt);

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData;
  try { formData = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form data." }, { status: 400 }); }
  const file = formData.get("avatar") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "File must be an image." }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Image must be under 5MB." }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await cloudinary.uploader.upload(base64, {
    folder: "forked/avatars",
    public_id: `user_${session.user.id}`,
    overwrite: true,
    transformation: [{ width: 200, height: 200, crop: "fill", gravity: "face" }],
  });

  await db.user.update({
    where: { id: session.user.id },
    data: { image: result.secure_url },
  });

  return NextResponse.json({ url: result.secure_url });
}
