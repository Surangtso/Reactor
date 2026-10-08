import { redirect } from "next/navigation";
import { after } from "next/server";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logRevisitIfNeeded } from "@/lib/events";
import { getTimeZone, todayIn } from "@/lib/day";
import { hasUnreadInsight } from "@/lib/insight";
import DailyPrompt from "./daily-prompt";
import RecordComposer from "./record-composer";
import ReflectionThread from "./reflection-thread";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: activeChapter, error: chapterError } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (chapterError) {
    return <ErrorState />;
  }

  if (!activeChapter) {
    redirect("/onboarding");
  }

  const timeZone = await getTimeZone();

  after(async () => {
    await logRevisitIfNeeded(supabase, user.id, timeZone);
  });

  const { data: todayEntries, error: entriesError } = await supabase
    .from("entries")
    .select("id, category, content, comment")
    .eq("user_id", user.id)
    .eq("entry_date", todayIn(timeZone))
    .order("created_at", { ascending: true });

  const todayEntryIds = (todayEntries ?? []).map((e) => e.id);
  const { data: reflections } = todayEntryIds.length
    ? await supabase
        .from("reflections")
        .select("id, entry_id, content, comment")
        .in("entry_id", todayEntryIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const reflectionsByEntry = new Map<
    string,
    { id: string; content: string; comment: string | null }[]
  >();
  for (const r of reflections ?? []) {
    const list = reflectionsByEntry.get(r.entry_id) ?? [];
    list.push(r);
    reflectionsByEntry.set(r.entry_id, list);
  }

  const unreadInsight = await hasUnreadInsight(supabase, user.id);

  const displayName = (user.user_metadata as { display_name?: string })
    ?.display_name;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black">
      <header className="flex items-center justify-between max-w-4xl w-full mx-auto px-4 py-6">
        <span className="text-sm text-zinc-400">{displayName ?? user.email}</span>
        <div className="flex items-center gap-3">
          <Link
            href="/for-you"
            className="relative text-sm leading-none text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            너에게
            {unreadInsight && (
              <span
                aria-label="새로 도착"
                className="absolute -right-1.5 -top-1 h-1.5 w-1.5 rounded-full bg-maroon"
              />
            )}
          </Link>
          <Link
            href="/profile"
            className="text-[15px] leading-none text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            <em>soft-profile</em>
          </Link>
          <Link
            href="/archive"
            className="text-[15px] leading-none text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            archive
          </Link>
          <form action="/api/auth/signout" method="post" className="flex items-center">
            <button
              type="submit"
              className="text-xs leading-none text-zinc-400 hover:text-black dark:hover:text-zinc-50"
            >
              로그아웃
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 pb-24">
        <p className="text-sm text-zinc-400 mb-10">{activeChapter.name}</p>

        <DailyPrompt />

        <RecordComposer />

        {entriesError && (
          <p className="mt-10 text-xs text-zinc-400">
            오늘 남긴 기록을 불러오지 못했어요. 새로고침하면 다시 보일 거예요.
          </p>
        )}

        {todayEntries && todayEntries.length > 0 && (
          <div className="mt-16 flex flex-col gap-8">
            {todayEntries.map((entry) => (
              <div key={entry.id}>
                <span className="text-xs text-zinc-400">{entry.category}</span>
                <p className="mt-1 text-base whitespace-pre-wrap text-black dark:text-zinc-50">
                  {entry.content}
                </p>
                {entry.comment && (
                  <p className="mt-2 text-sm italic text-zinc-400 dark:text-zinc-500">
                    {entry.comment}
                  </p>
                )}
                <ReflectionThread
                  entryId={entry.id}
                  initial={reflectionsByEntry.get(entry.id) ?? []}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 dark:bg-black px-4">
      <p className="text-sm text-zinc-500 text-center">
        지금 불러오는 데 문제가 생겼어요.
        <br />
        잠시 후 새로고침해주세요.
      </p>
    </div>
  );
}
