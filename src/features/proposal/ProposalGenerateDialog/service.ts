import { format } from "date-fns";
import {
  buildProposalCopyText,
  groupByJstDate,
} from "@/lib/proposal-format";

export type Candidate = { start: string; end: string };
export type SelectableCandidate = Candidate & { selected: boolean };
export type Phase = "input" | "preview" | "saved";

export const defaultPeriod = (): { from: string; to: string } => {
  const f = new Date();
  const t = new Date();
  t.setDate(t.getDate() + 14);
  return { from: format(f, "yyyy-MM-dd"), to: format(t, "yyyy-MM-dd") };
};

export const groupByDate = groupByJstDate;
export const buildCopyText = buildProposalCopyText;

export type GenerateInput = {
  from: string; // yyyy-MM-dd
  to: string; // yyyy-MM-dd
  minRangeMinutes: number;
  bufferAfterMinutes: number;
};

export const requestGenerate = async (
  input: GenerateInput,
): Promise<Candidate[]> => {
  const res = await fetch("/api/proposals/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      from: new Date(`${input.from}T00:00:00+09:00`).toISOString(),
      to: new Date(`${input.to}T23:59:59+09:00`).toISOString(),
      minRangeMinutes: input.minRangeMinutes,
      bufferAfterMinutes: input.bufferAfterMinutes,
    }),
  });
  if (!res.ok) {
    if (res.status === 412) {
      throw new Error("Google Calendar が連携されていません");
    }
    throw new Error(`HTTP ${res.status}`);
  }
  const data = (await res.json()) as { candidates: Candidate[] };
  return data.candidates;
};

export type SaveProposalResult = {
  googleSyncFailedSlotIds: string[];
};

export const saveProposal = async (input: {
  label: string;
  slots: Candidate[];
}): Promise<SaveProposalResult> => {
  const res = await fetch("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = (await res.json().catch(() => ({}))) as {
    googleSyncFailedSlotIds?: string[];
  };
  return {
    googleSyncFailedSlotIds: body.googleSyncFailedSlotIds ?? [],
  };
};
