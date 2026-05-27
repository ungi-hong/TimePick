"use client";

import { useMemo } from "react";
import { addDays, addMonths, endOfWeek, startOfWeek } from "date-fns";
import { useBusyEvents } from "@/lib/use-busy-events";
import { useProposals } from "@/lib/use-proposals";
import { useMeetings } from "@/lib/use-meetings";
import {
  enumerateHolidays,
  mergeCellEvents,
  overlapsDay,
  type CellEvent,
} from "@/lib/calendar-events";

export type WeekGroup = {
  weekStart: Date;
  weekEnd: Date;
  days: { date: Date; events: CellEvent[] }[];
};

export const useScheduleView = (
  selectedDate: Date,
  calendarConnected: boolean,
) => {
  const from = useMemo(
    () => startOfWeek(selectedDate, { weekStartsOn: 0 }),
    [selectedDate],
  );
  const to = useMemo(() => addMonths(from, 3), [from]);

  const { data: busy = [] } = useBusyEvents({
    from,
    to,
    enabled: calendarConnected,
  });
  const { data: proposals = [] } = useProposals({ from, to, status: "OPEN" });
  const { data: meetings = [] } = useMeetings({ from, to });

  const events = useMemo(
    () => [
      ...mergeCellEvents(busy, proposals, meetings),
      ...enumerateHolidays(from, to),
    ],
    [busy, proposals, meetings, from, to],
  );

  const weeks: WeekGroup[] = useMemo(() => {
    const list: WeekGroup[] = [];
    let cursor = from;
    while (cursor < to) {
      const weekStart = cursor;
      const weekEnd = endOfWeek(cursor, { weekStartsOn: 0 });
      const days: WeekGroup["days"] = [];
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayEvents = events
          .filter((e) => overlapsDay(e, day))
          .sort(
            (a, b) =>
              new Date(a.start).getTime() - new Date(b.start).getTime(),
          );
        if (dayEvents.length > 0) {
          days.push({ date: day, events: dayEvents });
        }
      }
      list.push({ weekStart, weekEnd, days });
      cursor = addDays(cursor, 7);
    }
    return list;
  }, [from, to, events]);

  return { weeks };
};
