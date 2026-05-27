"use client";

import { ja } from "date-fns/locale";
import { CheckCircle2, Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { formatJst } from "@/lib/datetime";
import type {
  Phase,
  SelectableCandidate,
  Candidate,
} from "./service";

export type ProposalGenerateDialogViewProps = {
  disabled?: boolean;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  phase: Phase;
  onPhaseBack: () => void;

  label: string;
  onLabelChange: (v: string) => void;
  from: string;
  onFromChange: (v: string) => void;
  to: string;
  onToChange: (v: string) => void;
  minRangeMinutes: number;
  onMinRangeMinutesChange: (v: number) => void;
  bufferAfterMinutes: number;
  onBufferAfterMinutesChange: (v: number) => void;

  generating: boolean;
  saving: boolean;
  candidates: SelectableCandidate[];
  previewGroups: Array<[string, SelectableCandidate[]]>;
  selectedCount: number;
  onGenerate: (e: React.FormEvent) => void;
  onSetAll: (selected: boolean) => void;
  onToggle: (index: number, checked: boolean) => void;
  onSave: () => void;

  savedLabel: string;
  savedCandidates: Candidate[];
  showYear: boolean;
  onShowYearChange: (v: boolean) => void;
  copyText: string;
  onCopy: () => void;
};

export function ProposalGenerateDialogView({
  disabled,
  open,
  onOpenChange,
  phase,
  onPhaseBack,
  label,
  onLabelChange,
  from,
  onFromChange,
  to,
  onToChange,
  minRangeMinutes,
  onMinRangeMinutesChange,
  bufferAfterMinutes,
  onBufferAfterMinutesChange,
  generating,
  saving,
  candidates,
  previewGroups,
  selectedCount,
  onGenerate,
  onSetAll,
  onToggle,
  onSave,
  savedLabel,
  savedCandidates,
  showYear,
  onShowYearChange,
  copyText,
  onCopy,
}: ProposalGenerateDialogViewProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger
        render={
          <Button
            variant="default"
            size="sm"
            disabled={disabled}
            className="w-full"
          />
        }
      >
        <Sparkles className="h-4 w-4" />
        候補を生成
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        {phase === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>候補を生成</DialogTitle>
              <DialogDescription>
                稼働時間から busy 時間と既存の候補・確定面談を除いた空き時間レンジを抽出します。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={onGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pg-label">ラベル (会社名など)</Label>
                <Input
                  id="pg-label"
                  value={label}
                  onChange={(e) => onLabelChange(e.target.value)}
                  placeholder="例: ABC 株式会社 一次面接"
                  required
                  maxLength={100}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pg-from">開始日</Label>
                  <Input
                    id="pg-from"
                    type="date"
                    required
                    value={from}
                    onChange={(e) => onFromChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pg-to">終了日</Label>
                  <Input
                    id="pg-to"
                    type="date"
                    required
                    value={to}
                    onChange={(e) => onToChange(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="pg-min">最小レンジ (分)</Label>
                  <Input
                    id="pg-min"
                    type="number"
                    min={15}
                    max={480}
                    step={15}
                    required
                    value={minRangeMinutes}
                    onChange={(e) =>
                      onMinRangeMinutesChange(Number(e.target.value))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    これより短い空きは候補にしません
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pg-buffer">バッファ (分)</Label>
                  <Input
                    id="pg-buffer"
                    type="number"
                    min={0}
                    max={180}
                    step={5}
                    required
                    value={bufferAfterMinutes}
                    onChange={(e) =>
                      onBufferAfterMinutesChange(Number(e.target.value))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">
                    busy の終了から N 分は確保
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={generating}>
                  {generating ? "生成中…" : "候補を生成"}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}

        {phase === "preview" && (
          <>
            <DialogHeader>
              <DialogTitle>候補を確認</DialogTitle>
              <DialogDescription>
                保存したい候補を選んでください。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                ラベル:{" "}
                <span className="font-medium text-foreground">{label}</span>
                <span className="ml-2">
                  / 選択 {selectedCount} / 全 {candidates.length}
                </span>
              </div>

              {candidates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  空き時間が見つかりませんでした。期間を広げるか、最小レンジ / バッファを短くしてください。
                </p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSetAll(true)}
                    >
                      全選択
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onSetAll(false)}
                    >
                      全解除
                    </Button>
                  </div>

                  <ul className="max-h-72 space-y-3 overflow-y-auto pr-1">
                    {previewGroups.map(([dateKey, items]) => {
                      const dateLabel = formatJst(
                        new Date(`${dateKey}T00:00:00+09:00`),
                        "M月d日(E)",
                        { locale: ja },
                      );
                      return (
                        <li key={dateKey} className="space-y-1">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {dateLabel}
                          </p>
                          {items.map((c) => {
                            const idx = candidates.indexOf(c);
                            return (
                              <label
                                key={`${c.start}-${idx}`}
                                className="flex cursor-pointer items-center gap-3 rounded-md border bg-card px-3 py-2 text-sm hover:bg-accent/30"
                              >
                                <Checkbox
                                  checked={c.selected}
                                  onCheckedChange={(checked) =>
                                    onToggle(idx, !!checked)
                                  }
                                />
                                <span>
                                  {formatJst(c.start, "HH:mm")} 〜{" "}
                                  {formatJst(c.end, "HH:mm")}
                                </span>
                              </label>
                            );
                          })}
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={onPhaseBack}>
                戻る
              </Button>
              <Button
                type="button"
                onClick={onSave}
                disabled={saving || selectedCount === 0}
              >
                {saving ? "保存中…" : "保存"}
              </Button>
            </DialogFooter>
          </>
        )}

        {phase === "saved" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                候補を保存しました
              </DialogTitle>
              <DialogDescription>
                以下の文言を相手に送ってください。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                ラベル:{" "}
                <span className="font-medium text-foreground">{savedLabel}</span>
                <span className="ml-2">候補 {savedCandidates.length} 件</span>
              </div>

              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <Checkbox
                  checked={showYear}
                  onCheckedChange={(v) => onShowYearChange(!!v)}
                />
                年を含める
              </label>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  コピー内容
                </Label>
                <pre className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-xs">
                  {copyText}
                </pre>
              </div>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button type="button" onClick={onCopy}>
                <Copy className="h-4 w-4" />
                コピー
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                閉じる
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
