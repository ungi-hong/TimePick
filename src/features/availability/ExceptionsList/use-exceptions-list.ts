"use client";

import { useState } from "react";
import { toast } from "sonner";
import type { AvailabilityExceptionDto } from "@/lib/availability";
import {
  createException,
  DEFAULT_FORM,
  deleteException,
  sortByDate,
  toPayload,
  validatePayload,
  type FormState,
} from "./service";

export const useExceptionsList = (initial: AvailabilityExceptionDto[]) => {
  const [items, setItems] = useState<AvailabilityExceptionDto[]>(initial);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = toPayload(form);
    if (!validatePayload(payload)) {
      toast.error("入力に誤りがあります");
      return;
    }

    setSubmitting(true);
    try {
      const created = await createException(payload);
      setItems((prev) => sortByDate([...prev, created]));
      setForm(DEFAULT_FORM);
      toast.success("例外日を追加しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteException(id);
      setItems((prev) => prev.filter((e) => e.id !== id));
      toast.success("削除しました");
    } catch (err) {
      toast.error(
        err instanceof Error
          ? `削除に失敗しました: ${err.message}`
          : "削除に失敗しました",
      );
    }
  };

  return {
    items,
    form,
    setForm,
    submitting,
    onSubmit,
    remove,
  };
};
