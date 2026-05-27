"use client";

import { useEffect, useState } from "react";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

// React Query の in-flight クエリ + mutation を監視し、画面上部に細いプログレスバーを出す。
// 開始時に opacity フェードイン + width: 0→90% アニメ、完了で 90→100→透明化。
// 軽量 (3rd party 依存なし)。
export function GlobalProgressBar() {
  const fetching = useIsFetching();
  const mutating = useIsMutating();
  const active = fetching > 0 || mutating > 0;

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;

    if (active) {
      setVisible(true);
      setProgress(8);
      // 徐々に 90% まで増加 (完了タイミングが読めないので漸近)
      const step = () => {
        setProgress((p) => {
          if (p >= 90) return 90;
          const inc = Math.max(0.5, (90 - p) * 0.04);
          return Math.min(90, p + inc);
        });
        raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    } else if (visible) {
      // 完了: 100% まで一気に進めてフェードアウト
      setProgress(100);
      timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (timeout) clearTimeout(timeout);
    };
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed top-0 left-0 z-[100] h-0.5 w-full"
    >
      <div
        className="h-full bg-primary shadow-[0_0_8px_rgba(0,0,0,0.2)] transition-[width,opacity] duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
