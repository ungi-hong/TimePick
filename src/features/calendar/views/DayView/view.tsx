"use client";

import { addDays, format, isToday, subDays } from "date-fns";
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

const START_HOUR = 0;
const END_HOUR = 24;
const HOUR_HEIGHT = 48;
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i,
);

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

export type DayViewViewProps = {
  selectedDate: Date;
  onSelectedDateChange: (date: Date) => void;
  onProposalConfirm: (target: ConfirmTarget) => void;
  onMeetingOpen: (meeting: Meeting) => void;
  onEventInfoOpen: (info: EventInfo) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  dayStart: Date;
  allDayEvents: CellEvent[];
  timedEvents: CellEvent[];
};

export function DayViewView({
  selectedDate,
  onSelectedDateChange,
  onProposalConfirm,
  onMeetingOpen,
  onEventInfoOpen,
  view,
  onViewChange,
  dayStart,
  allDayEvents,
  timedEvents,
}: DayViewViewProps) {
  const today = isToday(selectedDate);

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

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <CalendarHeader
        title={format(selectedDate, "yyyy 年 M 月 d 日 (E)", { locale: ja })}
        view={view}
        onViewChange={onViewChange}
        onPrev={() => onSelectedDateChange(subDays(selectedDate, 1))}
        onNext={() => onSelectedDateChange(addDays(selectedDate, 1))}
        onToday={() => onSelectedDateChange(new Date())}
      />

      {allDayEvents.length > 0 && (
        <div className="border-b bg-muted/30 px-4 py-2">
          <p className="mb-1 text-[10px] font-semibold text-muted-foreground">
            終日
          </p>
          <ul className="space-y-1">
            {allDayEvents.map((e) => (
              <li key={e.key}>
                <button
                  type="button"
                  onClick={() => onClickEvent(e)}
                  className={cn(
                    "w-full rounded px-2 py-1 text-left text-xs transition-opacity hover:opacity-80",
                    cellEventColorClass(e.type),
                  )}
                >
                  {eventTitle(e)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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

          <div className="relative flex-1">
            {HOURS.map((h) => (
              <div
                key={h}
                className="border-b"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}
            {today && <NowLine />}
            {timedEvents.map((e) => {
              const style = computeStyle(e, dayStart);
              if (!style) return null;
              return (
                <button
                  key={e.key}
                  type="button"
                  onClick={() => onClickEvent(e)}
                  style={style}
                  className={cn(
                    "absolute left-1 right-1 overflow-hidden rounded-md border px-2 py-1 text-left text-xs shadow-sm transition-opacity hover:opacity-80",
                    cellEventColorClass(e.type),
                  )}
                >
                  <div className="font-medium">{eventTitle(e)}</div>
                  <div className="text-[10px] opacity-80">
                    {formatJst(e.start, "HH:mm")}–{formatJst(e.end, "HH:mm")}
                  </div>
                </button>
              );
            })}
          </div>
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
