import { addDays, getDay } from "date-fns";
import type { AvailabilityExceptionDto, WeeklyHours, DayKey } from "@/lib/availability";
import { DAY_KEYS } from "@/lib/availability";
import { isHoliday } from "@/lib/holiday";
import { startOfJstDay, JST } from "@/lib/datetime";
import { formatInTimeZone } from "date-fns-tz";

export type TimeRange = { start: Date; end: Date };

export type ConflictRange = TimeRange;

export type GenerateInput = {
  weeklyHours: WeeklyHours;
  skipHolidays: boolean;
  exceptions: AvailabilityExceptionDto[];
  conflicts: ConflictRange[]; // busy + 既存 Proposal + 既存 Meeting をまとめたもの
  from: Date;
  to: Date;
  minRangeMinutes?: number;
  bufferAfterMinutes?: number; // 各 conflict の終了に加えるバッファ
  now?: Date;
};

// "HH:mm" + JST 日付 → Date
const combineDateTime = (jstDay: Date, hm: string): Date => {
  const dateKey = formatInTimeZone(jstDay, JST, "yyyy-MM-dd");
  return new Date(`${dateKey}T${hm}:00+09:00`);
};

const dayKeyOf = (date: Date): DayKey => {
  const jstDow = Number(formatInTimeZone(date, JST, "i")); // 1=Mon..7=Sun
  const idx = jstDow === 7 ? 0 : jstDow;
  return DAY_KEYS[idx];
};

const jstDateKey = (date: Date): string => formatInTimeZone(date, JST, "yyyy-MM-dd");

const getDayWindow = (
  date: Date,
  weeklyHours: WeeklyHours,
  exceptions: AvailabilityExceptionDto[],
  skipHolidays: boolean,
): { start: string; end: string } | null => {
  const dateKey = jstDateKey(date);
  const exception = exceptions.find((e) => e.date === dateKey);
  if (exception) {
    if (exception.start === null || exception.end === null) return null;
    return { start: exception.start, end: exception.end };
  }

  if (skipHolidays) {
    const dow = getDay(date);
    if (dow === 0 || dow === 6) return null;
    if (isHoliday(date)) return null;
  }

  return weeklyHours[dayKeyOf(date)];
};

const subtractConflicts = (
  windowRange: TimeRange,
  conflicts: ConflictRange[],
): TimeRange[] => {
  let result: TimeRange[] = [windowRange];
  for (const c of conflicts) {
    const cStart = c.start.getTime();
    const cEnd = c.end.getTime();
    const next: TimeRange[] = [];
    for (const r of result) {
      const rStart = r.start.getTime();
      const rEnd = r.end.getTime();
      if (cEnd <= rStart || cStart >= rEnd) {
        next.push(r);
        continue;
      }
      if (cStart > rStart) next.push({ start: r.start, end: new Date(cStart) });
      if (cEnd < rEnd) next.push({ start: new Date(cEnd), end: r.end });
    }
    result = next;
  }
  return result;
};

const minutesBetween = (a: Date, b: Date) =>
  Math.floor((b.getTime() - a.getTime()) / 60_000);

export const generateProposalCandidates = ({
  weeklyHours,
  skipHolidays,
  exceptions,
  conflicts,
  from,
  to,
  minRangeMinutes = 60,
  bufferAfterMinutes = 0,
  now = new Date(),
}: GenerateInput): TimeRange[] => {
  // バッファを適用: 各 conflict の終了を bufferAfter 分後ろにずらす
  const adjusted = conflicts.map((c) => ({
    start: c.start,
    end: new Date(c.end.getTime() + bufferAfterMinutes * 60_000),
  }));

  const result: TimeRange[] = [];
  let cursor = startOfJstDay(from);
  const limit = to.getTime();

  while (cursor.getTime() <= limit) {
    const window = getDayWindow(cursor, weeklyHours, exceptions, skipHolidays);
    if (!window) {
      cursor = addDays(cursor, 1);
      continue;
    }
    const dayStart = combineDateTime(cursor, window.start);
    const dayEnd = combineDateTime(cursor, window.end);
    const effectiveStart = dayStart.getTime() < now.getTime() ? now : dayStart;
    if (effectiveStart.getTime() >= dayEnd.getTime()) {
      cursor = addDays(cursor, 1);
      continue;
    }

    const dayConflicts = adjusted.filter(
      (c) =>
        c.end.getTime() > effectiveStart.getTime() &&
        c.start.getTime() < dayEnd.getTime(),
    );

    const free = subtractConflicts(
      { start: effectiveStart, end: dayEnd },
      dayConflicts,
    ).filter((r) => minutesBetween(r.start, r.end) >= minRangeMinutes);

    result.push(...free);
    cursor = addDays(cursor, 1);
  }

  return result.sort((a, b) => a.start.getTime() - b.start.getTime());
};
