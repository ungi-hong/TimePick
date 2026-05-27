import {
  AvailabilitySettingsSchema,
  DAY_KEYS,
  type AvailabilitySettings,
  type DayKey,
  type WeeklyHours,
} from "@/lib/availability";

export type FormState = {
  weeklyHours: Record<DayKey, { start: string; end: string }>;
  enabledDays: Record<DayKey, boolean>;
  skipHolidays: boolean;
};

export const toFormState = (initial: AvailabilitySettings): FormState => ({
  weeklyHours: Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      initial.weeklyHours[d] ?? { start: "10:00", end: "18:00" },
    ]),
  ) as Record<DayKey, { start: string; end: string }>,
  enabledDays: Object.fromEntries(
    DAY_KEYS.map((d) => [d, initial.weeklyHours[d] !== null]),
  ) as Record<DayKey, boolean>,
  skipHolidays: initial.skipHolidays,
});

export const toPayload = (state: FormState): AvailabilitySettings => ({
  weeklyHours: Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      state.enabledDays[d] ? state.weeklyHours[d] : null,
    ]),
  ) as WeeklyHours,
  skipHolidays: state.skipHolidays,
});

export const validateSettings = (
  payload: AvailabilitySettings,
): boolean => AvailabilitySettingsSchema.safeParse(payload).success;

export const saveAvailability = async (
  payload: AvailabilitySettings,
): Promise<void> => {
  const res = await fetch("/api/availability", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};
