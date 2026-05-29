"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: 72, fontWeight: 700, color: "var(--border)", margin: "0 0 8px" }}>500</p>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: "0 0 8px" }}>Something went wrong</h1>
        <p style={{ color: "var(--text-muted)", margin: "0 0 24px" }}>An unexpected error occurred.</p>
        <button
          onClick={reset}
          style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 16px", color: "var(--text)", fontSize: 14, fontWeight: 500, cursor: "pointer" }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
