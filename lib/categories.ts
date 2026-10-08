import type { Locale } from "@/lib/messages";

// DB에 저장되는 카테고리 값은 언어와 상관없이 항상 이 한국어 키다.
// 화면에서는 CATEGORY_LABELS로 언어에 맞게 바꿔 보여준다.
export const CATEGORIES = [
  "마음",
  "떠오름",
  "취향",
  "하루",
  "나에 대해",
  "목표",
  "순간",
  // 긴 글 전용 — 평소의 잡생각, 사상, 관점을 풀어 쓰는 곳. 화면에서 따로 표시된다.
  "생각",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const LONG_FORM_CATEGORY: Category = "생각";

export const CATEGORY_LABELS: Record<Locale, Record<Category, string>> = {
  ko: {
    마음: "마음",
    떠오름: "떠오름",
    취향: "취향",
    하루: "하루",
    "나에 대해": "나에 대해",
    목표: "목표",
    순간: "순간",
    생각: "생각",
  },
  en: {
    마음: "Feelings",
    떠오름: "Sparks",
    취향: "Tastes",
    하루: "Today",
    "나에 대해": "About me",
    목표: "Heading",
    순간: "Moments",
    생각: "Thoughts",
  },
  zh: {
    마음: "心情",
    떠오름: "灵光",
    취향: "喜好",
    하루: "今天",
    "나에 대해": "关于我",
    목표: "向往",
    순간: "瞬间",
    생각: "思考",
  },
};

export const CATEGORY_PLACEHOLDERS: Record<Locale, Record<Category, string>> = {
  ko: {
    마음: "지금 나의 마음",
    떠오름: "문득 떠오른 것",
    취향: "내가 좋아하는 것",
    하루: "오늘 하루",
    "나에 대해": "나 자신",
    목표: "향하는 삶의 모습",
    순간: "행복한 짧은 순간",
    생각: "요즘 머릿속을 오가는 생각, 내가 바라보는 세상",
  },
  en: {
    마음: "How I feel right now",
    떠오름: "Something that just crossed my mind",
    취향: "Something I love",
    하루: "My day",
    "나에 대해": "Myself",
    목표: "The life I'm heading toward",
    순간: "A short, happy moment",
    생각: "Thoughts on my mind lately, the world as I see it",
  },
  zh: {
    마음: "此刻的心情",
    떠오름: "忽然想到的",
    취향: "我喜欢的",
    하루: "今天",
    "나에 대해": "我自己",
    목표: "向往的生活",
    순간: "短暂的幸福瞬间",
    생각: "最近脑海里的想法，我眼中的世界",
  },
};

/** DB에 저장된 카테고리 값을 화면 언어의 이름으로. 알 수 없는 값은 그대로. */
export function categoryLabel(category: string | null | undefined, locale: Locale): string {
  if (!category) return "";
  return CATEGORY_LABELS[locale][category as Category] ?? category;
}
