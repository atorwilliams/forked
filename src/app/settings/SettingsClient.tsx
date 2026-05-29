"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { COUNTRY_MAP } from "@/lib/countries";

interface Props {
  initialName: string;
  initialBio: string;
  initialCountry: string;
  initialCity: string;
  initialFavouriteFood: string;
  initialImage: string;
  username: string;
  email: string;
  emailVerified: boolean;
}

export function SettingsClient({ initialName, initialBio, initialCountry, initialCity, initialFavouriteFood, initialImage, username, email, emailVerified }: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [country, setCountry] = useState(initialCountry);
  const [city, setCity] = useState(initialCity);
  const [favouriteFood, setFavouriteFood] = useState(initialFavouriteFood);
  const [avatarUrl, setAvatarUrl] = useState(initialImage);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setAvatarLoading(true);
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch("/api/user/avatar", { method: "POST", body: form });
    const data = await res.json();
    setAvatarLoading(false);
    if (!res.ok) { setAvatarError(data.error ?? "Upload failed."); return; }
    setAvatarUrl(data.url);
    router.refresh();
  };

  const bioCharsLeft = 280 - bio.length;

  const handleSave = async () => {
    setError("");
    setSaved(false);
    setLoading(true);

    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, bio, country, city, favouriteFood }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    setSaved(true);
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "40px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>Settings</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: 0 }}>
          Manage your public profile.
        </p>
      </div>

      {!emailVerified && <EmailVerificationBanner email={email} />}

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", border: "2px solid var(--border)", overflow: "hidden", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, flexShrink: 0 }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="Avatar" width={72} height={72} style={{ borderRadius: "50%", objectFit: "cover" }} />
              : (initialName || username)[0]?.toUpperCase()}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Profile photo</label>
            <label style={{ display: "inline-block", background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6, padding: "6px 14px", fontSize: 12, color: "var(--text-muted)", cursor: avatarLoading ? "not-allowed" : "pointer", opacity: avatarLoading ? 0.6 : 1 }}>
              {avatarLoading ? "Uploading..." : "Change photo"}
              <input type="file" accept="image/*" onChange={handleAvatarChange} disabled={avatarLoading} style={{ display: "none" }} />
            </label>
            {avatarError && <span style={{ fontSize: 11, color: "#f85149" }}>{avatarError}</span>}
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>JPG, PNG or GIF. Max 5MB.</span>
          </div>
        </div>

        <Field label="Username" note="Usernames cannot be changed after signup.">
          <input
            value={username}
            disabled
            style={{ ...inputStyle, opacity: 0.5, cursor: "not-allowed" }}
          />
        </Field>

        <Field label="Display name">
          <input
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            placeholder="Your name"
            maxLength={80}
            style={inputStyle}
          />
        </Field>

        <Field
          label="Bio"
          note={`${bioCharsLeft} characters remaining`}
          noteColor={bioCharsLeft < 40 ? (bioCharsLeft < 0 ? "#f85149" : "#e3b341") : undefined}
        >
          <textarea
            value={bio}
            onChange={(e) => { setBio(e.target.value); setSaved(false); }}
            placeholder="What you cook, where you're from, what matters to you in a kitchen."
            maxLength={280}
            rows={4}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />
        </Field>

        <Field label="Country">
          <div style={{ position: "relative" }}>
            <select
              value={country}
              onChange={(e) => { setCountry(e.target.value); setSaved(false); }}
              style={{ ...inputStyle, appearance: "none", paddingRight: 32, cursor: "pointer" }}
            >
              <option value="">Not set</option>
              {Object.entries(COUNTRY_MAP)
                .sort(([, a], [, b]) => a.name.localeCompare(b.name))
                .map(([code, { name: cName, flag }]) => (
                  <option key={code} value={code}>{flag} {cName}</option>
                ))}
            </select>
            <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--text-muted)", fontSize: 11 }}>▾</span>
          </div>
        </Field>

        <Field label="City">
          <input
            value={city}
            onChange={(e) => { setCity(e.target.value); setSaved(false); }}
            placeholder="Vienna"
            maxLength={80}
            style={inputStyle}
          />
        </Field>

        <Field label="Favourite food" note="e.g. Beef bourguignon, yakitori, miso ramen…">
          <input
            value={favouriteFood}
            onChange={(e) => { setFavouriteFood(e.target.value); setSaved(false); }}
            placeholder="What's the one dish you'd eat forever?"
            maxLength={80}
            style={inputStyle}
          />
        </Field>
      </div>

      <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={handleSave}
          disabled={loading || !name.trim()}
          style={{
            background: "var(--accent)",
            border: "none",
            borderRadius: 6,
            padding: "8px 20px",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            opacity: loading || !name.trim() ? 0.6 : 1,
          }}
        >
          {loading ? "Saving..." : "Save profile"}
        </button>

        {saved && <span style={{ color: "#3fb950", fontSize: 13 }}>Saved.</span>}
        {error && <span style={{ color: "#f85149", fontSize: 13 }}>{error}</span>}
      </div>

      {/* Password change */}
      <PasswordSection />

      {/* Danger zone */}
      <DeleteAccountSection />
    </div>
  );
}

