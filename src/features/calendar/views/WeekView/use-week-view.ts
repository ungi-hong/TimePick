"use client";

import { useMemo } from "react";
import { addDays, endOfWeek, startOfWeek } from "date-fns";
import { endOfJstDay, startOfJstDay } from "@/lib/datetime";
import { useBusyEvents } from "@/lib/use-busy-events";
import { useProposals } from "@/lib/use-proposals";
import { useMeetings } from "@/lib/use-meetings";
import {
  enumerateHolidays,
  mergeCellEvents,
  type CellEvent,
} from "@/lib/calendar-events";

export const useWeekView = (
  selectedDate: Date,
  calendarConnected: boolean,
) => {
  const weekStart = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 0 }),
    [selectedDate],
  );
  const weekEnd = useMemo(
    () => endOfWeek(selectedDate, { weekStartsOn: 0 }),
    [selectedDate],
  );
  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  );

  const from = useMemo(() => startOfJstDay(weekStart), [weekStart]);
  const to = useMemo(() => endOfJstDay(weekEnd), [weekEnd]);

  const { data: busy = [] } = useBusyEvents({
    from,
    to,
    enabled: calendarConnected,
  });
  const { data: proposals = [] } = useProposals({ from, to, status: "OPEN" });
  const { data: meetings = [] } = useMeetings({ from, to });

  const events: CellEvent[] = useMemo(
    () => [
      ...mergeCellEvents(busy, proposals, meetings),
      ...enumerateHolidays(from, to),
    ],
    [busy, proposals, meetings, from, to],
  );

  return { weekStart, weekEnd, days, events };
};
