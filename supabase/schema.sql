-- inner-app: 초기 스키마 (chapters, entries, reflections, narratives, session_summaries)
-- Supabase 대시보드 > SQL Editor 에서 이 파일 전체를 붙여넣고 Run 하세요.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- chapters: 2~4주 단위 탐구 주제
-- ---------------------------------------------------------------------------
create table if not exists public.chapters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create index if not exists chapters_user_id_idx on public.chapters (user_id);

-- ---------------------------------------------------------------------------
-- entries: 유저의 기록
-- ---------------------------------------------------------------------------
create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  chapter_id uuid references public.chapters (id) on delete set null,
  category text check (category in ('마음', '떠오름', '취향', '하루', '나에 대해', '목표', '순간', '생각')),
  content text not null,
  comment text,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists entries_user_id_idx on public.entries (user_id);
create index if not exists entries_chapter_id_idx on public.entries (chapter_id);

-- 카테고리 개편 (2026-09-29): 기존 '생각' → '떠오름'으로 이름 변경, '생각'은 긴 글 전용 카테고리로 새로 사용.
-- 순서가 중요하다: 제약을 풀고 → 기존 '생각' 기록을 '떠오름'으로 옮기고 → 새 제약을 건다.
-- 한 번만 실행할 것 (다시 실행하면 새 '생각' 긴 글까지 '떠오름'으로 바뀐다).
-- begin;
-- alter table public.entries drop constraint if exists entries_category_check;
-- update public.entries set category = '떠오름' where category = '생각';
-- alter table public.entries add constraint entries_category_check
--   check (category in ('마음', '떠오름', '취향', '하루', '나에 대해', '목표', '순간', '생각'));
-- commit;

-- ---------------------------------------------------------------------------
-- reflections: entries에 대한 이후 반응
-- ---------------------------------------------------------------------------
create table if not exists public.reflections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_id uuid not null references public.entries (id) on delete cascade,
  content text not null,
  comment text,
  created_at timestamptz not null default now()
);

-- 기존에 만들어진 테이블에도 반영되도록 (신규 설치에서는 위 create table에 이미 포함됨)
alter table public.reflections add column if not exists comment text;

create index if not exists reflections_user_id_idx on public.reflections (user_id);
create index if not exists reflections_entry_id_idx on public.reflections (entry_id);

-- ---------------------------------------------------------------------------
-- narratives: 생성된 서사
-- ---------------------------------------------------------------------------
create table if not exists public.narratives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists narratives_user_id_idx on public.narratives (user_id);

-- ---------------------------------------------------------------------------
-- session_summaries: 세션 요약 (구조화된 JSON)
-- summary 형태: { user_said: string[], good_moments: string[],
--                 current_concerns: string[], patterns: string[],
--                 current_chapter: string | null }
-- ---------------------------------------------------------------------------
create table if not exists public.session_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  summary jsonb not null,
  session_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists session_summaries_user_id_idx on public.session_summaries (user_id);

-- ---------------------------------------------------------------------------
-- events: 리텐션 계측용 이벤트 로그 (signup / entry_created / revisit)
-- 분석 로그이므로 수정·삭제는 허용하지 않는다 (기록만 남김, insert-only).
-- ---------------------------------------------------------------------------
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_type text not null check (event_type in ('signup', 'entry_created', 'revisit')),
  created_at timestamptz not null default now()
);

create index if not exists events_user_id_idx on public.events (user_id);
create index if not exists events_event_type_idx on public.events (event_type);
create index if not exists events_created_at_idx on public.events (created_at);

-- ---------------------------------------------------------------------------
-- daily_prompts: 하루 첫 접속 때 기록 화면 위에 놓이는 한마디 (유저당 하루 1개)
-- ---------------------------------------------------------------------------
create table if not exists public.daily_prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_date date not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, prompt_date)
);

-- ---------------------------------------------------------------------------
-- thought_summaries: '생각'(긴 글) 카테고리를 모아 읽고 쓴 글
-- 긴 글이 2편 이상일 때부터, 한 편씩 쌓일 때마다 새로 쓴다. 화면에는 최신 것만,
-- 이전 것은 보관용. entry_count = 이 글을 쓸 때 읽은 '생각' 글 수.
-- ---------------------------------------------------------------------------
create table if not exists public.thought_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_count int not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_count)
);

