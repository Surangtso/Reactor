import { createClient } from "@/lib/supabase/server";
import {
  countThoughtEntries,
  getLatestThoughtSummary,
  maybeUpdateThoughtSummary,
} from "@/lib/thought-summary";

// 글을 저장할 때 백그라운드에서 이미 만들어두지만, 그게 누락됐거나 아직 진행 중일 때
// 요약 화면에서 직접 불러 최신 상태로 맞춘다. 이미 최신이면 아무것도 하지 않는다.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  await maybeUpdateThoughtSummary(supabase, user.id);

  const [count, latest] = await Promise.all([
    countThoughtEntries(supabase, user.id),
    getLatestThoughtSummary(supabase, user.id),
  ]);

  if (latest?.entry_count !== count) {
    return Response.json({ error: "생성에 실패했습니다." }, { status: 500 });
  }

  return Response.json({ ok: true });
}
