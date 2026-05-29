"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
        <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 380, textAlign: "center" }}>
          <p style={{ color: "#f85149", marginBottom: 16 }}>Invalid reset link.</p>
          <Link href="/forgot-password" style={{ color: "var(--text-link)", fontSize: 14 }}>Request a new one</Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }

    router.push("/login?reset=1");
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>Set a new password</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>Choose a new password for your account.</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="New password" value={password} onChange={setPassword} />
          <Field label="Confirm password" value={confirm} onChange={setConfirm} />

          {error && <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? "Saving..." : "Set new password"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        required
        style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", color: "var(--text)", fontSize: 14, outline: "none" }}
      />
    </div>
  );
}
