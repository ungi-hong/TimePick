"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, startOfDay } from "date-fns";
import { ja } from "date-fns/locale";
import { CalendarCheck, CheckCircle2, ChevronRight, FileText, Settings2 } from "lucide-react";
import { formatJst } from "@/lib/datetime";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Meeting } from "@/lib/use-meetings";
import type { ManagedProposal } from "@/components/ProposalManageDialog";
import type { ConfirmTarget } from "@/components/ConfirmMeetingDialog";

type ProposalListItem = {
  id: string;
  label: string;
  status: "OPEN" | "CONFIRMED" | "CANCELLED";
  slots: { id: string; start: string; end: string }[];
};

type ProposalsResponse = { proposals: ProposalListItem[] };
type MeetingsResponse = { meetings: Meeting[] };

const fetchOpenProposals = async (from: Date): Promise<ProposalListItem[]> => {
  const url = new URL("/api/proposals", window.location.origin);
  url.searchParams.set("status", "OPEN");
  url.searchParams.set("from", from.toISOString());
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ProposalsResponse;
  return data.proposals;
};

const fetchFutureMeetings = async (from: Date, to: Date): Promise<Meeting[]> => {
  const url = new URL("/api/meetings", window.location.origin);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as MeetingsResponse;
  return data.meetings;
};

type Props = {
  onProposalOpen: (p: ManagedProposal) => void;
  onMeetingOpen: (m: Meeting) => void;
  onSlotConfirm: (target: ConfirmTarget) => void;
};

export function SidebarLists({ onProposalOpen, onMeetingOpen, onSlotConfirm }: Props) {
  const from = useMemo(() => startOfDay(new Date()), []);
  const to = useMemo(() => addMonths(from, 6), [from]);

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals", "sidebar", from.toISOString()],
    queryFn: () => fetchOpenProposals(from),
    staleTime: 30_000,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", "sidebar", from.toISOString(), to.toISOString()],
    queryFn: () => fetchFutureMeetings(from, to),
    staleTime: 30_000,
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-3 text-sm">
      <section>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <FileText className="h-3.5 w-3.5" />
          候補 ({proposals.length})
        </h4>
        {proposals.length === 0 ? (
          <p className="text-xs text-muted-foreground">候補はまだありません。</p>
        ) : (
          <ul className="space-y-1">
            {proposals.map((p) => {
              const isOpen = expanded.has(p.id);
              return (
                <li
                  key={p.id}
                  className={cn(
                    "overflow-hidden rounded-md border transition-colors",
                    "border-amber-300/70 bg-amber-50/50",
                    "dark:border-amber-800/40 dark:bg-amber-950/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggle(p.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left transition-colors hover:bg-amber-100/70 dark:hover:bg-amber-950/40"
                  >
                    <ChevronRight
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform",
                        isOpen && "rotate-90",
                      )}
                    />
                    <span className="flex-1 truncate text-xs font-medium">
                      {p.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.slots.length} 件
                    </span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-amber-200/60 bg-background/60 px-2.5 py-2 dark:border-amber-800/40">
                      <ul className="space-y-1">
                        {p.slots.map((s) => (
                          <li
                            key={s.id}
                            className="flex items-center justify-between gap-2"
                          >
                            <span className="flex-1 text-[11px] text-muted-foreground">
                              {formatJst(s.start, "M/d (E) HH:mm", { locale: ja })}
                              {" 〜 "}
                              {formatJst(s.end, "HH:mm")}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-6 shrink-0 px-1.5 text-[11px] text-emerald-700 hover:bg-emerald-100 hover:text-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                              onClick={() =>
                                onSlotConfirm({
                                  proposalId: p.id,
                                  slotId: s.id,
                                  label: p.label,
                                  slotStart: s.start,
                                  slotEnd: s.end,
                                })
                              }
                              aria-label="この候補で確定"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              確定
                            </Button>
                          </li>
                        ))}
                      </ul>
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-[11px]"
                          onClick={() =>
                            onProposalOpen({
                              id: p.id,
                              label: p.label,
                              slots: p.slots,
                            })
                          }
                        >
                          <Settings2 className="h-3 w-3" />
                          管理 (コピー / 編集 / 削除)
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <CalendarCheck className="h-3.5 w-3.5" />
          確定済み ({meetings.length})
        </h4>
        {meetings.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            予定された面談はありません。
          </p>
        ) : (
          <ul className="space-y-1">
            {meetings.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => onMeetingOpen(m)}
                  className={cn(
                    "flex w-full flex-col items-start gap-0.5 rounded-md border px-2.5 py-1.5 text-left transition-colors",
                    "border-sky-300/70 bg-sky-50/50 hover:bg-sky-100/70",
                    "dark:border-sky-800/40 dark:bg-sky-950/20 dark:hover:bg-sky-950/40",
                  )}
                >
                  <span className="truncate text-xs font-medium">{m.title}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {formatJst(m.start, "M/d (E) HH:mm", { locale: ja })}
                    {" 〜 "}
                    {formatJst(m.end, "HH:mm")}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
