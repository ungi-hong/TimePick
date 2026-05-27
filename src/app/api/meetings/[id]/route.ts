import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  deleteMeetingEvent,
  patchMeetingEvent,
} from "@/lib/google-calendar";

type Ctx = { params: Promise<{ id: string }> };

const UrlOrEmpty = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v),
    "URL は http(s):// で始めてください",
  );

const PatchSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    companyName: z.string().trim().min(1).max(200).optional(),
    meetingUrl: UrlOrEmpty.nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    start: z.iso.datetime({ offset: true }).optional(),
    end: z.iso.datetime({ offset: true }).optional(),
  })
  .refine(
    (v) =>
      v.start === undefined ||
      v.end === undefined ||
      new Date(v.start) < new Date(v.end),
    { message: "開始は終了より前にしてください", path: ["end"] },
  );

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

  const existing = await prisma.meeting.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const data = parsed.data;
  const next = {
    title: data.title ?? existing.title,
    companyName: data.companyName ?? existing.companyName,
    meetingUrl:
      data.meetingUrl === undefined
        ? existing.meetingUrl
        : data.meetingUrl
          ? data.meetingUrl
          : null,
    description:
      data.description === undefined ? existing.description : data.description,
    startAt: data.start ? new Date(data.start) : existing.startAt,
    endAt: data.end ? new Date(data.end) : existing.endAt,
  };

  // 1) DB を先に更新
  const updated = await prisma.meeting.update({
    where: { id },
    data: next,
  });

  // 2) Google を同期。失敗したら DB を旧値にロールバック。
  if (existing.googleEventId) {
    try {
      await patchMeetingEvent(userId, existing.googleEventId, {
        title: next.title,
        description: next.description,
        location: next.meetingUrl,
        start: next.startAt,
        end: next.endAt,
      });
    } catch (err) {
      console.error("[/api/meetings/:id PATCH] google sync failed", err);
      await prisma.meeting.update({
        where: { id },
        data: {
          title: existing.title,
          companyName: existing.companyName,
          meetingUrl: existing.meetingUrl,
          description: existing.description,
          startAt: existing.startAt,
          endAt: existing.endAt,
        },
      });
      return NextResponse.json({ error: "google_patch_failed" }, { status: 502 });
    }
  }

  return NextResponse.json({
    id: updated.id,
    proposalId: updated.proposalId,
    title: updated.title,
    companyName: updated.companyName,
    meetingUrl: updated.meetingUrl,
    description: updated.description,
    start: updated.startAt.toISOString(),
    end: updated.endAt.toISOString(),
    googleEventId: updated.googleEventId,
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;
  const { id } = await ctx.params;

  const existing = await prisma.meeting.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  if (existing.googleEventId) {
    try {
      await deleteMeetingEvent(userId, existing.googleEventId);
    } catch (err) {
      // 403 はカレンダーへのアクセス権を失っているケースなので DB だけ消して終わる。
      // それ以外 (5xx / ネットワーク断 / 401 等) は Google 側に幽霊イベントを残さない
      // よう 502 を返してユーザーに再試行を促す。404/410 は deleteMeetingEvent 内で
      // 既に成功扱い。
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? Number((err as { code: number }).code)
          : null;
      console.error("[/api/meetings/:id DELETE] google delete failed", err);
      if (code !== 403) {
        return NextResponse.json(
          { error: "google_delete_failed", code },
          { status: 502 },
        );
      }
    }
  }

  await prisma.meeting.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
