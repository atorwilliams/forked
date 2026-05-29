import Link from "next/link";
import { auth } from "@/auth";

export default async function LandingPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/new" : "/signup";

  return (
    <div>
      {/* Hero */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "80px 24px 64px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 48,
            fontWeight: 700,
            lineHeight: 1.2,
            marginBottom: 20,
            background: "linear-gradient(135deg, #e6edf3 0%, #7d8590 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Recipes worth iterating on.
        </h1>
        <p
          style={{
            fontSize: 18,
            color: "var(--text-muted)",
            maxWidth: 560,
            margin: "0 auto 36px",
            lineHeight: 1.7,
          }}
        >
          Update your recipes or fork to make new ideas. Nothing gets lost anymore.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href={ctaHref}>
            <button
              style={{
                background: "var(--accent)",
                border: "none",
                borderRadius: 8,
                padding: "12px 28px",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Get started
            </button>
          </Link>
          <Link href="/explore">
            <button
              style={{
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "12px 28px",
                color: "var(--text)",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Explore recipes
            </button>
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section
        style={{
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-secondary)",
          padding: "64px 24px",
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 600, marginBottom: 56 }}>
            How it works.
          </h2>

          {/* Commit node */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "20px 32px",
              textAlign: "center",
              maxWidth: 320,
              width: "100%",
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 8 }}>Start</div>
              <h3 style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>Commit</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                Write it down. Lock in what you made and why. Every version is saved. Nothing gets lost.
              </p>
            </div>

            {/* Vertical line down from commit */}
            <div style={{ width: 1, height: 32, background: "var(--border)" }} />

            {/* Horizontal split bar — spans all three columns */}
            <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center" }}>
              <div style={{ position: "absolute", top: 0, left: "16.5%", right: "16.5%", height: 1, background: "var(--border)" }} />
              <div style={{ position: "absolute", top: 0, left: "16.5%", width: 1, height: 24, background: "var(--border)" }} />
              <div style={{ position: "absolute", top: 0, left: "50%", width: 1, height: 24, background: "var(--border)", transform: "translateX(-50%)" }} />
              <div style={{ position: "absolute", top: 0, right: "16.5%", width: 1, height: 24, background: "var(--border)" }} />
              <div style={{ height: 24 }} />
            </div>

            {/* Three cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, width: "100%" }}>
              {/* Fork card */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--fork-blue)", marginBottom: 8 }}>Fork</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Same dish, new direction</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Pancakes become chocolate pancakes. Still the same tree, but a new branch. The original stays untouched.
                </p>
              </div>

              {/* Update card — center, highlighted as default */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 8 }}>Update</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Same recipe, improved</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Adjusted the salt or tightened the timing? Added a note? Every tweak is a new version and the old ones stay behind.
                </p>
              </div>

              {/* Snap card */}
              <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, padding: "20px 24px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--snap-purple)", marginBottom: 8 }}>Snap</div>
                <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>New dish, descended</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                  Chocolate pancakes become funnel cake. It{"'"}s its own thing now. Snap it and let it live on its own.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "64px 24px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, fontWeight: 600, marginBottom: 16 }}>
          Stop losing recipes to napkins and dead group chats.
        </h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 32 }}>
          Free for the community. Private workspaces for restaurants.
        </p>
        <Link href="/signup">
          <button
            style={{
              background: "var(--accent)",
              border: "none",
              borderRadius: 8,
              padding: "12px 32px",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Create your account
          </button>
        </Link>
      </section>
    </div>
  );
}



function CodeLine({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24, minHeight: "1.7em" }}>{children}</div>;
}

// Keep FRLExample — used by /frl-preview
export function FRLExample() {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <CodeLine>
        <span><span style={{ color: "var(--snap-purple)" }}>@title</span><span style={{ color: "var(--text)" }}> Korean Pulled Pork Sandwich</span></span>
      </CodeLine>
      <CodeLine>
        <span><span style={{ color: "var(--snap-purple)" }}>@yield</span><span style={{ color: "var(--text)" }}> 1 sandwich</span></span>
      </CodeLine>
      <CodeLine>
        <span><span style={{ color: "var(--snap-purple)" }}>@time</span><span style={{ color: "var(--text)" }}> 5m</span></span>
      </CodeLine>

      {/* Spacer */}
      <div style={{ height: "1.7em" }} />

      {/* Ingredients */}
      <CodeLine>
        <span style={{ color: "var(--snap-purple)" }}>@ingredients</span>
        <span style={{ color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>cost</span>
      </CodeLine>
      <CodeLine>
        <span><span style={{ color: "var(--text)" }}>150 g </span><span style={{ color: "var(--fork-blue)" }}>#soy pork belly</span></span>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>$2.00</span>
      </CodeLine>
      <CodeLine>
        <span style={{ color: "var(--text)" }}>1 brioche bun</span>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>$0.80</span>
      </CodeLine>
      <CodeLine>
        <span><span style={{ color: "var(--text)" }}>20 g </span><span style={{ color: "var(--fork-blue)" }}>#pickled-daikon</span></span>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>$0.10</span>
      </CodeLine>
      <CodeLine>
        <span><span style={{ color: "var(--text)" }}>80 g </span><span style={{ color: "var(--fork-blue)" }}>#gochujang-slaw</span></span>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>$0.60</span>
      </CodeLine>
      <CodeLine>
        <span><span style={{ color: "var(--text)" }}>20 g </span><span style={{ color: "var(--fork-blue)" }}>#wasabi-mayo</span></span>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>$0.30</span>
      </CodeLine>
      <CodeLine>
        <span style={{ color: "var(--text)" }}>5 g coriander</span>
        <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>$0.05</span>
      </CodeLine>

      {/* Totals */}
      <div style={{ borderTop: "1px solid var(--border)", marginTop: 10, paddingTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
        <CodeLine>
          <span style={{ color: "var(--text-muted)" }}>total · 1 sandwich</span>
          <span style={{ color: "var(--text)", flexShrink: 0 }}>$3.85</span>
        </CodeLine>
        <CodeLine>
          <span style={{ color: "var(--prod-green)" }}>sale price <span style={{ color: "var(--text-muted)", fontSize: 10 }}>×3 markup</span></span>
          <span style={{ color: "var(--prod-green)", flexShrink: 0, fontWeight: 600 }}>$11.55</span>
        </CodeLine>
      </div>
    </div>
  );
}
