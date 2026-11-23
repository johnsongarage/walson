-- 왈슨 서버 백업(복구 코드) — Supabase SQL Editor에 통째로 붙여 넣고 [Run] 한 번. (2026-11-23 가르시아 "supabase로 가자")
-- 다시 실행해도 괜찮다(있으면 건너뛰거나 바꾼다).
--
-- 무엇을 두나: 휴대폰에서 복구 코드로 잠근(AES-GCM) 기록 덩어리 하나와, 그 코드로 만든 번호(id, SHA-256 64자).
--   서버는 코드도, 잠그기 전 내용도 모른다. 이름·전화번호·이메일 칸이 없다. 경로·좌표·사진은 앱이 빼고 보낸다(cloud-backup.js).
-- 누가 무엇을 할 수 있나: 앱(공개 anon 키)은 아래 세 함수만 부를 수 있다. 표를 직접 읽거나 훑을 수 없다(RLS + 권한 회수).
--   번호를 아는 사람(= 코드를 아는 사람)만 그 한 칸을 넣고·꺼내고·지운다.
-- 보관: 1년 동안 새로 넣지도 꺼내지도 않은 칸은 지운다(맨 아래 정리 함수 — pg_cron을 켜면 매일 자동).

create table if not exists public.walson_backups (
  id          text primary key check (id ~ '^[0-9a-f]{64}$'),
  data        text not null check (length(data) <= 3000000),   -- 잠근 덩어리(base64). 사진을 빼면 보통 수십 KB
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  touched_at  timestamptz not null default now()                -- 마지막으로 넣거나 꺼낸 때(1년 정리 기준)
);

alter table public.walson_backups enable row level security;   -- 정책을 두지 않음 = 표 직접 접근은 모두 막힘
revoke all on public.walson_backups from anon, authenticated;

-- 넣기(같은 번호면 바꿔 넣기)
create or replace function public.walson_backup_save(p_id text, p_data text)
returns timestamptz
language plpgsql security definer set search_path = public as $$
declare t timestamptz := now();
begin
  if p_id is null or p_id !~ '^[0-9a-f]{64}$' then raise exception 'bad id'; end if;
  if p_data is null or length(p_data) > 3000000 or left(p_data, 3) <> 'w1.' then raise exception 'bad data'; end if;
  insert into walson_backups (id, data, updated_at, touched_at) values (p_id, p_data, t, t)
  on conflict (id) do update set data = excluded.data, updated_at = t, touched_at = t;
  return t;
end $$;

-- 꺼내기(없으면 빈 결과)
create or replace function public.walson_backup_load(p_id text)
returns table (data text, updated_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if p_id is null or p_id !~ '^[0-9a-f]{64}$' then raise exception 'bad id'; end if;
  update walson_backups b set touched_at = now() where b.id = p_id;
  return query select b.data, b.updated_at from walson_backups b where b.id = p_id;
end $$;

-- 지우기(사용자가 [서버 백업 지우기])
create or replace function public.walson_backup_delete(p_id text)
returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_id is null or p_id !~ '^[0-9a-f]{64}$' then raise exception 'bad id'; end if;
  delete from walson_backups where id = p_id;
  return found;
end $$;

revoke all on function public.walson_backup_save(text, text) from public;
revoke all on function public.walson_backup_load(text) from public;
revoke all on function public.walson_backup_delete(text) from public;
grant execute on function public.walson_backup_save(text, text) to anon;
grant execute on function public.walson_backup_load(text) to anon;
grant execute on function public.walson_backup_delete(text) to anon;

-- 1년 정리: 직접 부르거나(아래 select), Database → Extensions에서 pg_cron을 켠 뒤 맨 아래 줄을 한 번 실행하면 매일 새벽 자동.
create or replace function public.walson_backup_cleanup()
returns integer
language sql security definer set search_path = public as $$
  with d as (delete from walson_backups where touched_at < now() - interval '1 year' returning 1)
  select count(*)::int from d;
$$;
revoke all on function public.walson_backup_cleanup() from public, anon, authenticated;

-- select public.walson_backup_cleanup();
-- select cron.schedule('walson-backup-cleanup', '17 4 * * *', 'select public.walson_backup_cleanup()');
