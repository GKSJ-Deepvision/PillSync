-- PillSync doctor appointments (run after schema.sql).
-- Doctors register with role=doctor; an admin creates their public directory
-- entry after verifying their details. Patients only see active doctors.

alter type public.user_role add value if not exists 'doctor';

create or replace function public.handle_new_user()
returns trigger as $$
declare
  requested_role text := new.raw_user_meta_data ->> 'role';
  assigned_role public.user_role;
begin
  assigned_role := case
    when requested_role in ('patient', 'caregiver', 'doctor')
      then requested_role::public.user_role
    else 'patient'::public.user_role
  end;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    assigned_role
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.prevent_self_role_change()
returns trigger as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Only an administrator can change an account role.';
  end if;
  return new;
end;
$$ language plpgsql set search_path = public;

drop trigger if exists profiles_prevent_self_role_change on public.profiles;
create trigger profiles_prevent_self_role_change
  before update of role on public.profiles
  for each row execute function public.prevent_self_role_change();

create table if not exists public.doctor_profiles (
  id                uuid primary key default gen_random_uuid(),
  profile_id        uuid not null unique references public.profiles (id) on delete cascade,
  doctor_name       text not null,
  experience_years  integer not null check (experience_years >= 0),
  specialization    text not null,
  hospital_name     text not null,
  address           text not null,
  avatar_url        text,
  is_active         boolean not null default true,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.doctor_profiles add column if not exists avatar_url text;

create or replace function public.ensure_doctor_profile_role()
returns trigger as $$
declare
  doctor_role public.user_role;
  profile_avatar text;
begin
  select p.role, p.avatar_url
    into doctor_role, profile_avatar
    from public.profiles p
   where p.id = new.profile_id;

  if doctor_role is distinct from 'doctor'::public.user_role then
    raise exception 'Doctor listings must be linked to a doctor account.';
  end if;
  new.avatar_url := profile_avatar;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists doctor_profile_role_check on public.doctor_profiles;
create trigger doctor_profile_role_check
  before insert or update on public.doctor_profiles
  for each row execute function public.ensure_doctor_profile_role();

create or replace function public.sync_doctor_profile_photo()
returns trigger as $$
begin
  update public.doctor_profiles
     set avatar_url = new.avatar_url,
         updated_at = now()
   where profile_id = new.id
     and avatar_url is distinct from new.avatar_url;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_sync_doctor_photo on public.profiles;
create trigger profiles_sync_doctor_photo
  after update of avatar_url on public.profiles
  for each row execute function public.sync_doctor_profile_photo();

update public.doctor_profiles dp
   set avatar_url = p.avatar_url
  from public.profiles p
 where p.id = dp.profile_id
   and dp.avatar_url is distinct from p.avatar_url;

create table if not exists public.doctor_availability (
  id          uuid primary key default gen_random_uuid(),
  doctor_id   uuid not null references public.doctor_profiles (id) on delete cascade,
  starts_at   timestamptz not null,
  ends_at     timestamptz not null,
  created_at  timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (doctor_id, starts_at)
);

create or replace function public.prevent_overlapping_doctor_slots()
returns trigger as $$
declare
  doctor_is_active boolean;
begin
  select is_active
    into doctor_is_active
    from public.doctor_profiles
   where id = new.doctor_id
   for update;

  if not coalesce(doctor_is_active, false) then
    raise exception 'Only active doctors can schedule appointment times.';
  end if;

  if exists (
    select 1
      from public.doctor_availability da
     where da.doctor_id = new.doctor_id
       and da.id is distinct from new.id
       and da.starts_at < new.ends_at
       and da.ends_at > new.starts_at
  ) then
    raise exception 'Appointment times cannot overlap.';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists doctor_availability_no_overlap on public.doctor_availability;
create trigger doctor_availability_no_overlap
  before insert or update on public.doctor_availability
  for each row execute function public.prevent_overlapping_doctor_slots();

create table if not exists public.doctor_appointments (
  id               uuid primary key default gen_random_uuid(),
  availability_id  uuid not null references public.doctor_availability (id) on delete restrict,
  doctor_id        uuid not null references public.doctor_profiles (id) on delete restrict,
  patient_id       uuid not null references public.profiles (id) on delete cascade,
  starts_at        timestamptz not null,
  appointment_day  date not null,
  queue_number     integer not null check (queue_number > 0),
  status           text not null default 'booked'
                     check (status in ('booked', 'in_progress', 'completed', 'cancelled')),
  reason           text check (reason is null or char_length(reason) <= 300),
  created_at       timestamptz not null default now(),
  unique (doctor_id, appointment_day, queue_number)
);

create unique index if not exists doctor_appointments_active_slot_idx
  on public.doctor_appointments (availability_id)
  where status <> 'cancelled';

create index if not exists doctor_availability_start_idx
  on public.doctor_availability (starts_at);
create index if not exists doctor_appointments_patient_idx
  on public.doctor_appointments (patient_id, starts_at desc);
create index if not exists doctor_appointments_doctor_idx
  on public.doctor_appointments (doctor_id, starts_at);

create or replace function public.prepare_doctor_appointment()
returns trigger as $$
declare
  selected_doctor uuid;
  selected_start timestamptz;
  next_queue integer;
begin
  if new.patient_id <> auth.uid() then
    raise exception 'Appointments can only be booked for the signed-in patient.';
  end if;

  select da.doctor_id, da.starts_at
    into selected_doctor, selected_start
    from public.doctor_availability da
    join public.doctor_profiles dp on dp.id = da.doctor_id and dp.is_active
   where da.id = new.availability_id and da.starts_at > now()
   for update of da;

  if selected_doctor is null then
    raise exception 'This appointment time is no longer available.';
  end if;

  perform 1
    from public.doctor_profiles
   where id = selected_doctor
   for update;

  select coalesce(max(queue_number), 0) + 1
    into next_queue
    from public.doctor_appointments
   where doctor_id = selected_doctor
     and appointment_day = (selected_start at time zone 'Asia/Kolkata')::date;

  new.doctor_id := selected_doctor;
  new.starts_at := selected_start;
  new.appointment_day := (selected_start at time zone 'Asia/Kolkata')::date;
  new.queue_number := next_queue;
  new.status := 'booked';
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists doctor_appointment_prepare on public.doctor_appointments;
create trigger doctor_appointment_prepare
  before insert on public.doctor_appointments
  for each row execute function public.prepare_doctor_appointment();

create or replace function public.cancel_doctor_appointment(appointment_id uuid)
returns void as $$
begin
  update public.doctor_appointments
     set status = 'cancelled'
   where id = appointment_id
     and patient_id = auth.uid()
     and status = 'booked'
     and starts_at > now();

  if not found then
    raise exception 'This appointment can no longer be cancelled.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.set_doctor_appointment_status(
  appointment_id uuid,
  next_status text
)
returns void as $$
begin
  if next_status not in ('in_progress', 'completed') then
    raise exception 'Unsupported appointment status.';
  end if;

  update public.doctor_appointments da
     set status = next_status
   where da.id = appointment_id
     and (
       (next_status = 'in_progress' and da.status = 'booked' and da.starts_at <= now())
       or (next_status = 'completed' and da.status = 'in_progress')
     )
     and exists (
       select 1
         from public.doctor_profiles dp
        where dp.id = da.doctor_id
          and dp.profile_id = auth.uid()
     );

  if not found then
    raise exception 'Appointment not found or unavailable to this doctor.';
  end if;
