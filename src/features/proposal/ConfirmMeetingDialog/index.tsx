"use client";

import { useConfirmDialog } from "./use-confirm-dialog";
import { ConfirmMeetingDialogView } from "./view";
import type { ConfirmTarget } from "./service";

export type { ConfirmTarget };

type Props = {
  target: ConfirmTarget | null;
  onClose: () => void;
};

export function ConfirmMeetingDialog({ target, onClose }: Props) {
  if (!target) return null;
  // key で target 切替時に内部 state を強制リセット
  return (
    <ConfirmMeetingDialogInner
      key={target.slotId}
      target={target}
      onClose={onClose}
    />
  );
}

function ConfirmMeetingDialogInner({
  target,
  onClose,
}: {
  target: ConfirmTarget;
  onClose: () => void;
}) {
  const state = useConfirmDialog(target, onClose);
  return (
    <ConfirmMeetingDialogView
      target={target}
      title={state.title}
      onTitleChange={state.setTitle}
      companyName={state.companyName}
      onCompanyNameChange={state.setCompanyName}
      meetingUrl={state.meetingUrl}
      onMeetingUrlChange={state.setMeetingUrl}
      description={state.description}
      onDescriptionChange={state.setDescription}
      duration={state.duration}
      onApplyDuration={state.applyDuration}
      durationFitsSlot={state.durationFitsSlot}
      startTime={state.startTime}
      onStartTimeChange={state.setStartTime}
      endTime={state.endTime}
      onEndTimeChange={state.setEndTime}
      slotStartHM={state.slotStartHM}
      slotEndHM={state.slotEndHM}
      startOptions={state.startOptions}
      onPickStart={state.pickStart}
      submitting={state.submitting}
      onClose={onClose}
      onSubmit={state.onSubmit}
    />
  );
}
