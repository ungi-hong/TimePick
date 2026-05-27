"use client";

import { useMemo } from "react";
import { endOfJstDay, startOfJstDay } from "@/lib/datetime";
import { useBusyEvents } from "@/lib/use-busy-events";
import { useProposals } from "@/lib/use-proposals";
import { useMeetings } from "@/lib/use-meetings";
import {
  enumerateHolidays,
  mergeCellEvents,
  overlapsDay,
  type CellEvent,
} from "@/lib/calendar-events";

export const useDayView = (
  selectedDate: Date,
  calendarConnected: boolean,
) => {
  const dayStart = useMemo(() => startOfJstDay(selectedDate), [selectedDate]);
  const dayEnd = useMemo(() => endOfJstDay(selectedDate), [selectedDate]);

  const { data: busy = [] } = useBusyEvents({
    from: dayStart,
    to: dayEnd,
    enabled: calendarConnected,
  });
  const { data: proposals = [] } = useProposals({
    from: dayStart,
    to: dayEnd,
    status: "OPEN",
  });
  const { data: meetings = [] } = useMeetings({ from: dayStart, to: dayEnd });

  const events = useMemo(() => {
    const merged = [
      ...mergeCellEvents(busy, proposals, meetings),
      ...enumerateHolidays(dayStart, dayEnd),
    ];
    return merged.filter((e) => overlapsDay(e, selectedDate));
  }, [busy, proposals, meetings, dayStart, dayEnd, selectedDate]);

  const allDayEvents: CellEvent[] = events.filter(
    (e) => e.type === "holiday" || (e.type === "busy" && e.allDay),
  );
  const timedEvents: CellEvent[] = events.filter(
    (e) => !(e.type === "holiday" || (e.type === "busy" && e.allDay)),
  );

  return { dayStart, dayEnd, allDayEvents, timedEvents };
};
