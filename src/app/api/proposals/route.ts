import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { hasCalendarConnection } from "@/lib/calendar-connection";
import { insertProposalEvent } from "@/lib/google-calendar";

const SaveSchema = z.object({
  label: z.string().trim().min(1).max(100),
  slots: z
    .array(
      z.object({
        start: z.iso.datetime({ offset: true }),
        end: z.iso.datetime({ offset: true }),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const body = await req.json().catch(() => null);
  const parsed = SaveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { label, slots } = parsed.data;
  const connected = await hasCalendarConnection(userId);

  // 1) DB に Proposal + ProposalSlot を作成
  const created = await prisma.proposal.create({
    data: {
      userId,
      label,
      slots: {
        create: slots.map((s) => ({
          startAt: new Date(s.start),
          endAt: new Date(s.end),
        })),
      },
    },
    include: { slots: true },
  });

  // 2) Calendar に各 slot をイベントとして登録 (連携時のみ)
  if (connected) {
    await Promise.all(
      created.slots.map(async (slot) => {
        try {
          const eventId = await insertProposalEvent(userId, {
            label,
            start: slot.startAt,
            end: slot.endAt,
          });
          if (eventId) {
            await prisma.proposalSlot.update({
              where: { id: slot.id },
              data: { googleEventId: eventId },
            });
          }
        } catch (err) {
          console.error("[/api/proposals POST] insertProposalEvent failed", err);
          // ベストエフォート: 1 件失敗しても他は続ける
        }
      }),
    );
  }

  return NextResponse.json({
    id: created.id,
    label: created.label,
    status: created.status,
    slots: created.slots.map((s) => ({
      id: s.id,
      start: s.startAt.toISOString(),
      end: s.endAt.toISOString(),
    })),
  });
}

const ListQuerySchema = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
  status: z.enum(["OPEN", "CONFIRMED", "CANCELLED"]).optional(),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = ListQuerySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { from, to, status } = parsed.data;

  const proposals = await prisma.proposal.findMany({
    where: {
      userId: session.user.id,
      ...(status ? { status } : {}),
      ...(from || to
        ? {
            slots: {
              some: {
                ...(to ? { startAt: { lt: new Date(to) } } : {}),
                ...(from ? { endAt: { gt: new Date(from) } } : {}),
              },
            },
          }
        : {}),
    },
    include: { slots: { orderBy: { startAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    proposals: proposals.map((p) => ({
      id: p.id,
      label: p.label,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      slots: p.slots.map((s) => ({
        id: s.id,
        start: s.startAt.toISOString(),
        end: s.endAt.toISOString(),
      })),
    })),
  });
}
