-- =============================================================================
-- PillSync — Fitness module (Diet Planner, Exercise Library, Progress/Streak)
-- =============================================================================
-- Run against the same Supabase project as schema.sql / schema_m2_m3.sql
-- (Dashboard → SQL Editor → New query → paste → Run). Depends on
-- public.profiles and public.is_admin() from schema.sql already existing.
--
-- Tables:
--   1. diet_plans           — one row per AI/admin-generated diet plan
--   2. exercise_assignments — which exercise ids are assigned to a patient,
--                             one row per (patient, exercise, day)
--   3. fitness_logs         — one row per patient per day: what they actually
--                             did. This is the source of truth for the
--                             progress/streak UI (see src/lib/fitnessStreak.js)
--
-- Exercise content itself (name, steps, animation) lives in the frontend
-- static library (src/features/fitness/data/exercisesLibrary.js) and is
-- referenced here only by its string id — no exercises table needed.
-- =============================================================================

create type public.age_group as enum ('young', 'middle', 'old');

-- 1. Diet plans ---------------------------------------------------------------

create table if not exists public.diet_plans (
  id                   uuid primary key default gen_random_uuid(),
  patient_id           uuid not null references public.profiles (id) on delete cascade,
  age_group            public.age_group not null,
  gender               text,
  goal                 text,
  dietary_preference   text,
  plan_json            jsonb not null,       -- { calorieTarget, summary, meals, hydrationTip, cautions }
  exercise_ids         text[] not null default '{}',
  created_at           timestamptz not null default now()
);

comment on table public.diet_plans is
  'AI-generated (Groq, via the diet-ai Edge Function) or admin-assigned diet plans.';

-- 2. Exercise assignments -------------------------------------------------------

create table if not exists public.exercise_assignments (
  id             uuid primary key default gen_random_uuid(),
  patient_id     uuid not null references public.profiles (id) on delete cascade,
  exercise_id    text not null,              -- matches an id in exercisesLibrary.js
  age_group      public.age_group,
  assigned_by    text not null default 'ai' check (assigned_by in ('ai', 'admin', 'caregiver', 'self')),
  assigned_date  date not null default current_date,
  created_at     timestamptz not null default now(),
  unique (patient_id, exercise_id, assigned_date)
);

comment on table public.exercise_assignments is
  'Exercises assigned to a patient for a given day, from the AI planner, an admin, or the patient adding one themselves.';

-- 3. Daily fitness logs (progress + streak source of truth) --------------------

create table if not exists public.fitness_logs (
  id                        uuid primary key default gen_random_uuid(),
  patient_id                uuid not null references public.profiles (id) on delete cascade,
  log_date                  date not null default current_date,
  completed_exercise_ids    text[] not null default '{}',
  diet_followed             boolean not null default false,
  notes                     text,
  created_at                timestamptz not null default now(),
  unique (patient_id, log_date)
);

comment on table public.fitness_logs is
  'One row per patient per day. A day counts toward a streak if at least one exercise was completed or diet_followed is true — see src/lib/fitnessStreak.js.';

-- 4. Row Level Security ----------------------------------------------------------

alter table public.diet_plans enable row level security;
alter table public.exercise_assignments enable row level security;
alter table public.fitness_logs enable row level security;

-- Patients manage their own rows.
drop policy if exists "diet_plans_own" on public.diet_plans;
create policy "diet_plans_own" on public.diet_plans
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

drop policy if exists "exercise_assignments_own" on public.exercise_assignments;
create policy "exercise_assignments_own" on public.exercise_assignments
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

drop policy if exists "fitness_logs_own" on public.fitness_logs;
create policy "fitness_logs_own" on public.fitness_logs
  for all using (patient_id = auth.uid()) with check (patient_id = auth.uid());

-- Admins can read everything (mirrors profiles_select_admin in schema.sql —
-- powers the Admin dashboard fitness stats).
drop policy if exists "diet_plans_select_admin" on public.diet_plans;
create policy "diet_plans_select_admin" on public.diet_plans
  for select using (public.is_admin());

drop policy if exists "exercise_assignments_select_admin" on public.exercise_assignments;
create policy "exercise_assignments_select_admin" on public.exercise_assignments
  for select using (public.is_admin());

drop policy if exists "fitness_logs_select_admin" on public.fitness_logs;
create policy "fitness_logs_select_admin" on public.fitness_logs
  for select using (public.is_admin());

-- A caregiver can read (not write) the fitness data of patients linked to
-- them, reusing caregiver_links from schema.sql.
drop policy if exists "fitness_logs_select_linked_patient" on public.fitness_logs;
create policy "fitness_logs_select_linked_patient" on public.fitness_logs
  for select using (
    exists (
      select 1 from public.caregiver_links cl
      where cl.patient_id = fitness_logs.patient_id
        and cl.caregiver_id = auth.uid()
        and cl.status = 'accepted'
    )
  );
