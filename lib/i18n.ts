import { cookies, headers } from "next/headers";
import { messages, type Locale, type Messages, LOCALES } from "@/lib/messages";

export { LOCALES, type Locale, type Messages };

export const LOCALE_COOKIE = "locale";

function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * 화면 언어를 정한다: 사용자가 고른 언어(쿠키) → 브라우저 언어 → 영어.
 * 서버 컴포넌트·라우트 핸들러에서만 쓴다.
 */
export async function getLocale(): Promise<Locale> {
  const chosen = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(chosen)) return chosen;

  const accept = (await headers()).get("accept-language") ?? "";
  // "ko-KR,ko;q=0.9,en;q=0.8" → 순서대로 처음 맞는 언어
  for (const part of accept.split(",")) {
    const tag = part.split(";")[0].trim().toLowerCase();
    if (tag.startsWith("ko")) return "ko";
    if (tag.startsWith("zh")) return "zh";
    if (tag.startsWith("en")) return "en";
  }
  return "en";
}

export async function getMessages(): Promise<{ locale: Locale; m: Messages }> {
  const locale = await getLocale();
  return { locale, m: messages[locale] };
}
