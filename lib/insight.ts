import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordUsage } from "@/lib/ai-usage";
import { getMemory, memoryBlock } from "@/lib/memory";

const client = new Anthropic();
const MODEL = "claude-opus-5";

// 첫 제안은 기록이 이만큼 쌓였을 때, 그 뒤로는 새 기록이 NEW_ENTRIES_BETWEEN개 이상
// 쌓이고 MIN_DAYS_BETWEEN일이 지났을 때 도착한다.
export const MIN_ENTRIES_FIRST = 10;
const NEW_ENTRIES_BETWEEN = 5;
const MIN_DAYS_BETWEEN = 7;
// 입력이 끝없이 커지지 않도록 최근 기록부터 이만큼만 읽는다.
const MAX_ENTRIES_READ = 200;

export const INSIGHT_KINDS = ["book", "person", "potential", "fit"] as const;
export type InsightKind = (typeof INSIGHT_KINDS)[number];

export const INSIGHT_KIND_LABELS: Record<InsightKind, string> = {
  book: "책",
  person: "닮은 사람",
  potential: "너의 가능성",
  fit: "어울리는 것",
};

export type Insight = {
  id: string;
  kind: InsightKind;
  title: string;
  content: string;
  entry_count: number;
  read_at: string | null;
  created_at: string;
};

type EntryRow = {
  id: string;
  category: string | null;
  content: string;
  entry_date: string;
};

