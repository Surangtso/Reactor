import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordUsage } from "@/lib/ai-usage";
import { getMemory, memoryBlock } from "@/lib/memory";

const client = new Anthropic();
// 코멘트·덧붙임 답글 모델. 2026-10-04 블라인드 비교 후 비용(-61%)·속도 때문에 Sonnet 5로 전환.
// 이전 품질로 되돌리려면 "claude-opus-5"로 바꾸면 된다 (comment.md는 그대로 공유).
const MODEL = "claude-sonnet-5";
const HISTORY_LIMIT = 30;

type EntryForComment = {
  id: string;
  category: string | null;
  content: string;
};

type HistoryRow = {
  category: string | null;
  content: string;
  entry_date: string;
  comment: string | null;
};

async function fetchHistory(
  supabase: SupabaseClient,
  userId: string,
  excludeEntryId?: string,
): Promise<HistoryRow[]> {
  let query = supabase
    .from("entries")
    .select("category, content, entry_date, comment")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (excludeEntryId) {
    query = query.neq("id", excludeEntryId);
  }

  const { data } = await query;
  return ((data as HistoryRow[]) ?? []).slice().reverse();
}

function buildHistoryText(chronological: HistoryRow[]): string {
  return chronological
    .map(
      (h) =>
        `(${h.entry_date}) [${h.category ?? "무분류"}] ${h.content}` +
        (h.comment ? `\n  → 남겼던 코멘트: "${h.comment}"` : ""),
    )
    .join("\n");
}

function recentCommentsOf(chronological: HistoryRow[]): string[] {
  return chronological
    .map((h) => h.comment)
    .filter((c): c is string => !!c)
    .slice(-5);
}

async function callClaudeForComment(
  systemPrompt: string,
  userMessage: string,
  track: (response: Anthropic.Message) => Promise<void>,
): Promise<string | null> {
  const request = {
    model: MODEL,
    // claude-opus-5는 기본적으로 사고(thinking)를 켠 채 실행되고, 사고에 쓴
    // 토큰도 max_tokens에서 차감된다. 짧은 코멘트에는 깊은 사고가 필요 없으므로
    // effort를 낮추고, 사고 분량이 변동해도 텍스트가 잘리지 않도록 여유를 둔다.
    max_tokens: 1500,
    output_config: { effort: "low" as const },
    system: systemPrompt,
    messages: [{ role: "user" as const, content: userMessage }],
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await client.messages.create(request);
      await track(response);
      const textBlock = response.content.find(
        (block): block is Anthropic.TextBlock => block.type === "text",
      );

      if (textBlock?.text.trim()) {
        return textBlock.text.trim();
      }

      console.error(
        `[코멘트 생성] 텍스트 없이 종료 (attempt ${attempt}) stop_reason=${response.stop_reason}`,
      );
    } catch (error) {
      console.error(`[코멘트 생성 오류] (attempt ${attempt})`, error);
    }
  }

  return null;
}

export async function generateComment(
  supabase: SupabaseClient,
  userId: string,
  chapterName: string | null,
  entry: EntryForComment,
): Promise<string | null> {
  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "comment.md"),
    "utf-8",
  );

  const [chronological, memory] = await Promise.all([
    fetchHistory(supabase, userId, entry.id),
    getMemory(supabase, userId),
  ]);
  const recentComments = recentCommentsOf(chronological);

  const userMessage = [
    `현재 챕터: ${chapterName ?? "(없음)"}`,
    memoryBlock(memory),
    chronological.length > 0
      ? `누적 기록:\n${buildHistoryText(chronological)}`
      : "누적 기록: (아직 없음, 이번이 첫 기록)",
    recentComments.length > 0
      ? `최근에 남긴 코멘트들 (표현·문장 구조를 반복하지 않기 위한 참고용):\n${recentComments.map((c) => `- ${c}`).join("\n")}`
      : null,
    `방금 쓴 기록 (${entry.category ?? "무분류"}): "${entry.content}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return callClaudeForComment(systemPrompt, userMessage, (r) =>
    recordUsage(supabase, userId, "comment", r),
  );
}

export async function generateReflectionComment(
  supabase: SupabaseClient,
  userId: string,
  chapterName: string | null,
  entry: EntryForComment & { comment: string | null },
  reflectionContent: string,
): Promise<string | null> {
  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "comment.md"),
    "utf-8",
  );

  const [chronological, memory] = await Promise.all([
    fetchHistory(supabase, userId, entry.id),
    getMemory(supabase, userId),
  ]);
  const recentComments = recentCommentsOf(chronological);

  const userMessage = [
    `현재 챕터: ${chapterName ?? "(없음)"}`,
    memoryBlock(memory),
    chronological.length > 0
      ? `누적 기록:\n${buildHistoryText(chronological)}`
      : "누적 기록: (아직 없음)",
    recentComments.length > 0
      ? `최근에 남긴 코멘트들 (표현·문장 구조를 반복하지 않기 위한 참고용):\n${recentComments.map((c) => `- ${c}`).join("\n")}`
      : null,
    `아까 남긴 기록 (${entry.category ?? "무분류"}): "${entry.content}"` +
      (entry.comment ? `\n  → 그때 남겼던 코멘트: "${entry.comment}"` : ""),
    `방금 그 기록에 덧붙인 말: "${reflectionContent}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  return callClaudeForComment(systemPrompt, userMessage, (r) =>
    recordUsage(supabase, userId, "reflection_comment", r),
  );
}
