import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "FRL 1.0 Specification" };

export default function FRLSpecPage() {
  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "48px 24px", lineHeight: 1.75 }}>
      <div style={{ marginBottom: 12 }}>
        <Link href="/docs/frl" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
          ← FRL reference
        </Link>
      </div>

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 16, marginBottom: 8 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
            Forked Recipe Language
          </h1>
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--snap-purple)", background: "rgba(163,113,247,0.1)", border: "1px solid rgba(163,113,247,0.25)", borderRadius: 4, padding: "2px 8px" }}>
            Specification 1.0
          </span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>
          This document defines FRL 1.0. Conforming implementations must produce output consistent with this specification for all valid UTF-8 input.
        </p>
      </div>

      {/* TOC */}
      <nav style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px 24px", marginBottom: 48 }}>
        <p style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", margin: "0 0 12px" }}>Contents</p>
        <ol style={{ margin: 0, padding: "0 0 0 20px", display: "flex", flexDirection: "column", gap: 4 }}>
          {TOC.map(({ id, label }) => (
            <li key={id} style={{ fontSize: 13 }}>
              <a href={`#${id}`} style={{ color: "var(--text-link)", textDecoration: "none" }}>{label}</a>
            </li>
          ))}
        </ol>
      </nav>

      <Section id="overview" title="1. Overview">
        <P>
          FRL (Forked Recipe Language) is a plain-text format for recipes. It is designed to be human-writable without tooling and machine-readable without ambiguity. A document is either structured FRL or unstructured freetext — the mode is detected automatically from the content.
        </P>
        <P>
          FRL does not replace prose. Procedure and notes fields are free-form text. Structure is imposed only where it enables computation: ingredient quantities, units, and names are parsed to a structured schema that supports cost calculation, scaling, allergen analysis, and interoperability with external systems.
        </P>
      </Section>

      <Section id="detection" title="2. Document detection">
        <P>
          A document is FRL if and only if at least one line, after stripping leading whitespace, begins with <C>@</C> followed immediately by a known directive name (see §3). Detection is case-insensitive. If no such line exists, the document is freetext and must be returned with <C>mode: "freetext"</C> and the raw string preserved verbatim.
        </P>
        <P>
          Implementations must not reject documents with unknown <C>@word</C> tokens. Unknown directives are silently ignored and their content is discarded. This allows future directive additions without breaking older parsers.
        </P>
      </Section>

      <Section id="directives" title="3. Directives">
        <P>
          Directives fall into two classes: <strong>inline</strong> and <strong>block</strong>. Inline directives take their value from the remainder of the line. Block directives take their value from all subsequent lines until the next directive or end of document.
        </P>

        <H3>3.1 Inline directives</H3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>Directive</Th><Th>Output field</Th><Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            <Tr><Td><C>@title</C></Td><Td><C>title</C></Td><Td>Trimmed string. Null if absent.</Td></Tr>
            <Tr><Td><C>@description</C></Td><Td><C>description</C></Td><Td>Trimmed string. Null if absent.</Td></Tr>
            <Tr><Td><C>@yield</C></Td><Td><C>yield</C></Td><Td>Trimmed string. Not parsed — stored verbatim. Null if absent.</Td></Tr>
            <Tr><Td><C>@prep</C></Td><Td><C>prep_time</C></Td><Td>Parsed by §6. Null if absent or unparseable.</Td></Tr>
            <Tr><Td><C>@cook</C></Td><Td><C>cook_time</C></Td><Td>Parsed by §6. Null if absent or unparseable.</Td></Tr>
            <Tr><Td><C>@tags</C></Td><Td><C>tags</C></Td><Td>Comma-separated, each tag trimmed and lowercased. Empty array if absent.</Td></Tr>
          </tbody>
        </table>

        <H3>3.2 Block directives</H3>
        <table style={tableStyle}>
          <thead>
            <tr>
              <Th>Directive</Th><Th>Output field</Th><Th>Notes</Th>
            </tr>
          </thead>
          <tbody>
            <Tr><Td><C>@ingredients</C></Td><Td><C>ingredients</C></Td><Td>Array of parsed ingredient lines (§4). Each non-empty line is parsed individually.</Td></Tr>
            <Tr><Td><C>@materials</C></Td><Td><C>materials</C></Td><Td>Array of trimmed strings, list markers stripped. Empty lines discarded.</Td></Tr>
            <Tr><Td><C>@procedure</C></Td><Td><C>procedure</C></Td><Td>Full block text, internal newlines preserved. Trimmed. Null if absent.</Td></Tr>
            <Tr><Td><C>@notes</C></Td><Td><C>notes</C></Td><Td>Full block text, internal newlines preserved. Trimmed. Null if absent.</Td></Tr>
          </tbody>
        </table>

        <P>
          No directives are required. A document with only <C>@procedure</C> is valid. All absent fields produce their null/empty defaults in the output schema (§7).
        </P>
        <P>
          List markers (<C>-</C> or <C>*</C>) at the start of a line inside a block directive are stripped before processing. A line that is only a list marker after stripping is treated as empty and discarded.
        </P>
      </Section>

      <Section id="ingredient-lines" title="4. Ingredient line grammar">
        <P>
          Each non-empty line under <C>@ingredients</C> is parsed as an ingredient line. List markers are stripped first. Parsing is attempted in the order defined here; the first pattern that matches wins.
        </P>

        <H3>4.1 Patterns (evaluated in order)</H3>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {PATTERNS.map(({ n, name, form, example, notes }) => (
            <div key={n} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 6, padding: "14px 18px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)" }}>4.1.{n}</span>
                <strong style={{ fontSize: 14 }}>{name}</strong>
              </div>
              <pre style={{ ...preStyle, marginBottom: 6 }}>{form}</pre>
              <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
                <span style={{ color: "var(--text-muted)" }}>e.g.</span>
                <code style={codeStyle}>{example}</code>
              </div>
              {notes && <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "8px 0 0", lineHeight: 1.6 }}>{notes}</p>}
            </div>
          ))}
        </div>

        <H3>4.2 Number formats</H3>
        <P>All quantity fields accept the following number formats:</P>
        <table style={tableStyle}>
          <thead><tr><Th>Format</Th><Th>Example</Th><Th>Value</Th></tr></thead>
          <tbody>
            <Tr><Td>Integer</Td><Td><C>3</C></Td><Td>3.0</Td></Tr>
            <Tr><Td>Decimal</Td><Td><C>1.5</C></Td><Td>1.5</Td></Tr>
            <Tr><Td>Fraction</Td><Td><C>1/2</C></Td><Td>0.5</Td></Tr>
            <Tr><Td>Mixed fraction</Td><Td><C>1 1/2</C></Td><Td>1.5</Td></Tr>
            <Tr><Td>Range</Td><Td><C>1-2</C></Td><Td>min: 1, max: 2</Td></Tr>
          </tbody>
        </table>
        <P>
          A range produces a quantity object with <C>type: "range"</C>, <C>min</C>, and <C>max</C>. Neither end of a range may be a fraction — only integers and decimals are valid range bounds. Cost and scaling consumers should document their own policy for ranges (midpoint, maximum, or flagged for review).
        </P>

        <H3>4.3 Optional marker</H3>
        <P>
          If the ingredient line ends with the literal string <C>(optional)</C> (case-insensitive, after stripping the note if present), the field <C>is_optional</C> is set to <C>true</C> and the marker is removed from the ingredient name. An optional ingredient must still be included in allergen analysis.
        </P>

        <H3>4.4 Parenthetical notes</H3>
        <P>
          A parenthetical at the end of an ingredient line — after the ingredient name — is extracted into the <C>note</C> field. The content of the parenthetical is preserved verbatim. If the parenthetical is the optional marker (§4.3), it is handled by that rule instead.
        </P>
        <P>
          A comma-separated suffix is also a note: <C>150 g carrots, batons</C> → note: <C>"batons"</C>.
        </P>

        <H3>4.5 Name normalisation</H3>
        <P>
          Ingredient names are lowercased and have trailing punctuation stripped. Common English plurals are singularised using the rules in Appendix A. Singularisation is a best-effort operation — implementations are not required to handle all irregular plurals, but must handle the common patterns (trailing -s, -es, -ies, and the irregulars listed in Appendix A).
        </P>
      </Section>

      <Section id="status-codes" title="5. Status codes">
        <P>Every parsed ingredient line carries a <C>status</C> field. Implementations must set this field; they must not omit it or use values outside this set.</P>
        <table style={tableStyle}>
          <thead><tr><Th>Status</Th><Th>Meaning</Th></tr></thead>
          <tbody>
            <Tr>
              <Td><C>ok</C></Td>
              <Td>Line parsed fully. Quantity, unit, and ingredient name all resolved.</Td>
            </Tr>
            <Tr>
              <Td><C>unresolved</C></Td>
              <Td>Ingredient name not found in the implementation's ingredient database. Quantity and unit may still be valid. The raw text is preserved.</Td>
            </Tr>
            <Tr>
              <Td><C>to_taste</C></Td>
              <Td>No quantity. Line begins with "to taste" or is a bare ingredient name with no quantity or unit. is_to_taste is true.</Td>
            </Tr>
            <Tr>
              <Td><C>unquantified</C></Td>
              <Td>Quantity present but could not be converted to a number (e.g. "a few", "some"). Raw quantity text is preserved in a separate field.</Td>
            </Tr>
            <Tr>
              <Td><C>unparseable</C></Td>
              <Td>Line could not be matched to any pattern. Raw text is preserved verbatim. This status must never cause an exception.</Td>
            </Tr>
          </tbody>
        </table>
        <P>
          Implementations must not throw or return an error for any UTF-8 ingredient line. Unparseable lines degrade gracefully to <C>status: "unparseable"</C>.
        </P>
      </Section>

      <Section id="time-format" title="6. Time format">
        <P>
          The <C>@prep</C> and <C>@cook</C> directives accept a flexible time string. The canonical output is total minutes as an integer.
        </P>
        <table style={tableStyle}>
          <thead><tr><Th>Shorthand</Th><Th>Accepted aliases</Th><Th>Multiplier (minutes)</Th></tr></thead>
          <tbody>
            <Tr><Td><C>fn</C></Td><Td>fortnight, fortnights</Td><Td>20160</Td></Tr>
            <Tr><Td><C>w</C></Td><Td>wk, week, weeks</Td><Td>10080</Td></Tr>
            <Tr><Td><C>d</C></Td><Td>day, days</Td><Td>1440</Td></Tr>
            <Tr><Td><C>h</C></Td><Td>hr, hour, hours</Td><Td>60</Td></Tr>
            <Tr><Td><C>m</C></Td><Td>min, minute, minutes</Td><Td>1</Td></Tr>
          </tbody>
        </table>
        <P>
          Components may be combined: <C>1h30m</C>, <C>2d12h</C>. A bare integer with no unit suffix is interpreted as minutes. Parsing is case-insensitive. If the value cannot be parsed, the field is null and the raw string is preserved in a separate <C>*_time_raw</C> field.
        </P>
      </Section>

      <Section id="output-schema" title="7. Output schema">
        <P>
          All conforming implementations must produce output matching this schema. Field names use snake_case. The schema is JSON-serialisable.
        </P>
        <pre style={{ ...preStyle, fontSize: 12 }}>{OUTPUT_SCHEMA}</pre>

        <H3>7.1 IngredientLine schema</H3>
        <pre style={{ ...preStyle, fontSize: 12 }}>{INGREDIENT_SCHEMA}</pre>

        <H3>7.2 Quantity schema</H3>
        <pre style={{ ...preStyle, fontSize: 12 }}>{QUANTITY_SCHEMA}</pre>
      </Section>

      <Section id="conformance" title="8. Conformance">
        <P>
          A conforming FRL 1.0 implementation must:
        </P>
        <ol style={{ paddingLeft: 24, display: "flex", flexDirection: "column", gap: 8, color: "var(--text-muted)", fontSize: 14 }}>
          <li>Accept any valid UTF-8 string as input without throwing.</li>
          <li>Return output matching the schema defined in §7 for all inputs.</li>
          <li>Set the <C>frl_version</C> field to <C>"1.0"</C>.</li>
          <li>Pass all tests in the FRL 1.0 conformance test suite.</li>
          <li>Ignore unknown directives without error.</li>
          <li>Never silently discard ingredient lines — every line must appear in output with a status code.</li>
          <li>Treat "to taste" and bare names identically: both produce <C>status: "to_taste"</C>, <C>is_to_taste: true</C>.</li>
          <li>Treat optional markers as metadata, not as a reason to exclude an ingredient from allergen or cost output.</li>
        </ol>
        <P>
          The conformance test suite will be published at <strong>spec.forked.app/conformance</strong>. Until that URL is live, the reference implementation is the parser at <strong>github.com/forked-app/frl-parser</strong>.
        </P>
      </Section>

      <Section id="appendix-a" title="Appendix A — Singularisation rules">
        <P>
          Applied in order. First match wins.
        </P>
        <table style={tableStyle}>
          <thead><tr><Th>Input</Th><Th>Output</Th><Th>Type</Th></tr></thead>
          <tbody>
            {SINGULARISE.map(([input, output, type]) => (
              <Tr key={input}><Td><C>{input}</C></Td><Td><C>{output}</C></Td><Td style={{ color: "var(--text-muted)", fontSize: 12 }}>{type}</Td></Tr>
            ))}
          </tbody>
        </table>
        <P>
          After irregular matching: strip trailing <C>-ies</C> → <C>-y</C>, strip trailing <C>-ves</C> → <C>-f</C>, strip trailing <C>-es</C> (where stem ends in s/x/z/ch/sh), strip trailing <C>-s</C>. If no rule matches, return the word unchanged.
        </P>
      </Section>

      <Section id="changelog" title="Changelog">
        <table style={tableStyle}>
          <thead><tr><Th>Version</Th><Th>Date</Th><Th>Changes</Th></tr></thead>
          <tbody>
            <Tr><Td><C>1.0</C></Td><Td>2026-05-29</Td><Td>Initial specification.</Td></Tr>
          </tbody>
        </table>
      </Section>
    </div>
  );
}

