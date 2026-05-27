"use client";

import { Trash2 } from "lucide-react";
import type { AvailabilityExceptionDto } from "@/lib/availability";
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
import type { FormState } from "./service";

export type ExceptionsListViewProps = {
  items: AvailabilityExceptionDto[];
  form: FormState;
  submitting: boolean;
  onFormChange: (updater: (prev: FormState) => FormState) => void;
  onSubmit: (e: React.FormEvent) => void;
  onRemove: (id: string) => void;
};

export function ExceptionsListView({
  items,
  form,
  submitting,
  onFormChange,
  onSubmit,
  onRemove,
}: ExceptionsListViewProps) {
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
                  onClick={() => onRemove(e.id)}
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
                onChange={(e) =>
                  onFormChange((s) => ({ ...s, date: e.target.value }))
                }
              />
            </div>
            <div className="flex items-end gap-2">
              <Switch
                id="ex-closed"
                checked={form.closed}
                onCheckedChange={(v) =>
                  onFormChange((s) => ({ ...s, closed: v }))
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
                    onFormChange((s) => ({ ...s, start: e.target.value }))
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
                    onFormChange((s) => ({ ...s, end: e.target.value }))
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
              onChange={(e) =>
                onFormChange((s) => ({ ...s, note: e.target.value }))
              }
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
