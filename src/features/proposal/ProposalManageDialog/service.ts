import { ja } from "date-fns/locale";
import { formatJst } from "@/lib/datetime";

export type ManagedProposal = {
  id: string;
  label: string;
  slots: { id: string; start: string; end: string }[];
};

export type SlotItem = ManagedProposal["slots"][number];

export const groupByDate = (
  slots: SlotItem[],
): Array<[string, SlotItem[]]> => {
  const map = new Map<string, SlotItem[]>();
  for (const s of slots) {
    const key = formatJst(s.start, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
};

export const buildCopyText = (
  groups: Array<[string, SlotItem[]]>,
  showYear: boolean,
): string =>
  groups
    .map(([dateKey, items]) => {
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
    .join("\n");

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
