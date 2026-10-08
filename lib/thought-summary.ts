import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordUsage } from "@/lib/ai-usage";
import { LONG_FORM_CATEGORY } from "@/lib/categories";

const client = new Anthropic();
const MODEL = "claude-opus-5";
export const MIN_THOUGHT_ENTRIES = 2;
// 글이 아주 많이 쌓였을 때 입력이 끝없이 커지지 않도록 최근 것부터 이만큼만 읽는다.
const MAX_ENTRIES_READ = 100;

type ThoughtEntry = {
  id: string;
  content: string;
  entry_date: string;
};

export type ThoughtSummary = {
  content: string;
  entry_count: number;
  created_at: string;
};

export async function countThoughtEntries(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category", LONG_FORM_CATEGORY);
  return count ?? 0;
}

export async function getLatestThoughtSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<ThoughtSummary | null> {
  const { data } = await supabase
    .from("thought_summaries")
    .select("content, entry_count, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * '생각' 글이 2편 이상이고, 마지막으로 쓴 글 이후 편수가 달라졌으면
 * thought-summary.md로 새 글을 써서 저장한다. 조건이 안 맞으면 아무것도 하지 않는다.
 */
export async function maybeUpdateThoughtSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const [count, latest] = await Promise.all([
    countThoughtEntries(supabase, userId),
    getLatestThoughtSummary(supabase, userId),
  ]);

  if (count < MIN_THOUGHT_ENTRIES) return;
  if (latest && latest.entry_count === count) return;

  const { data: recent } = await supabase
    .from("entries")
    .select("id, content, entry_date")
    .eq("user_id", userId)
    .eq("category", LONG_FORM_CATEGORY)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(MAX_ENTRIES_READ)
    .returns<ThoughtEntry[]>();

  const entries = (recent ?? []).slice().reverse();
  if (entries.length < MIN_THOUGHT_ENTRIES) return;

  const { data: reflections } = await supabase
    .from("reflections")
    .select("entry_id, content")
    .in(
      "entry_id",
      entries.map((e) => e.id),
    )
    .order("created_at", { ascending: true });

  const reflectionsByEntry = new Map<string, string[]>();
  for (const r of reflections ?? []) {
    const list = reflectionsByEntry.get(r.entry_id) ?? [];
    list.push(r.content);
    reflectionsByEntry.set(r.entry_id, list);
  }

  const entriesText = entries
    .map((e, i) => {
      const added = reflectionsByEntry.get(e.id) ?? [];
      return (
        `[${i + 1}] (${e.entry_date})\n${e.content}` +
        added.map((a) => `\n  → 나중에 덧붙인 말: ${a}`).join("")
      );
    })
    .join("\n\n");

  const userMessage = [
    `'생각' 글 ${entries.length}편 (날짜순):\n\n${entriesText}`,
    latest ? `이전에 쓴 글 (글 ${latest.entry_count}편을 읽고):\n${latest.content}` : null,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "thought-summary.md"),
    "utf-8",
  );

  try {
    const response = await client.messages.create({
      model: MODEL,
      // 여러 글을 엮어 읽어야 해서 코멘트보다 사고를 더 쓰게 두고,
      // 사고 토큰이 max_tokens에서 차감돼도 본문이 잘리지 않게 여유를 둔다.
      max_tokens: 16000,
      output_config: { effort: "medium" },
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    await recordUsage(supabase, userId, "thought_summary", response);

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    const content = textBlock?.text.trim();

    if (!content || response.stop_reason === "max_tokens") {
      console.error(
        `[생각 모아 읽기] 본문 없음/잘림 stop_reason=${response.stop_reason}`,
      );
      return;
    }

    // 같은 편수로 이미 누가 먼저 저장했으면 unique 제약에 걸려 조용히 무시된다.
    await supabase
      .from("thought_summaries")
      .insert({ user_id: userId, entry_count: count, content });
  } catch (error) {
    console.error("[생각 모아 읽기 생성 오류]", error);
  }
}
