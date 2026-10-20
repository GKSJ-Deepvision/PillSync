-- PillSync: admin analytics summary (read-only, aggregate numbers only)
-- Admins cannot read individual dose_logs rows; this function returns only totals.

create or replace function public.admin_platform_summary(p_days int default 30)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_from timestamptz;
  v_result jsonb;
begin
  if public.current_user_role() is distinct from 'admin'::user_role then
    raise exception 'Admins only.';
  end if;

  v_from := date_trunc('day', now()) - make_interval(days => greatest(p_days, 1) - 1);

  with logs as (
    select (scheduled_for at time zone 'Asia/Kolkata')::date as day, status
    from public.dose_logs
    where scheduled_for >= v_from and scheduled_for <= now()
  ),
  daily as (
    select day,
           count(*) filter (where status = 'taken')  as taken,
           count(*) filter (where status = 'missed') as missed
    from logs
    group by day
  )
  select jsonb_build_object(
    'taken',  (select coalesce(sum(taken), 0)  from daily),
    'missed', (select coalesce(sum(missed), 0) from daily),
    'daily',  coalesce(
                (select jsonb_agg(jsonb_build_object('day', day, 'taken', taken, 'missed', missed) order by day)
                 from daily),
                '[]'::jsonb)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_platform_summary(int) from public;
grant execute on function public.admin_platform_summary(int) to authenticated;