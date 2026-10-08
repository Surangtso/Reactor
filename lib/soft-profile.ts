import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import type { SupabaseClient } from "@supabase/supabase-js";
import { recordUsage } from "@/lib/ai-usage";

const client = new Anthropic();
const MODEL = "claude-opus-5";

// 기록이 이만큼 쌓이면 처음 만들고, 그 뒤로는 새 기록이 PROFILE_UPDATE_EVERY개 쌓일 때마다 새로 쓴다.
export const MIN_ENTRIES_FOR_PROFILE = 10;
export const PROFILE_UPDATE_EVERY = 7;
const MAX_ITEMS = 10;
// 입력이 끝없이 커지지 않도록 최근 기록부터 이만큼만 읽는다.
const MAX_ENTRIES_READ = 200;

export type ProfileItem = { label: string; value: string };

export type SoftProfile = {
  entry_count: number;
  headline: string;
  items: ProfileItem[];
  created_at: string;
};

async function countEntries(supabase: SupabaseClient, userId: string) {
  const { count } = await supabase
    .from("entries")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function getLatestProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<SoftProfile | null> {
  const { data } = await supabase
    .from("soft_profiles")
    .select("entry_count, headline, items, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data as SoftProfile | null;
}

export async function getHiddenLabels(
  supabase: SupabaseClient,
  userId: string,
): Promise<string[]> {
  const { data } = await supabase
    .from("soft_profile_hidden")
    .select("label")
    .eq("user_id", userId);
  return (data ?? []).map((r) => r.label);
}

/** 지금 프로필을 새로 쓸 때가 됐는지. */
export async function isProfileDue(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ due: boolean; entryCount: number; latest: SoftProfile | null }> {
  const [entryCount, latest] = await Promise.all([
    countEntries(supabase, userId),
    getLatestProfile(supabase, userId),
  ]);

  const due = latest
    ? entryCount - latest.entry_count >= PROFILE_UPDATE_EVERY
    : entryCount >= MIN_ENTRIES_FOR_PROFILE;

  return { due, entryCount, latest };
}

const PROFILE_TOOL: Anthropic.Tool = {
  name: "write_profile",
  description: "완성된 Soft profile을 전달한다.",
  input_schema: {
    type: "object",
    properties: {
      headline: { type: "string", description: "이 사람을 한 줄로 (1인칭, 짧게)" },
      items: {
        type: "array",
        description: `항목들 (최대 ${MAX_ITEMS}개)`,
        items: {
          type: "object",
          properties: {
            label: { type: "string", description: "항목 이름 (1인칭, 짧게)" },
            value: { type: "string", description: "내용 (1인칭, 한 줄)" },
          },
          required: ["label", "value"],
        },
      },
    },
    required: ["headline", "items"],
  },
};

/** 때가 됐으면 프로필을 새로 써서 저장한다. 아니면 아무것도 하지 않는다. */
export async function maybeUpdateProfile(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { due, entryCount, latest } = await isProfileDue(supabase, userId);
  if (!due) return;

  const { data: recent } = await supabase
    .from("entries")
    .select("category, content, entry_date")
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(MAX_ENTRIES_READ);

  const entries = (recent ?? []).slice().reverse();
  if (entries.length === 0) return;

  const entriesText = entries
    .map((e) => `(${e.entry_date}) [${e.category ?? "무분류"}] ${e.content}`)
    .join("\n");

  const userMessage = [
    `이 사람의 기록 ${entries.length}개 (날짜순):\n${entriesText}`,
    latest
      ? `이전 프로필 (기록 ${latest.entry_count}개로 만든 것):\n한 줄: ${latest.headline}\n${latest.items
          .map((i) => `- ${i.label}: ${i.value}`)
          .join("\n")}`
      : "이전 프로필: (없음, 이번이 처음)",
  ].join("\n\n---\n\n");

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "soft-profile.md"),
    "utf-8",
  );

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: "high" },
      system: systemPrompt,
      tools: [PROFILE_TOOL],
      tool_choice: { type: "tool", name: "write_profile" },
      messages: [{ role: "user", content: userMessage }],
    });
    await recordUsage(supabase, userId, "soft_profile", response);

    const toolUse = response.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );
    const input = toolUse?.input as
      | { headline?: string; items?: ProfileItem[] }
      | undefined;

    const items = (input?.items ?? [])
      .filter((i) => i?.label?.trim() && i?.value?.trim())
      .map((i) => ({ label: i.label.trim(), value: i.value.trim() }))
      .slice(0, MAX_ITEMS);

    if (!input?.headline?.trim() || items.length === 0) {
      console.error(
        `[Soft profile] 결과 형식 오류 stop_reason=${response.stop_reason}`,
      );
      return;
    }

    // 같은 기록 수로 이미 누가 먼저 저장했으면 unique 제약에 걸려 조용히 무시된다.
    await supabase.from("soft_profiles").insert({
      user_id: userId,
      entry_count: entryCount,
      headline: input.headline.trim(),
      items,
    });
  } catch (error) {
    console.error("[Soft profile 생성 오류]", error);
  }
}
