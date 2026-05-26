"use client";

import { useQuery, type UseQueryResult } from "@tanstack/react-query";

export type ProposalStatus = "OPEN" | "CONFIRMED" | "CANCELLED";

export type ProposalSlotEntry = {
  slotId: string;
  proposalId: string;
  label: string;
  status: ProposalStatus;
  start: string;
  end: string;
};

type Options = {
  from: Date;
  to: Date;
  status?: ProposalStatus;
  enabled?: boolean;
};

type ApiResponse = {
  proposals: {
    id: string;
    label: string;
    status: ProposalStatus;
    slots: { id: string; start: string; end: string }[];
  }[];
};

const fetchProposals = async (
  from: Date,
  to: Date,
  status?: ProposalStatus,
): Promise<ProposalSlotEntry[]> => {
  const url = new URL("/api/proposals", window.location.origin);
  url.searchParams.set("from", from.toISOString());
  url.searchParams.set("to", to.toISOString());
  if (status) url.searchParams.set("status", status);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = (await res.json()) as ApiResponse;

  return data.proposals.flatMap((p) =>
    p.slots.map((s) => ({
      slotId: s.id,
      proposalId: p.id,
      label: p.label,
      status: p.status,
      start: s.start,
      end: s.end,
    })),
  );
};

export const useProposals = ({
  from,
  to,
  status,
  enabled = true,
}: Options): UseQueryResult<ProposalSlotEntry[], Error> =>
  useQuery({
    queryKey: [
      "proposals",
      from.toISOString(),
      to.toISOString(),
      status ?? "all",
    ],
    queryFn: () => fetchProposals(from, to, status),
    enabled,
    staleTime: 30_000,
  });
