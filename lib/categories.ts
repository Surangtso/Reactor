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
