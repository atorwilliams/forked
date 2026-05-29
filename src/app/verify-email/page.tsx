import { db } from "@/lib/db";
import Link from "next/link";
import { ResendVerification } from "./ResendVerification";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return <ResendVerification />;
  }

  const record = await db.verificationToken.findFirst({ where: { token } });

  if (!record) {
    return <ResendVerification message="This link has already been used or is invalid." />;
  }

  if (record.expires < new Date()) {
    await db.verificationToken.delete({ where: { identifier_token: { identifier: record.identifier, token } } });
    return <ResendVerification message="This link has expired." />;
  }

  await db.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  await db.verificationToken.delete({
    where: { identifier_token: { identifier: record.identifier, token } },
  });

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Email verified</h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>You&apos;re all set.</p>
      <Link href="/" style={{ background: "var(--accent)", color: "#fff", padding: "8px 20px", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
        Go home
      </Link>
    </div>
  );
}
