"use client";

import {
  addWeeks,
  format,
  isSameDay,
  isToday,
  subWeeks,
} from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { formatJst, startOfJstDay } from "@/lib/datetime";
import type { Meeting } from "@/lib/use-meetings";
import {
  cellEventColorClass,
  overlapsDay,
  type CellEvent,
} from "@/lib/calendar-events";
import type { ConfirmTarget } from "@/features/proposal/ConfirmMeetingDialog";
import type { EventInfo } from "@/features/calendar/EventInfoDialog";
import {
  CalendarHeader,
  type ViewMode,
} from "@/features/calendar/CalendarHeader";

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 48;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

const dayWeekColor = (dow: number) => {
  if (dow === 0) return "text-rose-600";
  if (dow === 6) return "text-sky-600";
  return "text-foreground";
};

const eventTitle = (e: CellEvent) => {
  if (e.type === "busy") return e.summary;
  if (e.type === "proposal") return `候補: ${e.label}`;
  if (e.type === "meeting") return e.title;
  return e.name;
};

const computeStyle = (
  event: CellEvent,
  dayStart: Date,
): React.CSSProperties | null => {
  const dayStartMs = dayStart.getTime();
  const visibleStartMs = dayStartMs + START_HOUR * 3_600_000;
  const visibleEndMs = dayStartMs + END_HOUR * 3_600_000;

  const eventStartMs = new Date(event.start).getTime();
  const eventEndMs = new Date(event.end).getTime();

  if (eventEndMs <= visibleStartMs || eventStartMs >= visibleEndMs) return null;

  const clampedStart = Math.max(eventStartMs, visibleStartMs);
  const clampedEnd = Math.min(eventEndMs, visibleEndMs);
  const top = ((clampedStart - visibleStartMs) / 3_600_000) * HOUR_HEIGHT;
  const height = Math.max(
    ((clampedEnd - clampedStart) / 3_600_000) * HOUR_HEIGHT,
    20,
  );
  return { top, height };
};

export type WeekViewViewProps = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  weekStart: Date;
  weekEnd: Date;
  days: Date[];
  events: CellEvent[];
};

export function WeekViewView({
  selectedDate,
  onSelectedDateChange,
  onProposalConfirm,
  onMeetingOpen,
  onEventInfoOpen,
  view,
  onViewChange,
  weekStart,
  weekEnd,
  days,
  events,
}: WeekViewViewProps) {
  const onClickEvent = (e: CellEvent) => {
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

  const title = `${format(weekStart, "M 月 d 日", { locale: ja })} – ${format(
    weekEnd,
    "M 月 d 日",
    { locale: ja },
  )}`;

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <CalendarHeader
        title={title}
        view={view}
        onViewChange={onViewChange}
        onPrev={() => onSelectedDateChange(subWeeks(selectedDate, 1))}
        onNext={() => onSelectedDateChange(addWeeks(selectedDate, 1))}
        onToday={() => onSelectedDateChange(new Date())}
      />

      <div className="flex border-b bg-background">
        <div className="w-14 shrink-0 border-r" />
        {days.map((d) => {
          const isCurrent = isToday(d);
          const selected = isSameDay(d, selectedDate);
          const dow = d.getDay();
          return (
            <button
              key={d.toISOString()}
              type="button"
              onClick={() => onSelectedDateChange(d)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 border-r py-2 transition-colors hover:bg-accent/30",
                selected && "bg-accent/30",
              )}
            >
              <span className={cn("text-[10px]", dayWeekColor(dow))}>
                {format(d, "E", { locale: ja })}
              </span>
              <span
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                  isCurrent && "bg-primary text-primary-foreground",
                  !isCurrent && dayWeekColor(dow),
                )}
              >
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {(() => {
        const allDay = events.filter(
          (e) => e.type === "holiday" || (e.type === "busy" && e.allDay),
        );
        if (allDay.length === 0) return null;
        return (
          <div className="flex border-b bg-muted/30 text-[10px]">
            <div className="w-14 shrink-0 border-r py-1 text-right pr-1.5 text-muted-foreground">
              終日
            </div>
            {days.map((d) => {
              const dayItems = allDay.filter((e) => overlapsDay(e, d));
              return (
                <div
                  key={d.toISOString()}
                  className="min-h-[1.5rem] flex-1 border-r px-1 py-0.5"
                >
                  {dayItems.map((e) => (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => onClickEvent(e)}
                      className={cn(
                        "block w-full truncate rounded px-1 text-left leading-4 transition-opacity hover:opacity-80",
                        cellEventColorClass(e.type),
                      )}
                    >
                      {eventTitle(e)}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        );
      })()}

      <div className="flex-1 overflow-y-auto">
        <div
          className="relative flex"
          style={{ height: HOURS.length * HOUR_HEIGHT }}
        >
          <div className="w-14 shrink-0 border-r">
            {HOURS.map((h) => (
              <div
                key={h}
                className="relative text-right text-[10px] text-muted-foreground"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-1.5 right-1.5">
                  {h.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {days.map((d) => {
            const dayStart = startOfJstDay(d);
            const dayTimedEvents = events
              .filter(
                (e) =>
                  !(
                    e.type === "holiday" ||
                    (e.type === "busy" && e.allDay)
                  ),
              )
              .filter((e) => overlapsDay(e, d));
            const currentDay = isToday(d);
            return (
              <div key={d.toISOString()} className="relative flex-1 border-r">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}
                {currentDay && <NowLine />}
                {dayTimedEvents.map((e) => {
                  const style = computeStyle(e, dayStart);
                  if (!style) return null;
                  return (
                    <button
                      key={e.key}
                      type="button"
                      onClick={() => onClickEvent(e)}
                      style={style}
                      className={cn(
                        "absolute left-0.5 right-0.5 overflow-hidden rounded px-1 py-0.5 text-left text-[10px] leading-tight shadow-sm transition-opacity hover:opacity-80",
                        cellEventColorClass(e.type),
                      )}
                    >
                      <div className="font-medium">{eventTitle(e)}</div>
                      <div className="opacity-80">
                        {formatJst(e.start, "HH:mm")}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NowLine() {
  const now = new Date();
  const top = (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT;
  return (
    <div
      className="pointer-events-none absolute left-0 right-0 z-10 h-px bg-rose-500"
      style={{ top }}
    >
      <div className="absolute -left-1 -top-1 h-2 w-2 rounded-full bg-rose-500" />
    </div>
  );
}
