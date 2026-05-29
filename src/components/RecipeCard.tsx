"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface RecipeCardProps {
  id?: string;
  username: string;
  recipeSlug: string;
  title: string;
  description?: string;
  tags?: string[];
  isProduction?: boolean;
  forkCount: number;
  snapCount: number;
  updatedAt: string;
  snapOf?: string;
  isOwner?: boolean;
}

export function RecipeCard({
  id,
  username,
  recipeSlug,
  title,
  description,
  tags,
  isProduction,
  forkCount,
  snapCount,
  updatedAt,
  snapOf,
  isOwner,
}: RecipeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(true);
    setMenuOpen(false);
    await fetch(`/api/recipes/${id}`, { method: "DELETE" });
    router.refresh();
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        transition: "border-color 0.15s",
        position: "relative",
        opacity: deleting ? 0.4 : 1,
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--fork-blue)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)")
      }
    >
      {/* Gear button */}
      {isOwner && id && (
        <div ref={menuRef} style={{ position: "absolute", top: 14, right: 14 }}>
          <button
            onClick={(e) => { e.preventDefault(); setMenuOpen((o) => !o); }}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "var(--text-muted)",
              padding: 4,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              opacity: 0.5,
              transition: "opacity 0.1s, color 0.1s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.5"; }}
            title="Recipe actions"
          >
            <GearIcon />
          </button>

          {menuOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 6,
              minWidth: 150,
              boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
              zIndex: 100,
              overflow: "hidden",
            }}>
              <Link
                href={`/${username}/${recipeSlug}/edit`}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: "block",
                  padding: "9px 14px",
                  fontSize: 13,
                  color: "var(--text)",
                  textDecoration: "none",
                  borderBottom: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-tertiary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              >
                Edit recipe
              </Link>
              <button
                onClick={handleDelete}
                style={{
                  display: "block",
                  width: "100%",
                  padding: "9px 14px",
                  fontSize: 13,
                  color: "#f85149",
                  background: "transparent",
                  border: "none",
                  textAlign: "left",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--bg-tertiary)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
              >
                Delete recipe
              </button>
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", paddingRight: isOwner ? 28 : 0 }}>
        <Link
          href={`/${username}/${recipeSlug}`}
          style={{
            color: "var(--text-link)",
            fontWeight: 600,
            fontSize: 15,
            textDecoration: "none",
          }}
        >
          <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
            {username}
          </span>
          <span style={{ color: "var(--text-muted)" }}> / </span>
          {title}
        </Link>
        {snapOf && (
          <span
            className="badge-snap"
            style={{ fontSize: 11, padding: "1px 7px", borderRadius: 20, fontWeight: 500 }}
          >
            snap of {snapOf}
          </span>
        )}
      </div>

      {description && (
        <p style={{ color: "var(--text-muted)", margin: 0, fontSize: 13 }}>
          {description}
        </p>
      )}

      {tags && tags.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {tags.map((tag) => (
            <span key={tag} className="tag-pill">{tag}</span>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 16, color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <ForkCountIcon />
          {forkCount}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <SnapCountIcon />
          {snapCount}
        </span>
        <span>Updated {updatedAt}</span>
      </div>
    </div>
  );
}

export function StatusBadge({ isProduction }: { isProduction: boolean }) {
  return (
    <span
      className={isProduction ? "badge-prod" : "badge-dev"}
      style={{ fontSize: 11, padding: "1px 7px", borderRadius: 20, fontWeight: 500 }}
    >
      {isProduction ? "production" : "dev"}
    </span>
  );
}

function GearIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function ForkCountIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="6" r="3" />
      <path d="M6 9v2a3 3 0 0 0 3 3h6a3 3 0 0 0 3-3V9" />
      <line x1="12" y1="15" x2="12" y2="12" />
    </svg>
  );
}

function SnapCountIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18" />
      <path d="M8 6h10v10" />
    </svg>
  );
}
