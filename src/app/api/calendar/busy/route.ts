import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { hasCalendarConnection } from "@/lib/calendar-connection";
import { listBusyEvents } from "@/lib/google-calendar";
import { prisma } from "@/lib/db";

const QuerySchema = z.object({
  from: z.iso.datetime({ offset: true }),
  to: z.iso.datetime({ offset: true }),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = QuerySchema.safeParse({
    from: req.nextUrl.searchParams.get("from"),
    to: req.nextUrl.searchParams.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_query", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const userId = session.user.id;

  if (!(await hasCalendarConnection(userId))) {
    return NextResponse.json({ error: "calendar_not_connected" }, { status: 412 });
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);

  try {
    const [events, ownedSlotIds, ownedMeetingIds] = await Promise.all([
      listBusyEvents(userId, from, to),
      prisma.proposalSlot.findMany({
        where: {
          proposal: { userId },
          googleEventId: { not: null },
          startAt: { lt: to },
          endAt: { gt: from },
        },
        select: { googleEventId: true },
      }),
      prisma.meeting.findMany({
        where: {
          userId,
          googleEventId: { not: null },
          startAt: { lt: to },
          endAt: { gt: from },
        },
        select: { googleEventId: true },
      }),
    ]);

    const ownedIds = new Set<string>([
      ...ownedSlotIds.map((s) => s.googleEventId!).filter(Boolean),
      ...ownedMeetingIds.map((m) => m.googleEventId!).filter(Boolean),
    ]);

    const filtered = events.filter((e) => !ownedIds.has(e.googleEventId));

    return NextResponse.json({ events: filtered });
  } catch (err) {
    console.error("[/api/calendar/busy] failed", err);
    return NextResponse.json({ error: "calendar_fetch_failed" }, { status: 502 });
  }
}
