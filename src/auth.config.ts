import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login", newUser: "/setup/username" },
  providers: [],
  session: { strategy: "jwt" as const },
  callbacks: {
    session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          username: (token.username as string | null) ?? null,
          accountType: (token.accountType as string) ?? "free",
          emailVerified: (token.emailVerified as string | null) ?? null,
        },
      };
    },
  },
} satisfies NextAuthConfig;
