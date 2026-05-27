import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { formatInTimeZone } from "date-fns-tz";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CALENDAR_AUTHORIZATION_PARAMS,
  clearCalendarConnection,
  hasCalendarConnection,
} from "@/lib/calendar-connection";
import { prisma } from "@/lib/db";
import { JST } from "@/lib/datetime";
import {
  DEFAULT_AVAILABILITY,
  type AvailabilityExceptionDto,
  type AvailabilitySettings,
  type WeeklyHours,
} from "@/lib/availability";
import { AvailabilityForm } from "@/features/availability/AvailabilityForm";
import { ExceptionsList } from "@/features/availability/ExceptionsList";

async function connectCalendarAction() {
  "use server";
  await signIn(
    "google",
    { redirectTo: "/settings" },
    CALENDAR_AUTHORIZATION_PARAMS,
  );
}

async function disconnectCalendarAction() {
  "use server";
  const session = await auth();
  if (!session?.user?.id) return;
  await clearCalendarConnection(session.user.id);
}

const loadAvailability = async (
  userId: string,
): Promise<{
  settings: AvailabilitySettings;
  exceptions: AvailabilityExceptionDto[];
}> => {
  const row = await prisma.availability.findUnique({
    where: { userId },
    include: { exceptions: { orderBy: { date: "asc" } } },
  });

  if (!row) {
    return { settings: DEFAULT_AVAILABILITY, exceptions: [] };
  }

  return {
    settings: {
      weeklyHours: row.weeklyHours as WeeklyHours,
      skipHolidays: row.skipHolidays,
    },
    exceptions: row.exceptions.map((e) => ({
      id: e.id,
      date: formatInTimeZone(e.date, JST, "yyyy-MM-dd"),
      start: e.start,
      end: e.end,
      note: e.note,
    })),
  };
};

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const connected = await hasCalendarConnection(session.user.id);
  const { settings, exceptions } = await loadAvailability(session.user.id);

  return (
    <main className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
            <span>ホーム</span>
          </Link>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            設定
          </h1>
        </div>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          {session.user.email}
        </span>
      </header>

      <section className="mx-auto w-full max-w-2xl flex-1 space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle>Google Calendar 連携</CardTitle>
                <CardDescription>
                  既存予定の取り込みと、確定面談の自動登録に使います。
                </CardDescription>
              </div>
              {connected ? (
                <Badge variant="default">連携済み</Badge>
              ) : (
                <Badge variant="secondary">未連携</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {connected ? (
              <form action={disconnectCalendarAction}>
                <Button type="submit" variant="outline">
                  連携を解除
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  解除すると、月ビューに既存予定が表示されなくなり、候補生成・面談確定もできなくなります。
                </p>
              </form>
            ) : (
              <form action={connectCalendarAction}>
                <Button type="submit">Google Calendar を連携</Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Google の同意画面が開き、カレンダーへの読み書きを許可するよう求められます。
                </p>
              </form>
            )}
          </CardContent>
        </Card>

        <AvailabilityForm initial={settings} />

        <ExceptionsList initial={exceptions} />
      </section>
    </main>
  );
}
