"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok && res.status !== 200) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setDone(true);
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>Reset your password</h1>

        {done ? (
          <div style={{ textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
              If an account with that email exists, we&apos;ve sent a reset link. Check your inbox.
            </p>
            <Link href="/login" style={{ color: "var(--text-link)", fontSize: 14 }}>Back to sign in</Link>
          </div>
        ) : (
          <>
            <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                <label style={{ fontSize: 13, fontWeight: 500 }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", color: "var(--text)", fontSize: 14, outline: "none" }}
                />
              </div>

              {error && <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>}

              <button
                type="submit"
                disabled={loading}
                style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}
              >
                {loading ? "Sending..." : "Send reset link"}
              </button>
            </form>

            <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 20, marginBottom: 0 }}>
              <Link href="/login" style={{ color: "var(--text-link)" }}>Back to sign in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
