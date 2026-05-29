"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UsernameSetupPage() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/user/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Pick a username</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
          Your public identity on Forked. Shows up in recipe URLs like <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 3 }}>forked.app/your-username</code>.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 13, fontWeight: 500 }}>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="yourname"
              maxLength={32}
              required
              style={{ background: "var(--bg)", border: `1px solid ${error ? "rgba(248,81,73,0.6)" : "var(--border)"}`, borderRadius: 6, padding: "8px 12px", color: "var(--text)", fontSize: 14, outline: "none" }}
            />
            {error && <span style={{ color: "#f85149", fontSize: 12 }}>{error}</span>}
            <span style={{ color: "var(--text-muted)", fontSize: 11 }}>
              2–32 characters. Letters, numbers, hyphens, underscores.
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || username.length < 2}
            style={{ background: "var(--accent)", border: "none", borderRadius: 6, padding: "10px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer", opacity: loading || username.length < 2 ? 0.6 : 1 }}
          >
            {loading ? "Saving..." : "Set username"}
          </button>
        </form>
      </div>
    </div>
  );
}
