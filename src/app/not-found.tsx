import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 72, fontWeight: 700, color: "var(--border)", margin: "0 0 8px" }}>404</p>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Page not found</h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 24px" }}>The page you&apos;re looking for doesn&apos;t exist.</p>
        <Link
          href="/"
          style={{ display: "inline-block", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", color: "var(--text)", fontSize: 14, fontWeight: 500, textDecoration: "none" }}
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
