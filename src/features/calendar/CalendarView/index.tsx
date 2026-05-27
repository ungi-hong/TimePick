"use client";

import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import type { Meeting } from "@/lib/use-meetings";
import { useCalendarView } from "./use-calendar-view";
import { CalendarViewView } from "./view";

type Props = {
  calendarConnected: boolean;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
};

export function CalendarView(props: Props) {
  const { view, setView } = useCalendarView();
  return (
    <CalendarViewView
      {...props}
      view={view}
      onViewChange={setView}
    />
  );
}
