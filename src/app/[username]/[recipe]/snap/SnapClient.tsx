"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function SnapClient({
  sourceRecipeId,
  sourceVersionId,
  sourceUsername,
  sourceSlug,
  sourceTitle,
  sourceDescription,
  sourceTags,
  sourceCommitMessage,
}: {
  sourceRecipeId: string;
  sourceVersionId: string;
  sourceUsername: string;
  sourceSlug: string;
  sourceTitle: string;
  sourceDescription: string;
  sourceTags: string[];
  sourceCommitMessage: string;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [commitMessage, setCommitMessage] = useState(`Snapped from ${sourceUsername}/${sourceSlug}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewSlug = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") || "recipe";

  const handleSnap = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    setError("");
    setLoading(true);

    const res = await fetch("/api/recipes/snap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceRecipeId, sourceVersionId, title: title.trim(), note: note.trim(), commitMessage }),
    });

    setLoading(false);
    let data: { error?: string; username?: string; slug?: string } = {};
    try { data = await res.json(); } catch { /* empty */ }

    if (!res.ok) { setError(data.error ?? `Server error (${res.status})`); return; }
    router.push(`/${data.username}/${data.slug}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 8 }}>
        <p style={{ color: "var(--snap-purple)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 6px" }}>Snapping</p>
        <Link href={`/${sourceUsername}/${sourceSlug}`} style={{ color: "var(--text-link)", fontWeight: 600, fontSize: 18, textDecoration: "none" }}>
          {sourceUsername} / {sourceSlug}
        </Link>
        {sourceDescription && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>{sourceDescription}</p>
        )}
      </div>

      <div style={{ background: "rgba(163,113,247,0.06)", border: "1px solid rgba(163,113,247,0.2)", borderRadius: 8, padding: "12px 16px", margin: "20px 0 28px", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
        A snap says the recipe has become something new. The lineage is preserved, but this is its own dish now. Use fork when the identity holds. Snap when it has changed.
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", marginBottom: 28, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-muted)" }}>
          From: <em style={{ color: "var(--text)", fontStyle: "normal" }}>{sourceCommitMessage}</em>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {sourceTags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
          <code style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px", fontSize: 11, fontFamily: "monospace" }}>
            {sourceVersionId.slice(0, 7)}
          </code>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>New dish name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder={`What did ${sourceTitle} become?`} />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Created as{" "}
            <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 3 }}>you/{previewSlug}</code>
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Why did it snap? <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>(optional)</span></label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="The chocolate pancakes got more flour and hit the fryer. Not pancakes anymore."
            rows={3}
            style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Commit message</label>
          <input value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} style={inputStyle} />
        </div>

        {error && <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => router.back()} style={{ ...btnStyle, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
            Cancel
          </button>
          <button onClick={handleSnap} disabled={loading || !title.trim()} style={{ ...btnStyle, background: "var(--snap-purple)", border: "none", color: "#fff", opacity: loading || !title.trim() ? 0.6 : 1 }}>
            {loading ? "Snapping..." : "Snap recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%",
};

const btnStyle: React.CSSProperties = {
  borderRadius: 6, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
