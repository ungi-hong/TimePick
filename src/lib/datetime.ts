import { toZonedTime, formatInTimeZone } from "date-fns-tz";
import type { Locale } from "date-fns";

export const JST = "Asia/Tokyo" as const;

export const toJst = (date: Date | string): Date =>
  toZonedTime(typeof date === "string" ? new Date(date) : date, JST);

// ランタイム TZ に依存しないよう、JST の日付キー (yyyy-MM-dd) 経由で構築する。
export const startOfJstDay = (date: Date | string): Date => {
  const d = typeof date === "string" ? new Date(date) : date;
  const dayKey = formatInTimeZone(d, JST, "yyyy-MM-dd");
  return new Date(`${dayKey}T00:00:00+09:00`);
};

export const endOfJstDay = (date: Date | string): Date => {
  const d = typeof date === "string" ? new Date(date) : date;
  const dayKey = formatInTimeZone(d, JST, "yyyy-MM-dd");
  return new Date(`${dayKey}T23:59:59.999+09:00`);
};

// startOfJstDay の純粋関数版が必要な場面用 (Date を作らず key だけ欲しい時)
export const jstDateKey = (date: Date | string): string =>
  formatInTimeZone(typeof date === "string" ? new Date(date) : date, JST, "yyyy-MM-dd");

export const formatJst = (
  date: Date | string,
  fmt: string,
  options?: { locale?: Locale },
): string =>
  formatInTimeZone(
    typeof date === "string" ? new Date(date) : date,
    JST,
    fmt,
    options,
  );

