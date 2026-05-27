"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AvailabilitySettings, DayKey } from "@/lib/availability";
import {
  saveAvailability,
  toFormState,
  toPayload,
  validateSettings,
  type FormState,
} from "./service";

export const useAvailabilityForm = (initial: AvailabilitySettings) => {
  const [state, setState] = useState<FormState>(() => toFormState(initial));
  const [submitting, setSubmitting] = useState(false);

  const setHour = (day: DayKey, key: "start" | "end", value: string) =>
    setState((s) => ({
      ...s,
      weeklyHours: {
        ...s.weeklyHours,
        [day]: { ...s.weeklyHours[day], [key]: value },
      },
    }));

  const setEnabled = (day: DayKey, enabled: boolean) =>
    setState((s) => ({
      ...s,
      enabledDays: { ...s.enabledDays, [day]: enabled },
    }));

  const setSkipHolidays = (v: boolean) =>
    setState((s) => ({ ...s, skipHolidays: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(state);

    if (!validateSettings(payload)) {
      toast.error(
        "入力に誤りがあります。時刻の前後関係や形式を確認してください。",
      );
      return;
    }

    setSubmitting(true);
    try {
      await saveAvailability(payload);
      toast.success("稼働時間を保存しました");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `保存に失敗しました: ${err.message}`
          : "保存に失敗しました",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return {
    state,
    submitting,
    setHour,
    setEnabled,
    setSkipHolidays,
    onSubmit,
  };
};
