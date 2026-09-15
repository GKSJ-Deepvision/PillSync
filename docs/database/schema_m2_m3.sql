-- =============================================================================
-- PillSync — Milestone 2 & 3 database schema (Supabase / PostgreSQL)
-- =============================================================================
-- Run this AFTER schema.sql, against the same Supabase project:
-- Dashboard → SQL Editor → New query → paste this whole file → Run.
-- Idempotent-ish (IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS), so
-- re-running after a small edit is safe.
--
-- What this covers:
--   Milestone 2 — Medicine management, dosage scheduling, reminders, dose
--   tracking / history, multiple patient profiles (already handled by
--   `profiles` + `caregiver_links` from schema.sql).
--   Milestone 3 — Stock & refill alerts (computed client-side from
--   `medications.stock_quantity` + `medication_schedules`, see
--   `frontend/src/lib/refillPrediction.js`) and adherence analytics
--   (computed client-side from `dose_logs`, see `frontend/src/lib/adherence.js`).
--
-- Tables:
--   1. medications          — one row per medicine a patient is tracking
--   2. medication_schedules — one row per dosing time for a medication
--   3. dose_logs            — one row per scheduled dose occurrence
-- =============================================================================

-- 1. Medications --------------------------------------------------------------

create table if not exists public.medications (
  id                  uuid primary key default gen_random_uuid(),
  patient_id          uuid not null references public.profiles (id) on delete cascade,
  name                text not null,
  generic_name        text,
  strength            text,
  form                text not null default 'tablet'
                        check (form in ('tablet','capsule','syrup','injection','drops','inhaler','cream','patch','other')),
  instructions        text,
  color               text not null default '#5B5FEF',
  stock_quantity      numeric not null default 0 check (stock_quantity >= 0),
  low_stock_threshold numeric not null default 5 check (low_stock_threshold >= 0),
  refill_lead_days    integer not null default 5 check (refill_lead_days >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.medications is
  'One row per medicine a patient tracks. Stock/refill math lives in the '
  'frontend (frontend/src/lib/refillPrediction.js) so the formula is easy '
  'to unit test; this table just holds the inputs.';

drop trigger if exists medications_set_updated_at on public.medications;
create trigger medications_set_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

create index if not exists medications_patient_id_idx on public.medications (patient_id);

-- 2. Dosage schedules -----------------------------------------------------

create table if not exists public.medication_schedules (
  id             uuid primary key default gen_random_uuid(),
  medication_id  uuid not null references public.medications (id) on delete cascade,
  patient_id     uuid not null references public.profiles (id) on delete cascade,
  label          text not null default 'Dose',
  time_of_day    time not null,
  dose_quantity  numeric not null default 1 check (dose_quantity > 0),
  -- 0 = Sunday .. 6 = Saturday, matches JS Date#getDay(). Empty/full array = every day.
  days_of_week   integer[] not null default '{0,1,2,3,4,5,6}',
  start_date     date not null default current_date,
  end_date       date,
  is_active      boolean not null default true,
  created_at     timestamptz not null default now()
);

comment on table public.medication_schedules is
  'One row per dosing time (e.g. "8:00 AM, 2 tablets, every day"). A '
  'medication can have several — morning / afternoon / night.';

create index if not exists medication_schedules_medication_id_idx on public.medication_schedules (medication_id);
create index if not exists medication_schedules_patient_id_idx on public.medication_schedules (patient_id);

-- 3. Dose logs ----------------------------------------------------------------

create table if not exists public.dose_logs (
  id             uuid primary key default gen_random_uuid(),
  schedule_id    uuid references public.medication_schedules (id) on delete cascade,
  medication_id  uuid not null references public.medications (id) on delete cascade,
  patient_id     uuid not null references public.profiles (id) on delete cascade,
  scheduled_for  timestamptz not null,
  dose_quantity  numeric not null default 1,
  status         text not null default 'pending'
                   check (status in ('pending','taken','missed','snoozed','skipped')),
  taken_at       timestamptz,
  snooze_until   timestamptz,
  notes          text,
  created_at     timestamptz not null default now(),
  unique (schedule_id, scheduled_for)
);

comment on table public.dose_logs is
  'One row per scheduled dose occurrence — this is the medication history '
  '/ adherence audit trail. Rows are generated on the fly (upserted) the '
  'first time a patient opens the app on a given day; see '
  'frontend/src/features/reminders/api.js#ensureTodayDoseLogs.';

create index if not exists dose_logs_patient_id_idx on public.dose_logs (patient_id);
create index if not exists dose_logs_scheduled_for_idx on public.dose_logs (scheduled_for);
create index if not exists dose_logs_medication_id_idx on public.dose_logs (medication_id);

-- 4. Prescription images ------------------------------------------------------

create table if not exists public.prescriptions (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references public.profiles (id) on delete cascade,
  image_url            text not null,
  cloudinary_public_id text not null,
  original_filename    text,
  mime_type            text,
  file_size            integer,
  extracted_text       text,
  extracted_medicines  jsonb not null default '[]'::jsonb,
  ocr_confidence       numeric(5,4),
  ocr_processed_at     timestamptz,
  status               text not null default 'uploaded'
                       check (status in ('uploaded','reviewed','archived')),
  created_at           timestamptz not null default now()
);

alter table public.prescriptions add column if not exists extracted_text text;
alter table public.prescriptions add column if not exists extracted_medicines jsonb not null default '[]'::jsonb;
alter table public.prescriptions add column if not exists ocr_confidence numeric(5,4);
alter table public.prescriptions add column if not exists ocr_processed_at timestamptz;

create index if not exists prescriptions_patient_id_idx on public.prescriptions (patient_id);

-- 5. Caregiver notifications --------------------------------------------------

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  patient_id  uuid not null references public.profiles (id) on delete cascade,
  sender_id   uuid references public.profiles (id) on delete set null,
  dose_log_id uuid references public.dose_logs (id) on delete cascade,
  title       text not null,
  body        text not null,
  image_url   text,
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

alter table public.notifications add column if not exists sender_id uuid references public.profiles (id) on delete set null;
alter table public.notifications add column if not exists image_url text;

create index if not exists notifications_recipient_id_idx on public.notifications (recipient_id, created_at desc);

create or replace function public.notify_caregivers_of_missed_dose()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if new.status = 'missed' and old.status is distinct from 'missed' then
    insert into public.notifications (recipient_id, patient_id, dose_log_id, title, body)
    select
      cl.caregiver_id,
      new.patient_id,
      new.id,
      'Missed medicine dose',
      coalesce(p.full_name, 'A patient') || ' missed ' || coalesce(m.name, 'a medicine') || '.'
    from public.caregiver_links cl
    join public.profiles p on p.id = new.patient_id
    left join public.medications m on m.id = new.medication_id
    where cl.patient_id = new.patient_id
      and cl.status = 'accepted';

    insert into public.notifications (recipient_id, patient_id, dose_log_id, title, body)
    values (
      new.patient_id,
      new.patient_id,
      new.id,
      'Missed medicine reminder',
      'You missed ' || coalesce((select name from public.medications where id = new.medication_id), 'a medicine') || '. Please check your schedule.'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists dose_logs_notify_caregivers on public.dose_logs;
create trigger dose_logs_notify_caregivers
  after update of status on public.dose_logs
  for each row execute function public.notify_caregivers_of_missed_dose();

-- 6. Row Level Security ------------------------------------------------------

alter table public.medications enable row level security;
alter table public.medication_schedules enable row level security;
alter table public.dose_logs enable row level security;
alter table public.prescriptions enable row level security;
alter table public.notifications enable row level security;

-- medications: a patient has full control of their own rows.
drop policy if exists "medications_all_own" on public.medications;
create policy "medications_all_own"
  on public.medications for all
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "medications_insert_linked" on public.medications;
create policy "medications_insert_linked"
  on public.medications for insert
  with check (exists (select 1 from public.caregiver_links cl where cl.patient_id = medications.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'));

drop policy if exists "medications_update_linked" on public.medications;
create policy "medications_update_linked"
  on public.medications for update
  using (exists (select 1 from public.caregiver_links cl where cl.patient_id = medications.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'))
  with check (exists (select 1 from public.caregiver_links cl where cl.patient_id = medications.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'));

drop policy if exists "medications_delete_linked" on public.medications;
create policy "medications_delete_linked"
  on public.medications for delete
  using (exists (select 1 from public.caregiver_links cl where cl.patient_id = medications.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'));

-- medications: a linked caregiver can read (not write) a patient's rows.
drop policy if exists "medications_select_linked" on public.medications;
create policy "medications_select_linked"
  on public.medications for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = medications.patient_id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );

-- medications: admins can read everything.
drop policy if exists "medications_select_admin" on public.medications;
create policy "medications_select_admin"
  on public.medications for select
  using (public.is_admin());

-- medication_schedules: same shape as medications.
drop policy if exists "schedules_all_own" on public.medication_schedules;
create policy "schedules_all_own"
  on public.medication_schedules for all
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "schedules_insert_linked" on public.medication_schedules;
create policy "schedules_insert_linked"
  on public.medication_schedules for insert
  with check (exists (select 1 from public.caregiver_links cl where cl.patient_id = medication_schedules.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'));

drop policy if exists "schedules_update_linked" on public.medication_schedules;
create policy "schedules_update_linked"
  on public.medication_schedules for update
  using (exists (select 1 from public.caregiver_links cl where cl.patient_id = medication_schedules.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'))
  with check (exists (select 1 from public.caregiver_links cl where cl.patient_id = medication_schedules.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'));

drop policy if exists "schedules_delete_linked" on public.medication_schedules;
create policy "schedules_delete_linked"
  on public.medication_schedules for delete
  using (exists (select 1 from public.caregiver_links cl where cl.patient_id = medication_schedules.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'));

drop policy if exists "schedules_select_linked" on public.medication_schedules;
create policy "schedules_select_linked"
  on public.medication_schedules for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = medication_schedules.patient_id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );

drop policy if exists "schedules_select_admin" on public.medication_schedules;
create policy "schedules_select_admin"
  on public.medication_schedules for select
  using (public.is_admin());

-- dose_logs: a patient has full control of their own rows (Taken / Missed /
-- Snooze actions are UPDATEs; history is a SELECT).
drop policy if exists "dose_logs_all_own" on public.dose_logs;
create policy "dose_logs_all_own"
  on public.dose_logs for all
  using (patient_id = auth.uid())
  with check (patient_id = auth.uid());

drop policy if exists "dose_logs_select_linked" on public.dose_logs;
create policy "dose_logs_select_linked"
  on public.dose_logs for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = dose_logs.patient_id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );

drop policy if exists "dose_logs_select_admin" on public.dose_logs;
create policy "dose_logs_select_admin"
  on public.dose_logs for select
  using (public.is_admin());

drop policy if exists "prescriptions_insert_own" on public.prescriptions;
create policy "prescriptions_insert_own"
  on public.prescriptions for insert
  with check (patient_id = auth.uid());

drop policy if exists "prescriptions_select_own" on public.prescriptions;
create policy "prescriptions_select_own"
  on public.prescriptions for select
  using (patient_id = auth.uid());

drop policy if exists "prescriptions_select_linked" on public.prescriptions;
create policy "prescriptions_select_linked"
  on public.prescriptions for select
  using (exists (select 1 from public.caregiver_links cl where cl.patient_id = prescriptions.patient_id and cl.caregiver_id = auth.uid() and cl.status = 'accepted'));

drop policy if exists "prescriptions_select_admin" on public.prescriptions;
create policy "prescriptions_select_admin"
  on public.prescriptions for select
  using (public.is_admin());

drop policy if exists "notifications_select_own" on public.notifications;
create policy "notifications_select_own"
  on public.notifications for select
  using (recipient_id = auth.uid() or sender_id = auth.uid());

drop policy if exists "notifications_update_own" on public.notifications;
create policy "notifications_update_own"
  on public.notifications for update
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

drop policy if exists "caregivers_send_patient_notifications" on public.notifications;
create policy "caregivers_send_patient_notifications"
  on public.notifications for insert
  with check (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = public.notifications.patient_id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
    and public.notifications.recipient_id = public.notifications.patient_id
    and public.notifications.sender_id = auth.uid()
  );

drop policy if exists "patients_send_prescription_notifications" on public.notifications;
create policy "patients_send_prescription_notifications"
  on public.notifications for insert
  with check (
    sender_id = auth.uid()
    and patient_id = auth.uid()
    and exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = notifications.patient_id
        and cl.caregiver_id = notifications.recipient_id
        and cl.status = 'accepted'
    )
  );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
