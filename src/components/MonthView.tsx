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
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { endOfJstDay, formatJst, startOfJstDay } from "@/lib/datetime";
import { useBusyEvents } from "@/lib/use-busy-events";
import { useProposals } from "@/lib/use-proposals";
import { useMeetings, type Meeting } from "@/lib/use-meetings";
import {
  cellEventColorClass,
  enumerateHolidays,
  mergeCellEvents,
  overlapsDay,
  type CellEvent,
} from "@/lib/calendar-events";
import type { ConfirmTarget } from "@/components/ConfirmMeetingDialog";
import type { EventInfo } from "@/components/EventInfoDialog";
import { CalendarHeader, type ViewMode } from "@/components/CalendarHeader";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const weekdayColor = (dayOfWeek: number) => {
  if (dayOfWeek === 0) return "text-rose-600";
  if (dayOfWeek === 6) return "text-sky-600";
  return "text-foreground";
};

type DayCellProps = {
  date: Date;
  cursor: Date;
  events: CellEvent[];
  selected: boolean;
  onSelect: (d: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
};

function DayCell({
  date,
  cursor,
  events,
  selected,
  onSelect,
  onProposalConfirm,
  onMeetingOpen,
  onEventInfoOpen,
}: DayCellProps) {
  const inMonth = isSameMonth(date, cursor);
  const today = isToday(date);
  const dow = getDay(date);
  const dayEvents = useMemo(
    () => events.filter((e) => overlapsDay(e, date)),
    [date, events],
  );

  const renderChipLabel = (e: CellEvent) => {
    if (e.type === "busy") {
      return e.allDay
        ? `終日 ${e.summary}`
        : `${formatJst(e.start, "HH:mm")} ${e.summary}`;
    }
    if (e.type === "proposal") {
      return `候 ${formatJst(e.start, "HH:mm")}–${formatJst(e.end, "HH:mm")} ${e.label}`;
    }
    if (e.type === "meeting") {
      return `${formatJst(e.start, "HH:mm")} ${e.title}`;
    }
    return e.name; // holiday
  };

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
          {dayEvents.slice(0, 2).map((e) => (
            <span
              key={e.key}
              className={cn(
                "truncate rounded px-1 text-[10px] leading-4",
                cellEventColorClass(e.type),
              )}
              title={
                e.type === "busy"
                  ? e.summary
                  : e.type === "proposal"
                    ? e.label
                    : e.type === "meeting"
                      ? e.title
                      : e.name
              }
            >
              {renderChipLabel(e)}
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
            {dayEvents.map((e) => {
              const time =
                (e.type === "busy" && e.allDay) || e.type === "holiday"
                  ? "終日"
                  : `${formatJst(e.start, "HH:mm")} 〜 ${formatJst(e.end, "HH:mm")}`;
              const title =
                e.type === "busy"
                  ? e.summary
                  : e.type === "proposal"
                    ? `候補: ${e.label}`
                    : e.type === "meeting"
                      ? `${e.title} / ${e.companyName}`
                      : `祝日: ${e.name}`;
              const onRowClick = () => {
                if (e.type === "proposal") {
                  onProposalConfirm({
                    proposalId: e.proposalId,
                    slotId: e.slotId,
                    label: e.label,
                    slotStart: e.start,
                    slotEnd: e.end,
                  });
                } else if (e.type === "meeting") {
                  onMeetingOpen(e.meeting);
                } else if (e.type === "busy") {
                  onEventInfoOpen({
                    type: "busy",
                    summary: e.summary,
                    start: e.start,
                    end: e.end,
                    allDay: e.allDay,
                    description: e.description,
                    location: e.location,
                    meetUrl: e.meetUrl,
                  });
                } else {
                  onEventInfoOpen({
                    type: "holiday",
                    name: e.name,
                    start: e.start,
                    end: e.end,
                  });
                }
              };
              return (
                <li key={e.key}>
                  <button
                    type="button"
                    onClick={onRowClick}
                    className={cn(
                      "flex w-full flex-col gap-0.5 rounded border px-2 py-1.5 text-left transition-colors hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:hover:brightness-110",
                      e.type === "busy" && "bg-card",
                      e.type === "proposal" &&
                        "border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30",
                      e.type === "meeting" &&
                        "border-sky-300 bg-sky-50 dark:border-sky-800/60 dark:bg-sky-950/30",
                      e.type === "holiday" &&
                        "border-emerald-300 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30",
                    )}
                  >
                    <span className="text-xs font-medium">{title}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {time}
                    </span>
                  </button>
                </li>
              );
            })}
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
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
};

export function MonthView({
  calendarConnected,
  selectedDate,
  onSelectedDateChange,
  onProposalConfirm,
  onMeetingOpen,
  onEventInfoOpen,
  view,
  onViewChange,
}: Props) {
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

  const cellEvents = useMemo(
    () => [
      ...mergeCellEvents(busy, proposals, meetings),
      ...enumerateHolidays(from, to),
    ],
    [busy, proposals, meetings, from, to],
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <CalendarHeader
        title={format(cursor, "yyyy 年 M 月", { locale: ja })}
        view={view}
        onViewChange={onViewChange}
        onPrev={() => onSelectedDateChange(subMonths(selectedDate, 1))}
        onNext={() => onSelectedDateChange(addMonths(selectedDate, 1))}
        onToday={() => onSelectedDateChange(new Date())}
      />

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

      <div className="grid flex-1 grid-cols-7 border-l overflow-y-auto">
        {days.map((day) => (
          <DayCell
            key={day.toISOString()}
            date={day}
            cursor={cursor}
            events={cellEvents}
            selected={isSameDay(day, selectedDate)}
            onSelect={onSelectedDateChange}
            onProposalConfirm={onProposalConfirm}
            onMeetingOpen={onMeetingOpen}
            onEventInfoOpen={onEventInfoOpen}
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
    </div>
  );
}
