"use client";

import { useState } from "react";
import { parseFRL, type ParsedRecipe } from "@/lib/frl";

interface FRLEditorProps {
  initialValue?: string;
  onChange?: (raw: string, parsed: ParsedRecipe) => void;
}

const PLACEHOLDER = `@title Crispy Pork Belly
@yield 4 portions
@prep 30m
@cook 1h30m
@tags main, pork, austrian

@ingredients
- 2 kg pork belly
- 100 ml double cream
- fleur de sel

@materials
- cast iron pan
- roasting rack

@procedure
Score the skin in 1cm crosshatch pattern. Salt heavily and refrigerate uncovered overnight.
Bring to room temperature 30 minutes before cooking.
Cook at 160°C for 45 minutes, blast at 220°C for 10 minutes to crisp.

@notes
Josh runs his at 165°C. Worth testing side by side.`;

const FREETEXT_PLACEHOLDER = `Write your recipe however you like.

No structure required. Just write it down before you lose it.
You can add structure later.`;

export function FRLEditor({ initialValue = "", onChange }: FRLEditorProps) {
  const [mode, setMode] = useState<"frl" | "freetext">("frl");
  const [value, setValue] = useState(initialValue);
  const [commitMessage, setCommitMessage] = useState("");
  const parsed = parseFRL(value);

  const handleChange = (raw: string) => {
    setValue(raw);
    onChange?.(raw, parseFRL(raw));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Input mode:</span>
        <ModeToggle mode={mode} onChange={setMode} />
      </div>

      <textarea
        className="frl-editor"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={mode === "frl" ? PLACEHOLDER : FREETEXT_PLACEHOLDER}
        spellCheck={false}
      />

      {mode === "frl" && value && (
        <FRLPreview parsed={parsed} />
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ color: "var(--text-muted)", fontSize: 12, fontWeight: 500 }}>
          Commit message <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optional but helpful)</span>
        </label>
        <input
          value={commitMessage}
          onChange={(e) => setCommitMessage(e.target.value)}
          placeholder='e.g. "Increased cream by 20ml. New dairy supplier runs thinner."'
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "8px 12px",
            color: "var(--text)",
            fontSize: 13,
            outline: "none",
            fontFamily: "inherit",
          }}
        />
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: "frl" | "freetext"; onChange: (m: "frl" | "freetext") => void }) {
  const btn = (id: "frl" | "freetext", label: string) => (
    <button
      onClick={() => onChange(id)}
      style={{
        padding: "4px 12px",
        borderRadius: 5,
        fontSize: 12,
        fontWeight: 500,
        border: "1px solid var(--border)",
        cursor: "pointer",
        background: mode === id ? "var(--bg-tertiary)" : "transparent",
        color: mode === id ? "var(--text)" : "var(--text-muted)",
        transition: "background 0.15s",
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        display: "inline-flex",
        gap: 4,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: 3,
      }}
    >
      {btn("frl", "Structured")}
      {btn("freetext", "Freetext")}
    </div>
  );
}

function FRLPreview({ parsed }: { parsed: ParsedRecipe }) {
  if (parsed.mode === "freetext") return null;

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: 6,
        padding: "16px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          Preview
        </span>
      </div>

      {parsed.title && (
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{parsed.title}</h2>
      )}

      <div style={{ display: "flex", gap: 16, color: "var(--text-muted)", fontSize: 12 }}>
        {parsed.yield && <span>Yield: {parsed.yield}</span>}
        {parsed.prepTime && <span>Prep: {parsed.prepTime}</span>}
        {parsed.cookTime && <span>Cook: {parsed.cookTime}</span>}
      </div>

      {parsed.tags && parsed.tags.length > 0 && (
        <div style={{ display: "flex", gap: 6 }}>
          {parsed.tags.map((t) => (
            <span
              key={t}
              style={{
                background: "var(--bg-tertiary)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "1px 9px",
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {parsed.ingredients && parsed.ingredients.length > 0 && (
        <section>
          <h4 style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Ingredients
          </h4>
          <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
            {parsed.ingredients.map((i, idx) => (
              <li key={idx} style={{ color: "var(--text)", marginBottom: 2 }}>{i}</li>
            ))}
          </ul>
        </section>
      )}

      {parsed.materials && parsed.materials.length > 0 && (
        <section>
          <h4 style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Materials
          </h4>
          <ul style={{ margin: 0, padding: "0 0 0 20px" }}>
            {parsed.materials.map((m, idx) => (
              <li key={idx} style={{ color: "var(--text)", marginBottom: 2 }}>{m}</li>
            ))}
          </ul>
        </section>
      )}

      {parsed.procedure && (
        <section>
          <h4 style={{ margin: "0 0 6px", fontSize: 12, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Procedure
          </h4>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{parsed.procedure}</p>
        </section>
      )}

      {parsed.notes && (
        <section
          style={{
            background: "rgba(210, 153, 34, 0.08)",
            border: "1px solid rgba(210, 153, 34, 0.3)",
            borderRadius: 6,
            padding: "10px 14px",
          }}
        >
          <h4 style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 600, color: "var(--dev-amber)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Notes
          </h4>
          <p style={{ margin: 0, whiteSpace: "pre-wrap", color: "var(--text)" }}>{parsed.notes}</p>
        </section>
      )}
    </div>
  );
}
