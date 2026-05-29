"use client";

import { useState, useMemo, useCallback } from "react";
import {
  parseIngredientLine,
  singularize,
  type ParsedIngredientLine,
} from "@/lib/ingredient-parser";

function parseAliases(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as string[]; } catch { return raw.split(",").map((s) => s.trim()).filter(Boolean); }
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IngredientOption {
  id: string;
  nameNormalized: string;
  displayName: string;
  aliases: string;
  category: { id: string; name: string; slug: string };
}

export interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
}

interface ResolvedLine {
  parsed: ParsedIngredientLine | null;
  resolvedIngredientId: string | null;
  resolvedCategory: string | null;
  status: "idle" | "ok" | "unknown" | "ambiguous" | "invalid";
}

// ── Main component ────────────────────────────────────────────────────────────

export function IngredientEditor({ ingredients, categories, value, onChange }: { ingredients: IngredientOption[]; categories: CategoryOption[]; value?: string; onChange?: (text: string) => void }) {
  const [internalText, setInternalText] = useState(value ?? "");
  const text = value !== undefined ? value : internalText;
  const setText = (v: string) => { setInternalText(v); onChange?.(v); };
  const [localIngredients, setLocalIngredients] = useState<IngredientOption[]>(ingredients);
  const [addingFor, setAddingFor] = useState<{
    lineIndex: number;
    suggestedName: string;
    categoryId: string;
    aliases: string;
  } | null>(null);

  const resolve = useCallback(
    (raw: string): ResolvedLine => {
      if (!raw.trim()) return { parsed: null, resolvedIngredientId: null, resolvedCategory: null, status: "idle" };

      const parsed = parseIngredientLine(raw);

      if (parsed.status === "invalid") {
        return { parsed, resolvedIngredientId: null, resolvedCategory: null, status: "invalid" };
      }

      if (parsed.isToTaste || parsed.status === "ok") {
        const name = parsed.ingredientName;
        const singular = singularize(name);
        const match = localIngredients.find(
          (i) =>
            i.nameNormalized === name ||
            i.nameNormalized === singular ||
            parseAliases(i.aliases).some((a) => a.toLowerCase() === name || a.toLowerCase() === singular)
        );
        if (match) {
          return { parsed, resolvedIngredientId: match.id, resolvedCategory: match.category.name, status: "ok" };
        }
        return { parsed, resolvedIngredientId: null, resolvedCategory: null, status: "unknown" };
      }

      return { parsed, resolvedIngredientId: null, resolvedCategory: null, status: parsed.status as ResolvedLine["status"] };
    },
    [localIngredients]
  );

  const lines = text.split("\n");
  const resolved = useMemo(() => lines.map((l) => resolve(l)), [lines, resolve]);
  const nonEmpty = lines.filter((l) => l.trim()).length;

  const [addingLoading, setAddingLoading] = useState(false);
  const [addingError, setAddingError] = useState("");

  const handleAddIngredient = async () => {
    if (!addingFor) return;
    setAddingError("");
    setAddingLoading(true);

    const res = await fetch("/api/ingredients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nameNormalized: addingFor.suggestedName.toLowerCase().trim(),
        displayName: addingFor.suggestedName.trim().replace(/\b\w/g, (c) => c.toUpperCase()),
        categoryId: addingFor.categoryId,
        aliases: addingFor.aliases,
      }),
    });

    const data = await res.json();
    setAddingLoading(false);

    if (!res.ok && res.status !== 409) {
      setAddingError(data.error ?? "Failed to add ingredient.");
      return;
    }

    const ing = data.ingredient ?? data;
    const newIng: IngredientOption = {
      id: ing.id,
      nameNormalized: ing.nameNormalized,
      displayName: ing.displayName,
      aliases: ing.aliases,
      category: categories.find((c) => c.id === addingFor.categoryId) ?? { id: "", name: "", slug: "" },
    };
    setLocalIngredients((prev) => [...prev, newIng]);
    setAddingFor(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={"2 kg pork belly\n100 ml double cream\nfleur de sel\n3 eggs\nto taste black pepper"}
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "10px 12px",
          color: "var(--text)",
          fontSize: 13,
          fontFamily: "ui-monospace, monospace",
          lineHeight: 1.8,
          outline: "none",
          resize: "vertical",
          width: "100%",
          minHeight: 120,
          rows: Math.max(4, lines.length + 1),
        } as React.CSSProperties}
        spellCheck={false}
      />

      {nonEmpty > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {lines.map((line, i) => {
            if (!line.trim()) return null;
            const r = resolved[i];
            const p = r.parsed;
            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0,
                  borderRadius: 4,
                  overflow: "hidden",
                  background: "var(--bg-secondary)",
                  border: `1px solid ${
                    r.status === "ok" ? "transparent"
                    : r.status === "unknown" ? "rgba(210,153,34,0.3)"
                    : r.status === "invalid" || r.status === "ambiguous" ? "rgba(248,81,73,0.3)"
                    : "transparent"
                  }`,
                  fontSize: 13,
                }}
              >
                <span style={{ width: 52, padding: "5px 8px", fontFamily: "monospace", fontSize: 12, color: "var(--text-muted)", flexShrink: 0, borderRight: "1px solid var(--border-muted)" }}>
                  {p?.isToTaste ? <span style={{ fontSize: 10 }}>taste</span>
                    : p?.quantity != null ? formatQty(p.quantity)
                    : ""}
                </span>
                <span style={{ width: 52, padding: "5px 8px", fontSize: 12, color: "var(--text-muted)", flexShrink: 0, borderRight: "1px solid var(--border-muted)" }}>
                  {p?.unitDef?.display ?? p?.unit ?? ""}
                </span>
                <span style={{ flex: 1, padding: "5px 10px", color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                  {p?.ingredientName ?? line.trim()}
                  {p?.note && (
                    <span style={{ color: "var(--text-muted)", fontSize: 11, fontStyle: "italic" }}>({p.note})</span>
                  )}
                </span>
                <div style={{ padding: "0 8px", flexShrink: 0 }}>
                  <StatusBadge
                    status={r.status}
                    category={r.resolvedCategory}
                    onClick={() => {
                      if (r.status === "unknown" && p) {
                        setAddingFor({
                          lineIndex: i,
                          suggestedName: p.ingredientName,
                          categoryId: categories.find((c) => c.parentId === null)?.id ?? "",
                          aliases: "",
                        });
                      }
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p style={{ color: "var(--text-muted)", fontSize: 11, margin: 0 }}>
        One ingredient per line.{" "}
        <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 3 }}>450 g pork belly</code>
        {" · "}
        <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 3 }}>3 eggs</code>
        {" · "}
        <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 3 }}>to taste fleur de sel</code>
      </p>

      {addingFor && (
        <AddIngredientModal
          suggestedName={addingFor.suggestedName}
          categories={categories}
          selectedCategoryId={addingFor.categoryId}
          aliases={addingFor.aliases}
          onCategoryChange={(id) => setAddingFor((prev) => prev ? { ...prev, categoryId: id } : null)}
          onNameChange={(name) => setAddingFor((prev) => prev ? { ...prev, suggestedName: name } : null)}
          onAliasesChange={(a) => setAddingFor((prev) => prev ? { ...prev, aliases: a } : null)}
          onConfirm={handleAddIngredient}
          onDismiss={() => { setAddingFor(null); setAddingError(""); }}
          loading={addingLoading}
          error={addingError}
        />
      )}
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status, category, onClick }: { status: ResolvedLine["status"]; category: string | null; onClick: () => void }) {
  if (status === "ok" && category) {
    return (
      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(63,185,80,0.1)", color: "var(--prod-green)", border: "1px solid rgba(63,185,80,0.25)", whiteSpace: "nowrap" }}>
        {category.split(" / ").slice(-1)[0]}
      </span>
    );
  }
  if (status === "unknown") {
    return (
      <button onClick={onClick} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(210,153,34,0.1)", color: "var(--dev-amber)", border: "1px solid rgba(210,153,34,0.25)", cursor: "pointer", whiteSpace: "nowrap" }}>
        Unknown. Add?
      </button>
    );
  }
  if (status === "ambiguous" || status === "invalid") {
    return (
      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, background: "rgba(248,81,73,0.1)", color: "#f85149", border: "1px solid rgba(248,81,73,0.25)", whiteSpace: "nowrap" }}>
        Can&apos;t parse
      </span>
    );
  }
  return null;
}

