-- PillSync Milestone 1 schema
-- Two tables this milestone: profiles (role, identity, patient-only fields)
-- and caregiver_links (many-to-many caregiver <-> patient join).
-- Row Level Security is the real access-control boundary; ProtectedRoute.jsx
-- only gates which dashboard body renders, it does not enforce data access.

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('patient', 'caregiver', 'admin');
  end if;
end$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'patient',
  full_name text not null default '',
  phone text,
  date_of_birth date,
  avatar_url text,
  blood_group text,
  conditions text[] default '{}',
  emergency_contact_name text,
  emergency_contact_phone text,
  emergency_contact_relation text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.caregiver_links (
  id uuid primary key default gen_random_uuid(),
  caregiver_id uuid not null references public.profiles (id) on delete cascade,
  patient_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (caregiver_id, patient_id)
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'patient'),
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_links_updated_at on public.caregiver_links;
create trigger set_links_updated_at
  before update on public.caregiver_links
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.caregiver_links enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid());

create or replace function public.current_user_role()
returns user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy if exists profiles_select_admin on public.profiles;
create policy profiles_select_admin on public.profiles
  for select using (public.current_user_role() = 'admin');

drop policy if exists profiles_select_linked_patient on public.profiles;
create policy profiles_select_linked_patient on public.profiles
  for select using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = profiles.id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );

drop policy if exists links_select_participant on public.caregiver_links;
create policy links_select_participant on public.caregiver_links
  for select using (
    caregiver_id = auth.uid() or patient_id = auth.uid()
  );

drop policy if exists links_admin_write on public.caregiver_links;
create policy links_admin_write on public.caregiver_links
  for all using (public.current_user_role() = 'admin');