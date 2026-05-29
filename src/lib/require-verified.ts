import { auth } from "@/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Call at the top of any server component that requires a verified email.
 * Uses a fresh DB lookup so it's never blocked by a stale JWT.
 */
export async function requireVerified() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  });

  if (!user?.emailVerified) redirect("/verify-email");
}
