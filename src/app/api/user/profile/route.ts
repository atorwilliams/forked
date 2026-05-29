import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string; bio?: string; country?: string; city?: string; favouriteFood?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request body." }, { status: 400 }); }
  const name          = typeof body.name          === "string" ? body.name.trim()          : undefined;
  const bio           = typeof body.bio           === "string" ? body.bio.trim()           : undefined;
  const country       = typeof body.country       === "string" ? body.country.trim()       : undefined;
  const city          = typeof body.city          === "string" ? body.city.trim()          : undefined;
  const favouriteFood = typeof body.favouriteFood === "string" ? body.favouriteFood.trim() : undefined;

  if (name !== undefined && name.length === 0) {
    return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 });
  }
  if (bio !== undefined && bio.length > 280) {
    return NextResponse.json({ error: "Bio must be 280 characters or fewer." }, { status: 400 });
  }
  if (city !== undefined && city.length > 80) {
    return NextResponse.json({ error: "City must be 80 characters or fewer." }, { status: 400 });
  }
  if (favouriteFood !== undefined && favouriteFood.length > 80) {
    return NextResponse.json({ error: "Favourite food must be 80 characters or fewer." }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name          !== undefined && { name }),
      ...(bio           !== undefined && { bio:           bio           || null }),
      ...(country       !== undefined && { country:       country       || null }),
      ...(city          !== undefined && { city:          city          || null }),
      ...(favouriteFood !== undefined && { favouriteFood: favouriteFood || null }),
    },
    select: { name: true, bio: true, country: true, city: true, favouriteFood: true },
  });

  return NextResponse.json(updated);
}