-- ---------------------------------------------------------------------------
-- insights: '너에게' — 기록을 읽고 먼저 건네는 제안 (책 / 닮은 사람 / 가능성 / 어울리는 것)
-- 기록이 충분히 쌓이면 가끔 하나씩 도착한다. read_at은 새 도착 표시(점)에 쓴다.
-- entry_count = 이 제안을 쓸 때 읽은 전체 기록 수.
-- ---------------------------------------------------------------------------
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('book', 'person', 'potential', 'fit')),
  title text not null,
  content text not null,
  entry_count int not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, entry_count)
);

-- ---------------------------------------------------------------------------
-- soft_profiles: 'Soft profile' — 기록에서 뽑아낸 나를 설명하는 항목들
-- 기록 10개부터, 새 기록 3개마다 새로 쓴다. 화면에는 최신 것만, 이전 것은 보관용.
-- items = [{ "label": "내가 사랑하는 물건", "value": "..." }, ...]
-- ---------------------------------------------------------------------------
create table if not exists public.soft_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entry_count int not null,
  headline text not null,
  items jsonb not null,
  created_at timestamptz not null default now(),
  unique (user_id, entry_count)
);

-- 공유 이미지에서 뺄 항목 (항목 이름 기준 — 프로필이 새로 써져도 유지된다)
create table if not exists public.soft_profile_hidden (
  user_id uuid not null references auth.users (id) on delete cascade,
  label text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, label)
);

-- ---------------------------------------------------------------------------
-- ai_usage: AI 호출 한 번마다 토큰 수와 추정 비용 (비용 측정용)
-- 기록 내용은 남기지 않는다 — 숫자만. 이용자는 쓰기만 하고 읽을 수 없다
-- (운영자가 대시보드/서비스 키로 집계한다).
-- ---------------------------------------------------------------------------
create table if not exists public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  feature text not null,
  model text not null,
  input_tokens int not null,
  output_tokens int not null,
  cache_read_tokens int not null default 0,
  cache_write_tokens int not null default 0,
  cost_usd numeric(10, 6) not null,
  created_at timestamptz not null default now()
);

create index if not exists ai_usage_user_id_idx on public.ai_usage (user_id);
create index if not exists ai_usage_created_at_idx on public.ai_usage (created_at);

