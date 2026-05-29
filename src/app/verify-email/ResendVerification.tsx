"use client";

import { useState } from "react";

export function ResendVerification({ message }: { message?: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleResend = async () => {
    setLoading(true);
    setError("");

    const res = await fetch("/api/user/send-verification", { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    setSent(true);
  };

  return (
    <div style={{ maxWidth: 480, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Verify your email</h1>

      {message && (
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 16 }}>{message}</p>
      )}

      {sent ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          Verification email sent. Check your inbox.
        </p>
      ) : (
        <>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 24 }}>
            Check your inbox for the verification link, or request a new one.
          </p>
          {error && <p style={{ color: "#f85149", fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button
            onClick={handleResend}
            disabled={loading}
            style={{ background: "var(--accent)", border: "none", borderRadius: 6, padding: "8px 20px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Sending..." : "Resend verification email"}
          </button>
        </>
      )}
    </div>
  );
}
