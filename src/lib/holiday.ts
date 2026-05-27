import holidayJp from "@holiday-jp/holiday_jp";
import { jstDateKey } from "@/lib/datetime";

// holidayJp は Date を受け取ると getFullYear/getMonth/getDate を使う = ランタイム TZ 依存。
// JST 日付に正規化してから判定する。
const lookupByJstKey = (date: Date): { name: string } | null => {
  const key = jstDateKey(date);
  const hits = holidayJp.between(
    new Date(`${key}T00:00:00+09:00`),
    new Date(`${key}T23:59:59+09:00`),
  );
  return hits[0] ?? null;
};

export const isHoliday = (date: Date): boolean => lookupByJstKey(date) !== null;

export const getHolidayName = (date: Date): string | null =>
  lookupByJstKey(date)?.name ?? null;