-- ---------------------------------------------------------------------------
-- user_memories: 이 사람에 대한 기억 노트 (유저당 1행, AI들이 함께 읽는 내부 자료)
-- 기록 5개부터 만들고, 새 기록 5개마다 last_entry_at 이후 기록만 읽어 고쳐 쓴다.
-- ---------------------------------------------------------------------------
create table if not exists public.user_memories (
  user_id uuid primary key references auth.users (id) on delete cascade,
  content text not null,
  entry_count int not null,
  last_entry_at timestamptz not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- RLS: 모든 테이블에서 본인 데이터만 접근 가능하도록 설정
-- ---------------------------------------------------------------------------
alter table public.chapters enable row level security;
alter table public.entries enable row level security;
alter table public.reflections enable row level security;
alter table public.narratives enable row level security;
alter table public.session_summaries enable row level security;
alter table public.events enable row level security;
alter table public.daily_prompts enable row level security;
alter table public.thought_summaries enable row level security;
alter table public.insights enable row level security;
alter table public.soft_profiles enable row level security;
alter table public.soft_profile_hidden enable row level security;
alter table public.ai_usage enable row level security;
alter table public.user_memories enable row level security;

drop policy if exists "select own events" on public.events;
drop policy if exists "insert own events" on public.events;

create policy "select own events" on public.events
  for select using (auth.uid() = user_id);
create policy "insert own events" on public.events
  for insert with check (auth.uid() = user_id);

drop policy if exists "select own daily_prompts" on public.daily_prompts;
drop policy if exists "insert own daily_prompts" on public.daily_prompts;

create policy "select own daily_prompts" on public.daily_prompts
  for select using (auth.uid() = user_id);
create policy "insert own daily_prompts" on public.daily_prompts
  for insert with check (auth.uid() = user_id);

drop policy if exists "select own thought_summaries" on public.thought_summaries;
drop policy if exists "insert own thought_summaries" on public.thought_summaries;

create policy "select own thought_summaries" on public.thought_summaries
  for select using (auth.uid() = user_id);
create policy "insert own thought_summaries" on public.thought_summaries
  for insert with check (auth.uid() = user_id);

drop policy if exists "select own insights" on public.insights;
drop policy if exists "insert own insights" on public.insights;
drop policy if exists "update own insights" on public.insights;

create policy "select own insights" on public.insights
  for select using (auth.uid() = user_id);
create policy "insert own insights" on public.insights
  for insert with check (auth.uid() = user_id);
create policy "update own insights" on public.insights
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "select own soft_profiles" on public.soft_profiles;
drop policy if exists "insert own soft_profiles" on public.soft_profiles;

create policy "select own soft_profiles" on public.soft_profiles
  for select using (auth.uid() = user_id);
create policy "insert own soft_profiles" on public.soft_profiles
  for insert with check (auth.uid() = user_id);

drop policy if exists "select own soft_profile_hidden" on public.soft_profile_hidden;
drop policy if exists "insert own soft_profile_hidden" on public.soft_profile_hidden;
drop policy if exists "delete own soft_profile_hidden" on public.soft_profile_hidden;

create policy "select own soft_profile_hidden" on public.soft_profile_hidden
  for select using (auth.uid() = user_id);
create policy "insert own soft_profile_hidden" on public.soft_profile_hidden
  for insert with check (auth.uid() = user_id);
create policy "delete own soft_profile_hidden" on public.soft_profile_hidden
  for delete using (auth.uid() = user_id);

drop policy if exists "insert own ai_usage" on public.ai_usage;

create policy "insert own ai_usage" on public.ai_usage
  for insert with check (auth.uid() = user_id);

drop policy if exists "select own user_memories" on public.user_memories;
drop policy if exists "insert own user_memories" on public.user_memories;
drop policy if exists "update own user_memories" on public.user_memories;

create policy "select own user_memories" on public.user_memories
  for select using (auth.uid() = user_id);
create policy "insert own user_memories" on public.user_memories
  for insert with check (auth.uid() = user_id);
create policy "update own user_memories" on public.user_memories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

do $$
declare
  t text;
begin
  foreach t in array array['chapters', 'entries', 'reflections', 'narratives', 'session_summaries']
  loop
    execute format('drop policy if exists "select own %1$s" on public.%1$s', t);
    execute format('drop policy if exists "insert own %1$s" on public.%1$s', t);
    execute format('drop policy if exists "update own %1$s" on public.%1$s', t);
    execute format('drop policy if exists "delete own %1$s" on public.%1$s', t);

    execute format(
      'create policy "select own %1$s" on public.%1$s for select using (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "insert own %1$s" on public.%1$s for insert with check (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "update own %1$s" on public.%1$s for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', t
    );
    execute format(
      'create policy "delete own %1$s" on public.%1$s for delete using (auth.uid() = user_id)', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 권한(GRANT): RLS는 "허용 규칙"일 뿐, 그 전에 테이블 자체에 대한 접근 권한이
-- authenticated 롤에 있어야 한다. 로그인하지 않은 anon 롤에는 아무 권한도 주지 않는다
-- (로그인 안 하면 애초에 테이블 자체에 접근 불가 — 이중 방어).
-- ---------------------------------------------------------------------------
revoke all on public.chapters, public.entries, public.reflections, public.narratives, public.session_summaries, public.events, public.daily_prompts, public.thought_summaries, public.insights, public.soft_profiles, public.soft_profile_hidden, public.ai_usage, public.user_memories
  from anon;

grant usage on schema public to authenticated;
grant select, insert, update, delete
  on public.chapters, public.entries, public.reflections, public.narratives, public.session_summaries
  to authenticated;
grant select, insert on public.events to authenticated;
grant select, insert on public.daily_prompts to authenticated;
grant select, insert on public.thought_summaries to authenticated;
grant select, insert, update on public.insights to authenticated;
grant select, insert on public.soft_profiles to authenticated;
grant select, insert, delete on public.soft_profile_hidden to authenticated;
grant insert on public.ai_usage to authenticated;
grant select, insert, update on public.user_memories to authenticated;
