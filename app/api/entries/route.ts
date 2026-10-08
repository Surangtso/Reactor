import { after } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateComment } from "@/lib/comment";
import { maybeGenerateLetter } from "@/lib/letter";
import { maybeUpdateThoughtSummary } from "@/lib/thought-summary";
import { maybeGenerateInsight } from "@/lib/insight";
import { maybeUpdateProfile } from "@/lib/soft-profile";
import { maybeUpdateMemory } from "@/lib/memory";
import { logEvent } from "@/lib/events";
import { CATEGORIES, LONG_FORM_CATEGORY } from "@/lib/categories";
import { getToday } from "@/lib/day";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const category: string = body.category;
  const content: string = (body.content ?? "").trim();

  if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number]) || !content) {
    return Response.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const today = await getToday();

  const { data: activeChapter } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const { data: entry, error } = await supabase
    .from("entries")
    .insert({
      user_id: user.id,
      chapter_id: activeChapter?.id ?? null,
      category,
      content,
      entry_date: today,
    })
    .select()
    .single();

  if (error) {
    console.error("[entries 저장 오류]", error.code, error.message);
    return Response.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  await logEvent(supabase, user.id, "entry_created");

  // 연속으로 빠르게 여러 건을 저장하면 next/server의 after()가 백그라운드
  // 작업을 누락시키는 경우가 있어 (코멘트가 영영 안 달림), 응답 전에 기다린다.
  const comment = await generateComment(
    supabase,
    user.id,
    activeChapter?.name ?? null,
    entry,
  );

  if (comment) {
    await supabase.from("entries").update({ comment }).eq("id", entry.id);
    entry.comment = comment;
  }

  after(async () => {
    await maybeGenerateLetter(supabase, user.id, today);
    if (category === LONG_FORM_CATEGORY) {
      await maybeUpdateThoughtSummary(supabase, user.id);
    }
    await maybeGenerateInsight(supabase, user.id);
    await maybeUpdateProfile(supabase, user.id);
    await maybeUpdateMemory(supabase, user.id);
  });

  return Response.json({ ok: true, entry });
}
