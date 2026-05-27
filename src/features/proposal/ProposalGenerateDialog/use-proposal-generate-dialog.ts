"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  buildCopyText,
  defaultPeriod,
  groupByDate,
  requestGenerate,
  saveProposal,
  type Candidate,
  type Phase,
  type SelectableCandidate,
} from "./service";

export const useProposalGenerateDialog = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>("input");

  const [label, setLabel] = useState("");
  const initialPeriod = defaultPeriod();
  const [from, setFrom] = useState(initialPeriod.from);
  const [to, setTo] = useState(initialPeriod.to);
  const [minRangeMinutes, setMinRangeMinutes] = useState(60);
  const [bufferAfterMinutes, setBufferAfterMinutes] = useState(30);

  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [candidates, setCandidates] = useState<SelectableCandidate[]>([]);

  const [savedLabel, setSavedLabel] = useState("");
  const [savedCandidates, setSavedCandidates] = useState<Candidate[]>([]);
  const [showYear, setShowYear] = useState(false);

  const reset = () => {
    setPhase("input");
    setLabel("");
    const p = defaultPeriod();
    setFrom(p.from);
    setTo(p.to);
    setMinRangeMinutes(60);
    setBufferAfterMinutes(30);
    setCandidates([]);
    setSavedLabel("");
    setSavedCandidates([]);
    setShowYear(false);
    setGenerating(false);
    setSaving(false);
  };

  const onOpenChange = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!from || !to) {
      toast.error("期間を入力してください");
      return;
    }
    setGenerating(true);
    try {
      const list = await requestGenerate({
        from,
        to,
        minRangeMinutes,
        bufferAfterMinutes,
      });
      if (list.length === 0) {
        toast.info("指定期間に空き時間が見つかりませんでした");
      }
      setCandidates(list.map((c) => ({ ...c, selected: false })));
      setPhase("preview");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  };

  const previewGroups = useMemo(() => groupByDate(candidates), [candidates]);
  const selectedCandidates = candidates.filter((c) => c.selected);

  const setAll = (selected: boolean) =>
    setCandidates((prev) => prev.map((c) => ({ ...c, selected })));

  const toggle = (index: number, checked: boolean) =>
    setCandidates((prev) =>
      prev.map((c, i) => (i === index ? { ...c, selected: checked } : c)),
    );

  const save = async () => {
    if (!label.trim()) {
      toast.error("ラベル (会社名など) を入力してください");
      return;
    }
    if (selectedCandidates.length === 0) {
      toast.error("少なくとも 1 つの候補を選んでください");
      return;
    }
    setSaving(true);
    try {
      const { googleSyncFailedSlotIds } = await saveProposal({
        label: label.trim(),
        slots: selectedCandidates.map((c) => ({ start: c.start, end: c.end })),
      });
      setSavedLabel(label.trim());
      setSavedCandidates(
        selectedCandidates.map((c) => ({ start: c.start, end: c.end })),
      );
      setPhase("saved");
      if (googleSyncFailedSlotIds.length > 0) {
        toast.warning(
          `${googleSyncFailedSlotIds.length} 件は Google Calendar への書き込みに失敗しました`,
        );
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["proposals"] }),
        queryClient.invalidateQueries({ queryKey: ["busy"] }),
      ]);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const savedGroups = useMemo(
    () => groupByDate(savedCandidates),
    [savedCandidates],
  );
  const copyText = useMemo(
    () => buildCopyText(savedGroups, showYear),
    [savedGroups, showYear],
  );

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(copyText);
    toast.success("コピーしました");
  };

  return {
    open,
    onOpenChange,
    phase,
    setPhase,
    label,
    setLabel,
    from,
    setFrom,
    to,
    setTo,
    minRangeMinutes,
    setMinRangeMinutes,
    bufferAfterMinutes,
    setBufferAfterMinutes,
    generating,
    saving,
    candidates,
    previewGroups,
    selectedCandidates,
    setAll,
    toggle,
    generate,
    save,
    savedLabel,
    savedCandidates,
    showYear,
    setShowYear,
    copyText,
    copyToClipboard,
  };
};
