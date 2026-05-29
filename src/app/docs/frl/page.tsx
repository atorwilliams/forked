import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FRL Reference" };

export default function FRLReferencePage() {
  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ marginBottom: 40 }}>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--snap-purple)", margin: "0 0 8px" }}>Reference</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 10, letterSpacing: "-0.02em" }}>Forked Recipe Language</h1>
        <p style={{ color: "var(--text-muted)", fontSize: 15, lineHeight: 1.7, margin: "0 0 14px", maxWidth: 580 }}>
          FRL is a plain-text format for recipes. Write it directly in the freetext editor.
          Use <code style={inlineCode}>@directive</code> blocks for structure, or skip them entirely and just write.
        </p>
        <Link href="/docs/frl/spec" style={{ fontSize: 13, color: "var(--snap-purple)" }}>
          Read the FRL 1.0 specification →
        </Link>
      </div>

      <Section title="The basics">
        <p style={prose}>
          FRL is detected automatically. If your text contains any <code style={inlineCode}>@directive</code> lines,
          it parses as structured FRL. If not, it's stored as freetext and displayed as-is.
          You can mix structured blocks with plain prose inside <code style={inlineCode}>@procedure</code> and <code style={inlineCode}>@notes</code>.
        </p>
      </Section>

      <Section title="Directives">
        <p style={{ ...prose, marginBottom: 20 }}>
          Each directive starts with <code style={inlineCode}>@</code> at the beginning of a line.
          Everything that follows, until the next directive, belongs to that block.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {DIRECTIVES.map(({ name, syntax, description }) => (
            <div key={name} style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 16, padding: "10px 0", borderBottom: "1px solid var(--border-muted)", alignItems: "start" }}>
              <code style={{ ...inlineCode, fontSize: 13 }}>{syntax}</code>
              <span style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6 }}>{description}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Full example">
        <pre style={codeBlock}>{FULL_EXAMPLE}</pre>
      </Section>

      <Section title="Ingredient line format">
        <p style={{ ...prose, marginBottom: 20 }}>
          Each line under <code style={inlineCode}>@ingredients</code> is parsed individually.
          Lines can start with <code style={inlineCode}>-</code> or <code style={inlineCode}>*</code> — both are stripped.
          The parser handles quantities, units, ingredient names, package notation, and special cases.
        </p>

        <h3 style={subheading}>Basic pattern</h3>
        <pre style={codeBlock}>{`[quantity] [unit] ingredient [, note]`}</pre>

        <h3 style={subheading}>Quantities</h3>
        <ExampleTable rows={[
          ["450 g pork belly", "whole number"],
          ["1.5 kg chicken", "decimal"],
          ["1 1/2 tsp salt", "mixed fraction"],
          ["1/2 cup flour", "fraction"],
        ]} />

        <h3 style={subheading}>Weight units</h3>
        <UnitTable rows={[
          ["g", "gram, grams, gr"],
          ["kg", "kilogram, kilograms, kilo, kilos"],
          ["mg", "milligram, milligrams"],
          ["oz", "ounce, ounces"],
          ["lb", "lbs, pound, pounds"],
        ]} />

        <h3 style={subheading}>Volume units</h3>
        <UnitTable rows={[
          ["ml", "milliliter, millilitre, milliliters"],
          ["cl", "centiliter, centilitre"],
          ["dl", "deciliter, decilitre"],
          ["L", "l, liter, litre, liters"],
          ["tsp", "teaspoon, teaspoons, t"],
          ["tbsp", "tablespoon, tablespoons, tbs, T"],
          ["fl oz", "floz, fluid ounce, fluid ounces"],
          ["cup", "cups, c"],
          ["pt", "pint, pints"],
          ["qt", "quart, quarts"],
        ]} />

        <h3 style={subheading}>Count and container units</h3>
        <UnitTable rows={[
          ["whole", "unit, piece, pieces, item — implicit when no unit given"],
          ["bunch", "bunches"],
          ["sprig", "sprigs"],
          ["stalk", "stalks, stem, stems, stick, sticks"],
          ["head", "heads"],
          ["clove", "cloves"],
          ["leaf", "leaves"],
          ["slice", "slices"],
          ["can", "cans, tin, tins"],
          ["jar", "jars"],
          ["package", "packages, pkg, pack, packs"],
          ["bottle", "bottles"],
          ["bag", "bags"],
          ["knob", "knobs, nub"],
        ]} />

        <h3 style={subheading}>Special (non-numeric)</h3>
        <UnitTable rows={[
          ["pinch", "pinches"],
          ["dash", "dashes"],
          ["splash", "splashes"],
          ["handful", "handfuls"],
        ]} />

        <h3 style={subheading}>Special cases</h3>
        <ExampleTable rows={[
          ["to taste fleur de sel", "no quantity, flagged as to taste"],
          ["pinch fine sea salt", "qty: 1, unit: pinch"],
          ["3 eggs", "implicit whole — no unit needed"],
          ["2 bay leaves", "auto-singularized to bay leaf"],
          ["1 450g package ground beef", "purchasing count + cooking size"],
          ["150 g carrots, batons", "note after comma"],
        ]} />

        <h3 style={subheading}>Package notation</h3>
        <p style={{ ...prose, marginBottom: 12 }}>
          When an ingredient is sold in packages but measured by weight, write the count first then the size inline:
        </p>
        <pre style={codeBlock}>{`2 250g packages halloumi
1 400g can crushed tomatoes
3 150g portions salmon fillet`}</pre>
        <p style={{ ...prose, marginTop: 12 }}>
          The parser separates purchasing quantity (2 packages) from cooking quantity (500g total).
        </p>
      </Section>

      <Section title="Time format">
        <p style={{ ...prose, marginBottom: 16 }}>
          Used in <code style={inlineCode}>@prep</code> and <code style={inlineCode}>@cook</code>. Accepts natural shorthand:
        </p>
        <ExampleTable rows={[
          ["30m", "30 minutes"],
          ["1h30m", "1 hour 30 minutes"],
          ["2h", "2 hours"],
          ["1d", "1 day"],
          ["1w", "1 week"],
          ["1fn", "1 fortnight"],
          ["90", "90 minutes (bare number = minutes)"],
          ["1 hour 30 minutes", "verbose form also accepted"],
        ]} />
      </Section>

      <Section title="Freetext mode">
        <p style={prose}>
          If your text has no <code style={inlineCode}>@directive</code> lines, FRL stores it verbatim.
          Write however you like — paragraph prose, bullet lists, whatever works for the recipe.
          Freetext is displayed as-is when a cook views the recipe.
        </p>
        <pre style={codeBlock}>{`Blanch the green beans in heavily salted water for 2 minutes.
Shock in ice water. Drain well.

Make the vinaigrette: whisk together the mustard, vinegar, and oil.
Season hard. Toss beans just before serving — they bruise.`}</pre>
        <p style={{ ...prose, marginTop: 12 }}>
          No directives, so this is stored and shown exactly as written.
        </p>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>{title}</h2>
      {children}
    </section>
  );
}

