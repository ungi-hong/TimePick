import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const QuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).default(7),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    days: url.searchParams.get("days") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query" }, { status: 400 });
  }

  const threshold = new Date();
  threshold.setDate(threshold.getDate() - parsed.data.days);

  const proposals = await prisma.proposal.findMany({
    where: {
      userId: session.user.id,
      status: "OPEN",
      updatedAt: { lt: threshold },
    },
    include: { slots: { orderBy: { startAt: "asc" } } },
    orderBy: { updatedAt: "asc" },
  });

  return NextResponse.json({
    thresholdDays: parsed.data.days,
    proposals: proposals.map((p) => ({
      id: p.id,
      label: p.label,
      updatedAt: p.updatedAt.toISOString(),
      slots: p.slots.map((s) => ({
        id: s.id,
        start: s.startAt.toISOString(),
        end: s.endAt.toISOString(),
      })),
    })),
  });
}
