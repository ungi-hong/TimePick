"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export type BusyEvent = {
  start: string;
  end: string;
  summary: string;
  allDay: boolean;
  googleEventId: string;
  description: string | null;
  location: string | null;
  meetUrl: string | null;
};

type Options = {
  from: Date;
  to: Date;
  enabled: boolean;
};

const fetchBusy = async (from: Date, to: Date): Promise<BusyEvent[]> => {
  const url = new URL("/api/calendar/busy", window.location.origin);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  const json = (await res.json()) as { events: BusyEvent[] };
  return json.events;
};

export const useBusyEvents = ({
  from,
  to,
  enabled,
}: Options): UseQueryResult<BusyEvent[], Error> =>
  useQuery({
    queryKey: ["busy", from.toISOString(), to.toISOString()],
    queryFn: () => fetchBusy(from, to),
    enabled,
    staleTime: 60_000,
  });
