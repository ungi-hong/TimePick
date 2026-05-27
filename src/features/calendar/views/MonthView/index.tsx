"use client";

import type { Meeting } from "@/lib/use-meetings";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import type { ViewMode } from "@/features/calendar/CalendarHeader";
import { useMonthView } from "./use-month-view";
import { MonthViewView } from "./view";

type Props = {
  calendarConnected: boolean;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
};

export function MonthView(props: Props) {
  const { cursor, days, cellEvents, isLoading, error } = useMonthView(
    props.selectedDate,
    props.calendarConnected,
  );
  return (
    <MonthViewView
      {...props}
      cursor={cursor}
      days={days}
      cellEvents={cellEvents}
      isLoading={isLoading}
      error={error}
    />
  );
}
