"use client";

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

export type CalendarShellViewProps = {
  calendarConnected: boolean;
  selectedDate: Date;
  onSelectedDateChange: (d: Date) => void;
  confirmTarget: ConfirmTarget | null;
  onConfirmTargetChange: (t: ConfirmTarget | null) => void;
  meetingTarget: Meeting | null;
  onMeetingTargetChange: (m: Meeting | null) => void;
  proposalTarget: ManagedProposal | null;
  onProposalTargetChange: (p: ManagedProposal | null) => void;
  infoTarget: EventInfo | null;
  onInfoTargetChange: (i: EventInfo | null) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (v: boolean) => void;
  onMobileProposalOpen: (p: ManagedProposal) => void;
  onMobileMeetingOpen: (m: Meeting) => void;
  onMobileConfirmOpen: (t: ConfirmTarget) => void;
};

export function CalendarShellView({
  calendarConnected,
  selectedDate,
  onSelectedDateChange,
  confirmTarget,
  onConfirmTargetChange,
  meetingTarget,
  onMeetingTargetChange,
  proposalTarget,
  onProposalTargetChange,
  infoTarget,
  onInfoTargetChange,
  mobileOpen,
  onMobileOpenChange,
  onMobileProposalOpen,
  onMobileMeetingOpen,
  onMobileConfirmOpen,
}: CalendarShellViewProps) {
  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="hidden w-72 shrink-0 flex-col overflow-y-auto border-r md:flex">
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectedDateChange={onSelectedDateChange}
        />
        <Separator />
        <SidebarLists
          onProposalOpen={onProposalTargetChange}
          onMeetingOpen={onMeetingTargetChange}
          onSlotConfirm={onConfirmTargetChange}
        />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        <div className="flex items-center gap-2 border-b bg-background px-3 py-2 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
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
                  onProposalOpen={onMobileProposalOpen}
                  onMeetingOpen={onMobileMeetingOpen}
                  onSlotConfirm={onMobileConfirmOpen}
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
              onSelectedDateChange={onSelectedDateChange}
              onProposalConfirm={onConfirmTargetChange}
              onMeetingOpen={onMeetingTargetChange}
              onEventInfoOpen={onInfoTargetChange}
            />
          </div>
        </div>
      </div>

      <ConfirmMeetingDialog
        target={confirmTarget}
        onClose={() => onConfirmTargetChange(null)}
      />
      <MeetingDialog
        meeting={meetingTarget}
        onClose={() => onMeetingTargetChange(null)}
      />
      <ProposalManageDialog
        proposal={proposalTarget}
        onClose={() => onProposalTargetChange(null)}
      />
      <EventInfoDialog
        info={infoTarget}
        onClose={() => onInfoTargetChange(null)}
      />
    </div>
  );
}
