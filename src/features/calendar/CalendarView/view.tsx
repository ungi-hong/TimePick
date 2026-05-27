"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { MonthView } from "@/features/calendar/views/MonthView";
import { WeekView } from "@/features/calendar/views/WeekView";
import { DayView } from "@/features/calendar/views/DayView";
import { ScheduleView } from "@/features/calendar/views/ScheduleView";
import type { ViewMode } from "@/features/calendar/CalendarHeader";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import type { Meeting } from "@/lib/use-meetings";

export type CalendarViewViewProps = {
  calendarConnected: boolean;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
};

export function CalendarViewView(props: CalendarViewViewProps) {
  const { calendarConnected, view } = props;

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      {!calendarConnected && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Google Calendar が連携されていないため、既存予定は表示されません。
          </span>
          <Link href="/settings" className="underline">
            設定で連携する
          </Link>
        </div>
      )}

      {view === "month" && <MonthView {...props} />}
      {view === "week" && <WeekView {...props} />}
      {view === "day" && <DayView {...props} />}
      {view === "schedule" && <ScheduleView {...props} />}
    </section>
  );
}
