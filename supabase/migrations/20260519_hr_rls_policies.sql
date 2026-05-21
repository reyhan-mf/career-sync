-- Row-Level Security policies for HR (recruiter) users.
--
-- Why this exists: the `register-hr` Edge Function inserts into
-- `hr_profiles`, `companies`, and `user_roles` using the service role
-- (bypasses RLS). After login the same user reads these tables with the
-- `authenticated` role. Without these policies their own rows are
-- invisible, the HR dashboard sees null data, and the dashboard reports
-- HR[05] ("Akun HR Anda belum ditautkan ke perusahaan").
--
-- Run this in Supabase Dashboard -> SQL Editor (one-time).

-- ────────────────────────────────────────────────────────────────────
-- Helper functions (SECURITY DEFINER) — used by the policies below so
-- they can reference the caller's hr_profiles row without triggering an
-- RLS recursion.
-- ────────────────────────────────────────────────────────────────────

create or replace function public.current_hr_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.hr_profiles where user_id = auth.uid() limit 1;
$$;

create or replace function public.current_hr_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.hr_profiles where user_id = auth.uid() limit 1;
$$;

grant execute on function public.current_hr_id()         to authenticated;
grant execute on function public.current_hr_company_id() to authenticated;
revoke execute on function public.current_hr_id()         from anon;
revoke execute on function public.current_hr_company_id() from anon;

-- ────────────────────────────────────────────────────────────────────
-- Enable RLS (no-op if already on)
-- ────────────────────────────────────────────────────────────────────

alter table public.hr_profiles        enable row level security;
alter table public.companies          enable row level security;
alter table public.jobs               enable row level security;
alter table public.job_skills         enable row level security;
alter table public.requirements       enable row level security;
alter table public.applications       enable row level security;
alter table public.talent_invitations enable row level security;
alter table public.students           enable row level security;
alter table public.student_clos       enable row level security;

-- ────────────────────────────────────────────────────────────────────
-- hr_profiles: read + update own row
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "hr_select_own_profile" on public.hr_profiles;
create policy "hr_select_own_profile" on public.hr_profiles
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "hr_update_own_profile" on public.hr_profiles;
create policy "hr_update_own_profile" on public.hr_profiles
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────
-- companies: HR reads + updates their own company. Anyone authenticated
-- can read any company (useful when students view a job's company info).
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "authn_read_companies" on public.companies;
create policy "authn_read_companies" on public.companies
  for select to authenticated
  using (true);

drop policy if exists "hr_update_own_company" on public.companies;
create policy "hr_update_own_company" on public.companies
  for update to authenticated
  using (id = public.current_hr_company_id())
  with check (id = public.current_hr_company_id());

-- ────────────────────────────────────────────────────────────────────
-- jobs: HR full CRUD on their own jobs; everyone authenticated can read
-- active jobs (so students can browse).
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "hr_crud_own_jobs" on public.jobs;
create policy "hr_crud_own_jobs" on public.jobs
  for all to authenticated
  using (hr_id = public.current_hr_id())
  with check (hr_id = public.current_hr_id());

drop policy if exists "authn_read_active_jobs" on public.jobs;
create policy "authn_read_active_jobs" on public.jobs
  for select to authenticated
  using (status in ('active', 'closing'));

-- ────────────────────────────────────────────────────────────────────
-- job_skills + requirements: same access surface as the linked job
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "hr_crud_own_job_skills" on public.job_skills;
create policy "hr_crud_own_job_skills" on public.job_skills
  for all to authenticated
  using (job_id in (select id from public.jobs where hr_id = public.current_hr_id()))
  with check (job_id in (select id from public.jobs where hr_id = public.current_hr_id()));

drop policy if exists "authn_read_active_job_skills" on public.job_skills;
create policy "authn_read_active_job_skills" on public.job_skills
  for select to authenticated
  using (job_id in (select id from public.jobs where status in ('active','closing')));

drop policy if exists "hr_crud_own_requirements" on public.requirements;
create policy "hr_crud_own_requirements" on public.requirements
  for all to authenticated
  using (job_id in (select id from public.jobs where hr_id = public.current_hr_id()))
  with check (job_id in (select id from public.jobs where hr_id = public.current_hr_id()));

drop policy if exists "authn_read_active_requirements" on public.requirements;
create policy "authn_read_active_requirements" on public.requirements
  for select to authenticated
  using (job_id in (select id from public.jobs where status in ('active','closing')));

-- ────────────────────────────────────────────────────────────────────
-- applications: HR reads + updates applications to their own jobs.
-- Students manage their own applications (separate policy below).
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "hr_read_own_applications" on public.applications;
create policy "hr_read_own_applications" on public.applications
  for select to authenticated
  using (job_id in (select id from public.jobs where hr_id = public.current_hr_id()));

drop policy if exists "hr_update_own_applications" on public.applications;
create policy "hr_update_own_applications" on public.applications
  for update to authenticated
  using (job_id in (select id from public.jobs where hr_id = public.current_hr_id()))
  with check (job_id in (select id from public.jobs where hr_id = public.current_hr_id()));

drop policy if exists "student_manage_own_applications" on public.applications;
create policy "student_manage_own_applications" on public.applications
  for all to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()))
  with check (student_id in (select id from public.students where user_id = auth.uid()));

-- ────────────────────────────────────────────────────────────────────
-- talent_invitations: HR full CRUD on their own invitations. Students
-- see invitations addressed to them.
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "hr_crud_own_invitations" on public.talent_invitations;
create policy "hr_crud_own_invitations" on public.talent_invitations
  for all to authenticated
  using (hr_id = public.current_hr_id())
  with check (hr_id = public.current_hr_id());

drop policy if exists "student_read_own_invitations" on public.talent_invitations;
create policy "student_read_own_invitations" on public.talent_invitations
  for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()));

-- ────────────────────────────────────────────────────────────────────
-- students: HR can read all (for talent pool); each student can read
-- their own row. Admins are handled by their own policies elsewhere.
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "hr_read_students" on public.students;
create policy "hr_read_students" on public.students
  for select to authenticated
  using (public.current_hr_id() is not null);

drop policy if exists "student_read_self" on public.students;
create policy "student_read_self" on public.students
  for select to authenticated
  using (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────
-- student_clos: same shape — HR reads all for match scoring; student
-- reads their own grades.
-- ────────────────────────────────────────────────────────────────────

drop policy if exists "hr_read_student_clos" on public.student_clos;
create policy "hr_read_student_clos" on public.student_clos
  for select to authenticated
  using (public.current_hr_id() is not null);

drop policy if exists "student_read_own_clos" on public.student_clos;
create policy "student_read_own_clos" on public.student_clos
  for select to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()));

-- ────────────────────────────────────────────────────────────────────
-- Sanity check: list the policies we just installed.
-- ────────────────────────────────────────────────────────────────────
select schemaname, tablename, policyname
from pg_policies
where schemaname = 'public'
  and policyname in (
    'hr_select_own_profile',
    'hr_update_own_profile',
    'authn_read_companies',
    'hr_update_own_company',
    'hr_crud_own_jobs',
    'authn_read_active_jobs',
    'hr_crud_own_job_skills',
    'authn_read_active_job_skills',
    'hr_crud_own_requirements',
    'authn_read_active_requirements',
    'hr_read_own_applications',
    'hr_update_own_applications',
    'student_manage_own_applications',
    'hr_crud_own_invitations',
    'student_read_own_invitations',
    'hr_read_students',
    'student_read_self',
    'hr_read_student_clos',
    'student_read_own_clos'
  )
order by tablename, policyname;
