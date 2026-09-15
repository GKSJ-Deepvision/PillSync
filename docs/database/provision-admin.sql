-- Promote an existing Supabase Auth account to administrator.
-- Run this in Supabase Dashboard -> SQL Editor as a project owner.
-- Create the Auth user and set its password in Authentication -> Users first.

update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id
  from auth.users
  where lower(email) = lower('phanichakri19@gmail.com')
);

-- Verify exactly one profile now has the expected role.
select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('phanichakri19@gmail.com');
