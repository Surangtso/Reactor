import { createClient } from "@/lib/supabase/server";

// 공유 이미지에서 항목을 빼거나(hidden: true) 다시 넣는다(hidden: false).
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await request.json();
  const label: string = (body.label ?? "").trim();
  const hidden = body.hidden === true;

  if (!label) {
    return Response.json({ error: "입력값이 올바르지 않습니다." }, { status: 400 });
  }

  const { error } = hidden
    ? await supabase
        .from("soft_profile_hidden")
        .upsert({ user_id: user.id, label }, { ignoreDuplicates: true })
    : await supabase
        .from("soft_profile_hidden")
        .delete()
        .eq("user_id", user.id)
        .eq("label", label);

  if (error) {
    console.error("[Soft profile 숨김 저장 오류]", error.code, error.message);
    return Response.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
