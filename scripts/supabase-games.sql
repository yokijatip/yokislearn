create table if not exists public.game_rooms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  material_type text not null check (material_type in ('kanji', 'kotoba')),
  level text not null check (level in ('n5', 'n4')),
  mode text not null default 'Speed Quiz',
  time_limit integer not null default 60 check (time_limit between 30 and 300),
  created_by text not null,
  creator_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.game_scores (
  id text primary key,
  room_id text not null,
  room_name text not null,
  player_nim text not null,
  player_name text not null,
  score integer not null default 0,
  correct_count integer not null default 0,
  answered_count integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.game_rooms enable row level security;
alter table public.game_scores enable row level security;

drop policy if exists "game_rooms_read_public" on public.game_rooms;
create policy "game_rooms_read_public"
  on public.game_rooms
  for select
  using (true);

drop policy if exists "game_rooms_insert_public" on public.game_rooms;
create policy "game_rooms_insert_public"
  on public.game_rooms
  for insert
  with check (true);

drop policy if exists "game_scores_read_public" on public.game_scores;
create policy "game_scores_read_public"
  on public.game_scores
  for select
  using (true);

drop policy if exists "game_scores_insert_public" on public.game_scores;
create policy "game_scores_insert_public"
  on public.game_scores
  for insert
  with check (true);

insert into public.game_rooms (name, material_type, level, mode, time_limit, created_by, creator_name)
select 'Kanji N5 Sprint', 'kanji', 'n5', 'Speed Quiz', 60, 'GURU001', 'Guru LPK Baraya'
where not exists (select 1 from public.game_rooms where name = 'Kanji N5 Sprint' and created_by = 'GURU001');

insert into public.game_rooms (name, material_type, level, mode, time_limit, created_by, creator_name)
select 'Kotoba Bab Campur', 'kotoba', 'n5', 'Speed Quiz', 90, 'DEV001', 'Developer'
where not exists (select 1 from public.game_rooms where name = 'Kotoba Bab Campur' and created_by = 'DEV001');

insert into public.game_rooms (name, material_type, level, mode, time_limit, created_by, creator_name)
select 'Kanji N4 Challenge', 'kanji', 'n4', 'Speed Quiz', 120, 'GURU001', 'Guru LPK Baraya'
where not exists (select 1 from public.game_rooms where name = 'Kanji N4 Challenge' and created_by = 'GURU001');
