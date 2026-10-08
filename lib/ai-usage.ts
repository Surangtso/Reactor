import type Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";

export type AiFeature =
  | "comment"
  | "reflection_comment"
  | "daily_prompt"
  | "letter"
  | "thought_summary"
  | "insight_write"
  | "insight_review"
  | "soft_profile"
  | "memory";

// 백만 토큰당 달러 (2026-09 기준 Claude API 정가). 가격이 바뀌면 여기만 고친다.
const PRICE_PER_MTOK: Record<string, { input: number; output: number }> = {
  "claude-opus-5": { input: 5, output: 25 },
  "claude-sonnet-5": { input: 2, output: 10 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/**
 * AI 호출 한 번의 토큰 사용량과 추정 비용을 ai_usage에 남긴다.
 * 기록 내용은 절대 남기지 않는다 — 숫자만. 실패해도 본 기능에는 영향을 주지 않는다.
 */
export async function recordUsage(
  supabase: SupabaseClient,
  userId: string,
  feature: AiFeature,
  response: Anthropic.Message,
) {
  const u = response.usage;
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const price = PRICE_PER_MTOK[response.model] ?? PRICE_PER_MTOK["claude-opus-5"];
  // 캐시 읽기는 입력 단가의 0.1배, 캐시 쓰기는 1.25배
  const costUsd =
    (u.input_tokens * price.input +
      cacheRead * price.input * 0.1 +
      cacheWrite * price.input * 1.25 +
      u.output_tokens * price.output) /
    1_000_000;

  const { error } = await supabase.from("ai_usage").insert({
    user_id: userId,
    feature,
    model: response.model,
    input_tokens: u.input_tokens,
    output_tokens: u.output_tokens,
    cache_read_tokens: cacheRead,
    cache_write_tokens: cacheWrite,
    cost_usd: costUsd,
  });

  if (error) {
    console.error("[AI 사용량 기록 오류]", error.code, error.message);
  }
}
