import { addDays } from "date-fns";
import { endOfJstDay, formatJst, JST, startOfJstDay } from "@/lib/datetime";
import { getHolidayName, isHoliday } from "@/lib/holiday";
import type { BusyEvent } from "@/lib/use-busy-events";
import type { ProposalSlotEntry } from "@/lib/use-proposals";
import type { Meeting } from "@/lib/use-meetings";

export type CellEvent =
  | {
      type: "busy";
      start: string;
      end: string;
      summary: string;
      allDay: boolean;
      description: string | null;
      location: string | null;
      meetUrl: string | null;
      key: string;
    }
  | {
      type: "proposal";
      start: string;
      end: string;
      label: string;
      proposalId: string;
      slotId: string;
      key: string;
    }
  | {
      type: "meeting";
      start: string;
      end: string;
      title: string;
      companyName: string;
      meeting: Meeting;
      key: string;
    }
  | {
      type: "holiday";
      start: string;
      end: string;
      name: string;
      key: string;
    };

export const overlapsDay = (
  event: { start: string; end: string },
  date: Date,
): boolean => {
  const dayStart = startOfJstDay(date).getTime();
  const dayEnd = endOfJstDay(date).getTime();
  const s = new Date(event.start).getTime();
  const e = new Date(event.end).getTime();
  return s < dayEnd && e > dayStart;
};

export const mergeCellEvents = (
  busy: BusyEvent[],
  proposals: ProposalSlotEntry[],
  meetings: Meeting[],
): CellEvent[] => [
  ...busy.map<CellEvent>((b, i) => ({
    type: "busy",
    start: b.start,
    end: b.end,
    summary: b.summary,
    allDay: b.allDay,
    description: b.description,
    location: b.location,
    meetUrl: b.meetUrl,
    key: `busy-${b.googleEventId}-${i}`,
  })),
  ...proposals.map<CellEvent>((p) => ({
    type: "proposal",
    start: p.start,
    end: p.end,
    label: p.label,
    proposalId: p.proposalId,
    slotId: p.slotId,
    key: `proposal-${p.slotId}`,
  })),
  ...meetings.map<CellEvent>((m) => ({
    type: "meeting",
    start: m.start,
    end: m.end,
    title: m.title,
    companyName: m.companyName,
    meeting: m,
    key: `meeting-${m.id}`,
  })),
];

export const enumerateHolidays = (from: Date, to: Date): CellEvent[] => {
  const events: CellEvent[] = [];
  let cursor = startOfJstDay(from);
  const limit = to.getTime();
  while (cursor.getTime() <= limit) {
    if (isHoliday(cursor)) {
      const dayKey = formatJst(cursor, "yyyy-MM-dd");
      events.push({
        type: "holiday",
        start: `${dayKey}T00:00:00+09:00`,
        end: `${dayKey}T23:59:59+09:00`,
        name: getHolidayName(cursor) ?? "祝日",
        key: `holiday-${dayKey}`,
      });
    }
    cursor = addDays(cursor, 1);
  }
  return events;
};

export const cellEventColorClass = (type: CellEvent["type"]): string => {
  switch (type) {
    case "busy":
      return "bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200";
    case "proposal":
      return "bg-amber-200 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100";
    case "meeting":
      return "bg-sky-200 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100";
    case "holiday":
      return "bg-emerald-200 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100";
  }
};

// 表示用タイトル。短形式 (リスト中) と詳細形式 (popover) で文言が違うため variant を分ける。
export const cellEventTitle = (
  e: CellEvent,
  variant: "short" | "detail" = "short",
): string => {
  switch (e.type) {
    case "busy":
      return e.summary;
    case "proposal":
      return `候補: ${e.label}`;
    case "meeting":
      return variant === "detail" ? `${e.title} / ${e.companyName}` : e.title;
    case "holiday":
      return variant === "detail" ? `祝日: ${e.name}` : e.name;
  }
};

export { JST };
