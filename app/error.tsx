"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <div className="text-center">
        <p className="text-sm text-zinc-500 mb-4">
          지금 문제가 생겼어요.
          <br />
          잠시 후 다시 시도해주세요.
        </p>
        <button
          onClick={reset}
          className="rounded-full border border-zinc-300 dark:border-zinc-700 px-4 py-1.5 text-xs text-zinc-600 dark:text-zinc-300 hover:border-black dark:hover:border-zinc-50"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}
