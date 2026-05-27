"use client";

import { useProposalManageDialog } from "./use-proposal-manage-dialog";
import { ProposalManageDialogView } from "./view";
import type { ManagedProposal } from "./service";

export type { ManagedProposal };

type Props = {
  proposal: ManagedProposal | null;
  onClose: () => void;
};

export function ProposalManageDialog({ proposal, onClose }: Props) {
  const state = useProposalManageDialog(proposal, onClose);

  if (!proposal) return null;

  return (
    <ProposalManageDialogView
      proposal={proposal}
      editing={state.editing}
      onEditingChange={state.setEditing}
      labelDraft={state.labelDraft}
      onLabelDraftChange={state.setLabelDraft}
      showYear={state.showYear}
      onShowYearChange={state.setShowYear}
      copyText={state.copyText}
      busy={state.busy}
      onClose={state.close}
      onSaveLabel={state.saveLabel}
      onCopy={state.copyToClipboard}
      onRemove={state.remove}
    />
  );
}
