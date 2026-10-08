"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PrivacyHint from "../privacy-hint";
import { useI18n } from "../locale-provider";

export default function OnboardingForm() {
  const { m } = useI18n();
  const CHAPTER_EXAMPLES = m.onboarding.chapterExamples;
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
        setError(m.onboarding.saveError);
        setSubmitting(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError(m.onboarding.saveError);
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-md mx-auto px-4 py-16">
        <p className="text-sm text-zinc-400 mb-2">{m.onboarding.eyebrow}</p>
        <div className="flex items-center gap-2 mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            {m.onboarding.title}
          </h1>
          <PrivacyHint />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              {m.onboarding.nameLabel}
            </label>
            <input
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={m.onboarding.namePlaceholder}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              {m.onboarding.phaseLabel}
            </label>
            <input
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50"
              value={currentPhase}
              onChange={(e) => setCurrentPhase(e.target.value)}
              placeholder={m.onboarding.phasePlaceholder}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              {m.onboarding.concernLabel}
            </label>
            <textarea
              className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-black dark:text-zinc-50 outline-none focus:border-black dark:focus:border-zinc-50 resize-none"
              rows={3}
              value={currentConcern}
              onChange={(e) => setCurrentConcern(e.target.value)}
              placeholder={m.onboarding.concernPlaceholder}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-sm text-zinc-600 dark:text-zinc-300">
              {m.onboarding.chapterLabel}
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
              placeholder={m.onboarding.chapterPlaceholder}
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-maroon text-white px-5 py-3 text-sm font-medium disabled:opacity-40"
          >
            {submitting ? m.onboarding.submitting : m.onboarding.submit}
          </button>
        </form>
      </main>
    </div>
  );
}
