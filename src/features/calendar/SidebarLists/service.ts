import type { Meeting } from "@/lib/use-meetings";

export type ProposalListItem = {
  id: string;
  label: string;
  status: "OPEN" | "CONFIRMED" | "CANCELLED";
  slots: { id: string; start: string; end: string }[];
};

type ProposalsResponse = { proposals: ProposalListItem[] };
type MeetingsResponse = { meetings: Meeting[] };

export const fetchOpenProposals = async (
  from: Date,
): Promise<ProposalListItem[]> => {
  const url = new URL("/api/proposals", window.location.origin);
  url.searchParams.set("status", "OPEN");
  url.searchParams.set("from", from.toISOString());
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ProposalsResponse;
  return data.proposals;
};

export const fetchFutureMeetings = async (
  from: Date,
  to: Date,
): Promise<Meeting[]> => {
  const url = new URL("/api/meetings", window.location.origin);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as MeetingsResponse;
  return data.meetings;
};
