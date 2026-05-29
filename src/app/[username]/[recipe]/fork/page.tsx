import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ForkClient } from "./ForkClient";

export default async function ForkPage({
  params,
}: {
  params: Promise<{ username: string; recipe: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { username, recipe: recipeSlug } = await params;

  const source = await db.recipe.findFirst({
    where: { slug: recipeSlug, workspace: { slug: username } },
    include: {
      versions: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { id: true, commitMessage: true, title: true },
      },
    },
  });

  if (!source) notFound();

  const latest = source.versions[0];
  const tags: string[] = (() => { try { return JSON.parse(source.tags ?? "[]") as string[]; } catch { return []; } })();

  return (
    <ForkClient
      sourceRecipeId={source.id}
      sourceVersionId={latest?.id ?? ""}
      sourceUsername={username}
      sourceSlug={recipeSlug}
      sourceTitle={latest?.title ?? source.title}
      sourceDescription={source.description ?? ""}
      sourceTags={tags}
      sourceCommitMessage={latest?.commitMessage ?? "Initial commit"}
    />
  );
}
