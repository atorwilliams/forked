import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();

  let user = null;
  if (session?.user?.id) {
    const dbUser = await db.user.findUnique({
      where: { id: session.user.id },
      select: { username: true, name: true, image: true },
    });
    user = {
      username: dbUser?.username ?? null,
      name: dbUser?.name ?? null,
      image: dbUser?.image ?? null,
    };
  }

  return <NavbarClient user={user} />;
}
