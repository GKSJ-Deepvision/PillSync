-- PillSync: self-service caregiver link requests ("Add patient")
-- Adds three functions only. No existing table or policy is changed.

-- A caregiver asks to be linked to a patient by the patient's email.
-- The reply is always the same, so it never reveals whether an email is registered.
create or replace function public.request_caregiver_link(p_patient_email text)
returns text
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_patient uuid;
  v_status text;
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
    select cl.status into v_status
    from public.caregiver_links cl
    where cl.caregiver_id = auth.uid() and cl.patient_id = v_patient;

    if v_status is null then
      insert into public.caregiver_links (caregiver_id, patient_id, status)
      values (auth.uid(), v_patient, 'pending');
    elsif v_status = 'revoked' then
      update public.caregiver_links
      set status = 'pending'
      where caregiver_id = auth.uid() and patient_id = v_patient;
    end if;
  end if;

  return 'requested';
end;
$$;

-- A patient lists the pending requests addressed to them.
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
  where cl.patient_id = auth.uid() and cl.status = 'pending'
  order by cl.created_at desc;
$$;

-- A patient accepts or declines one of their own pending requests.
create or replace function public.respond_caregiver_link(p_link_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.caregiver_links
  set status = case when p_accept then 'accepted' else 'revoked' end
  where id = p_link_id and patient_id = auth.uid() and status = 'pending';

  if not found then
    raise exception 'Request not found.';
  end if;
end;
$$;

revoke all on function public.request_caregiver_link(text) from public;
revoke all on function public.my_caregiver_requests() from public;
revoke all on function public.respond_caregiver_link(uuid, boolean) from public;
grant execute on function public.request_caregiver_link(text) to authenticated;
grant execute on function public.my_caregiver_requests() to authenticated;
grant execute on function public.respond_caregiver_link(uuid, boolean) to authenticated;