async function countEntries(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function listInsights(
  supabase: SupabaseClient,
  userId: string,
): Promise<Insight[]> {
  const { data } = await supabase
    .from("insights")
    .select("id, kind, title, content, entry_count, read_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data as Insight[]) ?? [];
}

export async function hasUnreadInsight(
  supabase: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { count } = await supabase
    .from("insights")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  return (count ?? 0) > 0;
}

export async function markInsightsRead(
  supabase: SupabaseClient,
  userId: string,
) {
  await supabase
    .from("insights")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
}

function daysSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

/** 지금 새 제안을 쓸 때가 됐는지. */
export async function isInsightDue(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ due: boolean; entryCount: number; latest: Insight | null }> {
  const [entryCount, insights] = await Promise.all([
    countEntries(supabase, userId),
    listInsights(supabase, userId),
  ]);
  const latest = insights[0] ?? null;

  const due = latest
    ? entryCount - latest.entry_count >= NEW_ENTRIES_BETWEEN &&
      daysSince(latest.created_at) >= MIN_DAYS_BETWEEN
    : entryCount >= MIN_ENTRIES_FIRST;

  return { due, entryCount, latest };
}

const DELIVER_TOOL: Anthropic.Tool = {
  name: "deliver_insight",
  description: "이 사람에게 건넬 제안 하나를 전달한다.",
  input_schema: {
    type: "object",
    properties: {
      kind: {
        type: "string",
        enum: [...INSIGHT_KINDS],
        description: "book(책) / person(닮은 사람) / potential(가능성) / fit(어울리는 것)",
      },
      title: { type: "string", description: "짧은 제목" },
      body: { type: "string", description: "본문 (줄글 3~5문단)" },
    },
    required: ["kind", "title", "body"],
  },
};

/** 때가 됐으면 새 제안을 써서 저장한다. 아니면 아무것도 하지 않는다. */
export async function maybeGenerateInsight(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { due, entryCount } = await isInsightDue(supabase, userId);
  if (!due) return;

  const { data: recent } = await supabase
    .from("entries")
    .select("id, category, content, entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(MAX_ENTRIES_READ)
    .returns<EntryRow[]>();

  const entries = (recent ?? []).slice().reverse();
  if (entries.length === 0) return;

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
    .map(
      (e) =>
        `(${e.entry_date}) [${e.category ?? "무분류"}] ${e.content}` +
        (reflectionsByEntry.get(e.id) ?? [])
          .map((a) => `\n  → 나중에 덧붙인 말: ${a}`)
          .join(""),
    )
    .join("\n");

  const previous = await listInsights(supabase, userId);
  const previousText = previous
    .slice()
    .reverse()
    .map(
      (p) =>
        `- (${p.created_at.slice(0, 10)}) [${p.kind}] ${p.title}\n  ${p.content.slice(0, 300)}…`,
    )
    .join("\n");

  const memory = await getMemory(supabase, userId);

  const userMessage = [
    memoryBlock(memory),
    `이 사람의 기록 ${entries.length}개 (날짜순):\n${entriesText}`,
    previous.length > 0
      ? `이전에 건넨 것들 (반복하지 않기 위한 참고용):\n${previousText}`
      : "이전에 건넨 것: (없음, 이번이 처음)",
  ]
    .filter(Boolean)
    .join("\n\n---\n\n");

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "insight.md"),
    "utf-8",
  );

  const trackWrite = (r: Anthropic.Message) =>
    recordUsage(supabase, userId, "insight_write", r);
  const trackReview = (r: Anthropic.Message) =>
    recordUsage(supabase, userId, "insight_review", r);

  try {
    // 쓰고 → 검수하고 → 문제가 있으면 지적을 반영해 한 번 더 쓴다.
    // 두 번째도 통과하지 못하면 저장하지 않는다 (다음 기회에 다시 시도).
    let draft = await writeInsight(systemPrompt, userMessage, trackWrite);
    let review = draft
      ? await reviewInsight(draft, entriesText, trackReview)
      : null;

    if (draft && review && !review.ok) {
      console.error(`[너에게] 검수 실패, 다시 씀: ${review.problems.length}건`);
      draft = await writeInsight(
        systemPrompt,
        userMessage +
          "\n\n---\n\n방금 쓴 초안에서 검수자가 찾은 문제 (이번에는 반드시 고쳐서 처음부터 다시 쓴다):\n" +
          review.problems.map((p) => `- ${p}`).join("\n"),
        trackWrite,
      );
      review = draft
        ? await reviewInsight(draft, entriesText, trackReview)
        : null;
    }

    if (!draft || !review?.ok) {
      console.error("[너에게] 검수를 통과한 글이 없어 저장하지 않음");
      return;
    }

    // 같은 기록 수로 이미 누가 먼저 저장했으면 unique 제약에 걸려 조용히 무시된다.
    await supabase.from("insights").insert({
      user_id: userId,
      kind: draft.kind,
      title: draft.title,
      content: draft.body,
      entry_count: entryCount,
    });
  } catch (error) {
    console.error("[너에게 생성 오류]", error);
  }
}

type Draft = { kind: InsightKind; title: string; body: string };

async function writeInsight(
  systemPrompt: string,
  userMessage: string,
  track: (response: Anthropic.Message) => Promise<void>,
): Promise<Draft | null> {
  const response = await client.messages.create({
    model: MODEL,
    // 이 기능의 핵심은 기록들 사이의 연결을 찾는 것이라 사고를 충분히 쓰게 둔다.
    max_tokens: 16000,
    output_config: { effort: "high" },
    system: systemPrompt,
    tools: [DELIVER_TOOL],
    tool_choice: { type: "tool", name: "deliver_insight" },
    messages: [{ role: "user", content: userMessage }],
  });
  await track(response);

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  const input = toolUse?.input as
    | { kind?: string; title?: string; body?: string }
    | undefined;

  if (
    !input?.kind ||
    !INSIGHT_KINDS.includes(input.kind as InsightKind) ||
    !input.title?.trim() ||
    !input.body?.trim()
  ) {
    console.error(`[너에게] 결과 형식 오류 stop_reason=${response.stop_reason}`);
    return null;
  }

  return {
    kind: input.kind as InsightKind,
    title: input.title.trim(),
    body: input.body.trim(),
  };
}

const REVIEW_TOOL: Anthropic.Tool = {
  name: "review_result",
  description: "검수 결과를 전달한다.",
  input_schema: {
    type: "object",
    properties: {
      ok: { type: "boolean", description: "그대로 내보내도 되면 true" },
      problems: {
        type: "array",
        items: { type: "string" },
        description: "발견한 문제들 (없으면 빈 배열)",
      },
    },
    required: ["ok", "problems"],
  },
};

const REVIEW_PROMPT = `(비공개 검수 규칙 — 쓰다가 고친 흔적, 틀린 사실, 기록에 없는 인용, 제목 형식을 확인한다)`;

async function reviewInsight(
  draft: Draft,
  entriesText: string,
  track: (response: Anthropic.Message) => Promise<void>,
): Promise<{ ok: boolean; problems: string[] } | null> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: { effort: "medium" },
    system: REVIEW_PROMPT,
    tools: [REVIEW_TOOL],
    tool_choice: { type: "tool", name: "review_result" },
    messages: [
      {
        role: "user",
        content: `[이용자의 기록]
${entriesText}

---

[검수할 글]
종류: ${draft.kind}
제목: ${draft.title}

${draft.body}`,
      },
    ],
  });
  await track(response);

  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
  );
  const input = toolUse?.input as
    | { ok?: boolean; problems?: string[] }
    | undefined;

  if (typeof input?.ok !== "boolean") return null;
  return { ok: input.ok, problems: input.problems ?? [] };
}
