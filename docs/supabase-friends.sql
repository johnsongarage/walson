-- 왈슨 친구 방·방명록(서로 넣은 사이) — Supabase SQL Editor에 통째로 붙여 넣고 [Run] 한 번. (2026-11-25 가르시아 "서버랑 같이 오픈에 열자")
-- 백업(docs/supabase-backup.sql)과 같은 프로젝트에 둔다. 다시 실행해도 괜찮다(있으면 건너뛰거나 바꾼다).
--
-- 무엇을 두나(앱에서 켠 사람만 — 동의 화면 뒤):
--   walson_dogs    강아지 번호(8자, 도감 카드 번호) · 주인 열쇠의 SHA-256 · 카드(이름 12자·크기·성향·털색) · 방 모습 몇 글자 · 방을 올린 날
--   walson_adds    "누가 누구를 도감에 넣었나"(번호 두 개 + 날짜). 두 방향이 다 있어야 "서로 넣은 사이"
--   walson_guests  방명록 — 누가 누구 방에 다녀갔나(번호 두 개 + 날짜 + 고른 한마디 번호 0~7). 하루 한 줄
--   walson_blocks  막은 강아지
-- 두지 않는 것: 위치·산책 경로·사진·견주 이름·연락처·자유 글. 시각은 날짜까지만.
-- 누가 무엇을 볼 수 있나: 앱(공개 키)은 아래 함수만 부른다. 표를 직접 읽거나 훑을 수 없다(RLS + 권한 회수).
--   주인 열쇠가 맞아야 내 강아지로 무엇이든 한다. 남의 방·방명록은 "서로 넣은 사이"이고 서로 막지 않았을 때만 보인다.
-- 번호를 처음 등록한 열쇠가 주인이다(가입이 없어서). 다른 열쇠로 같은 번호를 등록하려 하면 'taken' — 앱이 운영자에게 알려 달라고 한다.
--   운영자가 풀어 줄 때: delete from walson_dogs where id = '번호';  (그 강아지가 넣은·받은 줄은 아래 walson_dog_delete처럼 같이 지운다)
-- 보관: 1년 동안 쓰지 않은 강아지는 받은·보낸 것과 함께 지운다(맨 아래 정리 함수 — pg_cron을 켜면 매일 자동).

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.walson_dogs (
  id          text primary key check (id ~ '^[a-z0-9]{8}$'),
  key_hash    text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  n           text not null check (length(n) between 1 and 12),
  s           text not null check (s in ('s', 'm', 'l')),
  g           text not null default '' check (g in ('', 'g', 'y', 'r')),
  c           text not null check (c ~ '^#[0-9a-f]{6}$'),
  room        text check (room is null or (length(room) <= 40 and room ~ '^[0-9a-z]{4}[0-9a-f]{1,8}(\.[0-9a-f]{1,8}){0,2}$')),
  room_at     date,
  created_at  timestamptz not null default now(),
  touched_at  timestamptz not null default now()
);
create table if not exists public.walson_adds (
  owner   text not null references public.walson_dogs(id) on delete cascade,
  friend  text not null check (friend ~ '^[a-z0-9]{8}$'),
  day     date not null default current_date,
  primary key (owner, friend)
);
create index if not exists walson_adds_friend on public.walson_adds(friend);
create table if not exists public.walson_guests (
  host     text not null check (host ~ '^[a-z0-9]{8}$'),
  guest    text not null references public.walson_dogs(id) on delete cascade,
  day      date not null default current_date,
  m        smallint check (m is null or m between 0 and 7),
  created_at timestamptz not null default now(),
  primary key (host, guest, day)
);
create index if not exists walson_guests_host on public.walson_guests(host, day desc);
create table if not exists public.walson_blocks (
  owner    text not null references public.walson_dogs(id) on delete cascade,
  blocked  text not null check (blocked ~ '^[a-z0-9]{8}$'),
  primary key (owner, blocked)
);

alter table public.walson_dogs   enable row level security;
alter table public.walson_adds   enable row level security;
alter table public.walson_guests enable row level security;
alter table public.walson_blocks enable row level security;
revoke all on public.walson_dogs, public.walson_adds, public.walson_guests, public.walson_blocks from anon, authenticated;

-- 열쇠 확인(안에서만 씀) — 맞으면 true. 열쇠는 32글자 16진수(앱이 만든 128비트)
create or replace function public.walson_key_ok(p_id text, p_key text)
returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select p_key ~ '^[0-9a-f]{32}$' and exists (
    select 1 from walson_dogs d where d.id = p_id and d.key_hash = encode(digest(p_key, 'sha256'), 'hex'));
