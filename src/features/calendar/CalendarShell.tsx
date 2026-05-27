"use client";

import { useState } from "react";
import { startOfDay } from "date-fns";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { MiniCalendar } from "@/features/calendar/MiniCalendar";
import { CalendarView } from "@/features/calendar/CalendarView";
import { SidebarLists } from "@/features/calendar/SidebarLists";
import {
  ConfirmMeetingDialog,
  type ConfirmTarget,
} from "@/features/proposal/ConfirmMeetingDialog";
import { MeetingDialog } from "@/features/meeting/MeetingDialog";
import {
  ProposalManageDialog,
  type ManagedProposal,
} from "@/features/proposal/ProposalManageDialog";
import {
  EventInfoDialog,
  type EventInfo,
} from "@/features/calendar/EventInfoDialog";
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
          onSlotConfirm={setConfirmTarget}
        />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        <div className="flex items-center gap-2 border-b bg-background px-3 py-2 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="候補リストを開く"
                />
              }
            >
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 sm:max-w-72">
              <SheetHeader className="border-b">
                <SheetTitle>候補 / 確定済み</SheetTitle>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto">
                <SidebarLists
                  onProposalOpen={openProposalFromMobile}
                  onMeetingOpen={openMeetingFromMobile}
                  onSlotConfirm={openConfirmFromMobile}
                />
              </div>
            </SheetContent>
          </Sheet>
          <span className="text-sm font-medium">候補 / 確定済み</span>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden md:p-4 lg:p-6">
          <div className="flex flex-1 flex-col overflow-hidden bg-background md:rounded-lg md:border md:shadow-sm">
            <CalendarView
              calendarConnected={calendarConnected}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
              onProposalConfirm={setConfirmTarget}
              onMeetingOpen={setMeetingTarget}
              onEventInfoOpen={setInfoTarget}
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
      <EventInfoDialog info={infoTarget} onClose={() => setInfoTarget(null)} />
    </div>
  );
}
