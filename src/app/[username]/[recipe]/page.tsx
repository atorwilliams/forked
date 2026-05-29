import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VersionHistory } from "@/components/VersionHistory";
import { Comments } from "@/components/Comments";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { parseIngredientLine } from "@/lib/ingredient-parser";
import { parseTimeMinutes, formatMinutes } from "@/lib/time-parser";

export async function generateMetadata(
  { params }: { params: Promise<{ username: string; recipe: string }> }
): Promise<Metadata> {
  const { username, recipe: recipeSlug } = await params;
  const workspace = await db.workspace.findUnique({ where: { slug: username }, select: { id: true } });
  if (!workspace) return { title: `${username}/${recipeSlug}` };
  const recipe = await db.recipe.findUnique({
    where: { workspaceId_slug: { workspaceId: workspace.id, slug: recipeSlug } },
    select: { title: true },
  });
  const title = recipe?.title || recipeSlug;
  return { title: `${username}/${title}` };
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)} weeks ago`;
}

type RecipeData = {
  id: string;
  title: string;
  yield: string | null;
  prepTime: string | null;
  cookTime: string | null;
  tags: string[];
  ingredients: string[];
  materials: string[];
  procedure: string;
  notes?: string;
  commitMessage: string;
  author: string;
  isProduction: boolean;
  createdAt: string;
  forkCount: number;
  snapCount: number;
  versionCount: number;
  history: { id: string; commitMessage: string; author: string; createdAt: string; isProduction: boolean; isCurrent: boolean; isFork: boolean }[];
  forks: { username: string; recipeSlug: string; commitMessage: string; updatedAt: string; isProduction: boolean }[];
  snaps: { username: string; recipeSlug: string; commitMessage: string; snappedAt: string; displayNote: string | null }[];
};

export default async function RecipePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string; recipe: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ username, recipe }, { tab }, session] = await Promise.all([params, searchParams, auth()]);
  const activeTab = (tab === "history" || tab === "forks" || tab === "snaps") ? tab : "recipe";
  const currentUsername = session?.user?.username ?? null;

  const dbRecipe = await db.recipe.findFirst({
    where: { slug: recipe, workspace: { slug: username } },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { username: true, name: true } },
          ingredients: { orderBy: { order: "asc" }, select: { rawText: true } },
        },
      },
      creator: { select: { username: true, name: true } },
      forks: {
        include: {
          workspace: { select: { slug: true } },
          versions: { orderBy: { createdAt: "desc" }, take: 1, select: { commitMessage: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      snapOrigins: {
        include: {
          newRecipe: {
            include: {
              workspace: { select: { slug: true } },
              versions: { orderBy: { createdAt: "desc" }, take: 1, select: { commitMessage: true } },
            },
          },
          snapCreator: { select: { username: true } },
        },
        orderBy: { snappedAt: "desc" },
      },
    },
  });

  if (!dbRecipe) notFound();

  const latest = dbRecipe.versions[0];
  const tags: string[] = JSON.parse(dbRecipe.tags ?? "[]");
  const v: RecipeData = {
    id: latest?.id ?? dbRecipe.id,
    title: dbRecipe.title,
    yield: latest?.yield ?? null,
    prepTime: latest?.prepTime ?? null,
    cookTime: latest?.cookTime ?? null,
    tags,
    ingredients: latest?.ingredients.map((i) => i.rawText) ?? [],
    materials: latest?.materials ? latest.materials.split("\n").filter(Boolean) : [],
    procedure: latest?.procedure ?? "",
    notes: latest?.notes ?? undefined,
    commitMessage: latest?.commitMessage ?? "Initial commit",
    author: dbRecipe.creator.username ?? dbRecipe.creator.name ?? username,
    isProduction: dbRecipe.isProduction,
    createdAt: latest ? relativeTime(latest.createdAt) : "just now",
    forkCount: dbRecipe.forkCount,
    snapCount: dbRecipe.snapCount,
    versionCount: dbRecipe.versions.length,
    history: dbRecipe.versions.map((ver, i) => ({
      id: ver.id,
      commitMessage: ver.commitMessage ?? "No message",
      author: ver.author.username ?? ver.author.name ?? "unknown",
      createdAt: relativeTime(ver.createdAt),
      isProduction: ver.isProduction,
      isCurrent: i === 0,
      isFork: false,
    })),
    forks: dbRecipe.forks.map((f) => ({
      username: f.workspace.slug,
      recipeSlug: f.slug,
      commitMessage: f.versions[0]?.commitMessage ?? "Initial commit",
      updatedAt: relativeTime(f.updatedAt),
      isProduction: f.isProduction,
    })),
    snaps: dbRecipe.snapOrigins.map((s) => ({
      username: s.newRecipe.workspace.slug,
      recipeSlug: s.newRecipe.slug,
      commitMessage: s.newRecipe.versions[0]?.commitMessage ?? "Initial commit",
      snappedAt: relativeTime(s.snappedAt),
      displayNote: s.displayNote,
    })),
  };

  return <RecipeView username={username} recipe={recipe} v={v} activeTab={activeTab} recipeId={dbRecipe.id} currentUsername={currentUsername} />;
}

function RecipeView({ username, recipe, v, activeTab, recipeId, currentUsername }: { username: string; recipe: string; v: RecipeData; activeTab: string; recipeId: string; currentUsername: string | null }) {
  return (
    <div style={{ maxWidth: 1060, margin: "0 auto", padding: "28px 24px" }}>

      {/* ── Row 1: title + action buttons ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 16 }}>
            <Link href={`/${username}`} style={{ color: "var(--text-link)", fontWeight: 500 }}>{username}</Link>
            <span style={{ color: "var(--border)", fontWeight: 300, fontSize: 20 }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 600 }}>{recipe}</span>
          </nav>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <GhActionBtn href={`/${username}/${recipe}/fork`} label="Fork" count={v.forkCount} color="var(--fork-blue)" />
          <GhActionBtn href={`/${username}/${recipe}/snap`} label="Snap" count={v.snapCount} color="var(--snap-purple)" />
        </div>
      </div>

      {/* ── Row 2: meta bar ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 0,
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 6,
          fontSize: 13,
          marginBottom: 0,
          overflow: "hidden",
        }}
      >
        <MetaCell label={`${v.versionCount}`} sub={v.versionCount === 1 ? "version" : "versions"} />
        <MetaSep />
        <MetaCell label={`${v.forkCount}`} sub={v.forkCount === 1 ? "fork" : "forks"} />
        <MetaSep />
        <MetaCell label={`${v.snapCount}`} sub={v.snapCount === 1 ? "snap" : "snaps"} />
        {v.tags.length > 0 && (
          <>
            <MetaSep />
            <div style={{ display: "flex", gap: 6, padding: "8px 14px", flexWrap: "wrap" }}>
              {v.tags.map((tag) => (
                <Link key={tag} href={`/explore?tag=${encodeURIComponent(tag)}`} className="tag-pill">
                  {tag}
                </Link>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Row 3: latest commit strip ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          borderTop: "none",
          borderRadius: "0 0 6px 6px",
          padding: "8px 16px",
          fontSize: 13,
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <span style={{ color: "var(--text-muted)", minWidth: 0 }}>
          <strong style={{ color: "var(--text)" }}>{v.author}</strong>
          {" committed "}
          <em style={{ color: "var(--text)", fontStyle: "normal" }}>{v.commitMessage}</em>
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <span style={{ color: "var(--text-muted)" }}>{v.createdAt}</span>
          <code style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontFamily: "monospace" }}>
            {v.id.slice(0, 7)}
          </code>
        </div>
      </div>

      {/* ── Recipe content ── */}
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)", padding: "0 16px" }}>
          <ContentTab label="Recipe" href={`/${username}/${recipe}`} active={activeTab === "recipe"} />
          <ContentTab label="History" href={`/${username}/${recipe}?tab=history`} active={activeTab === "history"} />
          <ContentTab label={`Forks (${v.forks.length})`} href={`/${username}/${recipe}?tab=forks`} active={activeTab === "forks"} />
          <ContentTab label={`Snaps (${v.snaps.length})`} href={`/${username}/${recipe}?tab=snaps`} active={activeTab === "snaps"} />
          {currentUsername === username && (
            <div style={{ marginLeft: "auto" }}>
              <Link href={`/${username}/${recipe}/edit`} style={{ fontSize: 12, fontWeight: 600, color: "#fff", textDecoration: "none", background: "var(--fork-blue)", padding: "5px 14px", borderRadius: 6, display: "inline-block" }}>
                Edit recipe
              </Link>
            </div>
          )}
        </div>

        <div style={{ padding: "24px 28px" }}>
          {activeTab === "recipe" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {(v.yield || v.prepTime || v.cookTime) && (() => {
                const totalMins = parseTimeMinutes(v.prepTime) + parseTimeMinutes(v.cookTime);
                const total = formatMinutes(totalMins);
                return (
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {v.yield && <RecipeStat label="Yield" value={v.yield} />}
                      {v.prepTime && <RecipeStat label="Prep" value={v.prepTime} />}
                      {v.cookTime && v.cookTime !== "0m" && <RecipeStat label="Cook" value={v.cookTime} />}
                    </div>
                    {total && <RecipeStat label="Total" value={total} />}
                  </div>
                );
              })()}
              <section>
                <SectionLabel>Ingredients</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {v.ingredients.map((ing, i) => (
                    <IngredientRow key={i} raw={ing} last={i === v.ingredients.length - 1} />
                  ))}
                </div>
              </section>
              <Divider />
              <section>
                <SectionLabel>Materials</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {v.materials.map((mat, i) => (
                    <div key={i} style={{ padding: "7px 0", fontSize: 14, color: "var(--text)", borderBottom: i < v.materials.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                      {mat}
                    </div>
                  ))}
                </div>
              </section>
              <Divider />
              <section>
                <SectionLabel>Procedure</SectionLabel>
                <div style={{ color: "var(--text)", fontSize: 14, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{v.procedure}</div>
              </section>
              {v.notes && (
                <>
                  <Divider />
                  <section>
                    <SectionLabel color="var(--dev-amber)">Notes</SectionLabel>
                    <p style={{ background: "rgba(210,153,34,0.06)", border: "1px solid rgba(210,153,34,0.25)", borderRadius: 6, padding: "12px 16px", color: "var(--text)", fontSize: 13, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap" }}>
                      {v.notes}
                    </p>
                  </section>
                </>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <VersionHistory versions={v.history} username={username} recipeSlug={recipe} />
          )}

          {activeTab === "forks" && (
            v.forks.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>No forks yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", margin: "-24px -28px" }}>
                {v.forks.map((fork, i) => (
                  <div key={fork.username + fork.recipeSlug} style={{ padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: i < v.forks.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                    <div>
                      <Link href={`/${fork.username}/${fork.recipeSlug}`} style={{ color: "var(--text-link)", fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
                        {fork.username} / {fork.recipeSlug}
                      </Link>
                      <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "3px 0 0" }}>{fork.commitMessage} · {fork.updatedAt}</p>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500, background: "rgba(31,111,235,0.1)", color: "var(--fork-blue)", border: "1px solid rgba(31,111,235,0.3)", flexShrink: 0 }}>fork</span>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "snaps" && (
            v.snaps.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: 14, margin: 0 }}>Nothing has snapped from this recipe yet.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", margin: "-24px -28px" }}>
                {v.snaps.map((snap, i) => (
                  <div key={snap.username + snap.recipeSlug} style={{ padding: "14px 28px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: i < v.snaps.length - 1 ? "1px solid var(--border-muted)" : "none" }}>
                    <div>
                      <Link href={`/${snap.username}/${snap.recipeSlug}`} style={{ color: "var(--text-link)", fontWeight: 500, fontSize: 14, textDecoration: "none" }}>
                        {snap.username} / {snap.recipeSlug}
                      </Link>
                      {snap.displayNote && (
                        <p style={{ color: "var(--text-muted)", fontSize: 13, margin: "4px 0 0", fontStyle: "italic" }}>{snap.displayNote}</p>
                      )}
                      <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "3px 0 0" }}>{snap.commitMessage} · {snap.snappedAt}</p>
                    </div>
                    <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500, background: "rgba(163,113,247,0.1)", color: "var(--snap-purple)", border: "1px solid rgba(163,113,247,0.3)", flexShrink: 0 }}>snap</span>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>

      {/* Comments */}
      <div style={{ marginTop: 32, borderTop: "1px solid var(--border)", paddingTop: 32 }}>
        <Comments recipeId={recipeId} currentUsername={currentUsername} />
      </div>
    </div>
  );
}

function IngredientRow({ raw, last }: { raw: string; last: boolean }) {
  const p = parseIngredientLine(raw);
  let qty = "";
  let unit = "";
  let name = raw.trim();
  let note: string | undefined;

  if (p.status === "ok" || p.isToTaste) {
    name = p.ingredientName;
    note = p.note;
    if (p.isToTaste && p.quantity == null) {
      qty = "to taste";
    } else {
      qty = p.quantity != null ? (Number.isInteger(p.quantity) ? String(p.quantity) : parseFloat(p.quantity.toPrecision(4)).toString()) : "";
      unit = p.unitDef?.display ?? p.unit ?? "";
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "80px 56px 1fr",
        gap: "0 8px",
        alignItems: "baseline",
        padding: "8px 0",
        borderBottom: last ? "none" : "1px solid var(--border-muted)",
        fontSize: 14,
      }}
    >
      <span style={{ color: "var(--text-muted)", fontFamily: "ui-monospace, monospace", fontSize: 13, textAlign: "right" }}>
        {qty}
      </span>
      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{unit}</span>
      <span style={{ color: "var(--text)" }}>
        {name}
        {note && <span style={{ color: "var(--text-muted)", fontSize: 12, fontStyle: "italic", marginLeft: 6 }}>({note})</span>}
      </span>
    </div>
  );
}

function GhActionBtn({ href, label, count, color }: { href: string; label: string; count?: number; color?: string }) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "stretch", borderRadius: 6, border: "1px solid var(--border)", overflow: "hidden", fontSize: 12, fontWeight: 500 }}>
        <span style={{ padding: "5px 12px", background: "var(--bg-secondary)", color: color ?? "var(--text-muted)", display: "flex", alignItems: "center" }}>
          {label}
        </span>
        {count !== undefined && (
          <>
            <span style={{ width: 1, background: "var(--border)" }} />
            <span style={{ padding: "5px 10px", background: "var(--bg-tertiary)", color: "var(--text-muted)", display: "flex", alignItems: "center" }}>
              {count}
            </span>
          </>
        )}
      </div>
    </Link>
  );
}

function MetaCell({ label, sub }: { label: string; sub: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "8px 16px", gap: 1 }}>
      <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{label}</span>
      <span style={{ color: "var(--text-muted)", fontSize: 11 }}>{sub}</span>
    </div>
  );
}

function MetaSep() {
  return <span style={{ width: 1, background: "var(--border)", alignSelf: "stretch" }} />;
}

function RecipeStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "stretch", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", fontSize: 13 }}>
      <span style={{ padding: "4px 10px", background: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "flex", alignItems: "center" }}>
        {label}
      </span>
      <span style={{ width: 1, background: "var(--border)" }} />
      <span style={{ padding: "4px 12px", background: "var(--bg)", color: "var(--text)", fontWeight: 500, display: "flex", alignItems: "center" }}>
        {value}
      </span>
    </div>
  );
}

function SectionLabel({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: color ?? "var(--text-muted)", marginBottom: 12, marginTop: 0 }}>
      {children}
    </h3>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid var(--border-muted)" }} />;
}

function ContentTab({ label, href, active }: { label: string; href: string; active?: boolean }) {
  return (
    <Link href={href} style={{ textDecoration: "none", display: "inline-block", borderBottom: active ? "2px solid var(--text)" : "2px solid transparent", padding: "12px 16px", color: active ? "var(--text)" : "var(--text-muted)", fontSize: 13, fontWeight: active ? 600 : 400, marginBottom: -1 }}>
      {label}
    </Link>
  );
}
