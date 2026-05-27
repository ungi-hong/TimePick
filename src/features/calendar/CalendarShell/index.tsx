"use client";

import { useCalendarShell } from "./use-calendar-shell";
import { CalendarShellView } from "./view";

type Props = {
  calendarConnected: boolean;
};

export function CalendarShell({ calendarConnected }: Props) {
  const state = useCalendarShell();
  return (
    <CalendarShellView
      calendarConnected={calendarConnected}
      selectedDate={state.selectedDate}
      onSelectedDateChange={state.setSelectedDate}
      confirmTarget={state.confirmTarget}
      onConfirmTargetChange={state.setConfirmTarget}
      meetingTarget={state.meetingTarget}
      onMeetingTargetChange={state.setMeetingTarget}
      proposalTarget={state.proposalTarget}
      onProposalTargetChange={state.setProposalTarget}
      infoTarget={state.infoTarget}
      onInfoTargetChange={state.setInfoTarget}
      mobileOpen={state.mobileOpen}
      onMobileOpenChange={state.setMobileOpen}
      onMobileProposalOpen={state.openProposalFromMobile}
      onMobileMeetingOpen={state.openMeetingFromMobile}
      onMobileConfirmOpen={state.openConfirmFromMobile}
    />
  );
}
