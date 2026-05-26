"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  AvailabilityExceptionInputSchema,
  type AvailabilityExceptionDto,
  type AvailabilityExceptionInput,
} from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormState = {
  date: string;
  closed: boolean;
  start: string;
  end: string;
  note: string;
};

const DEFAULT_FORM: FormState = {
  date: "",
  closed: true,
  start: "10:00",
  end: "18:00",
  note: "",
};

export function ExceptionsList({
  initial,
}: {
  initial: AvailabilityExceptionDto[];
}) {
  const [items, setItems] = useState<AvailabilityExceptionDto[]>(initial);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AvailabilityExceptionInput = {
      date: form.date,
      start: form.closed ? null : form.start,
      end: form.closed ? null : form.end,
      note: form.note.trim() || null,
    };

    const parsed = AvailabilityExceptionInputSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("入力に誤りがあります");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/availability/exceptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? `HTTP ${res.status}`);
      }
      const created = (await res.json()) as AvailabilityExceptionDto;
      setItems((prev) =>
        [...prev, created].sort((a, b) => a.date.localeCompare(b.date)),
      );
      setForm(DEFAULT_FORM);
      toast.success("例外日を追加しました");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    try {
      const res = await fetch(`/api/availability/exceptions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setItems((prev) => prev.filter((e) => e.id !== id));
      toast.success("削除しました");
    } catch (err) {
      toast.error(
        err instanceof Error ? `削除に失敗しました: ${err.message}` : "削除に失敗しました",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>例外日設定</CardTitle>
        <CardDescription>
          特定日だけ休み、または別の時間に上書きしたい場合に追加します。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            まだ例外は登録されていません。
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-md border bg-card px-3 py-2"
              >
                <div className="flex flex-col text-sm">
                  <span className="font-medium">{e.date}</span>
                  <span className="text-xs text-muted-foreground">
                    {e.start === null && e.end === null
                      ? "終日休み"
                      : `${e.start} – ${e.end}`}
                    {e.note ? ` / ${e.note}` : ""}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(e.id)}
                  aria-label={`${e.date} の例外を削除`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-md border bg-muted/30 p-3"
        >
          <p className="text-sm font-medium">例外を追加</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ex-date">日付</Label>
              <Input
                id="ex-date"
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))}
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch
                id="ex-closed"
                checked={form.closed}
                onCheckedChange={(v) =>
                  setForm((s) => ({ ...s, closed: v }))
                }
              />
              <Label htmlFor="ex-closed" className="cursor-pointer pb-0.5">
                終日休み
              </Label>
            </div>
          </div>

          {!form.closed && (
            <div className="flex items-center gap-2">
              <div className="flex-1 space-y-1">
                <Label htmlFor="ex-start">開始</Label>
                <Input
                  id="ex-start"
                  type="time"
                  value={form.start}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, start: e.target.value }))
                  }
                />
              </div>
              <span className="pt-5 text-muted-foreground">～</span>
              <div className="flex-1 space-y-1">
                <Label htmlFor="ex-end">終了</Label>
                <Input
                  id="ex-end"
                  type="time"
                  value={form.end}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, end: e.target.value }))
                  }
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="ex-note">メモ (任意)</Label>
            <Input
              id="ex-note"
              placeholder="例: 通院のため"
              maxLength={200}
              value={form.note}
              onChange={(e) => setForm((s) => ({ ...s, note: e.target.value }))}
            />
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "追加中…" : "追加"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
