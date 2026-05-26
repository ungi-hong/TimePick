import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { hasCalendarConnection } from "@/lib/calendar-connection";
import { listBusyEvents } from "@/lib/google-calendar";

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

  if (!(await hasCalendarConnection(session.user.id))) {
    return NextResponse.json({ error: "calendar_not_connected" }, { status: 412 });
  }

  try {
    const events = await listBusyEvents(
      session.user.id,
      new Date(parsed.data.from),
      new Date(parsed.data.to),
    );
    return NextResponse.json({ events });
  } catch (err) {
    console.error("[/api/calendar/busy] failed", err);
    return NextResponse.json({ error: "calendar_fetch_failed" }, { status: 502 });
  }
}
