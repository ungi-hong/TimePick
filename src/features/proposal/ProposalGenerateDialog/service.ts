import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { formatJst } from "@/lib/datetime";

export type Candidate = { start: string; end: string };
export type SelectableCandidate = Candidate & { selected: boolean };
export type Phase = "input" | "preview" | "saved";

export const defaultPeriod = (): { from: string; to: string } => {
  const f = new Date();
  const t = new Date();
  t.setDate(t.getDate() + 14);
  return { from: format(f, "yyyy-MM-dd"), to: format(t, "yyyy-MM-dd") };
};

export const groupByDate = <T extends Candidate>(
  items: T[],
): Array<[string, T[]]> => {
  const map = new Map<string, T[]>();
  for (const c of items) {
    const key = formatJst(c.start, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(c);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
};

export const buildCopyText = (
  groups: Array<[string, Candidate[]]>,
  showYear: boolean,
): string =>
  groups
    .map(([dateKey, items]) => {
      if (items.length === 0) return null;
      const sample = new Date(`${dateKey}T00:00:00+09:00`);
      const datePart = formatJst(
        sample,
        showYear ? "yyyy年 M月d日(E)" : "M月d日(E)",
        { locale: ja },
      );
      const ranges = items
        .map(
          (c) =>
            `${formatJst(c.start, "HH:mm")} 〜 ${formatJst(c.end, "HH:mm")}`,
        )
        .join(" または ");
      return `${datePart} ${ranges}`;
    })
    .filter((line): line is string => line !== null)
    .join("\n");

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

export const saveProposal = async (input: {
  label: string;
  slots: Candidate[];
}): Promise<void> => {
  const res = await fetch("/api/proposals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
};
