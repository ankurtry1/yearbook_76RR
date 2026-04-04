create table if not exists public.roster_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  full_name text not null,
  nickname text not null,
  room_no text,
  photo_path text,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.memoirs (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.roster_users(id) on delete cascade,
  author_id uuid references public.roster_users(id) on delete set null,
  is_anonymous boolean not null default false,
  text text not null check (char_length(text) <= 10000),
  created_at timestamptz not null default now()
);

create table if not exists public.memoir_reactions (
  id uuid primary key default gen_random_uuid(),
  memoir_id uuid not null references public.memoirs(id) on delete cascade,
  reacted_by_id uuid not null references public.roster_users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('love', 'laugh', 'emotional', 'anchored')),
  created_at timestamptz not null default now(),
  unique (memoir_id, reacted_by_id)
);

create table if not exists public.memoir_reads (
  memoir_id uuid not null references public.memoirs(id) on delete cascade,
  read_by_id uuid not null references public.roster_users(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (memoir_id, read_by_id)
);
