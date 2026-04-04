drop extension if exists "pg_net";


  create table "public"."memories" (
    "id" bigint generated always as identity not null,
    "recipient_id" uuid not null,
    "author_name" text not null,
    "message" text not null,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."memories" enable row level security;


  create table "public"."people" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text not null,
    "room_no" text not null,
    "photo_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."people" enable row level security;

CREATE UNIQUE INDEX memories_pkey ON public.memories USING btree (id);

CREATE UNIQUE INDEX people_pkey ON public.people USING btree (id);

CREATE UNIQUE INDEX people_room_no_key ON public.people USING btree (room_no);

alter table "public"."memories" add constraint "memories_pkey" PRIMARY KEY using index "memories_pkey";

alter table "public"."people" add constraint "people_pkey" PRIMARY KEY using index "people_pkey";

alter table "public"."memories" add constraint "memories_recipient_id_fkey" FOREIGN KEY (recipient_id) REFERENCES public.people(id) ON DELETE CASCADE not valid;

alter table "public"."memories" validate constraint "memories_recipient_id_fkey";

alter table "public"."people" add constraint "people_room_no_key" UNIQUE using index "people_room_no_key";

grant delete on table "public"."memories" to "anon";

grant insert on table "public"."memories" to "anon";

grant references on table "public"."memories" to "anon";

grant select on table "public"."memories" to "anon";

grant trigger on table "public"."memories" to "anon";

grant truncate on table "public"."memories" to "anon";

grant update on table "public"."memories" to "anon";

grant delete on table "public"."memories" to "authenticated";

grant insert on table "public"."memories" to "authenticated";

grant references on table "public"."memories" to "authenticated";

grant select on table "public"."memories" to "authenticated";

grant trigger on table "public"."memories" to "authenticated";

grant truncate on table "public"."memories" to "authenticated";

grant update on table "public"."memories" to "authenticated";

grant delete on table "public"."memories" to "service_role";

grant insert on table "public"."memories" to "service_role";

grant references on table "public"."memories" to "service_role";

grant select on table "public"."memories" to "service_role";

grant trigger on table "public"."memories" to "service_role";

grant truncate on table "public"."memories" to "service_role";

grant update on table "public"."memories" to "service_role";

grant delete on table "public"."people" to "anon";

grant insert on table "public"."people" to "anon";

grant references on table "public"."people" to "anon";

grant select on table "public"."people" to "anon";

grant trigger on table "public"."people" to "anon";

grant truncate on table "public"."people" to "anon";

grant update on table "public"."people" to "anon";

grant delete on table "public"."people" to "authenticated";

grant insert on table "public"."people" to "authenticated";

grant references on table "public"."people" to "authenticated";

grant select on table "public"."people" to "authenticated";

grant trigger on table "public"."people" to "authenticated";

grant truncate on table "public"."people" to "authenticated";

grant update on table "public"."people" to "authenticated";

grant delete on table "public"."people" to "service_role";

grant insert on table "public"."people" to "service_role";

grant references on table "public"."people" to "service_role";

grant select on table "public"."people" to "service_role";

grant trigger on table "public"."people" to "service_role";

grant truncate on table "public"."people" to "service_role";

grant update on table "public"."people" to "service_role";


  create policy "Allow public insert memories"
  on "public"."memories"
  as permissive
  for insert
  to anon, authenticated
with check (true);



  create policy "Allow public read memories"
  on "public"."memories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "Allow public read people"
  on "public"."people"
  as permissive
  for select
  to anon, authenticated
using (true);



