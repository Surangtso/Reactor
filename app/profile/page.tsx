import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  MIN_ENTRIES_FOR_PROFILE,
  PROFILE_UPDATE_EVERY,
  getHiddenLabels,
  isProfileDue,
} from "@/lib/soft-profile";
import ProfileRefresher from "./refresher";
import ProfileView from "./profile-view";
import { getMessages } from "@/lib/i18n";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { m } = await getMessages();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [{ due, entryCount, latest }, hidden] = await Promise.all([
    isProfileDue(supabase, user.id),
    getHiddenLabels(supabase, user.id),
  ]);

  // 다음 프로필(처음 생성 또는 다음 갱신)까지의 진행 상황. 이 페이지에서만 보여준다
  // — 메인화면에 두면 솔직한 기록보다 프로필 채우기에 신경 쓰게 될 수 있어서.
  const progress = latest
    ? {
        done: Math.min(entryCount - latest.entry_count, PROFILE_UPDATE_EVERY),
        goal: PROFILE_UPDATE_EVERY,
        label: m.profile.nextUpdate,
      }
    : {
        done: Math.min(entryCount, MIN_ENTRIES_FOR_PROFILE),
        goal: MIN_ENTRIES_FOR_PROFILE,
        label: m.profile.untilFirst,
      };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black">
      <main className="max-w-2xl mx-auto py-10 px-4">
        <div className="flex items-center justify-between mb-10">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h1 className="text-xl font-semibold text-black dark:text-zinc-50">
              <em>soft-profile</em>
            </h1>
            {!due && (
              <span className="text-xs text-zinc-400">
                {progress.label} ({progress.done}/{progress.goal})
              </span>
            )}
          </div>
          <Link
            href="/"
            className="text-xs text-zinc-500 hover:text-black dark:hover:text-zinc-50"
          >
            {m.common.home}
          </Link>
        </div>

        {due && (
          <div className="mb-10">
            <ProfileRefresher first={!latest} />
          </div>
        )}

        {!latest && !due && (
          <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {m.profile.empty(MIN_ENTRIES_FOR_PROFILE)}
          </p>
        )}

        {latest && (
          <ProfileView
            key={latest.created_at}
            headline={latest.headline}
            items={latest.items}
            initialHidden={hidden}
          />
        )}
      </main>
    </div>
  );
}
