import type { Metadata } from "next";

export const metadata: Metadata = { title: "Choose a username" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
