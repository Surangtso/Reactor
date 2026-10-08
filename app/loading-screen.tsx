"use client";

import { useI18n } from "./locale-provider";

/** 페이지를 불러오는 동안 보이는 화면 (loading.tsx들이 함께 쓴다) */
export default function LoadingScreen({ fullHeight = true }: { fullHeight?: boolean }) {
  const { m } = useI18n();
  return (
    <div
      className={`${fullHeight ? "min-h-screen" : "flex-1"} flex items-center justify-center bg-zinc-50 dark:bg-black`}
    >
      <p className="text-xs text-zinc-300 dark:text-zinc-700 animate-pulse">
        {m.common.loading}
      </p>
    </div>
  );
}
