"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CATEGORIES as ALL_CATEGORIES,
  CATEGORY_LABELS,
  CATEGORY_PLACEHOLDERS,
  LONG_FORM_CATEGORY,
  type Category,
} from "@/lib/categories";
import { useI18n } from "./locale-provider";

// 짧은 기록 카테고리들 (긴 글 '생각'은 같은 줄 맨 오른쪽에 다른 모양으로 따로 놓인다)
const CATEGORIES = ALL_CATEGORIES.filter((c) => c !== LONG_FORM_CATEGORY);

export default function RecordComposer() {
  const router = useRouter();
  const { locale, m } = useI18n();
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
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
        setError(m.common.saveFailed);
        return;
      }

      setContent("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      // 코멘트는 저장 응답에 포함되어 이미 완성된 상태로 온다.
      router.refresh();
    } catch {
      setError(m.common.connectionError);
    } finally {
      setSaving(false);
    }
  }

  const isLongForm = category === LONG_FORM_CATEGORY;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={`rounded-full px-4 py-2 text-sm border transition-colors ${
              category === c
                ? "bg-maroon text-white border-maroon"
                : "border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-maroon"
            }`}
          >
            {CATEGORY_LABELS[locale][c]}
          </button>
        ))}

        <button
          type="button"
          onClick={() => setCategory(LONG_FORM_CATEGORY)}
          className={`ml-auto rounded-lg px-4 py-2 text-sm font-medium border transition-colors ${
            isLongForm
              ? "bg-maroon text-white border-maroon"
              : "bg-zinc-100 border-zinc-100 text-zinc-700 dark:bg-zinc-900 dark:border-zinc-900 dark:text-zinc-300 hover:border-maroon"
          }`}
        >
          {CATEGORY_LABELS[locale][LONG_FORM_CATEGORY]}
          <span className="ml-1.5 text-xs font-normal opacity-60">{m.home.longForm}</span>
        </button>
      </div>

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => {
          setContent(e.target.value);
          autoResize();
        }}
        placeholder={CATEGORY_PLACEHOLDERS[locale][category]}
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
            {saving ? m.common.saving : m.common.save}
          </button>
          {isLongForm && (
            <Link
              href="/thoughts"
              className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
            >
              {m.home.myThoughts}
            </Link>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    </div>
  );
}
