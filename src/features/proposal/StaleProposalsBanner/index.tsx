"use client";

import { useStaleProposalsBanner } from "./use-stale-proposals-banner";
import { StaleProposalsBannerView } from "./view";

export function StaleProposalsBanner() {
  const state = useStaleProposalsBanner();
  if (state.stale.length === 0) return null;
  return (
    <StaleProposalsBannerView
      stale={state.stale}
      threshold={state.threshold}
      open={state.open}
      onOpenChange={state.setOpen}
      busyId={state.busyId}
      onIgnore={state.ignore}
      onRemove={state.remove}
    />
  );
}
