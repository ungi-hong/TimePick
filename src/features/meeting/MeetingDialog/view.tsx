"use client";

import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { ExternalLink, Trash2 } from "lucide-react";
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
import { formatJst } from "@/lib/datetime";
import { isSafeHttpUrl, renderLinkified } from "@/lib/linkify";
import type { Meeting } from "./service";

export type MeetingDialogViewProps = {
  meeting: Meeting;
  editing: boolean;
  onEditingChange: (v: boolean) => void;
  title: string;
  onTitleChange: (v: string) => void;
  companyName: string;
  onCompanyNameChange: (v: string) => void;
  meetingUrl: string;
  onMeetingUrlChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  date: string;
  onDateChange: (v: string) => void;
  startTime: string;
  onStartTimeChange: (v: string) => void;
  endTime: string;
  onEndTimeChange: (v: string) => void;
  busy: boolean;
  onClose: () => void;
  onSave: (e: React.FormEvent) => void;
  onDelete: () => void;
};

export function MeetingDialogView({
  meeting,
  editing,
  onEditingChange,
  title,
  onTitleChange,
  companyName,
  onCompanyNameChange,
  meetingUrl,
  onMeetingUrlChange,
  description,
  onDescriptionChange,
  date,
  onDateChange,
  startTime,
  onStartTimeChange,
  endTime,
  onEndTimeChange,
  busy,
  onClose,
  onSave,
  onDelete,
}: MeetingDialogViewProps) {
  return (
    <Dialog
      open={true}
      onOpenChange={(v) => {
        if (!v) onClose();
      }}
    >
      <ResponsiveModalContent>
        <DialogHeader>
          <DialogTitle>{editing ? "面談を編集" : "確定済みの面談"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Google Calendar 側のイベントも同期されます。"
              : "詳細を確認 / 編集 / 削除できます。"}
          </DialogDescription>
        </DialogHeader>

        {!editing ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-base font-semibold">{meeting.title}</p>
              <p className="text-xs text-muted-foreground">
                {meeting.companyName}
              </p>
            </div>
            <p className="text-sm">
              {format(
                new Date(
                  `${formatJst(meeting.start, "yyyy-MM-dd")}T00:00:00+09:00`,
                ),
                "yyyy 年 M 月 d 日 (E)",
                { locale: ja },
              )}{" "}
              {formatJst(meeting.start, "HH:mm")} 〜{" "}
              {formatJst(meeting.end, "HH:mm")}
            </p>
            {isSafeHttpUrl(meeting.meetingUrl) && (
              <p>
                <a
                  href={meeting.meetingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary underline"
                >
                  面談 URL
                  <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            )}
            {meeting.description && (
              <div className="whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-xs">
                {renderLinkified(meeting.description)}
              </div>
            )}

            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onDelete}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" />
                削除
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  閉じる
                </Button>
                <Button type="button" onClick={() => onEditingChange(true)}>
                  編集
                </Button>
              </div>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={onSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="md-title">題名</Label>
              <Input
                id="md-title"
                required
                maxLength={200}
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="md-company">会社名</Label>
              <Input
                id="md-company"
                required
                maxLength={200}
                value={companyName}
                onChange={(e) => onCompanyNameChange(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="md-url">面談 URL (任意)</Label>
              <Input
                id="md-url"
                type="url"
                placeholder="https://..."
                value={meetingUrl}
                onChange={(e) => onMeetingUrlChange(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="md-date">日付</Label>
                <Input
                  id="md-date"
                  type="date"
                  required
                  value={date}
                  onChange={(e) => onDateChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="md-start">開始</Label>
                <Input
                  id="md-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => onStartTimeChange(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="md-end">終了</Label>
                <Input
                  id="md-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => onEndTimeChange(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="md-desc">概要 (任意)</Label>
              <Textarea
                id="md-desc"
                rows={3}
                maxLength={2000}
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onEditingChange(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "保存中…" : "保存"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </ResponsiveModalContent>
    </Dialog>
  );
}
