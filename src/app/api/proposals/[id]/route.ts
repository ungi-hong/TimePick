import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  deleteProposalEvent,
  patchProposalEventLabel,
} from "@/lib/google-calendar";

type Ctx = { params: Promise<{ id: string }> };

const PatchSchema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
});

export async function PATCH(req: Request, ctx: Ctx) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;
  const { id } = await ctx.params;

  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const existing = await prisma.proposal.findFirst({
    where: { id, userId },
    include: { slots: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let googleSyncFailed = false;
  if (parsed.data.label && parsed.data.label !== existing.label) {
    const newLabel = parsed.data.label;
    await prisma.proposal.update({
      where: { id },
      data: { label: newLabel },
    });

    // Google Calendar 側のイベントタイトルも更新
    const results = await Promise.all(
      existing.slots
        .filter((s) => s.googleEventId)
        .map(async (s) => {
          try {
            await patchProposalEventLabel(userId, s.googleEventId!, newLabel);
            return true;
          } catch (err) {
            console.error(
              "[/api/proposals/:id PATCH] patchProposalEventLabel failed",
              err,
            );
            return false;
          }
        }),
    );
    googleSyncFailed = results.some((ok) => !ok);
  }

  return NextResponse.json({ ok: true, googleSyncFailed });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;
  const { id } = await ctx.params;

  const existing = await prisma.proposal.findFirst({
    where: { id, userId },
    include: { slots: true, meeting: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  if (existing.meeting) {
    return NextResponse.json(
      { error: "has_meeting", message: "確定済みの面談がある候補は削除できません" },
      { status: 409 },
    );
  }

  // Calendar 側のイベントを先に削除 (ベストエフォート)
  await Promise.all(
    existing.slots
      .filter((s) => s.googleEventId)
      .map(async (s) => {
        try {
          await deleteProposalEvent(userId, s.googleEventId!);
        } catch (err) {
          console.error(
            "[/api/proposals/:id DELETE] deleteProposalEvent failed",
            err,
          );
        }
      }),
  );

  // Slot は onDelete: Cascade で同時削除される
  await prisma.proposal.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