function ExampleTable({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
      {rows.map(([input, desc]) => (
        <div key={input} style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, padding: "7px 0", borderBottom: "1px solid var(--border-muted)", alignItems: "baseline" }}>
          <code style={{ ...inlineCode, fontSize: 12 }}>{input}</code>
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{desc}</span>
        </div>
      ))}
    </div>
  );
}

function UnitTable({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
      {rows.map(([canonical, aliases]) => (
        <div key={canonical} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 16, padding: "6px 0", borderBottom: "1px solid var(--border-muted)", alignItems: "baseline" }}>
          <code style={{ ...inlineCode, fontSize: 12, fontWeight: 700 }}>{canonical}</code>
          <span style={{ color: "var(--text-muted)", fontSize: 12, fontFamily: "monospace" }}>{aliases}</span>
        </div>
      ))}
    </div>
  );
}

const inlineCode: React.CSSProperties = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 4,
  padding: "1px 6px",
  fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace",
  fontSize: 12,
};

const codeBlock: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "16px 20px",
  fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace",
  fontSize: 13,
  lineHeight: 1.7,
  color: "var(--text)",
  overflowX: "auto",
  whiteSpace: "pre",
  margin: 0,
};

const prose: React.CSSProperties = {
  color: "var(--text-muted)",
  fontSize: 14,
  lineHeight: 1.75,
  margin: 0,
};

const subheading: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--text-muted)",
  margin: "24px 0 10px",
};

const DIRECTIVES = [
  { name: "title",       syntax: "@title",       description: "Recipe name. Inline — everything after @title on the same line." },
  { name: "description", syntax: "@description", description: "One-line summary shown on recipe cards. Inline." },
  { name: "yield",       syntax: "@yield",       description: "How much the recipe makes. e.g. 4 portions, 1 loaf. Inline." },
  { name: "prep",        syntax: "@prep",        description: "Prep time. Accepts shorthand: 30m, 1h30m, 2h. Inline." },
  { name: "cook",        syntax: "@cook",        description: "Cook time. Same format as @prep. Inline." },
  { name: "tags",        syntax: "@tags",        description: "Comma-separated list. Inline. e.g. @tags main, pork, austrian" },
  { name: "ingredients", syntax: "@ingredients", description: "Block. One ingredient per line. Lines may start with - or *." },
  { name: "materials",   syntax: "@materials",   description: "Block. Equipment needed, one item per line." },
  { name: "procedure",   syntax: "@procedure",   description: "Block. Full method. Prose, numbered steps, whatever works." },
  { name: "notes",       syntax: "@notes",       description: "Block. Dev notes — visible in the editor, hidden from cooks in a future production view." },
];

const FULL_EXAMPLE = `@title Crispy Pork Belly
@description Low and slow, then blast. The crosshatch skin is non-negotiable.
@yield 4 portions
@prep 30m
@cook 1h30m
@tags main, pork, austrian

@ingredients
- 2 kg pork belly, skin-on
- fleur de sel
- 5g freshly cracked black pepper

@materials
- roasting rack
- cast iron pan
- probe thermometer

@procedure
Score the skin in a 1cm crosshatch pattern. All the way through the fat,
not into the meat. Salt heavily and refrigerate uncovered overnight.

Roast at 160°C for 45 minutes until internal temp reaches 68°C.
Blast at 220°C for 8-10 minutes to crackle the skin. Watch it actively.

Rest 10 minutes before carving.

@notes
Josh runs his at 165°C. Worth a side-by-side on the same day with the same cut.`;
