"use client";

import type { Meeting } from "@/lib/use-meetings";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import type { ViewMode } from "@/features/calendar/CalendarHeader";
import { useDayView } from "./use-day-view";
import { DayViewView } from "./view";

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

export function DayView(props: Props) {
  const { dayStart, allDayEvents, timedEvents } = useDayView(
    props.selectedDate,
    props.calendarConnected,
  );
  return (
    <DayViewView
      {...props}
      dayStart={dayStart}
      allDayEvents={allDayEvents}
      timedEvents={timedEvents}
    />
  );
}
