-- PillSync Milestone 2 schema
-- Adds: medications (what a patient takes + dosage schedule),
-- dose_logs (the Taken/Missed/Snooze record for each scheduled dose),
-- and notifications (in-app notification feed).
-- Builds on Milestone 1's profiles / caregiver_links tables and RLS pattern.

-- ---------------------------------------------------------------------
-- 1. medications
--    One row per medicine a patient is tracking.
-- ---------------------------------------------------------------------
create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  dosage text not null,               -- e.g. "500mg", "1 tablet"
  frequency_per_day int not null default 1,
  -- times of day this medicine should be taken, e.g. {'08:00','20:00'}
  reminder_times time[] not null default '{}',
  disease_category text,              -- e.g. "Blood Pressure", "Diabetes"
  quantity_on_hand int,                -- for later refill-prediction milestone
  notes text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_medications_updated_at on public.medications;
create trigger set_medications_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 2. dose_logs
--    One row per scheduled dose event: taken, missed, or snoozed.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'dose_status') then
    create type dose_status as enum ('pending', 'taken', 'missed', 'snoozed');
  end if;
end$$;

create table if not exists public.dose_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references public.medications (id) on delete cascade,
  patient_id uuid not null references public.profiles (id) on delete cascade,
  scheduled_for timestamptz not null,   -- the specific dose time
  status dose_status not null default 'pending',
  snoozed_until timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists dose_logs_patient_scheduled_idx
  on public.dose_logs (patient_id, scheduled_for desc);

-- Prevents duplicate dose rows for the same medication at the same
-- scheduled time — guards against double-inserts from concurrent requests
-- (e.g. React's development-mode double-invoked effects).
create unique index if not exists dose_logs_unique_medication_time
  on public.dose_logs (medication_id, scheduled_for);

-- ---------------------------------------------------------------------
-- 3. notifications
--    In-app notification feed (missed dose alerts, etc).
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'missed_dose', -- 'missed_dose' | 'reminder' | 'refill' (later)
  title text not null,
  body text,
  related_medication_id uuid references public.medications (id) on delete set null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);

-- ---------------------------------------------------------------------
-- 4. Row Level Security
-- ---------------------------------------------------------------------
alter table public.medications enable row level security;
alter table public.dose_logs enable row level security;
alter table public.notifications enable row level security;

-- Patients manage their own medications
drop policy if exists medications_select_own on public.medications;
create policy medications_select_own on public.medications
  for select using (patient_id = auth.uid());

drop policy if exists medications_write_own on public.medications;
create policy medications_write_own on public.medications
  for all using (patient_id = auth.uid());

-- A caregiver can read (not write) an accepted-linked patient's medications
drop policy if exists medications_select_linked on public.medications;
create policy medications_select_linked on public.medications
  for select using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = medications.patient_id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );

-- Admins can read every medication (analytics, later milestones)
drop policy if exists medications_select_admin on public.medications;
create policy medications_select_admin on public.medications
  for select using (public.current_user_role() = 'admin');

-- dose_logs: same ownership pattern
drop policy if exists dose_logs_select_own on public.dose_logs;
create policy dose_logs_select_own on public.dose_logs
  for select using (patient_id = auth.uid());

drop policy if exists dose_logs_write_own on public.dose_logs;
create policy dose_logs_write_own on public.dose_logs
  for all using (patient_id = auth.uid());

drop policy if exists dose_logs_select_linked on public.dose_logs;
create policy dose_logs_select_linked on public.dose_logs
  for select using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = dose_logs.patient_id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );

-- notifications: only the recipient can see/manage their own
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update using (recipient_id = auth.uid());

drop policy if exists notifications_write_own on public.notifications;
create policy notifications_write_own on public.notifications
  for insert with check (recipient_id = auth.uid());

-- ---------------------------------------------------------------------
-- 5. Trigger: when a dose is logged as missed, create a notification
--    for the patient (and, if linked, their accepted caregivers).
-- ---------------------------------------------------------------------
create or replace function public.notify_on_missed_dose()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  med_name text;
  cg record;
begin
  if new.status = 'missed' and (old.status is distinct from 'missed') then
    select name into med_name from public.medications where id = new.medication_id;

    insert into public.notifications (recipient_id, kind, title, body, related_medication_id)
    values (
      new.patient_id,
      'missed_dose',
      'Missed dose',
      coalesce(med_name, 'A medicine') || ' was not marked as taken on time.',
      new.medication_id
    );

    for cg in
      select caregiver_id from public.caregiver_links
      where patient_id = new.patient_id and status = 'accepted'
    loop
      insert into public.notifications (recipient_id, kind, title, body, related_medication_id)
      values (
        cg.caregiver_id,
        'missed_dose',
        'Missed dose alert',
        coalesce(med_name, 'A medicine') || ' was missed by a linked patient.',
        new.medication_id
      );
    end loop;
  end if;
  return new;
end;
$$;

drop trigger if exists on_dose_missed on public.dose_logs;
create trigger on_dose_missed
  after update on public.dose_logs
  for each row execute function public.notify_on_missed_dose();
