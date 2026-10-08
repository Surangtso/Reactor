-- ============================================================================
-- RLS(Row Level Security) 검증 스크립트
--
-- 왜 필요한가:
--   Supabase 대시보드의 SQL Editor는 최고 권한(postgres, RLS 무시) 계정으로
--   실행됩니다. 그냥 SELECT 해보고 "잘 보이네" 하는 건 RLS가 켜져 있는지와
--   무관하게 항상 성공합니다. 즉, 아무것도 검증하지 못합니다.
--
--   실제 앱은 로그인한 유저의 권한(authenticated 롤 + 그 유저의 uid)으로
--   접근합니다. 이 스크립트는 SQL Editor 안에서 "내가 지금 유저 A다" /
--   "내가 지금 유저 B다"인 것처럼 역할을 바꿔가며 실제로 RLS가 필터링하는지
--   확인합니다. Supabase 공식 문서가 권장하는 로컬 RLS 테스트 방식입니다.
--
-- 사용 순서:
--   1) schema.sql을 먼저 실행해서 테이블 + RLS 정책이 만들어져 있어야 합니다.
--   2) 앱에서 실제로 매직링크 로그인을 2번 해서, 서로 다른 유저 2명을
--      만들어 두세요 (예: you@example.com, you+rlstest@example.com
--      — 같은 지메일 받은편지함으로 두 계정을 만들 수 있습니다).
--   3) Authentication > Users 에서 두 유저의 UID(uuid)를 복사합니다.
--   4) 아래 <유저A_UID>, <유저B_UID> 를 실제 값으로 바꿔서 전체를 실행합니다.
--   5) 결과를 눈으로 확인: STEP 2에서는 A의 글만, STEP 3에서는 B의 글만
--      보여야 합니다. 상대방 글이 하나라도 보이면 RLS가 새는 것입니다.
-- ============================================================================

-- 0) 테스트용 더미 데이터 삽입 (관리자 권한으로 시딩 — 정상적인 준비 단계)
insert into public.entries (user_id, content) values
  ('<유저A_UID>', '[TEST] 이건 A의 기록입니다'),
  ('<유저B_UID>', '[TEST] 이건 B의 기록입니다');

-- 1) 지금부터 "로그인하지 않은 사람(anon)"인 척 해본다 — 아무것도 안 보여야 함
begin;
set local role anon;
select id, content from public.entries where content like '[TEST]%';
rollback;

-- 2) 지금부터 "유저 A"인 척 해본다 — A의 글 1개만 보여야 함
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<유저A_UID>","role":"authenticated"}';
select id, content from public.entries where content like '[TEST]%';
rollback;

-- 3) 지금부터 "유저 B"인 척 해본다 — B의 글 1개만 보여야 함
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<유저B_UID>","role":"authenticated"}';
select id, content from public.entries where content like '[TEST]%';
rollback;

-- 4) 유저 A인 척, 유저 B의 글에 남의 user_id로 몰래 끼워넣기 시도 — 반드시 실패해야 함
begin;
set local role authenticated;
set local "request.jwt.claims" = '{"sub":"<유저A_UID>","role":"authenticated"}';
insert into public.entries (user_id, content) values ('<유저B_UID>', '[TEST] A가 B인 척 끼워넣기 시도');
-- 위 INSERT가 "new row violates row-level security policy" 에러를 내야 정상입니다.
rollback;

-- 5) 정리: 테스트 데이터 삭제 (관리자 권한)
delete from public.entries where content like '[TEST]%';
