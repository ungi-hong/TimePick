"use client";

import { useMemo } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export const useMiniCalendar = (
  selectedDate: Date,
  onSelectedDateChange: (date: Date) => void,
) => {
  const cursor = useMemo(() => startOfMonth(selectedDate), [selectedDate]);

  const days = useMemo(() => {
    const gridStart = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
    const gridEnd = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
    const list: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      list.push(d);
      d = addDays(d, 1);
    }
    return list;
  }, [cursor]);

  const goPrev = () => onSelectedDateChange(subMonths(selectedDate, 1));
  const goNext = () => onSelectedDateChange(addMonths(selectedDate, 1));

  return { cursor, days, goPrev, goNext };
};
