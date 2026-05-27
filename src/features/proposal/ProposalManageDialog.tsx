"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResponsiveModalContent } from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatJst } from "@/lib/datetime";

export type ManagedProposal = {
  id: string;
  label: string;
  slots: { id: string; start: string; end: string }[];
};

type Props = {
  proposal: ManagedProposal | null;
  onClose: () => void;
};

const groupByDate = (slots: ManagedProposal["slots"]) => {
  const map = new Map<string, typeof slots>();
  for (const s of slots) {
    const key = formatJst(s.start, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
};

const buildCopyText = (
  groups: ReturnType<typeof groupByDate>,
  showYear: boolean,
): string =>
  groups
    .map(([dateKey, items]) => {
      const sample = new Date(`${dateKey}T00:00:00+09:00`);
      const datePart = formatJst(
        sample,
        showYear ? "yyyy年 M月d日(E)" : "M月d日(E)",
        { locale: ja },
      );
      const ranges = items
        .map(
          (c) =>
            `${formatJst(c.start, "HH:mm")} 〜 ${formatJst(c.end, "HH:mm")}`,
        )
        .join(" または ");
      return `${datePart} ${ranges}`;
    })
    .join("\n");

export function ProposalManageDialog({ proposal, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState("");
  const [showYear, setShowYear] = useState(false);
  const [busy, setBusy] = useState(false);

  const propKey = proposal?.id ?? null;
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  if (proposal && propKey !== appliedKey) {
    setEditing(false);
    setLabelDraft(proposal.label);
    setShowYear(false);
    setAppliedKey(propKey);
  }

  const groups = useMemo(
    () => (proposal ? groupByDate(proposal.slots) : []),
    [proposal],
  );
  const copyText = useMemo(
    () => buildCopyText(groups, showYear),
    [groups, showYear],
  );

  const close = () => {
    setEditing(false);
    setAppliedKey(null);
    onClose();
  };

  if (!proposal) return null;

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(copyText);
    toast.success("コピーしました");
  };

  const saveLabel = async () => {
    const next = labelDraft.trim();
    if (!next) {
      toast.error("ラベルを入力してください");
      return;
    }
    if (next === proposal.label) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: next }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("ラベルを更新しました");
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["busy"] });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm("この候補を削除しますか? Google Calendar 上の候補イベントも削除されます。")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/proposals/${proposal.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
      }
      toast.success("候補を削除しました");
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["busy"] });
      router.refresh();
      close();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(v) => !v && close()}>
      <ResponsiveModalContent>
        <DialogHeader>
          <DialogTitle>候補の管理</DialogTitle>
          <DialogDescription>
            この候補のコピー / ラベル変更 / 削除ができます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {editing ? (
            <div className="space-y-2">
              <Label htmlFor="pm-label">ラベル</Label>
              <div className="flex gap-2">
                <Input
                  id="pm-label"
                  value={labelDraft}
                  onChange={(e) => setLabelDraft(e.target.value)}
                  maxLength={100}
                  required
                />
                <Button onClick={saveLabel} disabled={busy}>
                  {busy ? "..." : "保存"}
                </Button>
                <Button variant="outline" onClick={() => setEditing(false)}>
                  取消
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-md border bg-muted/30 px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">ラベル</p>
                <p className="text-sm font-medium">{proposal.label}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={showYear}
              onCheckedChange={(v) => setShowYear(!!v)}
            />
            年を含める
          </label>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">コピー内容</Label>
            <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-xs">
              {copyText}
            </pre>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={remove}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" />
            削除
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={close}>
              閉じる
            </Button>
            <Button type="button" onClick={copyToClipboard} disabled={busy}>
              <Copy className="h-4 w-4" />
              コピー
            </Button>
          </div>
        </DialogFooter>
      </ResponsiveModalContent>
    </Dialog>
  );
}
