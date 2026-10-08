import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MIN_THOUGHT_ENTRIES,
  countThoughtEntries,
  getLatestThoughtSummary,
} from "@/lib/thought-summary";
import ThoughtSummaryRefresher from "./refresher";
import { getMessages } from "@/lib/i18n";

export default async function ThoughtsPage() {
  const supabase = await createClient();
  const { m } = await getMessages();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [count, latest] = await Promise.all([
    countThoughtEntries(supabase, user.id),
    getLatestThoughtSummary(supabase, user.id),
  ]);

  const enough = count >= MIN_THOUGHT_ENTRIES;
  const stale = enough && latest?.entry_count !== count;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            {m.thoughts.title}
          </h1>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            {m.common.home}
          </Link>
        </div>

        {!enough && (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {m.thoughts.empty1}
            <br />
            {m.thoughts.empty2}
          </p>
        )}

        {stale && (
          <div className="mb-8">
            <ThoughtSummaryRefresher hasPrevious={!!latest} />
          </div>
        )}

        {enough && latest && (
          <article>
            <p className="text-xs text-zinc-400 mb-6">
              {m.thoughts.readCount(latest.entry_count)}
            </p>
            <div className="text-base leading-loose whitespace-pre-wrap text-black dark:text-zinc-50">
              {latest.content}
            </div>
          </article>
        )}
      </main>
    </div>
  );
}
