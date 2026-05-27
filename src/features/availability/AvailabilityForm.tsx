"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  AvailabilitySettingsSchema,
  DAY_KEYS,
  DAY_LABELS,
  type AvailabilitySettings,
  type DayKey,
  type WeeklyHours,
} from "@/lib/availability";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type FormState = {
  weeklyHours: Record<DayKey, { start: string; end: string }>;
  enabledDays: Record<DayKey, boolean>;
  skipHolidays: boolean;
};

const toFormState = (initial: AvailabilitySettings): FormState => ({
  weeklyHours: Object.fromEntries(
    DAY_KEYS.map((d) => [
      d,
      initial.weeklyHours[d] ?? { start: "10:00", end: "18:00" },
    ]),
  ) as Record<DayKey, { start: string; end: string }>,
  enabledDays: Object.fromEntries(
    DAY_KEYS.map((d) => [d, initial.weeklyHours[d] !== null]),
  ) as Record<DayKey, boolean>,
  skipHolidays: initial.skipHolidays,
});

export function AvailabilityForm({ initial }: { initial: AvailabilitySettings }) {
  const [state, setState] = useState<FormState>(() => toFormState(initial));
  const [submitting, setSubmitting] = useState(false);

  const setHour = (day: DayKey, key: "start" | "end", value: string) =>
    setState((s) => ({
      ...s,
      weeklyHours: {
        ...s.weeklyHours,
        [day]: { ...s.weeklyHours[day], [key]: value },
      },
    }));

  const setEnabled = (day: DayKey, enabled: boolean) =>
    setState((s) => ({
      ...s,
      enabledDays: { ...s.enabledDays, [day]: enabled },
    }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: AvailabilitySettings = {
      weeklyHours: Object.fromEntries(
        DAY_KEYS.map((d) => [
          d,
          state.enabledDays[d] ? state.weeklyHours[d] : null,
        ]),
      ) as WeeklyHours,
      skipHolidays: state.skipHolidays,
    };

    const parsed = AvailabilitySettingsSchema.safeParse(payload);
    if (!parsed.success) {
      toast.error("入力に誤りがあります。時刻の前後関係や形式を確認してください。");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      toast.success("稼働時間を保存しました");
    } catch (err) {
      toast.error(
        err instanceof Error ? `保存に失敗しました: ${err.message}` : "保存に失敗しました",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>稼働時間</CardTitle>
        <CardDescription>
          曜日ごとの稼働時間を設定します。候補生成時に、この範囲から空いている時間レンジを切り出します。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="space-y-2">
            {DAY_KEYS.map((day) => (
              <div
                key={day}
                className="flex flex-wrap items-center gap-3 rounded-md border bg-card px-3 py-2"
              >
                <span className="w-6 text-sm font-medium">{DAY_LABELS[day]}</span>
                <Switch
                  checked={state.enabledDays[day]}
                  onCheckedChange={(v) => setEnabled(day, v)}
                  aria-label={`${DAY_LABELS[day]}曜日の稼働`}
                />
                {state.enabledDays[day] ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-[7.5rem]"
                      value={state.weeklyHours[day].start}
                      onChange={(e) => setHour(day, "start", e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">～</span>
                    <Input
                      type="time"
                      className="w-[7.5rem]"
                      value={state.weeklyHours[day].end}
                      onChange={(e) => setHour(day, "end", e.target.value)}
                    />
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">休み</span>
                )}
              </div>
            ))}
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Switch
              id="skipHolidays"
              checked={state.skipHolidays}
              onCheckedChange={(v) => setState((s) => ({ ...s, skipHolidays: v }))}
            />
            <Label htmlFor="skipHolidays" className="cursor-pointer">
              土日・祝日を候補に出さない
            </Label>
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? "保存中…" : "保存"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
