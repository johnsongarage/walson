-- 왈슨 그림 공장(강아지 사진 → 3×2 동작 그림) 신청 기록 — Supabase SQL Editor에 통째로 붙여 넣고 [Run] 한 번. (2026-11-28)
-- 친구 방(docs/supabase-friends.sql)과 같은 프로젝트에 둔다. 다시 실행해도 괜찮다.
--
-- 무엇을 두나: 그린 날·시각, 강아지 번호(8자 — 한 마리 몇 장인지 세려고), 견종 시험인지 사진인지, 됐는지, 어림 비용(원), 모델 이름.
-- 두지 않는 것: 사진·그림·위치·견주 이름·연락처. 사진은 서버 함수가 구글(Gemini)로 넘기고 바로 버린다(저장 안 함).
-- 누가 부르나: 서버 함수(dog-sheet)만 — service_role. 앱(공개 키)은 표도 함수도 못 건드린다.
-- 한도(바꾸려면 아래 walson_art_take의 숫자만):
--   하루 전체 20장 · 한 마리 3장(처음 1장 + 다시 그리기 2번 — 견종 시험도 같음, 시험은 번호를 바꿔 가며) · 이번 달 어림 8,000원이 넘으면 멈춤.
--   진짜 마지막 울타리는 구글 클라우드 예산(월 1만 원, 넘으면 멈춤)이다 — 이 표는 그 전에 먼저 멈추는 앞 울타리.

create table if not exists public.walson_art_log (
  id       bigserial primary key,
  at       timestamptz not null default now(),
  day      date not null default (now() at time zone 'Asia/Seoul')::date,
  dog      text not null check (dog ~ '^[a-z0-9_]{1,24}$'),
  kind     text not null check (kind in ('breed', 'photo')),
  ok       boolean,                      -- null = 그리는 중, true = 됨, false = 실패
  krw      integer not null default 50,  -- 어림 비용(1K 그림 한 장 ≈ $0.034 + 사진 읽기 ≈ 50원)
  model    text not null default ''
);
create index if not exists walson_art_log_day on public.walson_art_log(day);
create index if not exists walson_art_log_dog on public.walson_art_log(dog, day);
alter table public.walson_art_log enable row level security;
revoke all on public.walson_art_log from anon, authenticated;

-- 한 장 그려도 되는지 보고, 되면 줄을 하나 잡는다. 'ok:번호' 또는 'day'(오늘 다 씀) · 'dog'(이 강아지 다 씀) · 'month'(이번 달 다 씀)
-- 실패한 줄(ok = false)은 한도에 안 센다 — 구글 쪽 오류로 사용자가 기회를 잃지 않게. 그래도 비용은 들었을 수 있어 달 합계엔 센다.
create or replace function public.walson_art_take(p_dog text, p_kind text, p_model text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  n_day int; n_dog int; m_krw int; new_id bigint;
begin
  perform pg_advisory_xact_lock(hashtext('walson_art_take'));   -- 동시에 여러 번 눌러도 한도를 넘지 않게
  select count(*) into n_day from walson_art_log where day = today and ok is not false;
  if n_day >= 20 then return 'day'; end if;
  select count(*) into n_dog from walson_art_log where dog = p_dog and ok is not false;
  if n_dog >= 3 then return 'dog'; end if;
  select coalesce(sum(krw), 0) into m_krw from walson_art_log where day >= date_trunc('month', today)::date;
  if m_krw >= 8000 then return 'month'; end if;
  insert into walson_art_log(dog, kind, model) values (p_dog, p_kind, coalesce(p_model, '')) returning id into new_id;
  return 'ok:' || new_id;
end $$;
revoke all on function public.walson_art_take(text, text, text) from public, anon, authenticated;
grant execute on function public.walson_art_take(text, text, text) to service_role;

create or replace function public.walson_art_done(p_id bigint, p_ok boolean)
returns void
language sql security definer set search_path = public as $$
  update walson_art_log set ok = p_ok where id = p_id;
$$;
revoke all on function public.walson_art_done(bigint, boolean) from public, anon, authenticated;
grant execute on function public.walson_art_done(bigint, boolean) to service_role;

-- 운영자가 보는 법(SQL Editor):
--   select day, count(*) filter (where ok) as 됨, count(*) filter (where ok is false) as 실패, sum(krw) as 어림원
--     from walson_art_log group by day order by day desc;
-- 보관: 기록은 90일 지나면 지운다(그림·사진은 원래 안 남음).
--   delete from walson_art_log where at < now() - interval '90 days';
