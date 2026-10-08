import type { SupabaseClient } from "@supabase/supabase-js";
import { startOfTodayIn } from "@/lib/day";

type EventType = "signup" | "entry_created" | "revisit";

export async function logEvent(
  supabase: SupabaseClient,
  userId: string,
  eventType: EventType,
) {
  const { error } = await supabase
    .from("events")
    .insert({ user_id: userId, event_type: eventType });

  if (error) {
    console.error(`[이벤트 기록 오류: ${eventType}]`, error);
  }
}

/**
 * 오늘 이미 signup 또는 revisit 이벤트가 있으면 기록하지 않는다
 * (가입 당일은 재방문이 아니고, 같은 날 여러 번 방문해도 하루 1건만 남긴다).
 */
export async function logRevisitIfNeeded(
  supabase: SupabaseClient,
  userId: string,
  timeZone: string,
) {
  const { data: todayEvents } = await supabase
    .from("events")
    .select("id")
    .eq("user_id", userId)
    .in("event_type", ["signup", "revisit"])
    .gte("created_at", startOfTodayIn(timeZone))
    .limit(1);

  if (!todayEvents || todayEvents.length === 0) {
    await logEvent(supabase, userId, "revisit");
  }
}
