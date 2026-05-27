import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import {
  AvailabilityExceptionInputSchema,
  type AvailabilityExceptionDto,
} from "@/lib/availability";
import { getOrCreateAvailability } from "@/lib/availability-server";
import { formatInTimeZone } from "date-fns-tz";
import { JST } from "@/lib/datetime";

export async function POST(req: Request) {
  const auth = await requireUserId();
  if (auth instanceof NextResponse) return auth;
  const userId = auth;

  const body = await req.json().catch(() => null);
  const parsed = AvailabilityExceptionInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid", details: z.treeifyError(parsed.error) },
      { status: 400 },
    );
  }

  const availability = await getOrCreateAvailability(userId);
  const dateUtc = new Date(`${parsed.data.date}T00:00:00+09:00`);

  try {
    const created = await prisma.availabilityException.create({
      data: {
        availabilityId: availability.id,
        date: dateUtc,
        start: parsed.data.start,
        end: parsed.data.end,
        note: parsed.data.note ?? null,
      },
    });
    const dto: AvailabilityExceptionDto = {
      id: created.id,
      date: formatInTimeZone(created.date, JST, "yyyy-MM-dd"),
      start: created.start,
      end: created.end,
      note: created.note,
    };
    return NextResponse.json(dto);
  } catch (err) {
    // 同じ (availabilityId, date) の組み合わせがあると unique 制約に引っかかる
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "duplicate", message: "その日付の例外は既に登録されています" },
        { status: 409 },
      );
    }
    console.error("[/api/availability/exceptions] failed", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
