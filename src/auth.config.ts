import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login", newUser: "/setup/username" },
  providers: [],
  session: { strategy: "jwt" as const },
} satisfies NextAuthConfig;
