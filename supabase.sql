-- À coller dans Supabase > SQL Editor > New query > Run
create table if not exists public.app_storage (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);
alter table public.app_storage enable row level security;
drop policy if exists "app_storage_all" on public.app_storage;
create policy "app_storage_all" on public.app_storage
  for all to public using (true) with check (true);
