import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { VerificationBanner } from "@/components/VerificationBanner";
import { auth } from "@/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s · Forked",
    default: "Forked",
  },
  description: "Forked: version-controlled recipe collaboration for professional kitchens.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const showBanner = session?.user && !session.user.emailVerified;

  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        {showBanner && <VerificationBanner email={session.user.email ?? ""} />}
        <main style={{ flex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
