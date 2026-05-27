"use client";

import { useMiniCalendar } from "./use-mini-calendar";
import { MiniCalendarView } from "./view";

type Props = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

export function MiniCalendar({ selectedDate, onSelectedDateChange }: Props) {
  const { cursor, days, goPrev, goNext } = useMiniCalendar(
    selectedDate,
    onSelectedDateChange,
  );
  return (
    <MiniCalendarView
      selectedDate={selectedDate}
      cursor={cursor}
      days={days}
      onSelectedDateChange={onSelectedDateChange}
      onPrev={goPrev}
      onNext={goNext}
    />
  );
}
