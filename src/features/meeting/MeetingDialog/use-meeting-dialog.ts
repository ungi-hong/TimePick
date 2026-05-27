"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatJst } from "@/lib/datetime";
import {
  buildPatchInput,
  deleteMeeting,
  meetingFormErrorMessage,
  patchMeeting,
  validateMeetingForm,
  type Meeting,
} from "./service";

// meeting は非 null 前提。親側で key={meeting.id} を渡して再 mount すること。
export const useMeetingDialog = (meeting: Meeting, onClose: () => void) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(meeting.title);
  const [companyName, setCompanyName] = useState(meeting.companyName);
  const [meetingUrl, setMeetingUrl] = useState(meeting.meetingUrl ?? "");
  const [description, setDescription] = useState(meeting.description ?? "");
  const [date, setDate] = useState(formatJst(meeting.start, "yyyy-MM-dd"));
  const [startTime, setStartTime] = useState(formatJst(meeting.start, "HH:mm"));
  const [endTime, setEndTime] = useState(formatJst(meeting.end, "HH:mm"));
  const [busy, setBusy] = useState(false);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const draft = {
      title,
      companyName,
      meetingUrl,
      description,
      date,
      startTime,
      endTime,
    };
    const err = validateMeetingForm(draft);
    if (err) {
      toast.error(meetingFormErrorMessage(err));
      return;
    }

    setBusy(true);
    try {
      await patchMeeting(meeting.id, buildPatchInput(draft));
      toast.success("面談を更新しました");
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (
      !confirm(
        "この面談を削除しますか? Google Calendar からも削除されます。",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteMeeting(meeting.id);
      toast.success("面談を削除しました");
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return {
    editing,
    setEditing,
    title,
    setTitle,
    companyName,
    setCompanyName,
    meetingUrl,
    setMeetingUrl,
    description,
    setDescription,
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    busy,
    onSave,
    onDelete,
  };
};
