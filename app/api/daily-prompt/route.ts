import { createClient } from "@/lib/supabase/server";
import { getOrCreateDailyPrompt } from "@/lib/daily-prompt";
import { getToday } from "@/lib/day";
import { getLocale } from "@/lib/i18n";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: activeChapter } = await supabase
    .from("chapters")
    .select("name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const content = await getOrCreateDailyPrompt(
    supabase,
    user.id,
    activeChapter?.name ?? null,
    await getToday(),
    await getLocale(),
  );

  return Response.json({ content });
}
