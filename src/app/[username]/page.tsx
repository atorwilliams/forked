import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { RecipeCard } from "@/components/RecipeCard";
import { COUNTRY_MAP } from "@/lib/countries";

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params;
  const user = await db.user.findUnique({ where: { username }, select: { name: true } });
  if (!user) return { title: username };
  return { title: user.name ? `${username} (${user.name})` : username };
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs === 1 ? "1 hour ago" : `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks === 1) return "1 week ago";
  if (weeks < 5) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  if (months === 1) return "1 month ago";
  return `${months} months ago`;
}

export default async function UserProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [{ username }, { tab }] = await Promise.all([params, searchParams]);
  const activeTab = tab === "snaps" ? "snaps" : tab === "forks" ? "forks" : "recipes";
  const session = await auth();
  const isOwner = session?.user?.username === username;

  const user = await db.user.findUnique({
    where: { username },
    select: { id: true, name: true, username: true, bio: true, image: true, accountType: true, createdAt: true, country: true, city: true, favouriteFood: true },
  });

  if (!user) notFound();

  const [recipes, snapsMade, forksMade] = await Promise.all([
    db.recipe.findMany({
      where: { workspace: { slug: username } },
      orderBy: { updatedAt: "desc" },
      select: { id: true, slug: true, title: true, description: true, tags: true, isProduction: true, forkCount: true, snapCount: true, updatedAt: true, createdBy: true },
    }),
    db.snapPointer.findMany({
      where: { snapCreatorId: user.id },
      orderBy: { snappedAt: "desc" },
      include: {
        newRecipe: {
          include: { workspace: { select: { slug: true } } },
        },
        originalRecipe: {
          include: { workspace: { select: { slug: true } } },
        },
      },
    }),
    db.recipe.findMany({
      where: { createdBy: user.id, forkedFromRecipeId: { not: null } },
      orderBy: { updatedAt: "desc" },
      include: {
        workspace: { select: { slug: true } },
        forkedFromRecipe: { include: { workspace: { select: { slug: true } } } },
      },
    }),
  ]);

  const joinedMonth = user.createdAt.toLocaleString("en-US", { month: "long", year: "numeric" });

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
      <div className="profile-grid" style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 40, alignItems: "start" }}>
        {/* Sidebar */}
        <aside className="profile-sidebar">
          <div
            className="profile-avatar"
            style={{
              width: 100, height: 100, borderRadius: "50%",
              background: user.image ? "transparent" : "var(--bg-tertiary)",
              border: "2px solid var(--border)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 40, marginBottom: 18, overflow: "hidden",
            }}
          >
            {user.image
              ? <img src={user.image} alt={user.name ?? username} width={100} height={100} style={{ borderRadius: "50%" }} />
              : (user.name ?? username)[0].toUpperCase()
            }
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2, letterSpacing: "-0.01em" }}>{user.name ?? username}</h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>@{username}</p>

          {user.bio && (
            <p style={{ color: "var(--text)", fontSize: 13, lineHeight: 1.7, marginBottom: 18, borderLeft: "2px solid var(--border)", paddingLeft: 10 }}>{user.bio}</p>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
            {user.country && COUNTRY_MAP[user.country] && (
              <LocationRow
                flag={`https://flagcdn.com/w20/${user.country.toLowerCase()}.png`}
                flagAlt={COUNTRY_MAP[user.country].name}
                label={user.city ? `${user.city}, ${COUNTRY_MAP[user.country].name}` : COUNTRY_MAP[user.country].name}
              />
            )}
            {!user.country && user.city && (
              <MetaRow icon="◎" label={user.city} />
            )}
            {user.favouriteFood && (
              <MetaRow icon="◈" label={user.favouriteFood} />
            )}
            <MetaRow icon="◷" label={`Joined ${joinedMonth}`} />
            {user.accountType === "enterprise" && (
              <MetaRow icon="◆" label="Enterprise" highlight />
            )}
          </div>

          {isOwner && (
            <Link
              href="/settings"
              style={{
                display: "block",
                textAlign: "center",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "7px 0",
                color: "var(--text-muted)",
                fontSize: 12,
                fontWeight: 500,
                textDecoration: "none",
              }}
            >
              Edit profile
            </Link>
          )}
        </aside>

        {/* Main content */}
        <div>
          <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--border)", marginBottom: 24 }}>
            <TabLink label="Recipes" count={recipes.length} href={`/${username}`} active={activeTab === "recipes"} />
            <TabLink label="Forks" count={forksMade.length} href={`/${username}?tab=forks`} active={activeTab === "forks"} color="var(--fork-blue)" />
            <TabLink label="Snaps" count={snapsMade.length} href={`/${username}?tab=snaps`} active={activeTab === "snaps"} color="var(--snap-purple)" />
          </div>

          {activeTab === "recipes" && (
            recipes.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "24px 0" }}>No recipes yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {recipes.map((r) => (
                  <RecipeCard
                    key={r.id}
                    id={r.id}
                    username={username}
                    recipeSlug={r.slug}
                    title={r.title}
                    description={r.description ?? ""}
                    tags={JSON.parse(r.tags) as string[]}
                    isProduction={r.isProduction}
                    forkCount={r.forkCount}
                    snapCount={r.snapCount}
                    updatedAt={relativeTime(r.updatedAt)}
                    isOwner={isOwner}
                  />
                ))}
              </div>
            )
          )}

          {activeTab === "forks" && (
            forksMade.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "24px 0" }}>No forks yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {forksMade.map((r) => (
                  <div key={r.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
                      <Link href={`/${r.workspace.slug}/${r.slug}`} style={{ color: "var(--text-link)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                        {r.workspace.slug} / {r.title}
                      </Link>
                      <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 20, background: "rgba(88,166,255,0.1)", color: "var(--fork-blue)", border: "1px solid rgba(88,166,255,0.3)", fontWeight: 500, flexShrink: 0 }}>fork</span>
                    </div>
                    {r.forkedFromRecipe && (
                      <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>
                        Forked from{" "}
                        <Link href={`/${r.forkedFromRecipe.workspace.slug}/${r.forkedFromRecipe.slug}`} style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
                          {r.forkedFromRecipe.workspace.slug} / {r.forkedFromRecipe.title}
                        </Link>
                      </p>
                    )}
                    <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "3px 0 0" }}>{relativeTime(r.updatedAt)}</p>
                  </div>
                ))}
              </div>
            )
          )}

          {activeTab === "snaps" && (
            snapsMade.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: 14, padding: "24px 0" }}>No snaps yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {snapsMade.map((s) => (
                  <div key={s.id} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, padding: "14px 18px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Link href={`/${s.newRecipe.workspace.slug}/${s.newRecipe.slug}`} style={{ color: "var(--text-link)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}>
                          {s.newRecipe.workspace.slug} / {s.newRecipe.title}
                        </Link>
                        <span style={{ fontSize: 11, padding: "1px 7px", borderRadius: 20, background: "rgba(163,113,247,0.1)", color: "var(--snap-purple)", border: "1px solid rgba(163,113,247,0.3)", fontWeight: 500 }}>snap</span>
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{relativeTime(s.snappedAt)}</span>
                    </div>
                    <p style={{ color: "var(--text-muted)", fontSize: 12, margin: 0 }}>
                      Snapped from{" "}
                      <Link href={`/${s.originalRecipe.workspace.slug}/${s.originalRecipe.slug}`} style={{ color: "var(--text-muted)", textDecoration: "underline" }}>
                        {s.originalRecipe.workspace.slug} / {s.originalRecipe.title}
                      </Link>
                    </p>
                    {s.displayNote && (
                      <p style={{ color: "var(--text-muted)", fontSize: 12, margin: "4px 0 0", fontStyle: "italic" }}>{s.displayNote}</p>
                    )}
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

function MetaRow({ icon, label, highlight }: { icon: string; label: string; highlight?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <span style={{ color: "var(--text-muted)", fontSize: 10, width: 14, textAlign: "center", flexShrink: 0 }}>{icon}</span>
      <span style={{ color: highlight ? "var(--snap-purple)" : "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

function LocationRow({ flag, flagAlt, label }: { flag: string; flagAlt: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={flag} alt={flagAlt} width={20} height={15} style={{ borderRadius: 2, flexShrink: 0, display: "block" }} />
      <span style={{ color: "var(--text-muted)" }}>{label}</span>
    </div>
  );
}

function TabLink({ label, count, href, active, color }: { label: string; count: number; href: string; active?: boolean; color?: string }) {
  return (
    <Link
      href={href}
      style={{
        background: "transparent",
        borderBottom: active ? `2px solid ${color ?? "var(--text)"}` : "2px solid transparent",
        padding: "8px 16px",
        color: active ? (color ?? "var(--text)") : "var(--text-muted)",
        fontSize: 14, fontWeight: active ? 600 : 400,
        display: "flex", alignItems: "center", gap: 6, marginBottom: -1,
        textDecoration: "none",
      }}
    >
      {label}
      <span style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: 20, padding: "0px 7px", fontSize: 11, color: "var(--text-muted)" }}>
        {count}
      </span>
    </Link>
  );
}
