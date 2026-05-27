"use client";

import { differenceInDays } from "date-fns";
import { ja } from "date-fns/locale";
import { AlertTriangle, BellOff, Trash2 } from "lucide-react";
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
import type { StaleProposal } from "./service";

export type StaleProposalsBannerViewProps = {
  stale: StaleProposal[];
  threshold: number;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  busyId: string | null;
  onIgnore: (id: string) => void;
  onRemove: (id: string, label: string) => void;
};

export function StaleProposalsBannerView({
  stale,
  threshold,
  open,
  onOpenChange,
  busyId,
  onIgnore,
  onRemove,
}: StaleProposalsBannerViewProps) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="flex w-full items-center gap-2 border-b bg-amber-100 px-4 py-2 text-left text-sm text-amber-900 transition-colors hover:bg-amber-200/80 sm:px-6 dark:bg-amber-900/30 dark:text-amber-100 dark:hover:bg-amber-900/50"
      >
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <span className="flex-1">
          <span className="font-medium">{stale.length} 件</span>
          の候補が {threshold} 日以上更新されていません
        </span>
        <span className="text-xs underline">詳細を見る</span>
      </button>

      <Dialog open={open} onOpenChange={onOpenChange}>
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
                        onClick={() => onIgnore(p.id)}
                        disabled={busyId === p.id}
                      >
                        <BellOff className="h-4 w-4" />
                        無視
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onRemove(p.id, p.label)}
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
