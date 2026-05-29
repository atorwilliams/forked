"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FRLEditor } from "@/components/FRLEditor";
import { IngredientEditor, type IngredientOption, type CategoryOption } from "@/components/IngredientEditor";
import { normalizeTime } from "@/lib/time-parser";

interface Props {
  ingredients: IngredientOption[];
  categories: CategoryOption[];
}

type Tab = "structured" | "freetext";

export function NewRecipeClient({ ingredients, categories }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("structured");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [yield_, setYield] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [tags, setTags] = useState("");
  const [procedure, setProcedure] = useState("");
  const [ingredientText, setIngredientText] = useState("");
  const [materials, setMaterials] = useState("");
  const [notes, setNotes] = useState("");
  const [freetextContent, setFreetextContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [isProduction, setIsProduction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) { setError("Title is required."); return; }
    setError("");
    setLoading(true);

    const body =
      tab === "structured"
        ? { title, description, yield: yield_, prepTime, cookTime, tags, ingredientText, procedure, materials, notes, commitMessage, isProduction, contentMode: "structured" }
        : { title, commitMessage, isProduction, contentMode: "freetext", contentRaw: freetextContent };

    const res = await fetch("/api/recipes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    router.push(`/${data.username}/${data.slug}`);
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>New Recipe</h1>
      <p style={{ color: "var(--text-muted)", marginBottom: 24, fontSize: 13 }}>
        Write it down before you lose it.
      </p>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 28 }}>
        <ModeTab label="Structured" active={tab === "structured"} onClick={() => setTab("structured")} />
        <ModeTab label="Freetext" active={tab === "freetext"} onClick={() => setTab("freetext")} />
      </div>

      {tab === "structured" ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Meta row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, alignItems: "end" }}>
            <FormField label="Title">
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Crispy Pork Belly" style={inputStyle} />
            </FormField>
            <FormField label="Yield">
              <input value={yield_} onChange={(e) => setYield(e.target.value)} placeholder="4 portions" style={{ ...inputStyle, width: 120 }} />
            </FormField>
            <FormField label="Prep">
              <input value={prepTime} onChange={(e) => setPrepTime(e.target.value)} onBlur={(e) => setPrepTime(normalizeTime(e.target.value))} placeholder="30m" style={{ ...inputStyle, width: 80 }} />
            </FormField>
            <FormField label="Cook">
              <input value={cookTime} onChange={(e) => setCookTime(e.target.value)} onBlur={(e) => setCookTime(normalizeTime(e.target.value))} placeholder="1h30m" style={{ ...inputStyle, width: 80 }} />
            </FormField>
          </div>

          <FormField label="Description" note="One-liner shown on recipe cards">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Low and slow, then blast. The crosshatch skin is non-negotiable." style={inputStyle} />
          </FormField>

          <FormField label="Tags" note="Comma-separated">
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="main, pork, austrian" style={inputStyle} />
          </FormField>

          {/* Ingredients */}
          <section>
            <SectionHeader title="Ingredients" />
            <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
              <IngredientEditor ingredients={ingredients} categories={categories} value={ingredientText} onChange={setIngredientText} />
            </div>
          </section>

          {/* Procedure */}
          <section>
            <SectionHeader title="Procedure" />
            <textarea
              value={procedure}
              onChange={(e) => setProcedure(e.target.value)}
              placeholder={"Score the skin in 1cm crosshatch pattern.\nSalt heavily and refrigerate overnight.\nCook at 160°C for 45 minutes."}
              style={{ ...inputStyle, width: "100%", minHeight: 200, resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }}
            />
          </section>

          {/* Materials */}
          <section>
            <SectionHeader title="Materials" note="Equipment needed" />
            <textarea
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              placeholder={"roasting rack\ncast iron pan\nprobe thermometer"}
              style={{ ...inputStyle, width: "100%", minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
            />
          </section>

          {/* Notes */}
          <section>
            <SectionHeader title="Notes" note="Dev notes. Not shown to cooks in production view." />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Josh runs his at 165°C. Worth testing side by side."
              style={{ ...inputStyle, width: "100%", minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
            />
          </section>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <FormField label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recipe title" style={inputStyle} />
          </FormField>
          <FRLEditor initialValue={freetextContent} onChange={(raw) => setFreetextContent(raw)} />
        </div>
      )}

      {/* Commit row */}
      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <FormField label="Commit message" note="Explain what changed and why. Future you will thank present you.">
          <input
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder='e.g. "Increased cream by 20ml. New dairy supplier runs thinner."'
            style={inputStyle}
          />
        </FormField>

        {error && <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            style={{ ...btnStyle, background: "var(--accent)", border: "none", color: "#fff", opacity: loading || !title.trim() ? 0.6 : 1 }}
          >
            {loading ? "Committing..." : "Commit recipe"}
          </button>
        </div>
      </div>

    </div>
  );
}

function ModeTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: "transparent",
        border: "none",
        borderBottom: active ? "2px solid var(--text)" : "2px solid transparent",
        padding: "8px 16px",
        color: active ? "var(--text)" : "var(--text-muted)",
        fontSize: 14,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        marginBottom: -1,
      }}
    >
      {label}
    </button>
  );
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
        {title}
      </h3>
      {note && <p style={{ margin: "3px 0 0", fontSize: 11, color: "var(--text-muted)" }}>{note}</p>}
    </div>
  );
}

function FormField({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>{label}</label>
      {children}
      {note && <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{note}</span>}
    </div>
  );
}

function FRLReference() {
  return (
    <p style={{ marginTop: 32, fontSize: 13, color: "var(--text-muted)" }}>
      Not sure about the ingredient format?{" "}
      <a href="/docs/frl" target="_blank" rel="noreferrer" style={{ color: "var(--snap-purple)" }}>
        FRL reference
      </a>
    </p>
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
};

const btnStyle: React.CSSProperties = {
  borderRadius: 6,
  padding: "8px 18px",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