end;
$$ language plpgsql security definer set search_path = public;

create or replace function public.doctor_slot_is_open(slot_id uuid)
returns boolean as $$
  select exists (
    select 1
      from public.doctor_availability da
      join public.doctor_profiles dp on dp.id = da.doctor_id and dp.is_active
     where da.id = slot_id
       and da.starts_at > now()
       and not exists (
         select 1 from public.doctor_appointments ap
          where ap.availability_id = da.id and ap.status <> 'cancelled'
       )
  );
$$ language sql security definer set search_path = public stable;

create or replace function public.doctor_can_read_patient(target_patient_id uuid)
returns boolean as $$
  select exists (
    select 1
      from public.doctor_appointments ap
      join public.doctor_profiles dp on dp.id = ap.doctor_id
     where ap.patient_id = target_patient_id
       and ap.status <> 'cancelled'
       and dp.profile_id = auth.uid()
  );
$$ language sql security definer set search_path = public stable;

create or replace function public.patient_can_read_doctor(target_doctor_id uuid)
returns boolean as $$
  select exists (
    select 1
      from public.doctor_appointments ap
     where ap.doctor_id = target_doctor_id
       and ap.patient_id = auth.uid()
  );
$$ language sql security definer set search_path = public stable;

drop function if exists public.list_patient_appointments();
create function public.list_patient_appointments()
returns table (
  id uuid,
  availability_id uuid,
  doctor_id uuid,
  patient_id uuid,
  starts_at timestamptz,
  appointment_day date,
  queue_number integer,
  status text,
  reason text,
  created_at timestamptz,
  doctor_name text,
  doctor_avatar_url text,
  specialization text,
  hospital_name text,
  address text
) as $$
  select
    ap.id,
    ap.availability_id,
    ap.doctor_id,
    ap.patient_id,
    ap.starts_at,
    ap.appointment_day,
    case
      when ap.starts_at <= now() and ap.status <> 'cancelled' then ap.queue_number
      else null::integer
    end,
    ap.status,
    ap.reason,
    ap.created_at,
    dp.doctor_name,
    dp.avatar_url,
    dp.specialization,
    dp.hospital_name,
    dp.address
  from public.doctor_appointments ap
  join public.doctor_profiles dp on dp.id = ap.doctor_id
  where ap.patient_id = auth.uid()
  order by ap.starts_at desc;
