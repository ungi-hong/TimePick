"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export type Meeting = {
  id: string;
  proposalId: string | null;
  title: string;
  companyName: string;
  meetingUrl: string | null;
  description: string | null;
  start: string;
  end: string;
  googleEventId: string | null;
};

type Options = {
  from: Date;
  to: Date;
  enabled?: boolean;
};

const fetchMeetings = async (from: Date, to: Date): Promise<Meeting[]> => {
  const url = new URL("/api/meetings", window.location.origin);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as { meetings: Meeting[] };
  return data.meetings;
};

export const useMeetings = ({
  from,
  to,
  enabled = true,
}: Options): UseQueryResult<Meeting[], Error> =>
  useQuery({
    queryKey: ["meetings", from.toISOString(), to.toISOString()],
    queryFn: () => fetchMeetings(from, to),
    enabled,
    staleTime: 30_000,
  });
