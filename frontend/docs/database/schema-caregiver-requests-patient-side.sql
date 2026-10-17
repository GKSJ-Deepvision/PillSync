-- PillSync: patient-side "Add caregiver" (run after schema-caregiver-requests.sql)
-- Records who started each request, so either side can ask and the other side accepts.

alter table public.caregiver_links
  add column if not exists requested_by uuid references public.profiles (id) on delete set null;

-- Caregiver asks to be linked to a patient (replaces the first version).
create or replace function public.request_caregiver_link(p_patient_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_patient uuid;
  v_status text;
  v_by uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  if public.current_user_role() is distinct from 'caregiver'::user_role then
    raise exception 'Only caregivers can add patients.';
  end if;

  select u.id into v_patient
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_patient_email))
    and p.role = 'patient'
  limit 1;

  if v_patient is not null then
    select cl.status, cl.requested_by into v_status, v_by
    from public.caregiver_links cl
    where cl.caregiver_id = auth.uid() and cl.patient_id = v_patient;

    if not found then
      insert into public.caregiver_links (caregiver_id, patient_id, status, requested_by)
      values (auth.uid(), v_patient, 'pending', auth.uid());
    elsif v_status = 'revoked' then
      update public.caregiver_links
      set status = 'pending', requested_by = auth.uid()
      where caregiver_id = auth.uid() and patient_id = v_patient;
    elsif v_status = 'pending' and v_by = v_patient then
      update public.caregiver_links
      set status = 'accepted'
      where caregiver_id = auth.uid() and patient_id = v_patient;
    end if;
  end if;

  return 'requested';
end;
$$;

-- Patient asks to be linked to a caregiver.
create or replace function public.patient_request_caregiver(p_caregiver_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_caregiver uuid;
  v_status text;
  v_by uuid;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in.';
  end if;
  if public.current_user_role() is distinct from 'patient'::user_role then
    raise exception 'Only patients can add caregivers.';
  end if;

  select u.id into v_caregiver
  from auth.users u
  join public.profiles p on p.id = u.id
  where lower(u.email) = lower(trim(p_caregiver_email))
    and p.role = 'caregiver'
  limit 1;

  if v_caregiver is not null then
    select cl.status, cl.requested_by into v_status, v_by
    from public.caregiver_links cl
    where cl.caregiver_id = v_caregiver and cl.patient_id = auth.uid();

    if not found then
      insert into public.caregiver_links (caregiver_id, patient_id, status, requested_by)
      values (v_caregiver, auth.uid(), 'pending', auth.uid());
    elsif v_status = 'revoked' then
      update public.caregiver_links
      set status = 'pending', requested_by = auth.uid()
      where caregiver_id = v_caregiver and patient_id = auth.uid();
    elsif v_status = 'pending' and v_by is distinct from auth.uid() then
      update public.caregiver_links
      set status = 'accepted'
      where caregiver_id = v_caregiver and patient_id = auth.uid();
    end if;
  end if;

  return 'requested';
end;
$$;

-- Patient: requests from caregivers waiting for the patient's answer.
create or replace function public.my_caregiver_requests()
returns table (request_id uuid, caregiver_name text, requested_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select cl.id, p.full_name, cl.created_at
  from public.caregiver_links cl
  join public.profiles p on p.id = cl.caregiver_id
  where cl.patient_id = auth.uid()
    and cl.status = 'pending'
    and (cl.requested_by is null or cl.requested_by = cl.caregiver_id)
  order by cl.created_at desc;
$$;

-- Caregiver: requests from patients waiting for the caregiver's answer.
create or replace function public.my_patient_requests()
returns table (request_id uuid, patient_name text, requested_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select cl.id, p.full_name, cl.created_at
  from public.caregiver_links cl
  join public.profiles p on p.id = cl.patient_id
  where cl.caregiver_id = auth.uid()
    and cl.status = 'pending'
    and cl.requested_by = cl.patient_id
  order by cl.created_at desc;
$$;

-- Accept or decline a pending request that was sent to you (either role).
create or replace function public.respond_caregiver_link(p_link_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.caregiver_links
  set status = case when p_accept then 'accepted' else 'revoked' end
  where id = p_link_id
    and status = 'pending'
    and (
      (patient_id = auth.uid() and (requested_by is null or requested_by = caregiver_id))
      or (caregiver_id = auth.uid() and requested_by = patient_id)
    );

  if not found then
    raise exception 'Request not found.';
  end if;
end;
$$;

revoke all on function public.patient_request_caregiver(text) from public;
revoke all on function public.my_patient_requests() from public;
grant execute on function public.patient_request_caregiver(text) to authenticated;
grant execute on function public.my_patient_requests() to authenticated;