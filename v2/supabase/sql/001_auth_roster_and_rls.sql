-- Auth + roster mapping + private read policies
-- Run this in Supabase SQL editor (or `supabase db query`) before frontend auth testing.

begin;

alter table public.people
  add column if not exists allowed_email text;

create unique index if not exists people_allowed_email_unique_idx
  on public.people (lower(allowed_email))
  where allowed_email is not null;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  person_id uuid unique not null references public.people (id) on delete cascade,
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.people enable row level security;
alter table public.memories enable row level security;
alter table public.profiles enable row level security;

do $$
declare
  row_record record;
begin
  for row_record in
    select tablename, policyname
    from pg_policies
    where schemaname = 'public' and tablename in ('people', 'memories', 'profiles')
  loop
    execute format(
      'drop policy if exists %I on public.%I',
      row_record.policyname,
      row_record.tablename
    );
  end loop;
end
$$;

drop policy if exists people_authenticated_select on public.people;
create policy people_authenticated_select
  on public.people
  for select
  to authenticated
  using (true);

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own
  on public.profiles
  for insert
  to authenticated
  with check (
    auth.uid() = id
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

drop policy if exists profiles_delete_own on public.profiles;
create policy profiles_delete_own
  on public.profiles
  for delete
  to authenticated
  using (auth.uid() = id);

drop policy if exists memories_insert_authenticated on public.memories;
create policy memories_insert_authenticated
  on public.memories
  for insert
  to authenticated
  with check (true);

drop policy if exists memories_select_recipient_only on public.memories;
create policy memories_select_recipient_only
  on public.memories
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.person_id = memories.recipient_id
    )
  );

commit;
