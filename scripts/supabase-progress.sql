create table if not exists public.user_progress (
  user_nim text not null,
  item_id text not null,
  material_type text not null check (material_type in ('kanji', 'kotoba')),
  level text not null check (level in ('n5', 'n4')),
  chapter integer not null,
  status text not null check (status in ('hafal', 'belum')),
  updated_at timestamptz not null default now(),
  primary key (user_nim, item_id)
);

alter table public.user_progress enable row level security;

drop policy if exists "user_progress_read_public" on public.user_progress;
create policy "user_progress_read_public"
  on public.user_progress
  for select
  using (true);

drop policy if exists "user_progress_write_public" on public.user_progress;
create policy "user_progress_write_public"
  on public.user_progress
  for insert
  with check (true);

drop policy if exists "user_progress_update_public" on public.user_progress;
create policy "user_progress_update_public"
  on public.user_progress
  for update
  using (true)
  with check (true);
