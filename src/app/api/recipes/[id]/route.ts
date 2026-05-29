import { auth } from "@/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const recipe = await db.recipe.findUnique({
    where: { id },
    select: { createdBy: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (recipe.createdBy !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.recipe.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
