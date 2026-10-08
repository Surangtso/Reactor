"use client";

import { useI18n } from "./locale-provider";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  const { m } = useI18n();
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="text-center">
        <p className="text-sm text-zinc-500 mb-4">
          {m.common.errorTitle}
          <br />
          {m.common.errorBody}
        </p>
        <button
          onClick={reset}
          className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:border-black dark:hover:border-zinc-50"
        >
          {m.common.retry}
        </button>
      </div>
    </div>
  );
}
