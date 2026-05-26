"use client";

import { useState } from "react";
import { startOfDay } from "date-fns";
import { MiniCalendar } from "@/components/MiniCalendar";
import { MonthCalendar } from "@/components/MonthCalendar";

type Props = {
  calendarConnected: boolean;
};

export function CalendarShell({ calendarConnected }: Props) {
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));

  return (
    <div className="flex flex-1 overflow-hidden">
      <aside className="hidden w-72 shrink-0 border-r md:flex md:flex-col">
        <MiniCalendar
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden bg-muted/30">
        <div className="flex flex-1 flex-col overflow-hidden md:p-4 lg:p-6">
          <div className="flex flex-1 flex-col overflow-hidden bg-background md:rounded-lg md:border md:shadow-sm">
            <MonthCalendar
              calendarConnected={calendarConnected}
              selectedDate={selectedDate}
              onSelectedDateChange={setSelectedDate}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
