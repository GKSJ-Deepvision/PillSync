-- =============================================================================
-- PillSync — Milestone 1 database schema (Supabase / PostgreSQL)
-- =============================================================================
-- Run this once against a fresh Supabase project: Dashboard → SQL Editor →
-- New query → paste this whole file → Run. It is idempotent-ish (uses
-- IF NOT EXISTS / OR REPLACE) so re-running after a small edit is safe.
--
-- What this covers (Milestone 1 scope):
--   1. user_role enum + profiles table (one row per auth.users row)
--   2. Patient-only clinical fields folded into profiles (conditions, blood
--      group, emergency contact) — see docs/database/README.md for why
--   3. caregiver_links: many-to-many patient <-> caregiver assignment
--   4. A trigger that auto-creates a profiles row on signup, reading the
--      role and full name out of auth.users.raw_user_meta_data (set by the
--      frontend's supabase.auth.signUp({ options: { data: {...} } }) call)
--   5. Row Level Security policies enforcing:
--        - patients/caregivers/admins can all read + update their own row
--        - admins can read every profile (role-based access control)
--        - caregivers can read the profiles of patients linked to them
-- =============================================================================

-- 1. Roles ---------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('patient', 'caregiver', 'admin');
  end if;
end $$;

-- 2. Profiles --------------------------------------------------------------
-- One row per Supabase Auth user (auth.users.id is the primary key here too,
-- so profiles.id IS the user's auth id — no separate FK column needed).

create table if not exists public.profiles (
  id                          uuid primary key references auth.users (id) on delete cascade,
  role                        public.user_role not null default 'patient',
  full_name                   text not null default '',
  phone                       text,
  date_of_birth               date,
  avatar_url                  text,

  -- Patient-specific fields (module 2 / "profiles" app). Nullable because
  -- caregiver and admin rows never populate them.
  blood_group                 text,
  conditions                  text[] not null default '{}',
  emergency_contact_name      text,
  emergency_contact_phone     text,
  emergency_contact_relation  text,

  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.profiles is
  'One row per authenticated user. Role drives RBAC across the whole app.';

-- 3. Caregiver <-> patient links -------------------------------------------

create table if not exists public.caregiver_links (
  id            uuid primary key default gen_random_uuid(),
  caregiver_id  uuid not null references public.profiles (id) on delete cascade,
  patient_id    uuid not null references public.profiles (id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at    timestamptz not null default now(),
  unique (caregiver_id, patient_id)
);

comment on table public.caregiver_links is
  'Many-to-many: which caregivers can see which patients. An admin creates '
  'or approves these; Milestone 1 ships the schema + read access, the '
  'self-serve invite flow is Milestone 2.';

-- 4. updated_at bookkeeping --------------------------------------------------

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- 5. Auto-create a profile row when someone signs up ------------------------
-- Reads role/full_name out of the metadata the frontend passes to
-- supabase.auth.signUp(). Defaults to 'patient' if metadata is missing so a
-- bare signUp() call never fails.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'patient')
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Row Level Security ------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.caregiver_links enable row level security;

-- Helper: is the current user an admin? Defined as `security definer` so it
-- can read profiles without recursing into the policy that calls it.
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer set search_path = public stable;

-- profiles: everyone can read + update their own row.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

-- profiles: admins can read every row (RBAC — admin dashboard user counts).
drop policy if exists "profiles_select_admin" on public.profiles;
create policy "profiles_select_admin"
  on public.profiles for select
  using (public.is_admin());

-- profiles: a caregiver can read a patient's profile once the link is accepted.
drop policy if exists "profiles_select_linked_patient" on public.profiles;
create policy "profiles_select_linked_patient"
  on public.profiles for select
  using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = profiles.id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );

-- caregiver_links: a caregiver sees their own links; a patient sees links
-- pointing at them; an admin sees everything.
drop policy if exists "links_select_participant" on public.caregiver_links;
create policy "links_select_participant"
  on public.caregiver_links for select
  using (
    caregiver_id = auth.uid()
    or patient_id = auth.uid()
    or public.is_admin()
  );

-- Only admins create/update/delete links in Milestone 1 (self-serve invites
-- are Milestone 2's "caregiver ↔ patient assignment" flow).
drop policy if exists "links_admin_write" on public.caregiver_links;
create policy "links_admin_write"
  on public.caregiver_links for all
  using (public.is_admin())
  with check (public.is_admin());
