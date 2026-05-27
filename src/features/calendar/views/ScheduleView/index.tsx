"use client";

import type { Meeting } from "@/lib/use-meetings";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import type { ViewMode } from "@/features/calendar/CalendarHeader";
import { useScheduleView } from "./use-schedule-view";
import { ScheduleViewView } from "./view";

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

export function ScheduleView(props: Props) {
  const { weeks } = useScheduleView(
    props.selectedDate,
    props.calendarConnected,
  );
  return <ScheduleViewView {...props} weeks={weeks} />;
}
