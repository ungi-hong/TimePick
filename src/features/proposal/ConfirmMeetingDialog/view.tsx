"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
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
import {
  fromMinutes,
  toMinutes,
  type ConfirmTarget,
  type Duration,
} from "./service";

export type ConfirmMeetingDialogViewProps = {
  target: ConfirmTarget;
  title: string;
  onTitleChange: (v: string) => void;
  companyName: string;
  onCompanyNameChange: (v: string) => void;
  meetingUrl: string;
  onMeetingUrlChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  duration: Duration;
  onApplyDuration: (d: Duration) => void;
  durationFitsSlot: (d: Duration) => boolean;
  startTime: string;
  onStartTimeChange: (v: string) => void;
  endTime: string;
  onEndTimeChange: (v: string) => void;
  slotStartHM: string;
  slotEndHM: string;
  startOptions: string[];
  onPickStart: (hm: string) => void;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function ConfirmMeetingDialogView({
  target,
  title,
  onTitleChange,
  companyName,
  onCompanyNameChange,
  meetingUrl,
  onMeetingUrlChange,
  description,
  onDescriptionChange,
  duration,
  onApplyDuration,
  durationFitsSlot,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  slotStartHM,
  slotEndHM,
  startOptions,
  onPickStart,
  submitting,
  onClose,
  onSubmit,
}: ConfirmMeetingDialogViewProps) {
  const dateKey = formatJst(target.slotStart, "yyyy-MM-dd");
  const dateLabel = format(
    new Date(`${dateKey}T00:00:00+09:00`),
    "yyyy 年 M 月 d 日 (E)",
    { locale: ja },
  );

  return (
    <Dialog
      open={true}
      onOpenChange={(v) => {
        if (!v) onClose();
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
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-company">会社名</Label>
            <Input
              id="cm-company"
              required
              maxLength={200}
              value={companyName}
              onChange={(e) => onCompanyNameChange(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cm-url">面談 URL (任意)</Label>
            <Input
              id="cm-url"
              type="url"
              placeholder="https://..."
              value={meetingUrl}
              onChange={(e) => onMeetingUrlChange(e.target.value)}
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
                  onClick={() => onApplyDuration(d)}
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
                      onClick={() => onPickStart(hm)}
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
                onChange={(e) => onStartTimeChange(e.target.value)}
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
                onChange={(e) => onEndTimeChange(e.target.value)}
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
              onChange={(e) => onDescriptionChange(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
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
