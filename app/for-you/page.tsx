import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MIN_ENTRIES_FIRST,
  isInsightDue,
  listInsights,
  markInsightsRead,
  type Insight,
} from "@/lib/insight";
import InsightRefresher from "./refresher";
import { getMessages, type Messages } from "@/lib/i18n";

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export default async function ForYouPage() {
  const supabase = await createClient();
  const { m } = await getMessages();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ due, entryCount }, insights] = await Promise.all([
    isInsightDue(supabase, user.id),
    listInsights(supabase, user.id),
  ]);

  // 이 화면을 연 것으로 새 도착 표시(점)를 끈다.
  if (insights.some((i) => !i.read_at)) {
    await markInsightsRead(supabase, user.id);
  }

  const [latest, ...past] = insights;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            {m.forYou.title}
          </h1>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            {m.common.home}
          </Link>
        </div>

        {due && (
          <div className="mb-10">
            <InsightRefresher />
          </div>
        )}

        {!latest && !due && (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {m.forYou.empty}
            <br />
            <span className="text-xs text-zinc-400">
              ({Math.min(entryCount, MIN_ENTRIES_FIRST)} / {MIN_ENTRIES_FIRST})
            </span>
          </p>
        )}

        {latest && <InsightArticle insight={latest} m={m} />}

        {past.length > 0 && (
          <section className="mt-20">
            <h2 className="text-xs text-zinc-400 mb-6">{m.forYou.past}</h2>
            <div className="flex flex-col gap-4">
              {past.map((insight) => (
                <details key={insight.id} className="group">
                  <summary className="cursor-pointer list-none text-sm text-zinc-600 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50">
                    <span className="text-xs text-zinc-400 mr-2">
                      {formatDate(insight.created_at)} ·{" "}
                      {m.forYou.kinds[insight.kind]}
                    </span>
                    {insight.title}
                  </summary>
                  <div className="mt-4 mb-6 text-sm leading-loose whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {insight.content}
                  </div>
                </details>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function InsightArticle({ insight, m }: { insight: Insight; m: Messages }) {
  return (
    <article>
      <p className="text-xs text-zinc-400 mb-3">
        {m.forYou.kinds[insight.kind]} · {formatDate(insight.created_at)}
      </p>
      <h2 className="text-lg font-semibold text-black dark:text-zinc-50 mb-8">
        {insight.title}
      </h2>
      <div className="text-base leading-loose whitespace-pre-wrap text-black dark:text-zinc-50">
        {insight.content}
      </div>
    </article>
  );
}
