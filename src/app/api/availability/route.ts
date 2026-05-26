import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  AvailabilitySettingsSchema,
  DEFAULT_AVAILABILITY,
  type AvailabilityExceptionDto,
  type WeeklyHours,
} from "@/lib/availability";
import { formatInTimeZone } from "date-fns-tz";
import { JST } from "@/lib/datetime";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const row = await prisma.availability.findUnique({
    where: { userId: session.user.id },
    include: { exceptions: { orderBy: { date: "asc" } } },
  });

  if (!row) {
    return NextResponse.json({ ...DEFAULT_AVAILABILITY, exceptions: [] });
  }

  const exceptions: AvailabilityExceptionDto[] = row.exceptions.map((e) => ({
    id: e.id,
    date: formatInTimeZone(e.date, JST, "yyyy-MM-dd"),
    start: e.start,
    end: e.end,
    note: e.note,
  }));

  return NextResponse.json({
    weeklyHours: row.weeklyHours as WeeklyHours,
    skipHolidays: row.skipHolidays,
    exceptions,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = AvailabilitySettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const data = parsed.data;
  await prisma.availability.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      weeklyHours: data.weeklyHours,
      skipHolidays: data.skipHolidays,
    },
    update: {
      weeklyHours: data.weeklyHours,
      skipHolidays: data.skipHolidays,
    },
  });

  return NextResponse.json({ ok: true });
}
