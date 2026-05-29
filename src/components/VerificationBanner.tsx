"use client";

import { useState } from "react";

export function VerificationBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    await fetch("/api/user/send-verification", { method: "POST" });
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{
      background: "rgba(210,153,34,0.08)",
      borderBottom: "1px solid rgba(210,153,34,0.25)",
      padding: "8px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
      fontSize: 13,
      flexWrap: "wrap",
    }}>
      <span style={{ color: "var(--dev-amber)" }}>
        Verify your email to start creating recipes.
        <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>{email}</span>
      </span>
      {sent ? (
        <span style={{ color: "var(--text-muted)", fontSize: 12 }}>Check your inbox.</span>
      ) : (
        <button
          onClick={handleResend}
          disabled={loading}
          style={{ background: "transparent", border: "1px solid rgba(210,153,34,0.4)", borderRadius: 5, padding: "3px 12px", color: "var(--dev-amber)", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}
        >
          {loading ? "Sending..." : "Resend"}
        </button>
      )}
    </div>
  );
}
