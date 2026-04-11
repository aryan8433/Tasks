-- Run this in Supabase SQL Editor (Dashboard → SQL → New query).
-- Requires: Authentication enabled (Email provider is enough).

-- Folders
create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists folders_one_default_per_user
  on public.folders (user_id)
  where is_default = true;

-- Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  folder_id uuid not null references public.folders (id) on delete cascade,
  title text not null,
  description text not null default '',
  completed boolean not null default false,
  priority text null check (priority is null or priority in ('high', 'medium', 'low')),
  due_date date null,
  due_time text null,
  today_date date null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_folder on public.tasks (user_id, folder_id);

-- RLS
alter table public.folders enable row level security;
alter table public.tasks enable row level security;

drop policy if exists "folders_select_own" on public.folders;
drop policy if exists "folders_insert_own" on public.folders;
drop policy if exists "folders_update_own" on public.folders;
drop policy if exists "folders_delete_own" on public.folders;
drop policy if exists "tasks_select_own" on public.tasks;
drop policy if exists "tasks_insert_own" on public.tasks;
drop policy if exists "tasks_update_own" on public.tasks;
drop policy if exists "tasks_delete_own" on public.tasks;

create policy "folders_select_own"
  on public.folders for select to authenticated
  using (auth.uid() = user_id);

create policy "folders_insert_own"
  on public.folders for insert to authenticated
  with check (auth.uid() = user_id);

create policy "folders_update_own"
  on public.folders for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "folders_delete_own"
  on public.folders for delete to authenticated
  using (auth.uid() = user_id);

create policy "tasks_select_own"
  on public.tasks for select to authenticated
  using (auth.uid() = user_id);

create policy "tasks_insert_own"
  on public.tasks for insert to authenticated
  with check (auth.uid() = user_id);

create policy "tasks_update_own"
  on public.tasks for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "tasks_delete_own"
  on public.tasks for delete to authenticated
  using (auth.uid() = user_id);
