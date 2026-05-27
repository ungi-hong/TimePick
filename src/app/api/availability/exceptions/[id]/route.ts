import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const { id } = await ctx.params;
  const result = await prisma.availabilityException.deleteMany({
    where: {
      id,
      availability: { userId },
    },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
