import { FRLExample } from "@/app/page";

export default function FRLPreviewPage() {
  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "64px 24px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--snap-purple)" }}>
          Forked Recipe Language
        </span>
        <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 7px" }}>
          In development
        </span>
      </div>

      <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 16 }}>Stop scaling by hand.</h1>

      <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 14, maxWidth: 560 }}>
        When your ingredients are structured, the rest is automatic. Scale any recipe to any batch in one click. Know exactly what to order before service. Search your entire library by ingredient.
      </p>
      <p style={{ color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 48, maxWidth: 560 }}>
        Reference other recipes in your workspace with{" "}
        <code style={{ background: "var(--bg-tertiary)", padding: "1px 5px", borderRadius: 4, fontSize: 12, color: "var(--fork-blue)" }}>#recipe-name</code>
        {" "}— when you scale a dish, every sub-recipe scales with it. Cost flows up automatically. No manual recalculation across a chain.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Syntax</h2>
          <ul style={{ color: "var(--text-muted)", lineHeight: 2, fontSize: 14, paddingLeft: 20 }}>
            <li><code style={{ color: "var(--snap-purple)" }}>@directive</code> — structured field (title, yield, time, ingredients, notes)</li>
            <li><code style={{ color: "var(--fork-blue)" }}>#recipe name</code> — reference another recipe in your workspace</li>
            <li>Plain text — freetext, no parsing</li>
          </ul>
        </div>

        <div
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "16px 20px",
            fontSize: 12,
            lineHeight: 1.7,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          <FRLExample />
        </div>
      </div>
    </div>
  );
}
