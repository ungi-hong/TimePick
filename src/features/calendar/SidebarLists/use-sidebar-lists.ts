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

  const proposalsQ = useQuery({
    queryKey: ["proposals", "sidebar", from.toISOString()],
    queryFn: () => fetchOpenProposals(from),
    staleTime: 30_000,
  });
  const proposals = proposalsQ.data ?? [];

  const meetingsQ = useQuery({
    queryKey: ["meetings", "sidebar", from.toISOString(), to.toISOString()],
    queryFn: () => fetchFutureMeetings(from, to),
    staleTime: 30_000,
  });
  const meetings = meetingsQ.data ?? [];

  // 初回ロード判定: data がまだ無く、かつ fetching 中
  const proposalsLoading = proposalsQ.isPending;
  const meetingsLoading = meetingsQ.isPending;

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
    proposalsLoading,
    meetingsLoading,
    expanded,
    toggle,
  };
};
