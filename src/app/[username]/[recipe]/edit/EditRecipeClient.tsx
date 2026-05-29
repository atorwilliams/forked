"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IngredientEditor, type IngredientOption, type CategoryOption } from "@/components/IngredientEditor";
import { normalizeTime } from "@/lib/time-parser";

interface Initial {
  recipeId: string;
  title: string;
  description: string;
  yield: string;
  prepTime: string;
  cookTime: string;
  tags: string;
  ingredientText: string;
  procedure: string;
  materials: string;
  notes: string;
}

export function EditRecipeClient({ username, recipeSlug, initial, ingredients, categories }: {
  username: string;
  recipeSlug: string;
  initial: Initial;
  ingredients: IngredientOption[];
  categories: CategoryOption[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [yield_, setYield] = useState(initial.yield);
  const [prepTime, setPrepTime] = useState(initial.prepTime);
  const [cookTime, setCookTime] = useState(initial.cookTime);
  const [tags, setTags] = useState(initial.tags);
  const [ingredientText, setIngredientText] = useState(initial.ingredientText);
  const [procedure, setProcedure] = useState(initial.procedure);
  const [materials, setMaterials] = useState(initial.materials);
  const [notes, setNotes] = useState(initial.notes);
  const [commitMessage, setCommitMessage] = useState("");
  const [isProduction, setIsProduction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!commitMessage.trim()) { setError("Commit message is required."); return; }
    setError("");
    setLoading(true);

    const res = await fetch("/api/recipes/versions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipeId: initial.recipeId, title, description, yield: yield_, prepTime, cookTime, tags, ingredientText, procedure, materials, notes, commitMessage, isProduction, contentMode: "structured" }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) { setError(data.error ?? "Something went wrong."); return; }

    router.push(`/${username}/${recipeSlug}`);
    router.refresh();
  };

  return (
    <div style={{ maxWidth: 860, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "0 0 4px" }}>
          {username} / {recipeSlug}
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>Edit recipe</h1>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 12, alignItems: "end" }}>
          <FormField label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
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

        <FormField label="Description">
          <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} />
        </FormField>

        <FormField label="Tags" note="Comma-separated">
          <input value={tags} onChange={(e) => setTags(e.target.value)} style={inputStyle} />
        </FormField>

        <section>
          <SectionHeader title="Ingredients" />
          <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: 16 }}>
            <IngredientEditor ingredients={ingredients} categories={categories} value={ingredientText} onChange={setIngredientText} />
          </div>
        </section>

        <section>
          <SectionHeader title="Procedure" />
          <textarea value={procedure} onChange={(e) => setProcedure(e.target.value)} style={{ ...inputStyle, width: "100%", minHeight: 200, resize: "vertical", fontFamily: "inherit", lineHeight: 1.7 }} />
        </section>

        <section>
          <SectionHeader title="Materials" note="Equipment needed" />
          <textarea value={materials} onChange={(e) => setMaterials(e.target.value)} style={{ ...inputStyle, width: "100%", minHeight: 80, resize: "vertical", fontFamily: "inherit" }} />
        </section>

        <section>
          <SectionHeader title="Notes" note="Dev notes. Not shown to cooks in production view." />
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...inputStyle, width: "100%", minHeight: 80, resize: "vertical", fontFamily: "inherit" }} />
        </section>
      </div>

      <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
        <FormField label="Commit message" note="What changed and why.">
          <input value={commitMessage} onChange={(e) => setCommitMessage(e.target.value)} placeholder='e.g. "Reduced salt. Feedback from service."' style={inputStyle} />
        </FormField>

        {error && <p style={{ color: "#f85149", fontSize: 12, margin: 0 }}>{error}</p>}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => router.back()} style={{ ...btnStyle, background: "transparent", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading || !commitMessage.trim()} style={{ ...btnStyle, background: "var(--accent)", border: "none", color: "#fff", opacity: loading || !commitMessage.trim() ? 0.6 : 1 }}>
              {loading ? "Committing..." : "Commit changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({ title, note }: { title: string; note?: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <h3 style={{ margin: 0, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)" }}>{title}</h3>
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

const inputStyle: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
  padding: "8px 10px", color: "var(--text)", fontSize: 13, outline: "none",
};

const btnStyle: React.CSSProperties = {
  borderRadius: 6, padding: "8px 18px", fontSize: 14, fontWeight: 600, cursor: "pointer",
};