function formatQty(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toPrecision(4)).toString();
}

// ── Add ingredient modal ──────────────────────────────────────────────────────

function AddIngredientModal({ suggestedName, categories, selectedCategoryId, aliases, onCategoryChange, onNameChange, onAliasesChange, onConfirm, onDismiss, loading, error }: {
  suggestedName: string;
  categories: CategoryOption[];
  selectedCategoryId: string;
  aliases: string;
  onCategoryChange: (id: string) => void;
  onNameChange: (name: string) => void;
  onAliasesChange: (a: string) => void;
  onConfirm: () => void;
  onDismiss: () => void;
  loading?: boolean;
  error?: string;
}) {
  const roots = categories.filter((c) => c.parentId === null);
  const children = (parentId: string) => categories.filter((c) => c.parentId === parentId);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      onClick={(e) => e.target === e.currentTarget && onDismiss()}
    >
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 10, padding: 28, width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <h3 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 600 }}>Add to ingredient library</h3>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: 13 }}>Not in the global library yet. Confirm it and it will be available to everyone.</p>
        </div>

        <Field label="Canonical name (lowercase, singular)">
          <input value={suggestedName} onChange={(e) => onNameChange(e.target.value)} style={inputStyle} placeholder="e.g. pork belly" />
        </Field>

        <Field label="Category">
          <select value={selectedCategoryId} onChange={(e) => onCategoryChange(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
            {roots.map((root) => (
              <optgroup key={root.id} label={root.name}>
                {children(root.id).map((child) => (
                  <option key={child.id} value={child.id}>{child.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Field label="Aliases (comma-separated, optional)" note="Other names this ingredient goes by">
          <input value={aliases} onChange={(e) => onAliasesChange(e.target.value)} style={inputStyle} placeholder="e.g. heavy cream, whipping cream" />
        </Field>

        {error && <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={onDismiss} disabled={loading} style={{ ...btnStyle, background: "transparent", color: "var(--text-muted)", border: "1px solid var(--border)", opacity: loading ? 0.6 : 1 }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...btnStyle, background: "var(--accent)", color: "#fff", border: "none", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Adding..." : "Add to library"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{label}</label>
      {children}
      {note && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{note}</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none", width: "100%",
};

const btnStyle: React.CSSProperties = {
  borderRadius: 6, padding: "8px 18px", fontSize: 13, fontWeight: 500, cursor: "pointer",
};
