"use client";

import {
  addMonths,
  format,
  isSameDay,
  isToday,
  subMonths,
} from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatJst } from "@/lib/datetime";
import type { Meeting } from "@/lib/use-meetings";
import {
  cellEventColorClass,
  type CellEvent,
} from "@/lib/calendar-events";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import {
  CalendarHeader,
  type ViewMode,
} from "@/features/calendar/CalendarHeader";
import type { WeekGroup } from "./use-schedule-view";

const dayWeekColor = (dow: number) => {
  if (dow === 0) return "text-rose-600";
  if (dow === 6) return "text-sky-600";
  return "text-foreground";
};

const eventTimeLabel = (e: CellEvent) => {
  if (e.type === "holiday") return "終日";
  if (e.type === "busy" && e.allDay) return "終日";
  return `${formatJst(e.start, "HH:mm")} 〜 ${formatJst(e.end, "HH:mm")}`;
};

const eventTitle = (e: CellEvent) => {
  if (e.type === "busy") return e.summary;
  if (e.type === "proposal") return `候補: ${e.label}`;
  if (e.type === "meeting") return `${e.title} / ${e.companyName}`;
  return e.name;
};

export type ScheduleViewViewProps = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  weeks: WeekGroup[];
};

export function ScheduleViewView({
  selectedDate,
  onSelectedDateChange,
  onProposalConfirm,
  onMeetingOpen,
  onEventInfoOpen,
  view,
  onViewChange,
  weeks,
}: ScheduleViewViewProps) {
  let lastMonth: number | null = null;

  const handleClick = (e: CellEvent) => {
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
    <div className="flex flex-1 flex-col overflow-hidden">
      <CalendarHeader
        title="スケジュール"
        view={view}
        onViewChange={onViewChange}
        onPrev={() => onSelectedDateChange(subMonths(selectedDate, 1))}
        onNext={() => onSelectedDateChange(addMonths(selectedDate, 1))}
        onToday={() => onSelectedDateChange(new Date())}
      />

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {weeks.map((week, i) => {
          const month = week.weekStart.getMonth();
          const showMonthHeader = month !== lastMonth;
          lastMonth = month;
          return (
            <div key={i} className="space-y-2 pb-4">
              {showMonthHeader && (
                <div className="my-3 flex items-center gap-3 first:mt-0">
                  <div className="h-px flex-1 bg-border" />
                  <h3 className="text-base font-bold tracking-tight">
                    {format(week.weekStart, "yyyy 年 M 月", { locale: ja })}
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                </div>
              )}
              <p className="text-xs font-medium text-muted-foreground">
                {formatJst(week.weekStart, "M月d日")} –{" "}
                {formatJst(week.weekEnd, "M月d日")}
              </p>

              {week.days.length === 0 ? (
                <p className="text-xs text-muted-foreground/60">(予定なし)</p>
              ) : (
                <ul className="space-y-2">
                  {week.days.map((d) => {
                    const dow = d.date.getDay();
                    const today = isToday(d.date);
                    const selected = isSameDay(d.date, selectedDate);
                    return (
                      <li key={d.date.toISOString()} className="flex gap-3">
                        <div className="flex w-10 shrink-0 flex-col items-center pt-1">
                          <span
                            className={cn("text-[10px]", dayWeekColor(dow))}
                          >
                            {format(d.date, "E", { locale: ja })}
                          </span>
                          <span
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                              today && "bg-primary text-primary-foreground",
                              !today && selected && "bg-accent",
                              !today && !selected && dayWeekColor(dow),
                            )}
                          >
                            {d.date.getDate()}
                          </span>
                        </div>
                        <ul className="flex-1 space-y-1">
                          {d.events.map((e) => (
                            <li key={e.key}>
                              <button
                                type="button"
                                onClick={() => handleClick(e)}
                                className={cn(
                                  "block w-full rounded-md px-3 py-2 text-left transition-opacity hover:opacity-80",
                                  cellEventColorClass(e.type),
                                )}
                              >
                                <span className="block text-sm font-medium">
                                  {eventTitle(e)}
                                </span>
                                <span className="block text-[11px] opacity-80">
                                  {eventTimeLabel(e)}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
