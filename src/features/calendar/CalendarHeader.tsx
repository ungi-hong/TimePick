"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ViewMode = "month" | "week" | "day" | "schedule";

type Props = {
  title: string;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onToday: () => void;
};

export function CalendarHeader({
  title,
  view,
  onViewChange,
  onPrev,
  onNext,
  onToday,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3 sm:px-6">
      <h2 className="text-base font-semibold tracking-tight sm:text-lg">
        {title}
      </h2>
      <div className="flex items-center gap-1.5 sm:gap-2">
        {onPrev && (
          <Button variant="outline" size="sm" onClick={onPrev} aria-label="前へ">
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onToday}>
          今日
        </Button>
        {onNext && (
          <Button variant="outline" size="sm" onClick={onNext} aria-label="次へ">
            <ChevronRight className="h-4 w-4" />
          </Button>
        )}
        <Select value={view} onValueChange={(v) => onViewChange(v as ViewMode)}>
          <SelectTrigger className="h-8 w-[7.5rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="month">月</SelectItem>
            <SelectItem value="week">週</SelectItem>
            <SelectItem value="day">日</SelectItem>
            <SelectItem value="schedule">スケジュール</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
