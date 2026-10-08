import Link from "next/link";
import type { Locale } from "@/lib/messages";

// 개인정보처리방침·이용약관이 함께 쓰는 틀

const HOME: Record<Locale, string> = { ko: "홈으로", en: "Home", zh: "首页" };

const TRANSLATION_NOTICE: Record<Exclude<Locale, "ko">, string> = {
  en: "This English version is a translation provided for convenience. If it differs from the Korean original, the Korean version prevails.",
  zh: "本中文版本为方便阅读而提供的译文。如与韩文原文有出入，以韩文版本为准。",
};

export function LegalLayout({
  locale,
  title,
  effective,
  children,
}: {
  locale: Locale;
  title: string;
  effective: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">{title}</h1>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            {HOME[locale]}
          </Link>
        </div>

        <div className="flex flex-col gap-8 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          <p className="text-zinc-400 text-xs">{effective}</p>
          {locale !== "ko" && (
            <p className="rounded-lg bg-zinc-100 dark:bg-zinc-900 px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
              {TRANSLATION_NOTICE[locale]}
            </p>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-sm font-semibold text-black dark:text-zinc-50 mb-2">{title}</h2>
      {children}
    </section>
  );
}

export function List({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 flex flex-col gap-1.5">{children}</ul>;
}
