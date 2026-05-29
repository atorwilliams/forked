"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ForkClient({
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
  const [title, setTitle] = useState(sourceTitle);
  const [commitMessage, setCommitMessage] = useState(`Fork of ${sourceUsername}/${sourceSlug}`);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const previewSlug = title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-") || "recipe";

  const handleFork = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    setError("");
    setLoading(true);

    const res = await fetch("/api/recipes/fork", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceRecipeId, sourceVersionId, title: title.trim(), commitMessage }),
    });

    setLoading(false);
    let data: { error?: string; username?: string; slug?: string } = {};
    try { data = await res.json(); } catch { /* empty body — API crashed */ }

    if (!res.ok) { setError(data.error ?? `Server error (${res.status})`); return; }
    router.push(`/${data.username}/${data.slug}`);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 6px" }}>Forking</p>
        <Link href={`/${sourceUsername}/${sourceSlug}`} style={{ color: "var(--text-link)", fontWeight: 600, fontSize: 18, textDecoration: "none" }}>
          {sourceUsername} / {sourceSlug}
        </Link>
        {sourceDescription && (
          <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "8px 0 0", lineHeight: 1.5 }}>{sourceDescription}</p>
        )}
      </div>

      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 16px", marginBottom: 28, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: "var(--text-muted)" }}>
          Latest: <em style={{ color: "var(--text)", fontStyle: "normal" }}>{sourceCommitMessage}</em>
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
          <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>Fork name</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} placeholder="Recipe title" />
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            Will be created as{" "}
            <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 3 }}>you/{previewSlug}</code>
          </span>
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
          <button onClick={handleFork} disabled={loading || !title.trim()} style={{ ...btnStyle, background: "var(--fork-blue)", border: "none", color: "#fff", opacity: loading || !title.trim() ? 0.6 : 1 }}>
            {loading ? "Forking..." : "Fork recipe"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none",
};

const btnStyle: React.CSSProperties = {
  borderRadius: 6, padding: "8px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
