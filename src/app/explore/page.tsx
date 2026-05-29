import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { RecipeCard } from "@/components/RecipeCard";
import { SortSelect } from "./SortSelect";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Explore" };

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

type SortKey = "updated" | "newest" | "forked" | "snapped";

const DB_ORDER: Record<SortKey, object> = {
  updated: { updatedAt: "desc" },
  newest:  { createdAt: "desc" },
  forked:  { forkCount:  "desc" },
  snapped: { snapCount:  "desc" },
};

function sortRecipes<T extends { forkCount: number; snapCount: number }>(
  arr: T[], sort: SortKey
): T[] {
  if (sort === "forked")  return [...arr].sort((a, b) => b.forkCount  - a.forkCount);
  if (sort === "snapped") return [...arr].sort((a, b) => b.snapCount  - a.snapCount);
  return arr;
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; sort?: string }>;
}) {
  const session = await auth();
  const currentUsername = session?.user?.username ?? null;

  const { tag: activeTag, sort } = await searchParams;
  const activeSort: SortKey = (["updated", "newest", "forked", "snapped"].includes(sort ?? "")) ? sort as SortKey : "updated";

  const dbRecipes = await db.recipe.findMany({
    include: { creator: { select: { username: true } }, workspace: { select: { slug: true } } },
    orderBy: DB_ORDER[activeSort],
  });

  const cards = dbRecipes.map((r) => ({
    id: r.id,
    username: r.workspace.slug,
    recipeSlug: r.slug,
    title: r.title,
    description: r.description ?? "",
    tags: (() => { try { return JSON.parse(r.tags ?? "[]") as string[]; } catch { return [] as string[]; } })(),
    isProduction: r.isProduction,
    forkCount: r.forkCount,
    snapCount: r.snapCount,
    updatedAt: relativeTime(r.updatedAt),
    snapOf: undefined as string | undefined,
    isOwner: r.workspace.slug === currentUsername,
  }));

  const allRecipes = sortRecipes(cards, activeSort);

  const filtered = activeTag
    ? allRecipes.filter((r) => r.tags.includes(activeTag))
    : allRecipes;

  const allTags = Array.from(new Set(allRecipes.flatMap((r) => r.tags))).sort();

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 4 }}>Explore</h1>
        <p style={{ color: "var(--text-muted)", margin: 0 }}>
          Community recipes. Fork anything, snap what inspires you.
        </p>
      </div>

      {/* Tag filter + sort bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap", alignItems: "center" }}>
        <Suspense><SortSelect /></Suspense>
        <div style={{ width: 1, background: "var(--border)", alignSelf: "stretch", margin: "0 4px" }} />
        <Link
          href="/explore"
          style={{
            background: !activeTag ? "var(--bg-tertiary)" : "transparent",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "4px 14px",
            color: !activeTag ? "var(--text)" : "var(--text-muted)",
            fontSize: 13,
            fontWeight: !activeTag ? 600 : 400,
            textDecoration: "none",
          }}
        >
          All
        </Link>
        {allTags.map((tag) => (
          <Link
            key={tag}
            href={activeTag === tag ? "/explore" : `/explore?tag=${encodeURIComponent(tag)}`}
            className="tag-pill"
            style={{
              padding: "4px 14px",
              fontSize: 13,
              fontWeight: activeTag === tag ? 600 : 400,
              ...(activeTag === tag
                ? { background: "rgba(88,166,255,0.18)", borderColor: "rgba(88,166,255,0.5)", color: "rgba(88,166,255,1)" }
                : {}),
            }}
          >
            {tag}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>
          No recipes tagged <strong>{activeTag}</strong> yet.
        </p>
      ) : (
        <div className="explore-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filtered.map((recipe) => (
            <RecipeCard key={recipe.id} {...recipe} />
          ))}
        </div>
      )}
    </div>
  );
}
