"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** 새 '생각' 글이 반영되지 않았을 때 새로 쓰게 하고, 끝나면 화면을 다시 불러온다. */
export default function ThoughtSummaryRefresher({
  hasPrevious,
}: {
  hasPrevious: boolean;
}) {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/thought-summary", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error();
        router.refresh();
      })
      .catch(() => setFailed(true));
  }, [router]);

  if (failed) {
    return (
      <p className="text-xs text-zinc-400">
        지금은 새 글을 반영하지 못했어요. 잠시 후 다시 들어와 주세요.
      </p>
    );
  }

  return (
    <p className="text-xs text-zinc-400 animate-pulse">
      {hasPrevious
        ? "새로 쓴 글까지 읽고 다시 쓰는 중이에요. 조금 걸려요."
        : "네 글들을 읽고 쓰는 중이에요. 조금 걸려요."}
    </p>
  );
}
