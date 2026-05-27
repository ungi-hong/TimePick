"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { addMonths, startOfDay } from "date-fns";
import {
  fetchFutureMeetings,
  fetchOpenProposals,
} from "./service";

export const useSidebarLists = () => {
  const from = useMemo(() => startOfDay(new Date()), []);
  const to = useMemo(() => addMonths(from, 6), [from]);

  const { data: proposals = [] } = useQuery({
    queryKey: ["proposals", "sidebar", from.toISOString()],
    queryFn: () => fetchOpenProposals(from),
    staleTime: 30_000,
  });

  const { data: meetings = [] } = useQuery({
    queryKey: ["meetings", "sidebar", from.toISOString(), to.toISOString()],
    queryFn: () => fetchFutureMeetings(from, to),
    staleTime: 30_000,
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return {
    proposals,
    meetings,
    expanded,
    toggle,
  };
};
