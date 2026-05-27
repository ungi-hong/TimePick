"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatJst } from "@/lib/datetime";
import type { Meeting } from "@/lib/use-meetings";

type Props = {
  meeting: Meeting | null;
  onClose: () => void;
};

export function MeetingDialog({ meeting, onClose }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [busy, setBusy] = useState(false);

  const meetingKey = meeting?.id ?? null;
  const [appliedKey, setAppliedKey] = useState<string | null>(null);
  if (meeting && meetingKey !== appliedKey) {
    setEditing(false);
    setTitle(meeting.title);
    setCompanyName(meeting.companyName);
    setMeetingUrl(meeting.meetingUrl ?? "");
    setDescription(meeting.description ?? "");
    setDate(formatJst(meeting.start, "yyyy-MM-dd"));
    setStartTime(formatJst(meeting.start, "HH:mm"));
    setEndTime(formatJst(meeting.end, "HH:mm"));
    setAppliedKey(meetingKey);
  }

  const handleClose = () => {
    setEditing(false);
    setAppliedKey(null);
    onClose();
  };

  if (!meeting) return null;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !companyName.trim()) {
      toast.error("題名と会社名は必須です");
      return;
    }
    if (!date || !startTime || !endTime || startTime >= endTime) {
      toast.error("時刻を確認してください");
      return;
    }

    setBusy(true);
    try {
      const start = new Date(`${date}T${startTime}:00+09:00`).toISOString();
      const end = new Date(`${date}T${endTime}:00+09:00`).toISOString();
      const res = await fetch(`/api/meetings/${meeting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          companyName: companyName.trim(),
          meetingUrl: meetingUrl.trim() ? meetingUrl.trim() : null,
          description: description.trim() ? description.trim() : null,
          start,
          end,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      toast.success("面談を更新しました");
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      router.refresh();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm("この面談を削除しますか? Google Calendar からも削除されます。")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/meetings/${meeting.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("面談を削除しました");
      await queryClient.invalidateQueries({ queryKey: ["meetings"] });
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      router.refresh();
      handleClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={true}
      onOpenChange={(v) => {
        if (!v) handleClose();
      }}
    >
      <DialogContent className="sm:max-w-md">
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
                new Date(`${formatJst(meeting.start, "yyyy-MM-dd")}T00:00:00+09:00`),
                "yyyy 年 M 月 d 日 (E)",
                { locale: ja },
              )}{" "}
              {formatJst(meeting.start, "HH:mm")} 〜 {formatJst(meeting.end, "HH:mm")}
            </p>
            {meeting.meetingUrl && (
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
              <p className="whitespace-pre-wrap rounded-md border bg-muted/30 px-3 py-2 text-xs">
                {meeting.description}
              </p>
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
                <Button type="button" variant="outline" onClick={handleClose}>
                  閉じる
                </Button>
                <Button type="button" onClick={() => setEditing(true)}>
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
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="md-company">会社名</Label>
              <Input
                id="md-company"
                required
                maxLength={200}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="md-url">面談 URL (任意)</Label>
              <Input
                id="md-url"
                type="url"
                placeholder="https://..."
                value={meetingUrl}
                onChange={(e) => setMeetingUrl(e.target.value)}
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
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="md-start">開始</Label>
                <Input
                  id="md-start"
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="md-end">終了</Label>
                <Input
                  id="md-end"
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
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
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditing(false)}
              >
                キャンセル
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? "保存中…" : "保存"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
