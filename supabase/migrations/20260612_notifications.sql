-- In-app notifications: RLS, realtime, and server-side triggers that create a
-- notification row whenever a relevant event happens.
--
-- Why this exists: the `notifications` table existed but was empty and unwired.
-- The app (app/notifications/page.tsx + lib/supabase/notification-queries.ts)
-- now reads it live. Notifications are produced here in the database — never by
-- the client — so a recruiter/student can be notified about a row they are not
-- otherwise allowed to write. SECURITY DEFINER functions do the inserts.
--
-- Events covered:
--   * a student applies                -> notify the job's HR  ('new_application')
--   * HR changes an application status -> notify the student   ('application_status')
--   * HR invites a student             -> notify the student   ('talent_invitation')
--   * a student responds to an invite  -> notify the HR         ('invitation_response')
--
-- Run this in Supabase Dashboard -> SQL Editor (one-time).

-- ────────────────────────────────────────────────────────────────────
-- RLS: each user reads + updates (marks read) only their own rows.
-- ────────────────────────────────────────────────────────────────────

alter table public.notifications enable row level security;

drop policy if exists "user_read_own_notifications" on public.notifications;
create policy "user_read_own_notifications" on public.notifications
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "user_update_own_notifications" on public.notifications;
create policy "user_update_own_notifications" on public.notifications
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────
-- Realtime: full row payloads + add to the supabase_realtime publication.
-- ────────────────────────────────────────────────────────────────────

alter table public.notifications replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;
end
$$;

-- ────────────────────────────────────────────────────────────────────
-- Insert helper. Skips when the target user can't be resolved (null).
-- ────────────────────────────────────────────────────────────────────

create or replace function public.create_notification(
  p_user_id uuid,
  p_type text,
  p_payload jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null then
    return;
  end if;
  insert into public.notifications (user_id, type, payload)
  values (p_user_id, p_type, p_payload);
end;
$$;

-- ────────────────────────────────────────────────────────────────────
-- a. New application -> notify the job's HR.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.notify_hr_new_application()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hr_user uuid;
  v_title   text;
  v_student text;
begin
  select hp.user_id, j.title
    into v_hr_user, v_title
  from public.jobs j
  join public.hr_profiles hp on hp.id = j.hr_id
  where j.id = NEW.job_id;

  select name into v_student from public.students where id = NEW.student_id;

  perform public.create_notification(
    v_hr_user,
    'new_application',
    jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'job_title', v_title,
      'student_id', NEW.student_id,
      'student_name', v_student
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_hr_new_application on public.applications;
create trigger trg_notify_hr_new_application
  after insert on public.applications
  for each row execute function public.notify_hr_new_application();

-- ────────────────────────────────────────────────────────────────────
-- b. Application status change -> notify the student.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.notify_student_application_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_user uuid;
  v_title        text;
begin
  select user_id into v_student_user from public.students where id = NEW.student_id;
  select title   into v_title        from public.jobs     where id = NEW.job_id;

  perform public.create_notification(
    v_student_user,
    'application_status',
    jsonb_build_object(
      'application_id', NEW.id,
      'job_id', NEW.job_id,
      'job_title', v_title,
      'status', NEW.status
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_student_application_status on public.applications;
create trigger trg_notify_student_application_status
  after update of status on public.applications
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function public.notify_student_application_status();

-- ────────────────────────────────────────────────────────────────────
-- c. New talent invitation -> notify the student.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.notify_student_invitation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_user uuid;
  v_title        text;
  v_company      text;
begin
  select user_id into v_student_user from public.students where id = NEW.student_id;

  select j.title, c.name
    into v_title, v_company
  from public.jobs j
  left join public.companies c on c.id = j.company_id
  where j.id = NEW.job_id;

  perform public.create_notification(
    v_student_user,
    'talent_invitation',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'job_id', NEW.job_id,
      'job_title', v_title,
      'company_name', v_company
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_student_invitation on public.talent_invitations;
create trigger trg_notify_student_invitation
  after insert on public.talent_invitations
  for each row execute function public.notify_student_invitation();

-- ────────────────────────────────────────────────────────────────────
-- d. Invitation response (status change) -> notify the HR.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.notify_hr_invitation_response()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hr_user uuid;
  v_title   text;
  v_student text;
begin
  select user_id into v_hr_user from public.hr_profiles where id = NEW.hr_id;
  select title   into v_title   from public.jobs        where id = NEW.job_id;
  select name    into v_student from public.students    where id = NEW.student_id;

  perform public.create_notification(
    v_hr_user,
    'invitation_response',
    jsonb_build_object(
      'invitation_id', NEW.id,
      'job_id', NEW.job_id,
      'job_title', v_title,
      'status', NEW.status,
      'student_name', v_student
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trg_notify_hr_invitation_response on public.talent_invitations;
create trigger trg_notify_hr_invitation_response
  after update of status on public.talent_invitations
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function public.notify_hr_invitation_response();

-- ────────────────────────────────────────────────────────────────────
-- Permissions: authenticated clients only read/update via RLS; the insert
-- happens inside SECURITY DEFINER triggers, so no direct call is allowed.
-- Revoke from PUBLIC (not just anon/authenticated): CREATE FUNCTION grants
-- EXECUTE to PUBLIC by default, so revoking only from anon/authenticated
-- leaves them access via PUBLIC and the fn stays callable as /rpc/. Trigger
-- fns are revoked too so they aren't exposed as RPC either; triggers still
-- fire (trigger execution does not consult EXECUTE grants).
-- ────────────────────────────────────────────────────────────────────

revoke execute on function public.create_notification(uuid, text, jsonb) from public;
revoke execute on function public.notify_hr_new_application() from public;
revoke execute on function public.notify_student_application_status() from public;
revoke execute on function public.notify_student_invitation() from public;
revoke execute on function public.notify_hr_invitation_response() from public;

-- Sanity check: list the notification triggers.
select event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_name like 'trg_notify_%'
order by event_object_table, trigger_name;
