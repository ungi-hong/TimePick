import holidayJp from "@holiday-jp/holiday_jp";
import { JST } from "@/lib/datetime";
import { formatInTimeZone } from "date-fns-tz";

export const isHoliday = (date: Date): boolean => holidayJp.isHoliday(date);

export const getHolidayName = (date: Date): string | null => {
  // JST 上での 1 日範囲で問い合わせる
  const dayKey = formatInTimeZone(date, JST, "yyyy-MM-dd");
  const hit = holidayJp.between(
    new Date(`${dayKey}T00:00:00+09:00`),
    new Date(`${dayKey}T23:59:59+09:00`),
  );
  return hit[0]?.name ?? null;
};
