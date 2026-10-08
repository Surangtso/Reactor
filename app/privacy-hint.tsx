"use client";

// 커서를 올리면(모바일은 탭하면) 뜨는 기록 공개 범위 안내.
export default function PrivacyHint() {
  return (
    <span className="relative group inline-flex">
      <button
        type="button"
        aria-label="기록 공개 범위 안내"
        className="flex h-4 w-4 items-center justify-center rounded-full border border-zinc-400 text-[10px] font-semibold leading-none text-zinc-400 hover:border-zinc-600 hover:text-zinc-600 dark:hover:border-zinc-300 dark:hover:text-zinc-300"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-6 z-10 hidden w-max max-w-72 break-keep rounded-lg bg-black px-3 py-2 text-xs leading-relaxed text-white group-hover:block group-focus-within:block dark:bg-zinc-100 dark:text-black"
      >
        쓴 기록은 나만 볼 수 있어요. 운영자도 열어보지 않아요.
      </span>
    </span>
  );
}
