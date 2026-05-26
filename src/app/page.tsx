import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { hasCalendarConnection } from "@/lib/calendar-connection";
import { CalendarShell } from "@/components/CalendarShell";
import { ProposalGenerateDialog } from "@/components/ProposalGenerateDialog";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const connected = await hasCalendarConnection(session.user.id);

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <header className="flex items-center justify-between gap-2 border-b px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
            TimePick
          </h1>
          <Badge
            variant={connected ? "default" : "secondary"}
            className="hidden sm:inline-flex"
          >
            {connected ? "Calendar 連携済み" : "Calendar 未連携"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user.email}
          </span>
          <div className="w-[10.5rem] sm:w-auto">
            <ProposalGenerateDialog disabled={!connected} />
          </div>
          <Link
            href="/settings"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            設定
          </Link>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button type="submit" variant="outline" size="sm">
              ログアウト
            </Button>
          </form>
        </div>
      </header>

      <CalendarShell calendarConnected={connected} />
    </main>
  );
}
