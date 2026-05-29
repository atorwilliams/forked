import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getApiUser, unauthorized } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const apiUser = await getApiUser(req);
  if (!apiUser) return unauthorized();

  const user = await db.user.findUnique({
    where: { id: apiUser.userId },
    select: { id: true, username: true, name: true, image: true, bio: true, country: true, city: true, favouriteFood: true, email: true },
  });

  if (!user) return unauthorized();

  return NextResponse.json(user);
}
