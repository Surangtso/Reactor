import { createClient } from "@/lib/supabase/server";
import { generateReflectionComment } from "@/lib/comment";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const entryId: string = body.entryId ?? "";
  const content: string = (body.content ?? "").trim();

  if (!entryId || !content) {
    return Response.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { data: entry, error: entryError } = await supabase
    .from("entries")
    .select("id, category, content, comment, chapter_id")
    .eq("id", entryId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (entryError || !entry) {
    return Response.json({ error: "원래 기록을 찾을 수 없습니다." }, { status: 404 });
  }

  let chapterName: string | null = null;
  if (entry.chapter_id) {
    const { data: chapter } = await supabase
      .from("chapters")
      .select("name")
      .eq("id", entry.chapter_id)
      .maybeSingle();
    chapterName = chapter?.name ?? null;
  }

  const { data: reflection, error: insertError } = await supabase
    .from("reflections")
    .insert({
      user_id: user.id,
      entry_id: entryId,
      content,
    })
    .select()
    .single();

  if (insertError) {
    console.error("[reflections 저장 오류]", insertError.code, insertError.message);
    return Response.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  const comment = await generateReflectionComment(
    supabase,
    user.id,
    chapterName,
    entry,
    content,
  );

  if (comment) {
    await supabase
      .from("reflections")
      .update({ comment })
      .eq("id", reflection.id);
    reflection.comment = comment;
  }

  return Response.json({ ok: true, reflection });
}
