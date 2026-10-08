import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { getMessages, type Locale, type Messages } from "@/lib/i18n";
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
  const { locale, m } = await getMessages();
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
          {m.common.loadError}
          <br />
          {m.common.retryLater}
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
            {m.common.home}
          </Link>
        </div>

        <CategoryFilter selected={category} locale={locale} m={m} />

        {(!chapters || chapters.length === 0) && orphanEntries.length === 0 && (
          <p className="text-zinc-400 text-sm">
            {category
              ? m.archive.emptyCategory
              : m.archive.empty}
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
              locale={locale}
              m={m}
              emptyMessage={
                category ? m.archive.chapterEmptyCategory : m.archive.chapterEmpty
              }
            />
          ))}

          {orphanEntries.length > 0 && (
            <section>
              <h2 className="text-sm font-medium text-zinc-400 mb-4">
                {m.archive.noChapter}
              </h2>
              <Timeline
                entries={orphanEntries}
                reflectionsByEntry={reflectionsByEntry}
                locale={locale}
              />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

function CategoryFilter({
  selected,
  locale,
  m,
}: {
  selected?: string;
  locale: Locale;
  m: Messages;
}) {
  const tabs: { label: string; value?: string }[] = [
    { label: m.archive.all, value: undefined },
    ...CATEGORIES.map((c) => ({ label: categoryLabel(c, locale), value: c })),
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
  locale,
  m,
}: {
  chapter: Chapter;
  entries: Entry[];
  reflectionsByEntry: Map<string, Reflection[]>;
  narratives: Narrative[];
  emptyMessage: string;
  locale: Locale;
  m: Messages;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-50">
          {chapter.name}
        </h2>
        <span className="text-xs text-zinc-400 shrink-0 ml-3">
          {chapter.start_date} ~ {chapter.end_date ?? m.archive.ongoing}
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
                {m.archive.lookBack} · {n.period_start} ~ {n.period_end}
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
        <Timeline
          entries={entries}
          reflectionsByEntry={reflectionsByEntry}
          locale={locale}
        />
      )}
    </section>
  );
}

function Timeline({
  entries,
  reflectionsByEntry,
  locale,
}: {
  entries: Entry[];
  reflectionsByEntry: Map<string, Reflection[]>;
  locale: Locale;
}) {
  return (
    <div className="border-l border-zinc-200 dark:border-zinc-800 pl-4 flex flex-col gap-5 mt-3">
      {entries.map((entry) => (
        <div key={entry.id}>
          <div className="text-xs text-zinc-400 mb-1">
            {entry.entry_date}
            {entry.category ? ` · ${categoryLabel(entry.category, locale)}` : ""}
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
