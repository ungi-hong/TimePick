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

export const useMeetingDialog = (
  meeting: Meeting | null,
  onClose: () => void,
) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [busy, setBusy] = useState(false);

  const meetingKey = meeting?.id ?? null;
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  if (meeting && meetingKey !== appliedKey) {
    setEditing(false);
    setTitle(meeting.title);
    setCompanyName(meeting.companyName);
    setMeetingUrl(meeting.meetingUrl ?? "");
    setDescription(meeting.description ?? "");
    setDate(formatJst(meeting.start, "yyyy-MM-dd"));
    setStartTime(formatJst(meeting.start, "HH:mm"));
    setEndTime(formatJst(meeting.end, "HH:mm"));
    setAppliedKey(meetingKey);
  }

  const handleClose = () => {
    setEditing(false);
    setAppliedKey(null);
    onClose();
  };

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meeting) return;

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
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!meeting) return;
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
      handleClose();
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
    handleClose,
    onSave,
    onDelete,
  };
};
