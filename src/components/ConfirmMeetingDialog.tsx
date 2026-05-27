"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
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
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { formatJst } from "@/lib/datetime";

export type ConfirmTarget = {
  proposalId: string;
  slotId: string;
  label: string;
  slotStart: string; // ISO
  slotEnd: string;
};

type Props = {
  target: ConfirmTarget | null;
  onClose: () => void;
};

type Duration = 30 | 60;

const toMinutes = (hm: string): number => {
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

const fromMinutes = (mins: number): string => {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

const generateStartOptions = (
  slotStartHM: string,
  slotEndHM: string,
  duration: Duration,
  step = 30,
): string[] => {
  const startMin = toMinutes(slotStartHM);
  const endMin = toMinutes(slotEndHM);
  const opts: string[] = [];
  for (let t = startMin; t + duration <= endMin; t += step) {
    opts.push(fromMinutes(t));
  }
  return opts;
};

export function ConfirmMeetingDialog({ target, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState<Duration>(60);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const slotStartHM = target ? formatJst(target.slotStart, "HH:mm") : "";
  const slotEndHM = target ? formatJst(target.slotEnd, "HH:mm") : "";
  const slotSpanMinutes = target
    ? toMinutes(slotEndHM) - toMinutes(slotStartHM)
    : 0;

  // target が変わったときに初期値をセット
  const targetKey = target ? `${target.slotId}` : null;
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  if (target && targetKey !== appliedKey) {
    setTitle(target.label);
    setCompanyName("");
    setMeetingUrl("");
    setDescription("");
    const initialDuration: Duration = slotSpanMinutes >= 60 ? 60 : 30;
    setDuration(initialDuration);
    setStartTime(slotStartHM);
    setEndTime(
      fromMinutes(
        Math.min(toMinutes(slotStartHM) + initialDuration, toMinutes(slotEndHM)),
      ),
    );
    setAppliedKey(targetKey);
  }

  const startOptions = useMemo(
    () =>
      target ? generateStartOptions(slotStartHM, slotEndHM, duration) : [],
    [target, slotStartHM, slotEndHM, duration],
  );

  const applyDuration = (next: Duration) => {
    setDuration(next);
    if (!startTime) return;
    const newEnd = toMinutes(startTime) + next;
    if (newEnd <= toMinutes(slotEndHM)) {
      setEndTime(fromMinutes(newEnd));
    } else {
      // 現在の開始 + 新しい duration が範囲を超える → 末尾に寄せる
      const newStart = toMinutes(slotEndHM) - next;
      if (newStart >= toMinutes(slotStartHM)) {
        setStartTime(fromMinutes(newStart));
        setEndTime(slotEndHM);
      }
    }
  };

  const pickStart = (hm: string) => {
    setStartTime(hm);
    const e = Math.min(toMinutes(hm) + duration, toMinutes(slotEndHM));
    setEndTime(fromMinutes(e));
  };

  const reset = () => {
    setTitle("");
    setCompanyName("");
    setMeetingUrl("");
    setDescription("");
    setDuration(60);
    setStartTime("");
    setEndTime("");
    setSubmitting(false);
    setAppliedKey(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!target) return null;

  const dateKey = formatJst(target.slotStart, "yyyy-MM-dd");
  const dateLabel = format(
    new Date(`${dateKey}T00:00:00+09:00`),
    "yyyy 年 M 月 d 日 (E)",
    { locale: ja },
  );

  const durationFitsSlot = (d: Duration) => slotSpanMinutes >= d;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim()) {
      toast.error("題名と会社名は必須です");
      return;
    }
    if (!startTime || !endTime || startTime >= endTime) {
      toast.error("開始は終了より前にしてください");
      return;
    }
    if (startTime < slotStartHM || endTime > slotEndHM) {
      toast.error("候補レンジ内の時刻を入力してください");
      return;
    }

    setSubmitting(true);
    try {
      const start = new Date(`${dateKey}T${startTime}:00+09:00`).toISOString();
      const end = new Date(`${dateKey}T${endTime}:00+09:00`).toISOString();

      const res = await fetch("/api/meetings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId: target.proposalId,
          title: title.trim(),
          companyName: companyName.trim(),
          meetingUrl: meetingUrl.trim() || null,
          description: description.trim() || null,
          start,
          end,
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          message?: string;
        };
        if (body.error === "google_insert_failed") {
          throw new Error("Google Calendar への書き込みに失敗しました");
        }
        if (body.error === "already_confirmed") {
          throw new Error("この候補は既に確定済みです");
        }
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }

      toast.success("面談を確定しました");
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.refresh();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "確定に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <ResponsiveModalContent>
        <DialogHeader>
          <DialogTitle>面談を確定</DialogTitle>
          <DialogDescription>
            候補レンジ内で実際の開始時刻と所要時間を選んで確定します。
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-md border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{target.label}</span>
          <br />
          {dateLabel} / 候補レンジ {slotStartHM} 〜 {slotEndHM}
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cm-title">題名</Label>
            <Input
              id="cm-title"
              required
              maxLength={200}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-company">会社名</Label>
            <Input
              id="cm-company"
              required
              maxLength={200}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-url">面談 URL (任意)</Label>
            <Input
              id="cm-url"
              type="url"
              placeholder="https://..."
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>所要時間</Label>
            <div className="flex gap-2">
              {([30, 60] as const).map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant={duration === d ? "default" : "outline"}
                  size="sm"
                  disabled={!durationFitsSlot(d)}
                  onClick={() => applyDuration(d)}
                >
                  {d} 分
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>開始時刻を選択</Label>
            {startOptions.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                この候補レンジに {duration} 分は収まりません。
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {startOptions.map((hm) => {
                  const selected = hm === startTime;
                  return (
                    <button
                      key={hm}
                      type="button"
                      onClick={() => pickStart(hm)}
                      className={cn(
                        "rounded-md border px-2 py-1 text-xs font-medium tabular-nums transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input bg-background hover:bg-muted",
                      )}
                    >
                      {hm}〜{fromMinutes(toMinutes(hm) + duration)}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="cm-start">開始 (微調整)</Label>
              <Input
                id="cm-start"
                type="time"
                required
                min={slotStartHM}
                max={slotEndHM}
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cm-end">終了 (微調整)</Label>
              <Input
                id="cm-end"
                type="time"
                required
                min={slotStartHM}
                max={slotEndHM}
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-desc">概要 (任意)</Label>
            <Textarea
              id="cm-desc"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              キャンセル
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "確定中…" : "確定 + Google Calendar に登録"}
            </Button>
          </DialogFooter>
        </form>
      </ResponsiveModalContent>
    </Dialog>
  );
}
