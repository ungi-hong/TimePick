"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  deleteProposal,
  fetchStale,
  touchProposal,
} from "./service";

export const useStaleProposalsBanner = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data } = useQuery({
    queryKey: ["proposals", "stale"],
    queryFn: fetchStale,
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

  const stale = data?.proposals ?? [];
  const threshold = data?.thresholdDays ?? 7;

  const invalidate = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["proposals"] }),
      queryClient.invalidateQueries({ queryKey: ["busy"] }),
    ]);
    router.refresh();
  };

  const ignore = async (id: string) => {
    setBusyId(id);
    try {
      await touchProposal(id);
      toast.success("候補の更新日時を最新にしました");
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: string, label: string) => {
    if (
      !confirm(
        `「${label}」を削除しますか? Google Calendar の候補イベントも削除されます。`,
      )
    ) {
      return;
    }
    setBusyId(id);
    try {
      await deleteProposal(id);
      toast.success("候補を削除しました");
      await invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "削除に失敗しました");
    } finally {
      setBusyId(null);
    }
  };

  return {
    open,
    setOpen,
    busyId,
    stale,
    threshold,
    ignore,
    remove,
  };
};
