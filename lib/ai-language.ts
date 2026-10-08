import type { Locale } from "@/lib/messages";

// (비공개) 다른 언어로 쓸 때 AI 규칙 끝에 붙이는 언어·말투 지시문

/** 기록에 답하는 글: 이 사람이 쓴 언어로 답하게 하는 지시 */
export const FOLLOW_WRITING_LANGUAGE = "\n\n(비공개 — 이 사람이 쓴 언어로 답하게 하는 지시)";

/** 화면 언어로 쓰는 글: 한국어 화면이면 덧붙일 것이 없다 */
export function screenLanguageRule(locale: Locale): string {
  return locale === "ko" ? "" : `\n\n(비공개 — ${locale} 화면 언어로 쓰게 하는 지시)`;
}
