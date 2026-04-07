-- Example roster email mapping updates.
-- Replace these values with your real roster data before running.

-- Option A: set by known person id (recommended)
-- update public.people
-- set allowed_email = 'student1@yourcollege.edu'
-- where id = '11111111-1111-1111-1111-111111111111';

-- Option B: set by full name + room number
-- update public.people
-- set allowed_email = 'student2@yourcollege.edu'
-- where full_name = 'Batchmate Example' and room_no = '214';

-- Example bulk pattern:
-- update public.people
-- set allowed_email = lower(full_name) || '@yourcollege.edu'
-- where allowed_email is null;

-- Safety check query:
-- select id, full_name, room_no, allowed_email
-- from public.people
-- order by full_name asc;
