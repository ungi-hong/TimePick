"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
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

type Candidate = { start: string; end: string };
type SelectableCandidate = Candidate & { selected: boolean };
type Phase = "input" | "preview" | "saved";

const defaultPeriod = () => {
  const f = new Date();
  const t = new Date();
  t.setDate(t.getDate() + 14);
  return { from: format(f, "yyyy-MM-dd"), to: format(t, "yyyy-MM-dd") };
};

const groupByDate = <T extends Candidate>(items: T[]): Array<[string, T[]]> => {
  const map = new Map<string, T[]>();
  for (const c of items) {
    const key = formatJst(c.start, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(c);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
};

const buildCopyText = (
  groups: Array<[string, Candidate[]]>,
  showYear: boolean,
): string =>
  groups
    .map(([dateKey, items]) => {
      if (items.length === 0) return null;
      const sample = new Date(`${dateKey}T00:00:00+09:00`);
      const datePart = formatJst(
        sample,
        showYear ? "yyyy年 M月d日(E)" : "M月d日(E)",
        { locale: ja },
      );
      const ranges = items
        .map(
          (c) => `${formatJst(c.start, "HH:mm")} 〜 ${formatJst(c.end, "HH:mm")}`,
        )
        .join(" または ");
      return `${datePart} ${ranges}`;
    })
    .filter((line): line is string => line !== null)
    .join("\n");

type Props = {
  disabled?: boolean;
};

export function ProposalGenerateDialog({ disabled }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");

  // 入力フォーム state
  const [label, setLabel] = useState("");
  const initialPeriod = defaultPeriod();
  const [from, setFrom] = useState(initialPeriod.from);
  const [to, setTo] = useState(initialPeriod.to);
  const [minRangeMinutes, setMinRangeMinutes] = useState(60);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(30);

  // 動作 state
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<SelectableCandidate[]>([]);

  // 保存後 state
  const [savedLabel, setSavedLabel] = useState("");
  const [savedCandidates, setSavedCandidates] = useState<Candidate[]>([]);
  const [showYear, setShowYear] = useState(false);

  const reset = () => {
    setPhase("input");
    setLabel("");
    const p = defaultPeriod();
    setFrom(p.from);
    setTo(p.to);
    setMinRangeMinutes(60);
    setBufferAfterMinutes(30);
    setCandidates([]);
    setSavedLabel("");
    setSavedCandidates([]);
    setShowYear(false);
    setGenerating(false);
    setSaving(false);
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  // -------- input → preview --------
  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      toast.error("期間を入力してください");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/proposals/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: new Date(`${from}T00:00:00+09:00`).toISOString(),
          to: new Date(`${to}T23:59:59+09:00`).toISOString(),
          minRangeMinutes,
          bufferAfterMinutes,
        }),
      });
      if (!res.ok) {
        if (res.status === 412) {
          throw new Error("Google Calendar が連携されていません");
        }
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as { candidates: Candidate[] };
      if (data.candidates.length === 0) {
        toast.info("指定期間に空き時間が見つかりませんでした");
      }
      setCandidates(data.candidates.map((c) => ({ ...c, selected: true })));
      setPhase("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  // -------- preview helpers --------
  const previewGroups = useMemo(() => groupByDate(candidates), [candidates]);
  const selectedCandidates = candidates.filter((c) => c.selected);

  const setAll = (selected: boolean) =>
    setCandidates((prev) => prev.map((c) => ({ ...c, selected })));

  const toggle = (index: number, checked: boolean) =>
    setCandidates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: checked } : c)),
    );

  // -------- preview → saved --------
  const save = async () => {
    if (!label.trim()) {
      toast.error("ラベル (会社名など) を入力してください");
      return;
    }
    if (selectedCandidates.length === 0) {
      toast.error("少なくとも 1 つの候補を選んでください");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: label.trim(),
          slots: selectedCandidates.map((c) => ({ start: c.start, end: c.end })),
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setSavedLabel(label.trim());
      setSavedCandidates(
        selectedCandidates.map((c) => ({ start: c.start, end: c.end })),
      );
      setPhase("saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  // -------- saved helpers --------
  const savedGroups = useMemo(() => groupByDate(savedCandidates), [savedCandidates]);
  const copyText = useMemo(
    () => buildCopyText(savedGroups, showYear),
    [savedGroups, showYear],
  );

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(copyText);
    toast.success("コピーしました");
  };

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
        {/* ----- phase: input ----- */}
        {phase === "input" && (
          <>
            <DialogHeader>
              <DialogTitle>候補を生成</DialogTitle>
              <DialogDescription>
                稼働時間から busy 時間と既存の候補・確定面談を除いた空き時間レンジを抽出します。
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={generate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pg-label">ラベル (会社名など)</Label>
                <Input
                  id="pg-label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
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
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pg-to">終了日</Label>
                  <Input
                    id="pg-to"
                    type="date"
                    required
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
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
                    onChange={(e) => setMinRangeMinutes(Number(e.target.value))}
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
                      setBufferAfterMinutes(Number(e.target.value))
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

        {/* ----- phase: preview ----- */}
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
                  / 選択 {selectedCandidates.length} / 全 {candidates.length}
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
                      onClick={() => setAll(true)}
                    >
                      全選択
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setAll(false)}
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
                                    toggle(idx, !!checked)
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setPhase("input")}
              >
                戻る
              </Button>
              <Button
                type="button"
                onClick={save}
                disabled={saving || selectedCandidates.length === 0}
              >
                {saving ? "保存中…" : "保存"}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ----- phase: saved ----- */}
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
                  onCheckedChange={(v) => setShowYear(!!v)}
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
              <Button type="button" onClick={copyToClipboard}>
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
