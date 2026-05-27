"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { MonthView } from "@/components/MonthView";
import { WeekView } from "@/components/WeekView";
import { DayView } from "@/components/DayView";
import { ScheduleView } from "@/components/ScheduleView";
import type { ViewMode } from "@/components/CalendarHeader";
import type { ConfirmTarget } from "@/components/ConfirmMeetingDialog";
import type { EventInfo } from "@/components/EventInfoDialog";
import type { Meeting } from "@/lib/use-meetings";

type Props = {
  calendarConnected: boolean;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
};

export function CalendarView(props: Props) {
  const [view, setView] = useState<ViewMode>("month");

  const commonProps = {
    ...props,
    view,
    onViewChange: setView,
  };

  return (
    <section className="flex flex-1 flex-col overflow-hidden">
      {!props.calendarConnected && (
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

      {view === "month" && <MonthView {...commonProps} />}
      {view === "week" && <WeekView {...commonProps} />}
      {view === "day" && <DayView {...commonProps} />}
      {view === "schedule" && <ScheduleView {...commonProps} />}
    </section>
  );
}
