-- Upgrade memories model with author_id (people FK) and tighten insert policy.
-- Safe to run multiple times.

begin;

alter table public.memories
  add column if not exists author_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'memories_author_id_fkey'
      and conrelid = 'public.memories'::regclass
  ) then
    alter table public.memories
      add constraint memories_author_id_fkey
      foreign key (author_id) references public.people(id) on delete restrict;
  end if;
end
$$;

create index if not exists memories_author_id_idx on public.memories(author_id);

with unique_people as (
  select lower(trim(full_name)) as full_name_key, min(id::text)::uuid as person_id, count(*) as people_count
  from public.people
  group by lower(trim(full_name))
)
update public.memories m
set author_id = unique_people.person_id
from unique_people
where m.author_id is null
  and m.author_name is not null
  and lower(trim(m.author_name)) = unique_people.full_name_key
  and unique_people.people_count = 1;

drop policy if exists memories_insert_authenticated on public.memories;
create policy memories_insert_authenticated
  on public.memories
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.person_id = memories.author_id
    )
  );

commit;

do $$
declare
  missing_author_count bigint;
begin
  select count(*) into missing_author_count
  from public.memories
  where author_id is null;

  if missing_author_count = 0 then
    alter table public.memories
      alter column author_id set not null;
  else
    raise notice 'author_id is still null for % memories. Run manual backfill, then set NOT NULL.', missing_author_count;
    raise notice 'Example manual backfill: update public.memories set author_id = ''<person_uuid>'' where id = ''<memory_uuid>'';';
  end if;
end
$$;
