import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordUsage } from "@/lib/ai-usage";
import { screenLanguageRule } from "@/lib/ai-language";
import type { Locale } from "@/lib/messages";
import { getMemory, memoryBlock } from "@/lib/memory";

const client = new Anthropic();
const MODEL = "claude-opus-5";
const ENTRY_CONTEXT_LIMIT = 20;
const RECENT_PROMPTS_LIMIT = 7;

type EntryRow = {
  category: string | null;
  content: string;
  entry_date: string;
};

async function generate(
  supabase: SupabaseClient,
  userId: string,
  chapterName: string | null,
  today: string,
  locale: Locale,
): Promise<string | null> {
  const systemPrompt =
    fs.readFileSync(
    path.join(process.cwd(), "daily-prompt.md"),
    "utf-8",
  ) + screenLanguageRule(locale);

  const [{ data: entries }, { data: recentPrompts }, memory] = await Promise.all([
    supabase
      .from("entries")
      .select("category, content, entry_date")
      .eq("user_id", userId)
      .order("entry_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(ENTRY_CONTEXT_LIMIT)
      .returns<EntryRow[]>(),
    supabase
      .from("daily_prompts")
      .select("content")
      .eq("user_id", userId)
      .order("prompt_date", { ascending: false })
      .limit(RECENT_PROMPTS_LIMIT),
    getMemory(supabase, userId),
  ]);

  const chronological = (entries ?? []).slice().reverse();

  const userMessage = [
    `오늘 날짜: ${today}`,
    `현재 챕터: ${chapterName ?? "(없음)"}`,
    memoryBlock(memory),
    chronological.length > 0
      ? `최근 기록:\n${chronological
          .map((e) => `(${e.entry_date}) [${e.category ?? "무분류"}] ${e.content}`)
          .join("\n")}`
      : "최근 기록: (아직 없음)",
    recentPrompts && recentPrompts.length > 0
      ? `최근에 건넸던 말들 (반복하지 않기 위한 참고용):\n${recentPrompts
          .map((p) => `- ${p.content}`)
          .join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await client.messages.create({
      model: MODEL,
      // 코멘트와 마찬가지로 짧은 한마디라 사고를 깊게 할 필요가 없다.
      max_tokens: 1500,
      output_config: { effort: "low" },
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    await recordUsage(supabase, userId, "daily_prompt", response);
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    return textBlock?.text.trim() || null;
  } catch (error) {
    console.error("[오늘의 한마디 생성 오류]", error);
    return null;
  }
}

/**
 * 오늘의 한마디를 돌려준다. 오늘 처음 불리면 새로 만들어 저장하고,
 * 이미 있으면 저장된 것을 그대로 돌려준다 (유저당 하루 1개).
 */
export async function getOrCreateDailyPrompt(
  supabase: SupabaseClient,
  userId: string,
  chapterName: string | null,
  today: string,
  locale: Locale = "ko",
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("daily_prompts")
    .select("content")
    .eq("user_id", userId)
    .eq("prompt_date", today)
    .maybeSingle();

  if (existing) return existing.content;

  const content = await generate(supabase, userId, chapterName, today, locale);
  if (!content) return null;

  const { error } = await supabase
    .from("daily_prompts")
    .insert({ user_id: userId, prompt_date: today, content });

  if (error) {
    // 거의 동시에 두 번 요청돼 다른 쪽이 먼저 저장한 경우 — 그쪽 것을 쓴다.
    const { data: winner } = await supabase
      .from("daily_prompts")
      .select("content")
      .eq("user_id", userId)
      .eq("prompt_date", today)
      .maybeSingle();
    return winner?.content ?? content;
  }

  return content;
}
