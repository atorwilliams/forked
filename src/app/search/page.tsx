import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { RecipeCard } from "@/components/RecipeCard";

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}"` : "Search" };
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
  return `${Math.floor(days / 7)}w ago`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const recipes = query
    ? await db.recipe.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } },
            { tags: { contains: query } },
            { workspace: { slug: { contains: query } } },
          ],
        },
        include: { workspace: { select: { slug: true } } },
        orderBy: { updatedAt: "desc" },
        take: 50,
      })
    : [];

  const users = query
    ? await db.user.findMany({
        where: {
          OR: [
            { username: { contains: query } },
            { name: { contains: query } },
          ],
        },
        select: { username: true, name: true, image: true },
        take: 10,
      })
    : [];

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
        {query ? `Results for "${query}"` : "Search"}
      </h1>
      {query && (
        <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 28 }}>
          {recipes.length + users.length === 0 ? "Nothing found." : `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""}, ${users.length} user${users.length !== 1 ? "s" : ""}`}
        </p>
      )}

      {!query && (
        <p style={{ color: "var(--text-muted)", fontSize: 14 }}>Type something in the search bar above.</p>
      )}

      {users.length > 0 && (
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>Users</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {users.filter(u => u.username).map((u) => (
              <Link key={u.username} href={`/${u.username}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 8, textDecoration: "none", background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--bg-tertiary)", border: "1px solid var(--border)", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {u.image ? <img src={u.image} width={36} height={36} alt={u.username!} style={{ borderRadius: "50%" }} /> : (u.name ?? u.username ?? "?")[0]?.toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text)" }}>{u.name ?? u.username}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>@{u.username}</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {recipes.length > 0 && (
        <section>
          <h2 style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: 12 }}>Recipes</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recipes.map((r) => (
              <RecipeCard
                key={r.id}
                id={r.id}
                username={r.workspace.slug}
                recipeSlug={r.slug}
                title={r.title}
                description={r.description ?? ""}
                tags={(() => { try { return JSON.parse(r.tags) as string[]; } catch { return []; } })()}
                isProduction={r.isProduction}
                forkCount={r.forkCount}
                snapCount={r.snapCount}
                updatedAt={relativeTime(r.updatedAt)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
