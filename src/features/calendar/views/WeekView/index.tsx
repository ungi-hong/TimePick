"use client";

import type { Meeting } from "@/lib/use-meetings";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import type { ViewMode } from "@/features/calendar/CalendarHeader";
import { useWeekView } from "./use-week-view";
import { WeekViewView } from "./view";

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

export function WeekView(props: Props) {
  const { weekStart, weekEnd, days, events } = useWeekView(
    props.selectedDate,
    props.calendarConnected,
  );
  return (
    <WeekViewView
      {...props}
      weekStart={weekStart}
      weekEnd={weekEnd}
      days={days}
      events={events}
    />
  );
}
