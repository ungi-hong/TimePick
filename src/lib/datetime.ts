import { fromZonedTime, toZonedTime, formatInTimeZone } from "date-fns-tz";

export const JST = "Asia/Tokyo" as const;

export const toJst = (date: Date | string): Date =>
  toZonedTime(typeof date === "string" ? new Date(date) : date, JST);

export const startOfJstDay = (date: Date | string): Date => {
  const d = toJst(date);
  d.setHours(0, 0, 0, 0);
  return fromZonedTime(d, JST);
};

export const endOfJstDay = (date: Date | string): Date => {
  const d = toJst(date);
  d.setHours(23, 59, 59, 999);
  return fromZonedTime(d, JST);
};

export const formatJst = (date: Date | string, fmt: string): string =>
  formatInTimeZone(typeof date === "string" ? new Date(date) : date, JST, fmt);
