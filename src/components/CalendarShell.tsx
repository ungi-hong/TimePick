"use client";

import { useState } from "react";
import { startOfDay } from "date-fns";
import { MiniCalendar } from "@/components/MiniCalendar";
import { MonthCalendar } from "@/components/MonthCalendar";
import { SidebarLists } from "@/components/SidebarLists";
import { Separator } from "@/components/ui/separator";
import {
  ConfirmMeetingDialog,
  type ConfirmTarget,
} from "@/components/ConfirmMeetingDialog";
import { MeetingDialog } from "@/components/MeetingDialog";
import {
  ProposalManageDialog,
  type ManagedProposal,
} from "@/components/ProposalManageDialog";
import type { Meeting } from "@/lib/use-meetings";

type Props = {
  calendarConnected: boolean;
};

export function CalendarShell({ calendarConnected }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null);
  const [meetingTarget, setMeetingTarget] = useState<Meeting | null>(null);
  const [proposalTarget, setProposalTarget] = useState<ManagedProposal | null>(
    null,
  );

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r md:flex">
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
        <Separator />
        <SidebarLists
          onProposalOpen={setProposalTarget}
          onMeetingOpen={setMeetingTarget}
        />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        <div className="flex flex-1 flex-col overflow-hidden md:p-4 lg:p-6">
          <div className="flex flex-1 flex-col overflow-hidden bg-background md:rounded-lg md:border md:shadow-sm">
            <MonthCalendar
              calendarConnected={calendarConnected}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              onProposalConfirm={setConfirmTarget}
              onMeetingOpen={setMeetingTarget}
            />
          </div>
        </div>
      </div>

      <ConfirmMeetingDialog
        target={confirmTarget}
        onClose={() => setConfirmTarget(null)}
      />
      <MeetingDialog
        meeting={meetingTarget}
        onClose={() => setMeetingTarget(null)}
      />
      <ProposalManageDialog
        proposal={proposalTarget}
        onClose={() => setProposalTarget(null)}
      />
    </div>
  );
}
