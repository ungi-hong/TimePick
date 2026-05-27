export type StaleProposal = {
  id: string;
  label: string;
  updatedAt: string;
  slots: { id: string; start: string; end: string }[];
};

export type StaleResponse = {
  thresholdDays: number;
  proposals: StaleProposal[];
};

export const fetchStale = async (): Promise<StaleResponse> => {
  const res = await fetch("/api/proposals/stale");
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

export const touchProposal = async (id: string): Promise<void> => {
  const res = await fetch(`/api/proposals/${id}/touch`, { method: "POST" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};

export const deleteProposal = async (id: string): Promise<void> => {
  const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `HTTP ${res.status}`);
  }
};
