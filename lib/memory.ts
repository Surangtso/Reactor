import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordUsage } from "@/lib/ai-usage";

const client = new Anthropic();
const MODEL = "claude-opus-5";

// 기록이 이만큼 쌓이면 첫 노트를 쓰고, 그 뒤로는 새 기록이 UPDATE_EVERY개 쌓일 때마다 고쳐 쓴다.
const MIN_ENTRIES = 5;
const UPDATE_EVERY = 5;
// 첫 노트를 쓸 때 읽는 최대 기록 수 (최근 것부터)
const MAX_FIRST_READ = 200;

type MemoryRow = {
  content: string;
  entry_count: number;
  last_entry_at: string;
};

type EntryRow = {
  id: string;
  category: string | null;
  content: string;
  entry_date: string;
  created_at: string;
};

/** 다른 AI들이 함께 읽는 이 사람의 기억 노트. 없으면 null. */
export async function getMemory(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("user_memories")
    .select("content")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.content ?? null;
}

/** 프롬프트에 끼워 넣을 기억 노트 블록. 노트가 없으면 null. */
export function memoryBlock(memory: string | null): string | null {
  if (!memory) return null;
  return `이 사람에 대해 기억하고 있는 것 (최근 기록 너머 오래된 기록까지 정리한 노트 — 참고용):\n${memory}`;
}

function formatEntry(e: Pick<EntryRow, "category" | "content" | "entry_date">) {
  return `(${e.entry_date}) [${e.category ?? "무분류"}] ${e.content}`;
}

/**
 * 때가 됐으면 기억 노트를 처음 쓰거나 고쳐 쓴다. 아니면 아무것도 하지 않는다.
 * 고쳐 쓸 때는 지난번 이후의 새 기록(과 새로 덧붙인 말)만 읽는다.
 */
export async function maybeUpdateMemory(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const [{ data: memory }, { count }] = await Promise.all([
    supabase
      .from("user_memories")
      .select("content, entry_count, last_entry_at")
      .eq("user_id", userId)
      .maybeSingle<MemoryRow>(),
    supabase
      .from("entries")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);
  const total = count ?? 0;

  if (!memory && total < MIN_ENTRIES) return;
  if (memory && total - memory.entry_count < UPDATE_EVERY) return;

  // 새 기록: 처음이면 최근 MAX_FIRST_READ개, 고쳐 쓸 때는 지난번 이후 것만
  let entriesQuery = supabase
    .from("entries")
    .select("id, category, content, entry_date, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(MAX_FIRST_READ);
  if (memory) entriesQuery = entriesQuery.gt("created_at", memory.last_entry_at);
  const { data: recent } = await entriesQuery.returns<EntryRow[]>();
  const entries = (recent ?? []).slice().reverse();
  if (entries.length === 0) return;

  // 지난번 이후 새로 덧붙인 말 (예전 기록에 덧붙인 것 포함)
  let reflectionsQuery = supabase
    .from("reflections")
    .select("entry_id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (memory) reflectionsQuery = reflectionsQuery.gt("created_at", memory.last_entry_at);
  const { data: reflections } = await reflectionsQuery;

  const inBatch = new Map(entries.map((e) => [e.id, e]));
  const reflectionsByEntry = new Map<string, string[]>();
  for (const r of reflections ?? []) {
    const list = reflectionsByEntry.get(r.entry_id) ?? [];
    list.push(r.content);
    reflectionsByEntry.set(r.entry_id, list);
  }

  // 이번에 읽는 기록 밖의, 예전 기록에 덧붙인 말은 원래 기록과 함께 보여준다
  const olderIds = [...reflectionsByEntry.keys()].filter((id) => !inBatch.has(id));
  const { data: olderEntries } = olderIds.length
    ? await supabase
        .from("entries")
        .select("id, category, content, entry_date, created_at")
        .in("id", olderIds)
        .returns<EntryRow[]>()
    : { data: [] as EntryRow[] };

  const withReflections = (e: EntryRow) =>
    formatEntry(e) +
    (reflectionsByEntry.get(e.id) ?? [])
      .map((a) => `\n  → 나중에 덧붙인 말: ${a}`)
      .join("");

  const userMessage = [
    memory
      ? `지금까지의 기억 노트:\n${memory.content}`
      : "지금까지의 기억 노트: (없음, 이번이 처음)",
    `${memory ? "지난번 이후 새로 쓴 기록" : "이 사람의 기록"} ${entries.length}개 (날짜순):\n${entries
      .map(withReflections)
      .join("\n")}`,
    olderEntries && olderEntries.length > 0
      ? `예전 기록에 새로 덧붙인 말:\n${olderEntries.map(withReflections).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "memory.md"),
    "utf-8",
  );

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "medium" },
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    await recordUsage(supabase, userId, "memory", response);

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text",
    );
    const content = textBlock?.text.trim();

    if (!content || response.stop_reason === "max_tokens") {
      console.error(`[기억 노트] 본문 없음/잘림 stop_reason=${response.stop_reason}`);
      return;
    }

    await supabase.from("user_memories").upsert({
      user_id: userId,
      content,
      entry_count: total,
      last_entry_at: entries[entries.length - 1].created_at,
      updated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[기억 노트 생성 오류]", error);
  }
}
