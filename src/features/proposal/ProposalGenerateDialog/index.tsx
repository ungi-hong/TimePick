"use client";

import { useProposalGenerateDialog } from "./use-proposal-generate-dialog";
import { ProposalGenerateDialogView } from "./view";

type Props = {
  disabled?: boolean;
};

export function ProposalGenerateDialog({ disabled }: Props) {
  const state = useProposalGenerateDialog();

  return (
    <ProposalGenerateDialogView
      disabled={disabled}
      open={state.open}
      onOpenChange={state.onOpenChange}
      phase={state.phase}
      onPhaseBack={() => state.setPhase("input")}
      label={state.label}
      onLabelChange={state.setLabel}
      from={state.from}
      onFromChange={state.setFrom}
      to={state.to}
      onToChange={state.setTo}
      minRangeMinutes={state.minRangeMinutes}
      onMinRangeMinutesChange={state.setMinRangeMinutes}
      bufferAfterMinutes={state.bufferAfterMinutes}
      onBufferAfterMinutesChange={state.setBufferAfterMinutes}
      generating={state.generating}
      saving={state.saving}
      candidates={state.candidates}
      previewGroups={state.previewGroups}
      selectedCount={state.selectedCandidates.length}
      onGenerate={state.generate}
      onSetAll={state.setAll}
      onToggle={state.toggle}
      onSave={state.save}
      savedLabel={state.savedLabel}
      savedCandidates={state.savedCandidates}
      showYear={state.showYear}
      onShowYearChange={state.setShowYear}
      copyText={state.copyText}
      onCopy={state.copyToClipboard}
    />
  );
}
