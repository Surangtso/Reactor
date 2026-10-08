"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LOCALES, LOCALE_NAMES, messages, type Locale, type Messages } from "@/lib/messages";

const LocaleContext = createContext<Locale>("ko");

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

/** 클라이언트 컴포넌트에서 현재 화면 언어와 문구 사전을 꺼낸다. */
export function useI18n(): { locale: Locale; m: Messages } {
  const locale = useContext(LocaleContext);
  return { locale, m: messages[locale] };
}

function saveLocale(locale: Locale) {
  document.cookie = `locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/** 한 / EN / 中 전환. 고른 언어는 1년간 쿠키로 기억한다. */
export function LanguageSwitcher({ className = "" }: { className?: string }) {
  const { locale } = useI18n();
  const router = useRouter();

  function choose(next: Locale) {
    if (next === locale) return;
    saveLocale(next);
    // 로그인한 상태면 사용자 정보에도 남겨서 다음 로그인 메일이 이 언어로 오게 한다
    // (로그인 전이면 조용히 실패하고, 가입할 때 로그인 화면이 대신 남긴다).
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (data.user) {
          return createClient().auth.updateUser({ data: { locale: next } });
        }
      })
      .catch(() => {});
    router.refresh();
  }

  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => choose(l)}
          aria-current={l === locale}
          className={
            l === locale
              ? "font-semibold text-black dark:text-zinc-50"
              : "text-zinc-400 hover:text-black dark:hover:text-zinc-50"
          }
        >
          {LOCALE_NAMES[l]}
        </button>
      ))}
    </div>
  );
}
