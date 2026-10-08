import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import ReflectionThread from "../reflection-thread";

type Chapter = {
  id: string;
  name: string;
  start_date: string;
  end_date: string | null;
  status: string;
};

type Entry = {
  id: string;
  category: string | null;
  content: string;
  comment: string | null;
  entry_date: string;
  chapter_id: string | null;
};

type Reflection = {
  id: string;
  entry_id: string;
  content: string;
  comment: string | null;
  created_at: string;
};

type Narrative = {
  id: string;
  period_start: string;
  period_end: string;
  content: string;
};

export default async function ArchivePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { category: rawCategory } = await searchParams;
  const category = CATEGORIES.includes(
    rawCategory as (typeof CATEGORIES)[number],
  )
    ? rawCategory
    : undefined;

  const [
    { data: chapters, error: chaptersError },
    { data: entries, error: entriesError },
    { data: reflections },
    { data: narratives },
  ] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, name, start_date, end_date, status")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .returns<Chapter[]>(),
    supabase
      .from("entries")
      .select("id, category, content, comment, entry_date, chapter_id")
      .eq("user_id", user.id)
      .order("entry_date", { ascending: true })
      .returns<Entry[]>(),
    supabase
      .from("reflections")
      .select("id, entry_id, content, comment, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .returns<Reflection[]>(),
    supabase
      .from("narratives")
      .select("id, period_start, period_end, content")
      .eq("user_id", user.id)
      .order("period_start", { ascending: true })
      .returns<Narrative[]>(),
  ]);

  if (chaptersError || entriesError) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-black flex items-center justify-center px-4">
        <p className="text-sm text-zinc-500 text-center">
          지금 불러오는 데 문제가 생겼어요.
          <br />
          잠시 후 새로고침해주세요.
        </p>
      </div>
    );
  }

  const reflectionsByEntry = new Map<string, Reflection[]>();
  for (const r of reflections ?? []) {
    const list = reflectionsByEntry.get(r.entry_id) ?? [];
    list.push(r);
    reflectionsByEntry.set(r.entry_id, list);
  }

  const filteredEntries = category
    ? (entries ?? []).filter((e) => e.category === category)
    : entries ?? [];

  const entriesByChapter = new Map<string | null, Entry[]>();
  for (const e of filteredEntries) {
    const list = entriesByChapter.get(e.chapter_id) ?? [];
    list.push(e);
    entriesByChapter.set(e.chapter_id, list);
  }

  function narrativesForChapter(chapter: Chapter): Narrative[] {
    const chapterEnd = chapter.end_date ?? "9999-12-31";
    return (narratives ?? []).filter(
      (n) => n.period_start <= chapterEnd && n.period_end >= chapter.start_date,
    );
  }

  const orphanEntries = entriesByChapter.get(null) ?? [];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-4xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
            archive
          </h1>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            홈으로
          </Link>
        </div>

        <CategoryFilter selected={category} />

        {(!chapters || chapters.length === 0) && orphanEntries.length === 0 && (
          <p className="text-zinc-400 text-sm">
            {category
              ? "이 카테고리에는 아직 기록이 없어요."
              : "아직 쌓인 기록이 없어요. 채팅에서 대화를 시작해보세요."}
          </p>
        )}

        <div className="flex flex-col gap-12">
          {(chapters ?? []).map((chapter) => (
            <ChapterSection
              key={chapter.id}
              chapter={chapter}
              entries={entriesByChapter.get(chapter.id) ?? []}
              reflectionsByEntry={reflectionsByEntry}
              narratives={narrativesForChapter(chapter)}
              emptyMessage={
                category ? "이 카테고리 기록 없음" : "아직 기록이 없어요."
              }
            />
          ))}

          {orphanEntries.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-zinc-400 mb-4">
                챕터 없음
              </h2>
              <Timeline
                entries={orphanEntries}
                reflectionsByEntry={reflectionsByEntry}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function CategoryFilter({ selected }: { selected?: string }) {
  const tabs: { label: string; value?: string }[] = [
    { label: "전체", value: undefined },
    ...CATEGORIES.map((c) => ({ label: c, value: c })),
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {tabs.map((tab) => {
        const isActive = tab.value === selected;
        const href = tab.value ? `/archive?category=${encodeURIComponent(tab.value)}` : "/archive";
        return (
          <Link
            key={tab.label}
            href={href}
            className={
              isActive
                ? "text-sm px-4 py-2 rounded-full bg-maroon text-white"
                : "text-sm px-4 py-2 rounded-full bg-zinc-100 text-zinc-500 hover:text-black dark:bg-zinc-900 dark:hover:text-zinc-50"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

function ChapterSection({
  chapter,
  entries,
  reflectionsByEntry,
  narratives,
  emptyMessage,
}: {
  chapter: Chapter;
  entries: Entry[];
  reflectionsByEntry: Map<string, Reflection[]>;
  narratives: Narrative[];
  emptyMessage: string;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          {chapter.name}
        </h2>
        <span className="text-xs text-zinc-400 shrink-0 ml-3">
          {chapter.start_date} ~ {chapter.end_date ?? "진행 중"}
        </span>
      </div>

      {narratives.length > 0 && (
        <div className="flex flex-col gap-2 mb-4">
          {narratives.map((n) => (
            <div
              key={n.id}
              className="rounded-xl bg-zinc-100 dark:bg-zinc-900 px-4 py-3"
            >
              <div className="text-xs text-zinc-400 mb-1">
                돌아보기 · {n.period_start} ~ {n.period_end}
              </div>
              <p className="text-sm whitespace-pre-wrap text-black dark:text-zinc-50">
                {n.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="text-xs text-zinc-400 mt-3">{emptyMessage}</p>
      ) : (
        <Timeline entries={entries} reflectionsByEntry={reflectionsByEntry} />
      )}
    </section>
  );
}

function Timeline({
  entries,
  reflectionsByEntry,
}: {
  entries: Entry[];
  reflectionsByEntry: Map<string, Reflection[]>;
}) {
  return (
    <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4 flex flex-col gap-5 mt-3">
      {entries.map((entry) => (
        <div key={entry.id}>
          <div className="text-xs text-zinc-400 mb-1">
            {entry.entry_date}
            {entry.category ? ` · ${entry.category}` : ""}
          </div>
          <p className="text-base whitespace-pre-wrap text-black dark:text-zinc-50">
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
  );
}
