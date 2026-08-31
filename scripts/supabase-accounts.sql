create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  nim text not null unique,
  name text not null,
  role text not null default 'murid' check (role in ('developer', 'guru', 'murid')),
  created_by text,
  created_at timestamptz not null default now()
);

alter table public.accounts enable row level security;

drop policy if exists "accounts_read_public" on public.accounts;
create policy "accounts_read_public"
  on public.accounts
  for select
  using (true);

drop policy if exists "accounts_insert_public" on public.accounts;
create policy "accounts_insert_public"
  on public.accounts
  for insert
  with check (role = 'murid');

insert into public.accounts (nim, name, role, created_by)
values
  ('DEV001', 'Developer', 'developer', 'system'),
  ('GURU001', 'Guru LPK Baraya', 'guru', 'system')
on conflict (nim) do update
set
  name = excluded.name,
  role = excluded.role,
  created_by = excluded.created_by;
