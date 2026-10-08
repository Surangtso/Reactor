"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../locale-provider";

/** 새 '생각' 글이 반영되지 않았을 때 새로 쓰게 하고, 끝나면 화면을 다시 불러온다. */
export default function ThoughtSummaryRefresher({
  hasPrevious,
}: {
  hasPrevious: boolean;
}) {
  const router = useRouter();
  const { m } = useI18n();
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
        {m.thoughts.failed}
      </p>
    );
  }

  return (
    <p className="text-xs text-zinc-400 animate-pulse">
      {hasPrevious
        ? m.thoughts.rewriting
        : m.thoughts.writing}
    </p>
  );
}
