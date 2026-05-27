"use client";

import { useState } from "react";
import { startOfDay } from "date-fns";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { ManagedProposal } from "@/features/proposal/ProposalManageDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import type { Meeting } from "@/lib/use-meetings";

export const useCalendarShell = () => {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [meetingTarget, setMeetingTarget] = useState<Meeting | null>(null);
  const [proposalTarget, setProposalTarget] = useState<ManagedProposal | null>(
    null,
  );
  const [infoTarget, setInfoTarget] = useState<EventInfo | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const openProposalFromMobile = (p: ManagedProposal) => {
    setMobileOpen(false);
    setProposalTarget(p);
  };
  const openMeetingFromMobile = (m: Meeting) => {
    setMobileOpen(false);
    setMeetingTarget(m);
  };
  const openConfirmFromMobile = (t: ConfirmTarget) => {
    setMobileOpen(false);
    setConfirmTarget(t);
  };

  return {
    selectedDate,
    setSelectedDate,
    confirmTarget,
    setConfirmTarget,
    meetingTarget,
    setMeetingTarget,
    proposalTarget,
    setProposalTarget,
    infoTarget,
    setInfoTarget,
    mobileOpen,
    setMobileOpen,
    openProposalFromMobile,
    openMeetingFromMobile,
    openConfirmFromMobile,
  };
};