$$;
revoke all on function public.walson_key_ok(text, text) from public, anon, authenticated;

-- 서로 넣은 사이이고 서로 막지 않았나(안에서만 씀)
create or replace function public.walson_mutual(a text, b text)
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from walson_adds where owner = a and friend = b)
     and exists (select 1 from walson_adds where owner = b and friend = a)
     and not exists (select 1 from walson_blocks where (owner = a and blocked = b) or (owner = b and blocked = a));
$$;
revoke all on function public.walson_mutual(text, text) from public, anon, authenticated;

-- 이름 칸 검사(안에서만 씀) — 앱의 nameProblem과 같은 기준: 숫자 7개 이상(전화번호)·인터넷 주소면 안 받는다
create or replace function public.walson_name_ok(p_n text)
returns boolean
language sql immutable set search_path = public as $$
  select p_n is not null and length(btrim(p_n)) between 1 and 12
     and length(regexp_replace(p_n, '[^0-9０-９]', '', 'g')) < 7
     and p_n !~* '(https?:|www\.|@|[a-z0-9-]\.(com|net|org|kr|co|me|io|ly|gl|link|page|app|site|shop|xyz)([^a-z]|$))';
$$;
revoke all on function public.walson_name_ok(text) from public, anon, authenticated;

-- 켜기(등록): 처음이면 이 열쇠가 주인. 같은 열쇠면 'ok'(다시 켠 것), 다른 열쇠면 'taken'
create or replace function public.walson_dog_register(p_id text, p_key text, p_n text, p_s text, p_g text, p_c text)
returns text
language plpgsql security definer set search_path = public, extensions as $$
declare h text;
begin
  if p_id !~ '^[a-z0-9]{8}$' or p_key !~ '^[0-9a-f]{32}$' then raise exception 'bad id'; end if;
  if not walson_name_ok(p_n) then raise exception 'bad name'; end if;
  h := encode(digest(p_key, 'sha256'), 'hex');
  if exists (select 1 from walson_dogs where id = p_id) then
    return case when exists (select 1 from walson_dogs where id = p_id and key_hash = h) then 'ok' else 'taken' end;
  end if;
  insert into walson_dogs (id, key_hash, n, s, g, c) values (p_id, h, btrim(p_n), p_s, coalesce(p_g, ''), lower(p_c));
  return 'ok';
end $$;

-- 맞추기(아지트를 열 때 한 번): 내 카드·방 모습을 올리고, 내 도감 번호들을 "넣었다"로 적고,
-- 서로 넣은 친구들의 지금 카드·방 모습을 돌려준다. p_friends에 없는 번호는 "넣었다"에서 뺀다(도감에서 뺀 친구).
create or replace function public.walson_sync(p_id text, p_key text, p_n text, p_s text, p_g text, p_c text, p_room text, p_friends text[])
returns table (id text, n text, s text, g text, c text, room text, room_at date)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
declare fr text[];
begin
  if not walson_key_ok(p_id, p_key) then raise exception 'bad key'; end if;
  if not walson_name_ok(p_n) then raise exception 'bad name'; end if;
  if p_room is not null and (length(p_room) > 40 or p_room !~ '^[0-9a-z]{4}[0-9a-f]{1,8}(\.[0-9a-f]{1,8}){0,2}$') then p_room := null; end if;
  update walson_dogs d set n = btrim(p_n), s = p_s, g = coalesce(p_g, ''), c = lower(p_c), touched_at = now(),
    room = coalesce(p_room, d.room), room_at = case when p_room is not null and p_room is distinct from d.room then current_date else d.room_at end
    where d.id = p_id;
  select coalesce(array_agg(distinct x), '{}') into fr from unnest(coalesce(p_friends, '{}')) x where x ~ '^[a-z0-9]{8}$' and x <> p_id;
  if array_length(fr, 1) > 500 then fr := fr[1:500]; end if;
  delete from walson_adds a where a.owner = p_id and not (a.friend = any (fr));
  insert into walson_adds (owner, friend) select p_id, x from unnest(fr) x on conflict do nothing;
  return query select d.id, d.n, d.s, d.g, d.c, d.room, d.room_at from walson_dogs d
    where d.id = any (fr) and walson_mutual(p_id, d.id);
end $$;

