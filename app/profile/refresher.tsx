"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "../locale-provider";

/** 프로필을 새로 쓸 때가 됐는데 아직이면 쓰게 하고, 끝나면 화면을 다시 불러온다. */
export default function ProfileRefresher({ first }: { first: boolean }) {
  const router = useRouter();
  const { m } = useI18n();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/soft-profile", { method: "POST" })
      .then((res) => {
        if (!res.ok) throw new Error();
        router.refresh();
      })
      .catch(() => setFailed(true));
  }, [router]);

  if (failed) {
    return (
      <p className="text-xs text-zinc-400">
        {m.common.notReady}
      </p>
    );
  }

  return (
    <p className="text-xs text-zinc-400 animate-pulse">
      {first
        ? m.profile.creating
        : m.profile.updating}
    </p>
  );
}