function EmailVerificationBanner({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    await fetch("/api/user/send-verification", { method: "POST" });
    setLoading(false);
    setSent(true);
  };

  return (
    <div style={{ background: "rgba(210,153,34,0.08)", border: "1px solid rgba(210,153,34,0.3)", borderRadius: 8, padding: "12px 16px", marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--dev-amber)" }}>Email not verified</p>
        <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--text-muted)" }}>{email}</p>
      </div>
      {sent ? (
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Check your inbox.</span>
      ) : (
        <button onClick={handleSend} disabled={loading} style={{ background: "transparent", border: "1px solid rgba(210,153,34,0.4)", borderRadius: 6, padding: "5px 14px", color: "var(--dev-amber)", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, opacity: loading ? 0.6 : 1 }}>
          {loading ? "Sending..." : "Send verification email"}
        </button>
      )}
    </div>
  );
}

function PasswordSection() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleChange = async () => {
    setError("");
    setSaved(false);
    if (next !== confirm) { setError("Passwords don't match."); return; }
    if (next.length < 8) { setError("New password must be at least 8 characters."); return; }
    setLoading(true);
    const res = await fetch("/api/user/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }
    setSaved(true);
    setCurrent(""); setNext(""); setConfirm("");
  };

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Change password</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Current password">
          <input type="password" value={current} onChange={(e) => { setCurrent(e.target.value); setSaved(false); }} style={inputStyle} autoComplete="current-password" />
        </Field>
        <Field label="New password" note="At least 8 characters.">
          <input type="password" value={next} onChange={(e) => { setNext(e.target.value); setSaved(false); }} style={inputStyle} autoComplete="new-password" />
        </Field>
        <Field label="Confirm new password">
          <input type="password" value={confirm} onChange={(e) => { setConfirm(e.target.value); setSaved(false); }} style={inputStyle} autoComplete="new-password" />
        </Field>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleChange}
            disabled={loading || !current || !next || !confirm}
            style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 18px", color: "var(--text)", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading || !current || !next || !confirm ? 0.6 : 1 }}
          >
            {loading ? "Updating..." : "Update password"}
          </button>
          {saved && <span style={{ color: "#3fb950", fontSize: 13 }}>Password updated.</span>}
          {error && <span style={{ color: "#f85149", fontSize: 13 }}>{error}</span>}
        </div>
      </div>
    </div>
  );
}

function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (input !== "DELETE") return;
    setLoading(true);
    setError("");
    const res = await fetch("/api/user/account", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  };

  return (
    <div style={{ marginTop: 40, paddingTop: 32, borderTop: "1px solid var(--border)" }}>
      <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, color: "#f85149" }}>Danger zone</h2>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        Permanently delete your account and all your recipes. This cannot be undone.
      </p>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          style={{ background: "transparent", border: "1px solid #f85149", borderRadius: 6, padding: "7px 18px", color: "#f85149", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          Delete account
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 320 }}>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Type <strong style={{ color: "var(--text)" }}>DELETE</strong> to confirm.
          </p>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="DELETE"
            style={{ ...inputStyle, borderColor: input === "DELETE" ? "#f85149" : "var(--border)" }}
          />
          {error && <span style={{ fontSize: 12, color: "#f85149" }}>{error}</span>}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handleDelete}
              disabled={input !== "DELETE" || loading}
              style={{ background: "#f85149", border: "none", borderRadius: 6, padding: "7px 18px", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: input !== "DELETE" || loading ? 0.5 : 1 }}
            >
              {loading ? "Deleting..." : "Yes, delete everything"}
            </button>
            <button
              onClick={() => { setConfirming(false); setInput(""); setError(""); }}
              style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 6, padding: "7px 18px", color: "var(--text-muted)", fontSize: 13, cursor: "pointer" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "8px 10px",
  color: "var(--text)",
  fontSize: 13,
  outline: "none",
  width: "100%",
};

function Field({
  label,
  note,
  noteColor,
  children,
}: {
  label: string;
  note?: string;
  noteColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{label}</label>
      {children}
      {note && (
        <span style={{ fontSize: 11, color: noteColor ?? "var(--text-muted)" }}>{note}</span>
      )}
    </div>
  );
}