-- 방명록 남기기(친구 방에 다녀가며 한마디) — 서로 넣은 사이만, 하루 한 줄(같은 날 또 남기면 한마디만 바뀜), 하루 50곳까지
create or replace function public.walson_visit(p_id text, p_key text, p_host text, p_m smallint)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not walson_key_ok(p_id, p_key) then raise exception 'bad key'; end if;
  if p_host !~ '^[a-z0-9]{8}$' or p_host = p_id or not walson_mutual(p_id, p_host) then return false; end if;
  if p_m is not null and (p_m < 0 or p_m > 7) then p_m := null; end if;
  if (select count(*) from walson_guests where guest = p_id and day = current_date) >= 50
     and not exists (select 1 from walson_guests where guest = p_id and host = p_host and day = current_date) then return false; end if;
  insert into walson_guests (host, guest, day, m) values (p_host, p_id, current_date, p_m)
  on conflict (host, guest, day) do update set m = coalesce(excluded.m, walson_guests.m), created_at = now();
  update walson_dogs set touched_at = now() where id = p_id;
  return true;
end $$;

-- 내 방명록 받아 오기 — 서로 넣은 사이이고 막지 않은 친구가 남긴 것만, 최근 200줄
create or replace function public.walson_guestbook(p_id text, p_key text)
returns table (guest text, n text, day date, m smallint)
language plpgsql security definer set search_path = public as $$
#variable_conflict use_column
begin
  if not walson_key_ok(p_id, p_key) then raise exception 'bad key'; end if;
  return query select g.guest, d.n, g.day, g.m from walson_guests g join walson_dogs d on d.id = g.guest
    where g.host = p_id and walson_mutual(p_id, g.guest)
    order by g.day desc, g.created_at desc limit 200;
end $$;

-- 막기·풀기
create or replace function public.walson_block(p_id text, p_key text, p_other text, p_on boolean)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not walson_key_ok(p_id, p_key) then raise exception 'bad key'; end if;
  if p_other !~ '^[a-z0-9]{8}$' or p_other = p_id then return false; end if;
  if p_on then insert into walson_blocks (owner, blocked) values (p_id, p_other) on conflict do nothing;
  else delete from walson_blocks where owner = p_id and blocked = p_other; end if;
  return true;
end $$;

-- 끄고 지우기: 내 강아지 · 내가 넣은 것 · 남이 나를 넣은 것 · 받은·남긴 방명록 · 막은 것 모두
create or replace function public.walson_dog_delete(p_id text, p_key text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if not walson_key_ok(p_id, p_key) then raise exception 'bad key'; end if;
  delete from walson_adds where friend = p_id;
  delete from walson_guests where host = p_id;
  delete from walson_blocks where blocked = p_id;
  delete from walson_dogs where id = p_id;   -- 넣은 것·남긴 방명록·막은 것은 cascade로 같이
  return true;
end $$;

revoke all on function public.walson_dog_register(text, text, text, text, text, text) from public;
revoke all on function public.walson_sync(text, text, text, text, text, text, text, text[]) from public;
revoke all on function public.walson_visit(text, text, text, smallint) from public;
revoke all on function public.walson_guestbook(text, text) from public;
revoke all on function public.walson_block(text, text, text, boolean) from public;
revoke all on function public.walson_dog_delete(text, text) from public;
grant execute on function public.walson_dog_register(text, text, text, text, text, text) to anon;
grant execute on function public.walson_sync(text, text, text, text, text, text, text, text[]) to anon;
grant execute on function public.walson_visit(text, text, text, smallint) to anon;
grant execute on function public.walson_guestbook(text, text) to anon;
grant execute on function public.walson_block(text, text, text, boolean) to anon;
grant execute on function public.walson_dog_delete(text, text) to anon;

-- 1년 정리: 1년 동안 쓰지 않은 강아지와 그 강아지가 받은 줄, 1년 지난 방명록
create or replace function public.walson_friends_cleanup()
returns integer
language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  delete from walson_adds where friend in (select id from walson_dogs where touched_at < now() - interval '1 year');
  delete from walson_guests where host in (select id from walson_dogs where touched_at < now() - interval '1 year');
  delete from walson_blocks where blocked in (select id from walson_dogs where touched_at < now() - interval '1 year');
  with d as (delete from walson_dogs where touched_at < now() - interval '1 year' returning 1) select count(*)::int into n from d;
  delete from walson_guests where day < current_date - 365;
  return n;
end $$;
revoke all on function public.walson_friends_cleanup() from public, anon, authenticated;

-- select public.walson_friends_cleanup();
-- select cron.schedule('walson-friends-cleanup', '27 4 * * *', 'select public.walson_friends_cleanup()');
