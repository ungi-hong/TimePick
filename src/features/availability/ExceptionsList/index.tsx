"use client";

import type { AvailabilityExceptionDto } from "@/lib/availability";
import { useExceptionsList } from "./use-exceptions-list";
import { ExceptionsListView } from "./view";

export function ExceptionsList({
  initial,
}: {
  initial: AvailabilityExceptionDto[];
}) {
  const state = useExceptionsList(initial);
  return (
    <ExceptionsListView
      items={state.items}
      form={state.form}
      submitting={state.submitting}
      onFormChange={state.setForm}
      onSubmit={state.onSubmit}
      onRemove={state.remove}
    />
  );
}
