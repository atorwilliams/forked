import { auth } from "@/auth";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
  const session = await auth();

  const user = session?.user
    ? {
        username: session.user.username ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
      }
    : null;

  return <NavbarClient user={user} />;
}