// ── Components ──────────────────────────────────────────────────────────────

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} style={{ marginBottom: 56 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
        <a href={`#${id}`} style={{ color: "var(--text)", textDecoration: "none" }}>{title}</a>
      </h2>
      {children}
    </section>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", margin: "28px 0 12px" }}>{children}</h3>;
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "var(--text-muted)", fontSize: 14, margin: "0 0 14px", lineHeight: 1.75 }}>{children}</p>;
}

function C({ children }: { children: React.ReactNode }) {
  return <code style={codeStyle}>{children}</code>;
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ textAlign: "left", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", padding: "8px 12px", borderBottom: "1px solid var(--border)" }}>{children}</th>;
}

function Tr({ children }: { children: React.ReactNode }) {
  return <tr style={{ borderBottom: "1px solid var(--border-muted)" }}>{children}</tr>;
}

function Td({ children, style: s }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <td style={{ padding: "9px 12px", fontSize: 13, color: "var(--text)", verticalAlign: "top", ...s }}>{children}</td>;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const codeStyle: React.CSSProperties = {
  background: "var(--bg-tertiary)",
  border: "1px solid var(--border)",
  borderRadius: 3,
  padding: "1px 5px",
  fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace",
  fontSize: 12,
};

const preStyle: React.CSSProperties = {
  background: "var(--bg-secondary)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  padding: "14px 18px",
  fontFamily: "ui-monospace, SFMono-Regular, SF Mono, Menlo, monospace",
  fontSize: 13,
  lineHeight: 1.65,
  overflowX: "auto",
  whiteSpace: "pre",
  color: "var(--text)",
  margin: "0 0 14px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  marginBottom: 20,
  border: "1px solid var(--border)",
  borderRadius: 6,
  overflow: "hidden",
};

// ── Data ─────────────────────────────────────────────────────────────────────

const TOC = [
  { id: "overview",          label: "1. Overview" },
  { id: "detection",         label: "2. Document detection" },
  { id: "directives",        label: "3. Directives" },
  { id: "ingredient-lines",  label: "4. Ingredient line grammar" },
  { id: "status-codes",      label: "5. Status codes" },
  { id: "time-format",       label: "6. Time format" },
  { id: "output-schema",     label: "7. Output schema" },
  { id: "conformance",       label: "8. Conformance" },
  { id: "appendix-a",        label: "Appendix A — Singularisation rules" },
  { id: "changelog",         label: "Changelog" },
];

const PATTERNS = [
  {
    n: 1,
    name: "Package notation",
    form: "{count} {size}{size-unit} {container-type} {ingredient-name}",
    example: "2 250g packages halloumi",
    notes: "Matched first because it is the most specific. count is a number (§4.2). size is a number immediately followed by a unit with no space. container-type must be a known container unit. Output includes a package object with count, size, size_unit, container_type.",
  },
  {
    n: 2,
    name: "To taste",
    form: "to taste {ingredient-name}",
    example: "to taste fleur de sel",
    notes: 'Literal "to taste" prefix (case-insensitive). quantity is null, is_to_taste is true, status is "to_taste".',
  },
  {
    n: 3,
    name: "Special unit",
    form: "{special-unit} {ingredient-name}",
    example: "pinch fine sea salt",
    notes: "special-unit is one of: pinch, dash, splash, handful (and their plurals). quantity.value is 1, unit is the canonical special unit, status is ok if ingredient resolves, unresolved otherwise.",
  },
  {
    n: 4,
    name: "Measured quantity",
    form: "{quantity} {unit} {ingredient-name}",
    example: "450 g pork belly",
    notes: "quantity is a number or range (§4.2). unit is a known measured or container unit (Appendix B). Ingredient name is everything after the unit.",
  },
  {
    n: 5,
    name: "Implicit whole unit",
    form: "{quantity} {ingredient-name}",
    example: "3 eggs",
    notes: 'No recognised unit follows the quantity. unit is set to "whole", unit_tier is "container".',
  },
  {
    n: 6,
    name: "Bare name",
    form: "{ingredient-name}",
    example: "fleur de sel",
    notes: 'No quantity, no unit. Treated as to taste. status is "to_taste", is_to_taste is true.',
  },
];

const OUTPUT_SCHEMA = `{
  "frl_version": "1.0",             // always "1.0" for this spec
  "mode": "frl" | "freetext",
  "title": string | null,
  "description": string | null,
  "yield": string | null,            // verbatim, not parsed
  "prep_time": number | null,        // total minutes
  "prep_time_raw": string | null,    // original string, present if parse failed
  "cook_time": number | null,        // total minutes
  "cook_time_raw": string | null,
  "tags": string[],                  // lowercased, trimmed; [] if absent
  "ingredients": IngredientLine[],   // [] if absent
  "materials": string[],             // [] if absent
  "procedure": string | null,
  "notes": string | null,
  "raw": string                      // original input, always present
}`;

const INGREDIENT_SCHEMA = `{
  "raw": string,                     // original line text, always present
  "status": "ok"
          | "unresolved"
          | "to_taste"
          | "unquantified"
          | "unparseable",
  "quantity": Quantity | null,
  "unit": string | null,             // canonical unit (e.g. "g", "tbsp", "whole")
  "unit_tier": "measured"
             | "container"
             | "special"
             | null,
  "ingredient_name": string,         // normalised: lowercase, singular, punctuation stripped
  "is_to_taste": boolean,
  "is_optional": boolean,
  "note": string | null,             // content of parenthetical or comma suffix
  "package": {
    "count": number,
    "size": number,
    "size_unit": string,
    "container_type": string
  } | null
}`;

const QUANTITY_SCHEMA = `{
  "type": "exact" | "range",
  "value": number | null,            // present when type is "exact"
  "min": number | null,              // present when type is "range"
  "max": number | null,              // present when type is "range"
  "raw": string | null               // present when status is "unquantified"
}`;

const SINGULARISE: [string, string, string][] = [
  ["leaves",   "leaf",   "irregular"],
  ["knives",   "knife",  "irregular"],
  ["halves",   "half",   "irregular"],
  ["loaves",   "loaf",   "irregular"],
  ["shelves",  "shelf",  "irregular"],
  ["geese",    "goose",  "irregular"],
  ["teeth",    "tooth",  "irregular"],
  ["feet",     "foot",   "irregular"],
  ["mice",     "mouse",  "irregular"],
  ["children", "child",  "irregular"],
  ["oxen",     "ox",     "irregular"],
  ["-ies",     "-y",     "pattern (berries → berry)"],
  ["-ves",     "-f",     "pattern (loaves handled above; calves → calf)"],
  ["-ses",     "-s",     "pattern (grasses → grass)"],
  ["-xes",     "-x",     "pattern"],
  ["-zes",     "-z",     "pattern"],
  ["-ches",    "-ch",    "pattern (peaches → peach)"],
  ["-shes",    "-sh",    "pattern (radishes → radish)"],
  ["-s",       "",       "default (eggs → egg)"],
];
