"use client";

import { useState } from "react";
import type { ProfileItem } from "@/lib/soft-profile";
import { useI18n } from "../locale-provider";

export default function ProfileView({
  headline,
  items,
  initialHidden,
}: {
  headline: string;
  items: ProfileItem[];
  initialHidden: string[];
}) {
  const { m } = useI18n();
  const [hidden, setHidden] = useState<string[]>(initialHidden);
  // 숨김이 바뀔 때마다 미리보기 이미지를 새로 받아오기 위한 값
  const [version, setVersion] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(label: string) {
    const nextHidden = !hidden.includes(label);
    setHidden((h) =>
      nextHidden ? [...h, label] : h.filter((l) => l !== label),
    );
    const res = await fetch("/api/soft-profile/hidden", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label, hidden: nextHidden }),
    }).catch(() => null);
    if (!res?.ok) {
      setHidden((h) =>
        nextHidden ? h.filter((l) => l !== label) : [...h, label],
      );
      setError(m.profile.hideFailed);
      return;
    }
    setError(null);
    setVersion((v) => v + 1);
  }

  async function saveImage() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/soft-profile/image?v=${version}`);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const file = new File([blob], "soft-profile.png", { type: "image/png" });

      // 폰에서는 공유 시트(사진에 저장, 인스타 등)를, 컴퓨터에서는 파일 다운로드를 쓴다.
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file] }).catch(() => {});
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "soft-profile.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      setError(m.profile.imageFailed);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-16">
      <section>
        <p className="text-2xl font-semibold leading-snug text-black dark:text-zinc-50">
          {headline}
        </p>
        <ul className="mt-10 flex flex-col gap-7">
          {items.map((item) => {
            const isHidden = hidden.includes(item.label);
            return (
              <li
                key={item.label}
                className="flex items-start justify-between gap-4"
              >
                <div className={isHidden ? "opacity-35" : ""}>
                  <p className="text-xs text-zinc-400">{item.label}</p>
                  <p className="mt-1 text-base text-black dark:text-zinc-50">
                    {item.value}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(item.label)}
                  className="shrink-0 mt-1 text-xs text-zinc-400 hover:text-black dark:hover:text-zinc-50"
                >
                  {isHidden ? m.profile.show : m.profile.hide}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="flex flex-col items-center gap-5">
        {/* eslint-disable-next-line @next/next/no-img-element -- 로그인한 본인만 받는 동적 이미지라 next/image 최적화를 쓰지 않는다 */}
        <img
          src={`/api/soft-profile/image?v=${version}`}
          alt={m.profile.previewAlt}
          className="w-full max-w-xs rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800"
        />
        <button
          type="button"
          onClick={saveImage}
          disabled={saving}
          className="rounded-full bg-maroon text-white px-5 py-2 text-sm font-medium disabled:opacity-40"
        >
          {saving ? m.profile.making : m.profile.saveImage}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </section>
    </div>
  );
}
