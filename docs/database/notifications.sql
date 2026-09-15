-- PillSync caregiver/patient notifications
-- Run schema.sql and schema_m2_m3.sql first.

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  patient_id   uuid not null references public.profiles (id) on delete cascade,
  sender_id    uuid references public.profiles (id) on delete set null,
  dose_log_id  uuid references public.dose_logs (id) on delete cascade,
  title        text not null,
  body         text not null,
  image_url    text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

alter table public.notifications add column if not exists sender_id uuid references public.profiles (id) on delete set null;
alter table public.notifications add column if not exists image_url text;

create index if not exists notifications_recipient_id_idx
on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

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
    select 1
    from public.caregiver_links cl
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
    select 1
    from public.caregiver_links cl
    where cl.patient_id = notifications.patient_id
      and cl.caregiver_id = notifications.recipient_id
      and cl.status = 'accepted'
  )
);

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

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
