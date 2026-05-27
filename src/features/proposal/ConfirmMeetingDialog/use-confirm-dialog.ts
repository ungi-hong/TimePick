"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatJst } from "@/lib/datetime";
import {
  fromMinutes,
  generateStartOptions,
  submitConfirm,
  toMinutes,
  validateConfirm,
  validationErrorMessage,
  type ConfirmTarget,
  type Duration,
} from "./service";

export type UseConfirmDialog = ReturnType<typeof useConfirmDialog>;

export const useConfirmDialog = (
  target: ConfirmTarget | null,
  onClose: () => void,
) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<Duration>(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slotStartHM = target ? formatJst(target.slotStart, "HH:mm") : "";
  const slotEndHM = target ? formatJst(target.slotEnd, "HH:mm") : "";
  const slotSpanMinutes = target
    ? toMinutes(slotEndHM) - toMinutes(slotStartHM)
    : 0;

  // target が変わったときに初期値をセット
  const targetKey = target ? target.slotId : null;
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  if (target && targetKey !== appliedKey) {
    setTitle(target.label);
    setCompanyName("");
    setMeetingUrl("");
    setDescription("");
    const initialDuration: Duration = slotSpanMinutes >= 60 ? 60 : 30;
    setDuration(initialDuration);
    setStartTime(slotStartHM);
    setEndTime(
      fromMinutes(
        Math.min(
          toMinutes(slotStartHM) + initialDuration,
          toMinutes(slotEndHM),
        ),
      ),
    );
    setAppliedKey(targetKey);
  }

  const startOptions = useMemo(
    () => (target ? generateStartOptions(slotStartHM, slotEndHM, duration) : []),
    [target, slotStartHM, slotEndHM, duration],
  );

  const applyDuration = (next: Duration) => {
    setDuration(next);
    if (!startTime) return;
    const newEnd = toMinutes(startTime) + next;
    if (newEnd <= toMinutes(slotEndHM)) {
      setEndTime(fromMinutes(newEnd));
    } else {
      const newStart = toMinutes(slotEndHM) - next;
      if (newStart >= toMinutes(slotStartHM)) {
        setStartTime(fromMinutes(newStart));
        setEndTime(slotEndHM);
      }
    }
  };

  const pickStart = (hm: string) => {
    setStartTime(hm);
    const e = Math.min(toMinutes(hm) + duration, toMinutes(slotEndHM));
    setEndTime(fromMinutes(e));
  };

  const reset = () => {
    setTitle("");
    setCompanyName("");
    setMeetingUrl("");
    setDescription("");
    setDuration(60);
    setStartTime("");
    setEndTime("");
    setSubmitting(false);
    setAppliedKey(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const durationFitsSlot = (d: Duration) => slotSpanMinutes >= d;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    const err = validateConfirm({
      title,
      companyName,
      startTime,
      endTime,
      slotStartHM,
      slotEndHM,
    });
    if (err) {
      toast.error(validationErrorMessage(err));
      return;
    }

    setSubmitting(true);
    try {
      const dateKey = formatJst(target.slotStart, "yyyy-MM-dd");
      const start = new Date(`${dateKey}T${startTime}:00+09:00`).toISOString();
      const end = new Date(`${dateKey}T${endTime}:00+09:00`).toISOString();

      await submitConfirm({
        proposalId: target.proposalId,
        title: title.trim(),
        companyName: companyName.trim(),
        meetingUrl: meetingUrl.trim() || null,
        description: description.trim() || null,
        start,
        end,
      });

      toast.success("面談を確定しました");
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.refresh();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "確定に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    companyName,
    setCompanyName,
    meetingUrl,
    setMeetingUrl,
    description,
    setDescription,
    duration,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    submitting,
    slotStartHM,
    slotEndHM,
    startOptions,
    applyDuration,
    pickStart,
    durationFitsSlot,
    handleClose,
    onSubmit,
  };
};
