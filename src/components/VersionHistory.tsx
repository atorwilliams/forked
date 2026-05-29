import Link from "next/link";

export interface VersionEntry {
  id: string;
  commitMessage?: string;
  author: string;
  createdAt: string;
  isProduction: boolean;
  isCurrent: boolean;
  isFork: boolean;
}

interface VersionHistoryProps {
  versions: VersionEntry[];
  username: string;
  recipeSlug: string;
}

export function VersionHistory({ versions, username, recipeSlug }: VersionHistoryProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {versions.map((v, i) => (
        <div key={v.id} style={{ display: "flex", gap: 12, position: "relative" }}>
          {/* Timeline dot + line */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 32, flexShrink: 0 }}>
            <div
              style={{
                width: 10, height: 10, borderRadius: "50%",
                background: v.isFork ? "var(--fork-blue)" : v.isCurrent ? "var(--text)" : "var(--border)",
                border: `2px solid ${v.isFork ? "var(--fork-blue)" : v.isCurrent ? "var(--text)" : "var(--bg-tertiary)"}`,
                flexShrink: 0, marginTop: 16, zIndex: 1,
              }}
            />
            {i < versions.length - 1 && (
              <div style={{ width: 2, flex: 1, background: "var(--border-muted)", minHeight: 24 }} />
            )}
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1, padding: "12px 0",
              borderBottom: i < versions.length - 1 ? "1px solid var(--border-muted)" : "none",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <Link
                  href={`/${username}/${recipeSlug}/v/${v.id}`}
                  style={{ color: "var(--text)", fontWeight: 500, fontFamily: "monospace", fontSize: 13 }}
                >
                  {v.commitMessage || <span style={{ color: "var(--text-muted)" }}>No message</span>}
                </Link>
                {v.isFork && (
                  <span className="badge-fork" style={{ fontSize: 10, padding: "1px 7px", borderRadius: 20, fontWeight: 600 }}>
                    fork
                  </span>
                )}
                {v.isCurrent && (
                  <span style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", fontSize: 10, padding: "1px 7px", borderRadius: 20, color: "var(--text-muted)" }}>
                    current
                  </span>
                )}
              </div>
              <div style={{ color: "var(--text-muted)", fontSize: 12 }}>
                {v.author} · {v.createdAt}
              </div>
            </div>
            <Link
              href={`/${username}/${recipeSlug}/v/${v.id}`}
              style={{
                background: "var(--bg-tertiary)", border: "1px solid var(--border)",
                borderRadius: 5, padding: "3px 10px", color: "var(--text)",
                fontSize: 12, fontFamily: "monospace", flexShrink: 0, textDecoration: "none",
              }}
            >
              {v.id.slice(0, 7)}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
