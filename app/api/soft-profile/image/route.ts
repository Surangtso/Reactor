import { createClient } from "@/lib/supabase/server";
import { getHiddenLabels, getLatestProfile } from "@/lib/soft-profile";
import { renderProfileCard } from "@/lib/profile-card";

// 숨긴 항목을 뺀 최신 프로필을 세로 이미지(PNG)로 돌려준다. 본인만 받을 수 있다.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("로그인이 필요합니다.", { status: 401 });
  }

  const [profile, hidden] = await Promise.all([
    getLatestProfile(supabase, user.id),
    getHiddenLabels(supabase, user.id),
  ]);

  if (!profile) {
    return new Response("아직 프로필이 없습니다.", { status: 404 });
  }

  const name = (user.user_metadata as { display_name?: string })?.display_name;

  return renderProfileCard({
    name: name ?? null,
    headline: profile.headline,
    items: profile.items.filter((i) => !hidden.includes(i.label)),
  });
}
