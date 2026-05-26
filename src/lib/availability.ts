import { z } from "zod";

export const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, string> = {
  sun: "日",
  mon: "月",
  tue: "火",
  wed: "水",
  thu: "木",
  fri: "金",
  sat: "土",
};

const TimeStringSchema = z
  .string()
  .regex(/^([0-1]\d|2[0-3]):([0-5]\d)$/, "HH:mm 形式で入力してください");

const DayHoursSchema = z
  .object({
    start: TimeStringSchema,
    end: TimeStringSchema,
  })
  .refine((v) => v.start < v.end, {
    message: "開始は終了より前にしてください",
    path: ["end"],
  })
  .nullable();

export const WeeklyHoursSchema = z.object({
  sun: DayHoursSchema,
  mon: DayHoursSchema,
  tue: DayHoursSchema,
  wed: DayHoursSchema,
  thu: DayHoursSchema,
  fri: DayHoursSchema,
  sat: DayHoursSchema,
});

export type WeeklyHours = z.infer<typeof WeeklyHoursSchema>;

export const AvailabilitySettingsSchema = z.object({
  weeklyHours: WeeklyHoursSchema,
  skipHolidays: z.boolean(),
});

export type AvailabilitySettings = z.infer<typeof AvailabilitySettingsSchema>;

export const DEFAULT_AVAILABILITY: AvailabilitySettings = {
  weeklyHours: {
    sun: null,
    mon: { start: "10:00", end: "18:00" },
    tue: { start: "10:00", end: "18:00" },
    wed: { start: "10:00", end: "18:00" },
    thu: { start: "10:00", end: "18:00" },
    fri: { start: "10:00", end: "18:00" },
    sat: null,
  },
  skipHolidays: true,
};

const DateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD で入力してください");

export const AvailabilityExceptionInputSchema = z
  .object({
    date: DateOnlySchema,
    start: TimeStringSchema.nullable(),
    end: TimeStringSchema.nullable(),
    note: z.string().max(200).nullable().optional(),
  })
  .refine(
    (v) =>
      (v.start === null && v.end === null) ||
      (v.start !== null && v.end !== null),
    {
      message: "開始・終了は両方指定するか、両方空 (=終日休み) にしてください",
      path: ["end"],
    },
  )
  .refine(
    (v) => v.start === null || v.end === null || v.start < v.end,
    { message: "開始は終了より前にしてください", path: ["end"] },
  );

export type AvailabilityExceptionInput = z.infer<typeof AvailabilityExceptionInputSchema>;

export type AvailabilityExceptionDto = {
  id: string;
  date: string; // YYYY-MM-DD
  start: string | null;
  end: string | null;
  note: string | null;
};
