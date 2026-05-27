import {
  buildProposalCopyText,
  groupByJstDate,
} from "@/lib/proposal-format";

export type ManagedProposal = {
  id: string;
  label: string;
  slots: { id: string; start: string; end: string }[];
};

export type SlotItem = ManagedProposal["slots"][number];

export const groupByDate = groupByJstDate;
export const buildCopyText = buildProposalCopyText;

export type PatchLabelResult = { googleSyncFailed: boolean };

export const patchProposalLabel = async (
  id: string,
  label: string,
): Promise<PatchLabelResult> => {
  const res = await fetch(`/api/proposals/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json().catch(() => ({}))) as {
    googleSyncFailed?: boolean;
  };
  return { googleSyncFailed: body.googleSyncFailed ?? false };
};

export const deleteProposal = async (id: string): Promise<void> => {
  const res = await fetch(`/api/proposals/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
    };
    throw new Error(body.message ?? body.error ?? `HTTP ${res.status}`);
  }
};
