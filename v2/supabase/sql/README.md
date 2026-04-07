# Auth SQL Setup

Run SQL files in this order:

1. `001_auth_roster_and_rls.sql`
2. `002_allowed_email_seed_example.sql` (edit values first)
3. `003_memories_author_id_upgrade.sql`

`001` adds:
- `people.allowed_email`
- `public.profiles` table
- RLS + policies for `people`, `profiles`, and `memories`

`002` is a template to map real class emails to `people.allowed_email`.

`003` adds `memories.author_id`, backfills safe matches from `author_name` when possible,
and tightens insert policy so `author_id` must match the signed-in user's `profiles.person_id`.
If unmatched legacy rows remain, the script prints a NOTICE and skips `NOT NULL` enforcement
until you finish manual backfill.
