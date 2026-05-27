import { ja } from "date-fns/locale";
import { formatJst } from "@/lib/datetime";

export type DateRange = { start: string; end: string };

export const groupByJstDate = <T extends DateRange>(
  items: T[],
): Array<[string, T[]]> => {
  const map = new Map<string, T[]>();
  for (const s of items) {
    const key = formatJst(s.start, "yyyy-MM-dd");
    const list = map.get(key) ?? [];
    list.push(s);
    map.set(key, list);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
};

export const buildProposalCopyText = (
  groups: Array<[string, DateRange[]]>,
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