$$ language sql security definer set search_path = public stable;

revoke all on function public.doctor_slot_is_open(uuid) from public;
revoke all on function public.doctor_can_read_patient(uuid) from public;
revoke all on function public.patient_can_read_doctor(uuid) from public;
revoke all on function public.list_patient_appointments() from public;
grant execute on function public.doctor_slot_is_open(uuid) to authenticated;
grant execute on function public.doctor_can_read_patient(uuid) to authenticated;
grant execute on function public.patient_can_read_doctor(uuid) to authenticated;
grant execute on function public.list_patient_appointments() to authenticated;

alter table public.doctor_profiles enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.doctor_appointments enable row level security;

grant select, insert, update, delete on public.doctor_profiles to authenticated;
grant select, insert, update, delete on public.doctor_availability to authenticated;
grant select, insert, update, delete on public.doctor_appointments to authenticated;

drop policy if exists "doctor_profiles_public_active" on public.doctor_profiles;
create policy "doctor_profiles_public_active"
  on public.doctor_profiles for select
  using (is_active);

drop policy if exists "doctor_profiles_admin_manage" on public.doctor_profiles;
create policy "doctor_profiles_admin_manage"
  on public.doctor_profiles for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "doctor_profiles_owner_read" on public.doctor_profiles;
create policy "doctor_profiles_owner_read"
  on public.doctor_profiles for select
  using (profile_id = auth.uid());

drop policy if exists "doctor_profiles_booked_patient_read" on public.doctor_profiles;
create policy "doctor_profiles_booked_patient_read"
  on public.doctor_profiles for select
  using (public.patient_can_read_doctor(id));

drop policy if exists "profiles_select_booked_doctor" on public.profiles;
create policy "profiles_select_booked_doctor"
  on public.profiles for select
  using (public.doctor_can_read_patient(id));

drop policy if exists "availability_patient_open_slots" on public.doctor_availability;
create policy "availability_patient_open_slots"
  on public.doctor_availability for select
  using (public.doctor_slot_is_open(id));

drop policy if exists "availability_doctor_read" on public.doctor_availability;
create policy "availability_doctor_read"
  on public.doctor_availability for select
  using (
    exists (
      select 1 from public.doctor_profiles dp
       where dp.id = doctor_id and dp.profile_id = auth.uid()
    )
  );

drop policy if exists "availability_admin_read" on public.doctor_availability;
create policy "availability_admin_read"
  on public.doctor_availability for select
  using (public.is_admin());

drop policy if exists "availability_doctor_insert" on public.doctor_availability;
create policy "availability_doctor_insert"
  on public.doctor_availability for insert
  with check (
    starts_at > now()
    and exists (
      select 1 from public.doctor_profiles dp
       where dp.id = doctor_id and dp.profile_id = auth.uid() and dp.is_active
    )
  );

drop policy if exists "availability_doctor_delete" on public.doctor_availability;
create policy "availability_doctor_delete"
  on public.doctor_availability for delete
  using (
    exists (
      select 1 from public.doctor_profiles dp
       where dp.id = doctor_id and dp.profile_id = auth.uid()
    )
    and not exists (
      select 1 from public.doctor_appointments da
       where da.availability_id = doctor_availability.id
    )
  );

drop policy if exists "availability_admin_manage" on public.doctor_availability;
create policy "availability_admin_manage"
  on public.doctor_availability for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "appointments_patient_read" on public.doctor_appointments;

drop policy if exists "appointments_doctor_read" on public.doctor_appointments;
create policy "appointments_doctor_read"
  on public.doctor_appointments for select
  using (
    exists (
      select 1 from public.doctor_profiles dp
       where dp.id = doctor_id and dp.profile_id = auth.uid()
    )
  );

drop policy if exists "appointments_admin_manage" on public.doctor_appointments;
create policy "appointments_admin_manage"
  on public.doctor_appointments for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "appointments_patient_book" on public.doctor_appointments;
create policy "appointments_patient_book"
  on public.doctor_appointments for insert
  with check (
    patient_id = auth.uid()
    and exists (
      select 1 from public.profiles p
       where p.id = auth.uid() and p.role = 'patient'
    )
  );

grant execute on function public.cancel_doctor_appointment(uuid) to authenticated;
grant execute on function public.set_doctor_appointment_status(uuid, text) to authenticated;