"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PrivacyHint from "../privacy-hint";

const CHAPTER_EXAMPLES = [
  "무엇이 나를 편안하게 하는가",
  "요즘 나를 흔드는 것들",
  "내가 진짜 원하는 건 뭘까",
  "지금 이 시기를 어떻게 지나고 있는가",
];

export default function OnboardingForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [currentPhase, setCurrentPhase] = useState("");
  const [currentConcern, setCurrentConcern] = useState("");
  const [chapterName, setChapterName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    displayName.trim() && currentPhase.trim() && chapterName.trim() && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          currentPhase,
          currentConcern,
          chapterName,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "저장 중 문제가 생겼어요.");
        setSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("저장 중 문제가 생겼어요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-md mx-auto px-4 py-16">
        <p className="text-sm text-zinc-400 mb-2">시작하기 전에</p>
        <div className="flex items-center gap-2 mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            몇 가지만 알려주세요
          </h1>
          <PrivacyHint />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              뭐라고 불러드릴까요?
            </label>
            <input
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="이름 또는 부르고 싶은 말"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              지금 어떤 시기를 지나고 있나요? 한 줄로.
            </label>
            <input
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50"
              value={currentPhase}
              onChange={(e) => setCurrentPhase(e.target.value)}
              placeholder="예: 이직을 준비하는 중"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              요즘 마음에 걸리는 것이 있다면 (선택)
            </label>
            <textarea
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50 resize-none"
              rows={3}
              value={currentConcern}
              onChange={(e) => setCurrentConcern(e.target.value)}
              placeholder="없으면 비워두셔도 괜찮아요"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              앞으로 몇 주간 머물 첫 주제를 골라보세요.
            </label>
            <div className="flex flex-wrap gap-2">
              {CHAPTER_EXAMPLES.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setChapterName(example)}
                  className={`rounded-full px-4 py-2 text-xs border transition-colors ${
                    chapterName === example
                      ? "bg-maroon text-white border-maroon"
                      : "border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-maroon"
                  }`}
                >
                  {example}
                </button>
              ))}
            </div>
            <input
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50"
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              placeholder="또는 직접 적어주세요"
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-maroon text-white px-5 py-3 text-sm font-medium disabled:opacity-40"
          >
            {submitting ? "저장하는 중..." : "시작하기"}
          </button>
        </form>
      </main>
    </div>
  );
}
