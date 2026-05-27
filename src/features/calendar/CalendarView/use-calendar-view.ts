"use client";

import { useState } from "react";
import type { ViewMode } from "@/features/calendar/CalendarHeader";

export const useCalendarView = () => {
  const [view, setView] = useState<ViewMode>("month");
  return { view, setView };
};
