import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, ctx: Ctx) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;
  const { id } = await ctx.params;

  // W-11: 手動で updatedAt を渡すと Prisma 7 のドライバ挙動が不安定なので、
  // status を OPEN にし直す no-op update で @updatedAt を自動更新させる。
  // OPEN 以外 (CONFIRMED/CANCELLED) は touch 対象にしない。
  const result = await prisma.proposal.updateMany({
    where: { id, userId, status: "OPEN" },
    data: { status: "OPEN" },
  });

  if (result.count === 0) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
