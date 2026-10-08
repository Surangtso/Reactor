"use client";

import { useRef, useState } from "react";

type Reflection = {
  id: string;
  content: string;
  comment: string | null;
};

export default function ReflectionThread({
  entryId,
  initial,
}: {
  entryId: string;
  initial: Reflection[];
}) {
  const [reflections, setReflections] = useState(initial);
  const [content, setContent] = useState("");
  const [open, setOpen] = useState(false);
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
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, content: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "저장에 실패했어요. 다시 시도해주세요.");
        return;
      }

      const data = await res.json();
      setReflections((prev) => [...prev, data.reflection]);
      setContent("");
      setOpen(false);
    } catch {
      setError("연결에 문제가 있는 것 같아요.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      {reflections.map((r) => (
        <div
          key={r.id}
          className="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700"
        >
          <p className="text-sm text-zinc-500 whitespace-pre-wrap">
            {r.content}
          </p>
          {r.comment && (
            <p className="mt-1 text-sm italic text-zinc-400 dark:text-zinc-500">
              {r.comment}
            </p>
          )}
        </div>
      ))}

      {open ? (
        <div className="mt-2 pl-3 border-l-2 border-zinc-200 dark:border-zinc-700 flex flex-col gap-2">
          <textarea
            ref={textareaRef}
            autoFocus
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              autoResize();
            }}
            placeholder="더 하고 싶은 말"
            rows={1}
            className="w-full resize-none overflow-hidden bg-transparent text-sm leading-relaxed text-black dark:text-zinc-50 placeholder:text-zinc-400 outline-none border-b border-zinc-200 dark:border-zinc-800 focus:border-zinc-400 dark:focus:border-zinc-600 pb-2"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSave}
              disabled={!content.trim() || saving}
              className="text-xs rounded-full bg-maroon text-white px-3 py-1 disabled:opacity-30"
            >
              {saving ? "남기는 중..." : "남기기"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setContent("");
                setError(null);
              }}
              className="text-xs text-zinc-400 hover:text-black dark:hover:text-zinc-50"
            >
              취소
            </button>
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-2 text-xs text-zinc-400 hover:text-black dark:hover:text-zinc-50"
        >
          + 덧붙이기
        </button>
      )}
    </div>
  );
}
