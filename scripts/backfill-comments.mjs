// 일회성 스크립트: 배경 작업(after())이 누락시켜 코멘트가 안 달린 entries를 채워 넣는다.
// lib/comment.ts의 generateComment 로직을 그대로 복제한다 (plain .mjs라 경로 별칭 없이).
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);
const anthropic = new Anthropic();
const MODEL = "claude-opus-5";
const HISTORY_LIMIT = 30;

const targetIds = process.argv.slice(2);
if (targetIds.length === 0) {
  console.error("사용법: node --env-file=.env.local scripts/backfill-comments.mjs <entry-id> [entry-id...]");
  process.exit(1);
}

const systemPrompt = fs.readFileSync("comment.md", "utf-8");

for (const id of targetIds) {
  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .select("id, user_id, category, content, chapter_id, comment")
    .eq("id", id)
    .single();

  if (entryError || !entry) {
    console.error(`[${id}] 조회 실패:`, entryError?.message);
    continue;
  }
  if (entry.comment) {
    console.log(`[${id}] 이미 코멘트 있음, 건너뜀`);
    continue;
  }

  let chapterName = null;
  if (entry.chapter_id) {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("name")
      .eq("id", entry.chapter_id)
      .maybeSingle();
    chapterName = chapter?.name ?? null;
  }

  const { data: history } = await supabase
    .from("entries")
    .select("category, content, entry_date, comment")
    .eq("user_id", entry.user_id)
    .neq("id", entry.id)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const chronological = (history ?? []).slice().reverse();
  const historyText = chronological
    .map(
      (h) =>
        `(${h.entry_date}) [${h.category ?? "무분류"}] ${h.content}` +
        (h.comment ? `\n  → 남겼던 코멘트: "${h.comment}"` : ""),
    )
    .join("\n");

  const recentComments = chronological
    .map((h) => h.comment)
    .filter((c) => !!c)
    .slice(-5);

  const userMessage = [
    `현재 챕터: ${chapterName ?? "(없음)"}`,
    chronological.length > 0
      ? `누적 기록:\n${historyText}`
      : "누적 기록: (아직 없음, 이번이 첫 기록)",
    recentComments.length > 0
      ? `최근에 남긴 코멘트들 (표현·문장 구조를 반복하지 않기 위한 참고용):\n${recentComments.map((c) => `- ${c}`).join("\n")}`
      : null,
    `방금 쓴 기록 (${entry.category ?? "무분류"}): "${entry.content}"`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const comment = textBlock?.text.trim();

    if (!comment) {
      console.error(`[${id}] 빈 응답`);
      continue;
    }

    const { error: updateError } = await supabase
      .from("entries")
      .update({ comment })
      .eq("id", id);

    if (updateError) {
      console.error(`[${id}] 저장 실패:`, updateError.message);
      continue;
    }

    console.log(`[${id}] 완료: "${comment}"`);
  } catch (err) {
    console.error(`[${id}] 생성 오류:`, err.message ?? err);
  }
}
