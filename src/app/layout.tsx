import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    template: "%s · Forked",
    default: "Forked",
  },
  description: "Forked: version-controlled recipe collaboration for professional kitchens.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <Navbar />
        <main style={{ flex: 1 }}>{children}</main>
      </body>
    </html>
  );
}
