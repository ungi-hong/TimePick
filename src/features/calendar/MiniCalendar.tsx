"use client";

import { useMemo } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const weekdayColor = (dayOfWeek: number) => {
  if (dayOfWeek === 0) return "text-rose-600";
  if (dayOfWeek === 6) return "text-sky-600";
  return "text-foreground";
};

type Props = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

export function MiniCalendar({ selectedDate, onSelectedDateChange }: Props) {
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

  return (
    <div className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {format(cursor, "yyyy 年 M 月", { locale: ja })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            aria-label="前の月"
            className="rounded p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="次の月"
            className="rounded p-1 text-muted-foreground hover:bg-accent/40 hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px]">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn("py-1 font-medium", weekdayColor(i))}
          >
            {label}
          </div>
        ))}
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const selected = isSameDay(day, selectedDate);
          const today = isToday(day);
          const dow = getDay(day);

          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelectedDateChange(day)}
              className={cn(
                "mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors",
                !inMonth && "text-muted-foreground/60",
                inMonth && !today && !selected && weekdayColor(dow),
                today && !selected && "border border-primary text-primary",
                selected && "bg-primary text-primary-foreground",
                !selected && "hover:bg-accent/50",
              )}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
