"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertTriangle, BellOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatJst } from "@/lib/datetime";

type StaleProposal = {
  id: string;
  label: string;
  updatedAt: string;
  slots: { id: string; start: string; end: string }[];
};

type Response = { thresholdDays: number; proposals: StaleProposal[] };

const fetchStale = async (): Promise<Response> => {
  const res = await fetch("/api/proposals/stale");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export function StaleProposalsBanner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["proposals", "stale"],
    queryFn: fetchStale,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const stale = data?.proposals ?? [];
  const threshold = data?.thresholdDays ?? 7;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["proposals"] }),
      queryClient.invalidateQueries({ queryKey: ["busy"] }),
    ]);
    router.refresh();
  };

  const ignore = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/proposals/${id}/touch`, { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("候補の更新日時を最新にしました");
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string, label: string) => {
    if (!confirm(`「${label}」を削除しますか? Google Calendar の候補イベントも削除されます。`)) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      toast.success("候補を削除しました");
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  if (stale.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 border-b bg-amber-100 px-4 py-2 text-left text-sm text-amber-900 transition-colors hover:bg-amber-200/80 sm:px-6 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          <span className="font-medium">{stale.length} 件</span>
          の候補が {threshold} 日以上更新されていません
        </span>
        <span className="text-xs underline">詳細を見る</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>長期間更新のない候補</DialogTitle>
            <DialogDescription>
              「無視」は更新日時を今に戻して通知から外します。「削除」は候補そのものを削除します (Google Calendar 同期)。
            </DialogDescription>
          </DialogHeader>

          {stale.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              すべて処理されました。
            </p>
          ) : (
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto pr-1">
              {stale.map((p) => {
                const days = differenceInDays(new Date(), new Date(p.updatedAt));
                const earliest = p.slots[0];
                return (
                  <li
                    key={p.id}
                    className="space-y-2 rounded-md border bg-card px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {days} 日前更新 / 候補 {p.slots.length} 件
                        {earliest && (
                          <>
                            {" "}
                            ・ 最初:{" "}
                            {formatJst(earliest.start, "M/d (E) HH:mm", {
                              locale: ja,
                            })}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => ignore(p.id)}
                        disabled={busyId === p.id}
                      >
                        <BellOff className="h-4 w-4" />
                        無視
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => remove(p.id, p.label)}
                        disabled={busyId === p.id}
                      >
                        <Trash2 className="h-4 w-4" />
                        削除
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
