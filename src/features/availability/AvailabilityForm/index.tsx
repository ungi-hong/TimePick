"use client";

import type { AvailabilitySettings } from "@/lib/availability";
import { useAvailabilityForm } from "./use-availability-form";
import { AvailabilityFormView } from "./view";

export function AvailabilityForm({ initial }: { initial: AvailabilitySettings }) {
  const state = useAvailabilityForm(initial);
  return (
    <AvailabilityFormView
      state={state.state}
      submitting={state.submitting}
      onHourChange={state.setHour}
      onEnabledChange={state.setEnabled}
      onSkipHolidaysChange={state.setSkipHolidays}
      onSubmit={state.onSubmit}
    />
  );
}
