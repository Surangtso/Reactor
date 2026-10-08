import Image from "next/image";
import Link from "next/link";
import { getMessages } from "@/lib/i18n";
import { LanguageSwitcher } from "./locale-provider";

// 로그인하지 않은 방문자가 tsotlo.com에서 처음 보는 소개 페이지.
// 예시는 모두 가상이다 — 실제 이용자의 기록을 쓰지 않는다. 문구는 lib/messages.ts의 landing.

function Logo() {
  return (
    <span className="inline-flex items-center gap-2">
      <svg viewBox="0 0 64 64" className="h-5 w-5" aria-hidden="true">
        <rect x="7" y="21" width="22" height="22" fill="#D4A72C" />
        <rect x="35" y="21" width="22" height="22" fill="#D4A72C" />
      </svg>
      <span className="text-sm font-semibold tracking-wide text-black dark:text-zinc-50">
        Reactor
      </span>
    </span>
  );
}

function StartButton({ label }: { label: string }) {
  return (
    <Link
      href="/login"
      className="inline-flex items-center justify-center rounded-full bg-maroon px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
    >
      {label}
    </Link>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-xs tracking-wide text-maroon dark:text-[#e0707f]">{children}</p>;
}

function ExampleEntry({
  category,
  content,
  comment,
}: {
  category: string;
  content: string;
  comment: string;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
      <span className="text-xs text-zinc-400">{category}</span>
      <p className="mt-1 text-[15px] text-black dark:text-zinc-50">{content}</p>
      <p className="mt-3 text-sm italic text-zinc-500 dark:text-zinc-400">{comment}</p>
    </div>
  );
}

export default async function Landing() {
  const { m } = await getMessages();
  const t = m.landing;

  return (
    <div className="min-h-screen bg-[#F7F5F0] text-black dark:bg-black dark:text-zinc-50 break-keep">
      <header className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-6">
        <Logo />
        <div className="flex items-center gap-5">
          <LanguageSwitcher />
          <Link
            href="/login"
            className="text-sm text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            {t.login}
          </Link>
        </div>
      </header>

      <main>
        {/* 첫 화면 */}
        <section className="mx-auto max-w-5xl px-5 pt-16 pb-24 sm:pt-24">
          <h1 className="text-4xl font-semibold leading-tight sm:text-6xl sm:leading-tight">
            {t.heroTitle1}
            <br />
            {t.heroTitle2}
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            {t.heroBody}
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <StartButton label={t.start} />
            <span className="text-xs text-zinc-400">{t.heroNote}</span>
          </div>
        </section>

        {/* 1. 남기면, 곁에서 반응해요 */}
        <section className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto grid max-w-5xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center">
            <div>
              <Label>{t.s1Label}</Label>
              <h2 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
                {t.s1Title1}
                <br />
                {t.s1Title2}
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">{t.s1Body}</p>
            </div>
            <div className="flex flex-col gap-4">
              {t.examples.map((e) => (
                <ExampleEntry key={e.content} {...e} />
              ))}
            </div>
          </div>
        </section>

        {/* 2. 쌓이면, 먼저 건네요 */}
        <section className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto grid max-w-5xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center">
            <div className="md:order-2">
              <Label>{t.s2Label}</Label>
              <h2 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
                {t.s2Title1}
                <br />
                {t.s2Title2}
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">{t.s2Body}</p>
            </div>
            <div className="md:order-1 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5 dark:bg-zinc-900 dark:ring-white/10">
              <p className="text-xs text-zinc-400">{t.insightKind}</p>
              <p className="mt-2 text-lg font-semibold">{t.insightTitle}</p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                {t.insightBody}
              </p>
              <p className="mt-4 text-xs text-zinc-400">{t.insightNote}</p>
            </div>
          </div>
        </section>

        {/* 3. soft-profile */}
        <section className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto grid max-w-5xl gap-12 px-5 py-20 md:grid-cols-2 md:items-center">
            <div>
              <Label>{t.s3Label}</Label>
              <h2 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">
                {t.s3Title1}
                <br />
                {t.s3Title2}
              </h2>
              <p className="mt-4 leading-relaxed text-zinc-600 dark:text-zinc-400">
                <em>soft-profile</em>
                {t.s3Body}
              </p>
            </div>
            <div className="mx-auto w-full max-w-xs overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5">
              <Image
                src={t.profileImage}
                alt={t.profileAlt}
                width={1080}
                height={1920}
                className="aspect-[1080/1200] w-full object-cover object-top"
              />
            </div>
          </div>
        </section>

        {/* 약속 */}
        <section className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto max-w-5xl px-5 py-20">
            <Label>{t.promiseLabel}</Label>
            <h2 className="mt-3 text-2xl font-semibold leading-snug sm:text-3xl">{t.promiseTitle}</h2>
            <ul className="mt-8 grid gap-6 sm:grid-cols-3">
              {t.promises.map((p) => (
                <li key={p.title}>
                  <p className="font-medium">{p.title}</p>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {p.body}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* 마지막 */}
        <section className="border-t border-black/5 dark:border-white/10">
          <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 px-5 py-24">
            <h2 className="text-2xl font-semibold leading-snug sm:text-3xl">{t.finalTitle}</h2>
            <StartButton label={t.start} />
          </div>
        </section>
      </main>

      <footer className="border-t border-black/5 dark:border-white/10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-5 py-8 text-xs text-zinc-400">
          <span>© Reactor</span>
          <Link href="/privacy" className="hover:text-black dark:hover:text-zinc-50">
            {t.privacy}
          </Link>
          <Link href="/terms" className="hover:text-black dark:hover:text-zinc-50">
            {t.terms}
          </Link>
          <a
            href="https://github.com/Surangtso/Reactor"
            className="hover:text-black dark:hover:text-zinc-50"
          >
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
