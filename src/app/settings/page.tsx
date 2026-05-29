import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/settings");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, bio: true, username: true, country: true, city: true, favouriteFood: true, image: true, email: true, emailVerified: true },
  });

  if (!user?.username) redirect("/setup/username");

  return (
    <SettingsClient
      initialName={user.name ?? ""}
      initialBio={user.bio ?? ""}
      initialCountry={user.country ?? ""}
      initialCity={user.city ?? ""}
      initialFavouriteFood={user.favouriteFood ?? ""}
      initialImage={user.image ?? ""}
      username={user.username}
      email={user.email}
      emailVerified={!!user.emailVerified}
    />
  );
}
