import { createClient } from "@/lib/supabase/server";
import { isProfileDue, maybeUpdateProfile } from "@/lib/soft-profile";
import { getLocale } from "@/lib/i18n";

// 기록을 저장할 때 백그라운드에서 이미 새로 쓰지만, 그게 누락됐을 때
// 프로필 화면에서 직접 불러 맞춘다. 때가 아니면 아무것도 하지 않는다.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await maybeUpdateProfile(supabase, user.id, await getLocale());

  const { due } = await isProfileDue(supabase, user.id);
  if (due) {
    return Response.json({ error: "생성에 실패했습니다." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
