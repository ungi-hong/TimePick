"use client";

import { DAY_KEYS, DAY_LABELS, type DayKey } from "@/lib/availability";
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
import type { FormState } from "./service";

export type AvailabilityFormViewProps = {
  state: FormState;
  submitting: boolean;
  onHourChange: (day: DayKey, key: "start" | "end", value: string) => void;
  onEnabledChange: (day: DayKey, enabled: boolean) => void;
  onSkipHolidaysChange: (v: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function AvailabilityFormView({
  state,
  submitting,
  onHourChange,
  onEnabledChange,
  onSkipHolidaysChange,
  onSubmit,
}: AvailabilityFormViewProps) {
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
                  onCheckedChange={(v) => onEnabledChange(day, v)}
                  aria-label={`${DAY_LABELS[day]}曜日の稼働`}
                />
                {state.enabledDays[day] ? (
                  <div className="flex items-center gap-2">
                    <Input
                      type="time"
                      className="w-[7.5rem]"
                      value={state.weeklyHours[day].start}
                      onChange={(e) => onHourChange(day, "start", e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground">～</span>
                    <Input
                      type="time"
                      className="w-[7.5rem]"
                      value={state.weeklyHours[day].end}
                      onChange={(e) => onHourChange(day, "end", e.target.value)}
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
              onCheckedChange={(v) => onSkipHolidaysChange(v)}
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
