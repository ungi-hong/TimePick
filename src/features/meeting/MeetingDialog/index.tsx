"use client";

import { useMeetingDialog } from "./use-meeting-dialog";
import { MeetingDialogView } from "./view";
import type { Meeting } from "@/lib/use-meetings";

type Props = {
  meeting: Meeting | null;
  onClose: () => void;
};

export function MeetingDialog({ meeting, onClose }: Props) {
  if (!meeting) return null;
  return (
    <MeetingDialogInner key={meeting.id} meeting={meeting} onClose={onClose} />
  );
}

function MeetingDialogInner({
  meeting,
  onClose,
}: {
  meeting: Meeting;
  onClose: () => void;
}) {
  const state = useMeetingDialog(meeting, onClose);
  return (
    <MeetingDialogView
      meeting={meeting}
      editing={state.editing}
      onEditingChange={state.setEditing}
      title={state.title}
      onTitleChange={state.setTitle}
      companyName={state.companyName}
      onCompanyNameChange={state.setCompanyName}
      meetingUrl={state.meetingUrl}
      onMeetingUrlChange={state.setMeetingUrl}
      description={state.description}
      onDescriptionChange={state.setDescription}
      date={state.date}
      onDateChange={state.setDate}
      startTime={state.startTime}
      onStartTimeChange={state.setStartTime}
      endTime={state.endTime}
      onEndTimeChange={state.setEndTime}
      busy={state.busy}
      onClose={onClose}
      onSave={state.onSave}
      onDelete={state.onDelete}
    />
  );
}
