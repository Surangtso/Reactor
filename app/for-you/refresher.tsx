"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/** 새 제안을 쓸 때가 됐는데 아직 없으면 쓰게 하고, 끝나면 화면을 다시 불러온다. */
export default function InsightRefresher() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/insight", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error();
        router.refresh();
      })
      .catch(() => setFailed(true));
  }, [router]);

  if (failed) {
    return (
      <p className="text-xs text-zinc-400">
        지금은 준비하지 못했어. 조금 있다가 다시 와줘.
      </p>
    );
  }

  return (
    <p className="text-xs text-zinc-400 animate-pulse">
      기록들을 다시 읽어보는 중... 조금만 기다려줘
    </p>
  );
}
