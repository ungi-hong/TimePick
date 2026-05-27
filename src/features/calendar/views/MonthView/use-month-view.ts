"use client";

import { useMemo } from "react";
import {
  addDays,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { endOfJstDay, startOfJstDay } from "@/lib/datetime";
import { useBusyEvents } from "@/lib/use-busy-events";
import { useProposals } from "@/lib/use-proposals";
import { useMeetings } from "@/lib/use-meetings";
import {
  enumerateHolidays,
  mergeCellEvents,
  type CellEvent,
} from "@/lib/calendar-events";

export const useMonthView = (
  selectedDate: Date,
  calendarConnected: boolean,
) => {
  const cursor = useMemo(() => startOfMonth(selectedDate), [selectedDate]);

  const { gridStart, gridEnd, days } = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gs = startOfWeek(monthStart, { weekStartsOn: 0 });
    const ge = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const list: Date[] = [];
    let d = gs;
    while (d <= ge) {
      list.push(d);
      d = addDays(d, 1);
    }
    return { gridStart: gs, gridEnd: ge, days: list };
  }, [cursor]);

  const from = useMemo(() => startOfJstDay(gridStart), [gridStart]);
  const to = useMemo(() => endOfJstDay(gridEnd), [gridEnd]);

  const { data: busy = [], isLoading, error } = useBusyEvents({
    from,
    to,
    enabled: calendarConnected,
  });
  const { data: proposals = [] } = useProposals({ from, to, status: "OPEN" });
  const { data: meetings = [] } = useMeetings({ from, to });

  const cellEvents: CellEvent[] = useMemo(
    () => [
      ...mergeCellEvents(busy, proposals, meetings),
      ...enumerateHolidays(from, to),
    ],
    [busy, proposals, meetings, from, to],
  );

  return { cursor, days, cellEvents, isLoading, error };
};
