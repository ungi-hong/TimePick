import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  deleteProposalEvent,
  insertMeetingEvent,
} from "@/lib/google-calendar";
import { hasCalendarConnection } from "@/lib/calendar-connection";

const UrlOrEmpty = z
  .string()
  .trim()
  .refine(
    (v) => v === "" || /^https?:\/\//i.test(v),
    "URL は http(s):// で始めてください",
  );

const CreateSchema = z
  .object({
    proposalId: z.string().min(1),
    title: z.string().trim().min(1).max(200),
    companyName: z.string().trim().min(1).max(200),
    meetingUrl: UrlOrEmpty.nullable().optional(),
    description: z.string().max(2000).nullable().optional(),
    start: z.iso.datetime({ offset: true }),
    end: z.iso.datetime({ offset: true }),
  })
  .refine((v) => new Date(v.start) < new Date(v.end), {
    message: "開始は終了より前にしてください",
    path: ["end"],
  });

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const body = await req.json().catch(() => null);
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  if (!(await hasCalendarConnection(userId))) {
    return NextResponse.json({ error: "calendar_not_connected" }, { status: 412 });
  }

  const data = parsed.data;
  const startAt = new Date(data.start);
  const endAt = new Date(data.end);

  // proposal の所有確認
  const proposal = await prisma.proposal.findFirst({
    where: { id: data.proposalId, userId },
    include: { slots: true },
  });
  if (!proposal) {
    return NextResponse.json({ error: "proposal_not_found" }, { status: 404 });
  }
  if (proposal.status === "CONFIRMED") {
    return NextResponse.json({ error: "already_confirmed" }, { status: 409 });
  }

  // 1) 先に DB を確定 (googleEventId は後付け)
  const meeting = await prisma.$transaction(async (tx) => {
    const created = await tx.meeting.create({
      data: {
        userId,
        proposalId: data.proposalId,
        title: data.title,
        companyName: data.companyName,
        meetingUrl: data.meetingUrl ? data.meetingUrl : null,
        description: data.description ?? null,
        startAt,
        endAt,
        googleEventId: null,
      },
    });
    await tx.proposal.update({
      where: { id: data.proposalId },
      data: { status: "CONFIRMED" },
    });
    return created;
  });

  // 2) Google Calendar に書き込み。失敗したら DB をロールバックして
  //    Google にだけ予定が残る孤児状態を回避。
  let googleEventId: string | null = null;
  try {
    googleEventId = await insertMeetingEvent(userId, {
      title: data.title,
      description: data.description ?? null,
      location: data.meetingUrl ? data.meetingUrl : null,
      start: startAt,
      end: endAt,
    });
    if (googleEventId) {
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { googleEventId },
      });
    }
  } catch (err) {
    console.error("[/api/meetings] insertMeetingEvent failed", err);
    // DB ロールバック: Meeting を削除し proposal を OPEN に戻す
    await prisma.$transaction(async (tx) => {
      await tx.meeting.delete({ where: { id: meeting.id } });
      await tx.proposal.update({
        where: { id: data.proposalId },
        data: { status: "OPEN" },
      });
    });
    return NextResponse.json({ error: "google_insert_failed" }, { status: 502 });
  }

  // 候補として登録した Google Calendar イベントを削除 (確定したのでもう不要)
  await Promise.all(
    proposal.slots
      .filter((s) => s.googleEventId)
      .map(async (s) => {
        try {
          await deleteProposalEvent(userId, s.googleEventId!);
        } catch (err) {
          console.error("[/api/meetings POST] deleteProposalEvent failed", err);
        }
      }),
  );

  return NextResponse.json({
    id: meeting.id,
    proposalId: meeting.proposalId,
    title: meeting.title,
    companyName: meeting.companyName,
    meetingUrl: meeting.meetingUrl,
    description: meeting.description,
    start: meeting.startAt.toISOString(),
    end: meeting.endAt.toISOString(),
    googleEventId,
  });
}

const ListQuerySchema = z.object({
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
});

export async function GET(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const url = new URL(req.url);
  const parsed = ListQuerySchema.safeParse({
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const { from, to } = parsed.data;
  const meetings = await prisma.meeting.findMany({
    where: {
      userId,
      ...(to ? { startAt: { lt: new Date(to) } } : {}),
      ...(from ? { endAt: { gt: new Date(from) } } : {}),
    },
    orderBy: { startAt: "asc" },
  });

  return NextResponse.json({
    meetings: meetings.map((m) => ({
      id: m.id,
      proposalId: m.proposalId,
      title: m.title,
      companyName: m.companyName,
      meetingUrl: m.meetingUrl,
      description: m.description,
      start: m.startAt.toISOString(),
      end: m.endAt.toISOString(),
      googleEventId: m.googleEventId,
    })),
  });
}
