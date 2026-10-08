"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LONG_FORM_CATEGORY } from "@/lib/categories";

const CATEGORIES = [
  { key: "마음", placeholder: "지금 나의 마음" },
  { key: "떠오름", placeholder: "문득 떠오른 것" },
  { key: "취향", placeholder: "내가 좋아하는 것" },
  { key: "하루", placeholder: "오늘 하루" },
  { key: "나에 대해", placeholder: "나 자신" },
  { key: "목표", placeholder: "향하는 삶의 모습" },
  { key: "순간", placeholder: "행복한 짧은 순간" },
];

// 긴 글 전용 카테고리 — 다른 카테고리들과 같은 줄 맨 오른쪽에 다른 모양으로 놓인다.
const LONG_FORM = {
  key: LONG_FORM_CATEGORY,
  placeholder: "요즘 머릿속을 오가는 생각, 내가 바라보는 세상",
};

export default function RecordComposer() {
  const router = useRouter();
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }

  async function handleSave() {
    const text = content.trim();
    if (!text || saving) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, content: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "저장에 실패했어요. 다시 시도해주세요.");
        return;
      }

      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      // 코멘트는 저장 응답에 포함되어 이미 완성된 상태로 온다.
      router.refresh();
    } catch {
      setError("연결에 문제가 있는 것 같아요. 쓰신 내용은 그대로 있어요.");
    } finally {
      setSaving(false);
    }
  }

  const isLongForm = category === LONG_FORM.key;
  const active = isLongForm
    ? LONG_FORM
    : CATEGORIES.find((c) => c.key === category)!;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCategory(c.key)}
            className={`rounded-full px-4 py-2 text-sm border transition-colors ${
              category === c.key
                ? "bg-maroon text-white border-maroon"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-maroon"
            }`}
          >
            {c.key}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setCategory(LONG_FORM.key)}
          className={`ml-auto rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
            isLongForm
              ? "bg-maroon text-white border-maroon"
              : "bg-zinc-100 border-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-900 dark:text-zinc-300 hover:border-maroon"
          }`}
        >
          {LONG_FORM.key}
          <span className="ml-1.5 text-xs font-normal opacity-60">긴 글</span>
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          autoResize();
        }}
        placeholder={active.placeholder}
        rows={1}
        className={`w-full mt-4 resize-none ${isLongForm ? "min-h-40" : ""} overflow-hidden bg-transparent text-base leading-relaxed text-black dark:text-zinc-50 placeholder:text-zinc-400 outline-none border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 pb-3`}
      />

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={!content.trim() || saving}
            className="rounded-full bg-maroon text-white px-5 py-2 text-sm font-medium disabled:opacity-30"
          >
            {saving ? "남기는 중..." : "남기기"}
          </button>
          {isLongForm && (
            <Link
              href="/thoughts"
              className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
            >
              나의 생각들 →
            </Link>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
