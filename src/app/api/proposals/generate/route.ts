import { NextResponse } from "next/server";
import { z } from "zod";
import { formatInTimeZone } from "date-fns-tz";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { JST } from "@/lib/datetime";
import {
  DEFAULT_AVAILABILITY,
  type AvailabilityExceptionDto,
  type WeeklyHours,
} from "@/lib/availability";
import { hasCalendarConnection } from "@/lib/calendar-connection";
import { listBusyEvents } from "@/lib/google-calendar";
import {
  generateProposalCandidates,
  type ConflictRange,
} from "@/lib/proposal-generator";

const InputSchema = z.object({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
  minRangeMinutes: z.number().int().min(15).max(480).default(60),
  bufferAfterMinutes: z.number().int().min(0).max(180).default(0),
});

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const body = await req.json().catch(() => null);
  const parsed = InputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  if (!(await hasCalendarConnection(userId))) {
    return NextResponse.json({ error: "calendar_not_connected" }, { status: 412 });
  }

  const { from: fromIso, to: toIso, minRangeMinutes, bufferAfterMinutes } = parsed.data;
  const from = new Date(fromIso);
  const to = new Date(toIso);

  const row = await prisma.availability.findUnique({
    where: { userId: userId },
    include: { exceptions: true },
  });

  const weeklyHours =
    (row?.weeklyHours as WeeklyHours | undefined) ?? DEFAULT_AVAILABILITY.weeklyHours;
  const skipHolidays = row?.skipHolidays ?? DEFAULT_AVAILABILITY.skipHolidays;
  const exceptions: AvailabilityExceptionDto[] =
    row?.exceptions.map((e) => ({
      id: e.id,
      date: formatInTimeZone(e.date, JST, "yyyy-MM-dd"),
      start: e.start,
      end: e.end,
      note: e.note,
    })) ?? [];

  const [busy, openSlots, meetings] = await Promise.all([
    listBusyEvents(userId, from, to),
    prisma.proposalSlot.findMany({
      where: {
        proposal: { userId: userId, status: "OPEN" },
        startAt: { lt: to },
        endAt: { gt: from },
      },
      select: { startAt: true, endAt: true },
    }),
    prisma.meeting.findMany({
      where: {
        userId: userId,
        startAt: { lt: to },
        endAt: { gt: from },
      },
      select: { startAt: true, endAt: true },
    }),
  ]);

  const conflicts: ConflictRange[] = [
    ...busy.map((e) => ({ start: new Date(e.start), end: new Date(e.end) })),
    ...openSlots.map((s) => ({ start: s.startAt, end: s.endAt })),
    ...meetings.map((m) => ({ start: m.startAt, end: m.endAt })),
  ];

  const candidates = generateProposalCandidates({
    weeklyHours,
    skipHolidays,
    exceptions,
    conflicts,
    from,
    to,
    minRangeMinutes,
    bufferAfterMinutes,
  });

  return NextResponse.json({
    candidates: candidates.map((c) => ({
      start: c.start.toISOString(),
      end: c.end.toISOString(),
    })),
  });
}
