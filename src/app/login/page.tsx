"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  const resetSuccess = params.get("reset") === "1";

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  const handleOAuth = (provider: "github" | "google") => {
    signIn(provider, { callbackUrl });
  };

  const hasGitHub = !!process.env.NEXT_PUBLIC_HAS_GITHUB_OAUTH;
  const hasGoogle = !!process.env.NEXT_PUBLIC_HAS_GOOGLE_OAUTH;

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 56px)", padding: 24 }}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 12, padding: "40px 36px", width: "100%", maxWidth: 380 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6, textAlign: "center" }}>Sign in to Forked</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", marginBottom: resetSuccess ? 12 : 24 }}>Welcome back.</p>
        {resetSuccess && (
          <p style={{ color: "var(--prod-green)", fontSize: 13, textAlign: "center", marginBottom: 20 }}>
            Password updated. Sign in with your new password.
          </p>
        )}

        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          <OAuthButton
            onClick={() => handleOAuth("github")}
            icon={<GitHubIcon />}
            label="Continue with GitHub"
          />
          <OAuthButton
            onClick={() => handleOAuth("google")}
            icon={<GoogleIcon />}
            label="Continue with Google"
          />
        </div>

        <Divider />

        <form onSubmit={handleCredentials} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Email" type="email" value={email} onChange={setEmail} placeholder="you@example.com" />
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
              <label style={{ fontSize: 13, fontWeight: 500 }}>Password</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: "var(--text-muted)" }}>Forgot password?</Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", color: "var(--text)", fontSize: 14, outline: "none", width: "100%" }}
            />
          </div>

          {error && (
            <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ background: "var(--accent)", border: "none", borderRadius: 8, padding: "10px", color: "#fff", fontSize: 14, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.7 : 1, marginTop: 4 }}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 13, marginTop: 20, marginBottom: 0 }}>
          Don&apos;t have an account?{" "}
          <Link href="/signup" style={{ color: "var(--text-link)" }}>Sign up</Link>
        </p>
      </div>
    </div>
  );
}

function OAuthButton({ onClick, icon, label }: { onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 16px", color: "var(--text)", fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }}
    >
      {icon}
      {label}
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

function Field({ label, type, value, onChange, placeholder }: { label: string; type: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 13, fontWeight: 500 }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required
        style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "8px 12px", color: "var(--text)", fontSize: 14, outline: "none" }}
      />
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}
