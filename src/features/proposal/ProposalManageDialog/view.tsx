"use client";

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
import type { ManagedProposal } from "./service";

export type ProposalManageDialogViewProps = {
  proposal: ManagedProposal;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  labelDraft: string;
  onLabelDraftChange: (v: string) => void;
  showYear: boolean;
  onShowYearChange: (v: boolean) => void;
  copyText: string;
  busy: boolean;
  onClose: () => void;
  onSaveLabel: () => void;
  onCopy: () => void;
  onRemove: () => void;
};

export function ProposalManageDialogView({
  proposal,
  editing,
  onEditingChange,
  labelDraft,
  onLabelDraftChange,
  showYear,
  onShowYearChange,
  copyText,
  busy,
  onClose,
  onSaveLabel,
  onCopy,
  onRemove,
}: ProposalManageDialogViewProps) {
  return (
    <Dialog open={true} onOpenChange={(v) => !v && onClose()}>
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
                  onChange={(e) => onLabelDraftChange(e.target.value)}
                  maxLength={100}
                  required
                />
                <Button onClick={onSaveLabel} disabled={busy}>
                  {busy ? "..." : "保存"}
                </Button>
                <Button variant="outline" onClick={() => onEditingChange(false)}>
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
                onClick={() => onEditingChange(true)}
              >
                <Pencil className="h-4 w-4" />
                編集
              </Button>
            </div>
          )}

          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
              checked={showYear}
              onCheckedChange={(v) => onShowYearChange(!!v)}
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
            onClick={onRemove}
            disabled={busy}
          >
            <Trash2 className="h-4 w-4" />
            削除
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              閉じる
            </Button>
            <Button type="button" onClick={onCopy} disabled={busy}>
              <Copy className="h-4 w-4" />
              コピー
            </Button>
          </div>
        </DialogFooter>
      </ResponsiveModalContent>
    </Dialog>
  );
}
