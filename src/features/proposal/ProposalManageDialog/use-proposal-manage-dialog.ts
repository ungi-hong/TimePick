"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  buildCopyText,
  deleteProposal,
  groupByDate,
  patchProposalLabel,
  type ManagedProposal,
} from "./service";

// proposal は非 null 前提。親側で key={proposal.id} を渡して再 mount すること。
export const useProposalManageDialog = (
  proposal: ManagedProposal,
  onClose: () => void,
) => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [editing, setEditing] = useState(false);
  const [labelDraft, setLabelDraft] = useState(proposal.label);
  const [showYear, setShowYear] = useState(false);
  const [busy, setBusy] = useState(false);

  const groups = useMemo(() => groupByDate(proposal.slots), [proposal.slots]);
  const copyText = useMemo(
    () => buildCopyText(groups, showYear),
    [groups, showYear],
  );

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(copyText);
    toast.success("コピーしました");
  };

  const saveLabel = async () => {
    const next = labelDraft.trim();
    if (!next) {
      toast.error("ラベルを入力してください");
      return;
    }
    if (next === proposal.label) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      const { googleSyncFailed } = await patchProposalLabel(proposal.id, next);
      if (googleSyncFailed) {
        toast.warning(
          "ラベルは保存しましたが Google Calendar 側の更新に失敗しました",
        );
      } else {
        toast.success("ラベルを更新しました");
      }
      setEditing(false);
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["busy"] });
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (
      !confirm(
        "この候補を削除しますか? Google Calendar 上の候補イベントも削除されます。",
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await deleteProposal(proposal.id);
      toast.success("候補を削除しました");
      await queryClient.invalidateQueries({ queryKey: ["proposals"] });
      await queryClient.invalidateQueries({ queryKey: ["busy"] });
      router.refresh();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusy(false);
    }
  };

  return {
    editing,
    setEditing,
    labelDraft,
    setLabelDraft,
    showYear,
    setShowYear,
    busy,
    copyText,
    copyToClipboard,
    saveLabel,
    remove,
  };
};
