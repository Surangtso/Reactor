import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/events";
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
  const displayName: string = (body.displayName ?? "").trim();
  const currentPhase: string = (body.currentPhase ?? "").trim();
  const currentConcern: string = (body.currentConcern ?? "").trim();
  const chapterName: string = (body.chapterName ?? "").trim();

  if (!displayName || !currentPhase || !chapterName) {
    return Response.json(
      { error: "필수 항목이 비어있습니다." },
      { status: 400 },
    );
  }

  const { error: profileError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });
  if (profileError) {
    console.error("[온보딩: 프로필 저장 오류]", profileError.code, profileError.message);
    return Response.json(
      { error: "프로필 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  const entryDate = await getToday();
  const entryRows = [
    { user_id: user.id, category: "나에 대해", content: currentPhase, entry_date: entryDate },
    ...(currentConcern
      ? [{ user_id: user.id, category: "마음", content: currentConcern, entry_date: entryDate }]
      : []),
  ];

  const { error: entriesError } = await supabase.from("entries").insert(entryRows);
  if (entriesError) {
    console.error("[온보딩: entries 저장 오류]", entriesError.code, entriesError.message);
    return Response.json(
      { error: "기록 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  await supabase
    .from("chapters")
    .update({ status: "completed", end_date: entryDate })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { error: chapterError } = await supabase.from("chapters").insert({
    user_id: user.id,
    name: chapterName,
    start_date: entryDate,
    status: "active",
  });
  if (chapterError) {
    console.error("[온보딩: chapter 저장 오류]", chapterError.code, chapterError.message);
    return Response.json(
      { error: "챕터 저장에 실패했습니다." },
      { status: 500 },
    );
  }

  await logEvent(supabase, user.id, "signup");

  return Response.json({ ok: true });
}
