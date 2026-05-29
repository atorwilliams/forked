"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  const [form, setForm] = useState({ email: "", password: "", username: "", name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: k === "username" ? e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") : e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setDone(true);
  };

  const handleOAuth = (provider: "github" | "google") => {
    signIn(provider, { callbackUrl: "/" });
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 400 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>Create your account</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", marginBottom: 24 }}>
          Free for the community.
        </p>

        {done ? (
          <div style={{ textAlign: "center", padding: "8px 0" }}>
            <p style={{ fontSize: 14, marginBottom: 8 }}>Account created.</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
              We sent a verification link to <strong>{form.email}</strong>. Click it to activate your account.
            </p>
            <Link href="/login" style={{ color: "var(--text-link)", fontSize: 13 }}>Go to sign in</Link>
          </div>
        ) : (<>

        {/* OAuth */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <OAuthButton onClick={() => handleOAuth("github")} icon={<GitHubIcon />} label="Continue with GitHub" />
          <OAuthButton onClick={() => handleOAuth("google")} icon={<GoogleIcon />} label="Continue with Google" />
        </div>

        <Divider />

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Username" value={form.username} onChange={set("username")} placeholder="yourname" note="Your public URL: forked.app/yourname" />
          <Field label="Name" value={form.name} onChange={set("name")} placeholder="Chef Arthur" note="" />
          <Field label="Email" type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          <Field label="Password" type="password" value={form.password} onChange={set("password")} placeholder="••••••••" note="At least 8 characters." />

          {error && <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 20, marginBottom: 0 }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "var(--text-link)" }}>Sign in</Link>
        </p>
        </>)}
      </div>
    </div>
  );
}

function OAuthButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button type="button" onClick={onClick} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 16px", color: "var(--text)", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }}>
      {icon}{label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>or</span>
      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, note }: { label: string; type?: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; placeholder: string; note?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", color: "var(--text)", fontSize: 14, outline: "none" }} />
      {note && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{note}</span>}
    </div>
  );
}

function GitHubIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>;
}

function GoogleIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>;
}
