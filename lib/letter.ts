import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordUsage } from "@/lib/ai-usage";
import { getMemory, memoryBlock } from "@/lib/memory";

const client = new Anthropic();
const MODEL = "claude-opus-5";
const MIN_DAYS_BETWEEN = 7;
const PRIOR_CONTEXT_LIMIT = 30;

type EntryRow = {
  category: string | null;
  content: string;
  entry_date: string;
};

function daysSince(dateStr: string) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
}

function formatEntries(entries: EntryRow[]) {
  return entries
    .map((e) => `(${e.entry_date}) [${e.category ?? "무분류"}] ${e.content}`)
    .join("\n");
}

/**
 * 마지막 편지로부터 일주일이 지났고, 그 사이에 쓴 기록이 하나라도 있으면
 * letter.md를 시스템 프롬프트로 주간 편지를 생성해 narratives에 저장한다.
 * 조건이 안 맞으면 조용히 아무것도 하지 않는다.
 */
export async function maybeGenerateLetter(
  supabase: SupabaseClient,
  userId: string,
  today: string,
) {
  const { data: latestNarrative } = await supabase
    .from("narratives")
    .select("period_end, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let periodStart: string;

  if (latestNarrative) {
    if (daysSince(latestNarrative.created_at) < MIN_DAYS_BETWEEN) return;
    const next = new Date(latestNarrative.period_end);
    next.setDate(next.getDate() + 1);
    periodStart = next.toISOString().slice(0, 10);
  } else {
    const { data: firstEntry } = await supabase
      .from("entries")
      .select("entry_date")
      .eq("user_id", userId)
      .order("entry_date", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!firstEntry) return;
    if (daysSince(firstEntry.entry_date) < MIN_DAYS_BETWEEN) return;
    periodStart = firstEntry.entry_date;
  }

  const periodEnd = today;

  const { data: weekEntries } = await supabase
    .from("entries")
    .select("category, content, entry_date")
    .eq("user_id", userId)
    .gte("entry_date", periodStart)
    .lte("entry_date", periodEnd)
    .order("entry_date", { ascending: true })
    .returns<EntryRow[]>();

  if (!weekEntries || weekEntries.length === 0) return;

  const { data: priorEntries } = await supabase
    .from("entries")
    .select("category, content, entry_date")
    .eq("user_id", userId)
    .lt("entry_date", periodStart)
    .order("entry_date", { ascending: false })
    .limit(PRIOR_CONTEXT_LIMIT)
    .returns<EntryRow[]>();

  const { data: activeChapter } = await supabase
    .from("chapters")
    .select("name")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const systemPrompt = fs.readFileSync(path.join(process.cwd(), "letter.md"), "utf-8");

  const memory = await getMemory(supabase, userId);

  const userMessage = [
    `현재 챕터: ${activeChapter?.name ?? "(없음)"}`,
    memoryBlock(memory),
    `이번 주 기록 (${periodStart} ~ ${periodEnd}):\n${formatEntries(weekEntries)}`,
    priorEntries && priorEntries.length > 0
      ? `이전 기록 (참고용):\n${formatEntries(priorEntries.slice().reverse())}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    await recordUsage(supabase, userId, "letter", response);

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );

    if (!textBlock?.text) return;

    await supabase.from("narratives").insert({
      user_id: userId,
      period_start: periodStart,
      period_end: periodEnd,
      content: textBlock.text.trim(),
    });
  } catch (error) {
    console.error("[주간 편지 생성 오류]", error);
  }
}
