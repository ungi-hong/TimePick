"use client";

import { useMemo } from "react";
import Link from "next/link";
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
import { ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { endOfJstDay, formatJst, startOfJstDay } from "@/lib/datetime";
import { useBusyEvents, type BusyEvent } from "@/lib/use-busy-events";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const weekdayColor = (dayOfWeek: number) => {
  if (dayOfWeek === 0) return "text-rose-600";
  if (dayOfWeek === 6) return "text-sky-600";
  return "text-foreground";
};

const eventsOverlappingDay = (date: Date, events: BusyEvent[]) => {
  const dayStart = startOfJstDay(date).getTime();
  const dayEnd = endOfJstDay(date).getTime();
  return events.filter((e) => {
    const s = new Date(e.start).getTime();
    const en = new Date(e.end).getTime();
    return s < dayEnd && en > dayStart;
  });
};

type DayCellProps = {
  date: Date;
  cursor: Date;
  events: BusyEvent[];
  selected: boolean;
  onSelect: (d: Date) => void;
};

function DayCell({ date, cursor, events, selected, onSelect }: DayCellProps) {
  const inMonth = isSameMonth(date, cursor);
  const today = isToday(date);
  const dow = getDay(date);
  const dayEvents = useMemo(() => eventsOverlappingDay(date, events), [date, events]);

  return (
    <Popover>
      <PopoverTrigger
        onClick={() => onSelect(date)}
        className={cn(
          "flex min-h-[4.5rem] flex-col gap-1 border-r border-t px-1.5 py-1 text-left transition-colors hover:bg-accent/30 sm:min-h-[6rem] sm:px-2",
          !inMonth && "bg-muted/30 text-muted-foreground",
          selected && inMonth && "bg-accent/40",
        )}
      >
        <span
          className={cn(
            "inline-flex h-6 w-6 items-center justify-center text-xs font-medium",
            today && "rounded-full bg-primary text-primary-foreground",
            !today && inMonth && weekdayColor(dow),
          )}
        >
          {date.getDate()}
        </span>
        <div className="flex flex-col gap-0.5">
          {dayEvents.slice(0, 2).map((e, i) => (
            <span
              key={`${e.googleEventId}-${i}`}
              className="truncate rounded bg-zinc-200 px-1 text-[10px] leading-4 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200"
              title={e.summary}
            >
              {e.allDay
                ? `終日 ${e.summary}`
                : `${formatJst(e.start, "HH:mm")} ${e.summary}`}
            </span>
          ))}
          {dayEvents.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{dayEvents.length - 2} 件
            </span>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80">
        <PopoverHeader>
          <PopoverTitle>
            {format(date, "yyyy 年 M 月 d 日 (E)", { locale: ja })}
          </PopoverTitle>
        </PopoverHeader>
        {dayEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            この日に予定はありません。
          </p>
        ) : (
          <ul className="flex flex-col gap-1.5">
            {dayEvents.map((e, i) => (
              <li
                key={`${e.googleEventId}-${i}`}
                className="flex flex-col gap-0.5 rounded border bg-card px-2 py-1.5"
              >
                <span className="text-xs font-medium">{e.summary}</span>
                <span className="text-[11px] text-muted-foreground">
                  {e.allDay
                    ? "終日"
                    : `${formatJst(e.start, "HH:mm")} – ${formatJst(e.end, "HH:mm")}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

type Props = {
  calendarConnected: boolean;
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
};

export function MonthCalendar({
  calendarConnected,
  selectedDate,
  onSelectedDateChange,
}: Props) {
  const cursor = useMemo(() => startOfMonth(selectedDate), [selectedDate]);

  const { gridStart, gridEnd, days } = useMemo(() => {
    const monthStart = startOfMonth(cursor);
    const monthEnd = endOfMonth(cursor);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    const days: Date[] = [];
    let d = gridStart;
    while (d <= gridEnd) {
      days.push(d);
      d = addDays(d, 1);
    }
    return { gridStart, gridEnd, days };
  }, [cursor]);

  const { data: events = [], isLoading, error } = useBusyEvents({
    from: startOfJstDay(gridStart),
    to: endOfJstDay(gridEnd),
    enabled: calendarConnected,
  });

  const goPrev = () => onSelectedDateChange(subMonths(selectedDate, 1));
  const goNext = () => onSelectedDateChange(addMonths(selectedDate, 1));
  const goToday = () => onSelectedDateChange(new Date());

  return (
    <section className="flex flex-1 flex-col">
      {!calendarConnected && (
        <div className="flex flex-wrap items-center gap-2 border-b bg-amber-50 px-4 py-2 text-sm text-amber-900 sm:px-6 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>
            Google Calendar が連携されていないため、既存予定は表示されません。
          </span>
          <Link href="/settings" className="underline">
            設定で連携する
          </Link>
        </div>
      )}

      <div className="flex items-center justify-between border-b px-4 py-3 sm:px-6">
        <h2 className="text-base font-semibold tracking-tight sm:text-lg">
          {format(cursor, "yyyy 年 M 月", { locale: ja })}
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" onClick={goPrev} aria-label="前の月">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            今日
          </Button>
          <Button variant="outline" size="sm" onClick={goNext} aria-label="次の月">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-l text-xs">
        {WEEKDAY_LABELS.map((label, i) => (
          <div
            key={label}
            className={cn(
              "border-r border-t bg-muted/30 px-2 py-1 text-center font-medium",
              weekdayColor(i),
            )}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid flex-1 grid-cols-7 border-l">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            date={day}
            cursor={cursor}
            events={events}
            selected={isSameDay(day, selectedDate)}
            onSelect={onSelectedDateChange}
          />
        ))}
      </div>

      {calendarConnected && isLoading && (
        <div className="border-t px-4 py-2 text-xs text-muted-foreground sm:px-6">
          予定を読み込み中…
        </div>
      )}
      {calendarConnected && error && (
        <div className="border-t bg-rose-50 px-4 py-2 text-xs text-rose-900 sm:px-6 dark:bg-rose-950/30 dark:text-rose-200">
          予定の取得に失敗しました ({error.message})
        </div>
      )}
    </section>
  );
}
