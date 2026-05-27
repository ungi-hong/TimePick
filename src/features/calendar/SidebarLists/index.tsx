"use client";

import type { Meeting } from "@/lib/use-meetings";
import type { ManagedProposal } from "@/features/proposal/ProposalManageDialog";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import { useSidebarLists } from "./use-sidebar-lists";
import { SidebarListsView } from "./view";

type Props = {
  onProposalOpen: (p: ManagedProposal) => void;
  onMeetingOpen: (m: Meeting) => void;
  onSlotConfirm: (target: ConfirmTarget) => void;
};

export function SidebarLists(props: Props) {
  const state = useSidebarLists();
  return (
    <SidebarListsView
      proposals={state.proposals}
      meetings={state.meetings}
      expanded={state.expanded}
      onToggle={state.toggle}
      onProposalOpen={props.onProposalOpen}
      onMeetingOpen={props.onMeetingOpen}
      onSlotConfirm={props.onSlotConfirm}
    />
  );
}
