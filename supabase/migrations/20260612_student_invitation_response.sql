-- Lets a student accept/decline a talent invitation addressed to them.
--
-- Why this exists: the HR RLS migration (20260519_hr_rls_policies.sql) gave
-- students a SELECT policy on talent_invitations ("student_read_own_invitations")
-- so they can see invitations, but no UPDATE policy. Without this, the student
-- "Terima / Tolak Undangan" action fails silently under RLS (0 rows updated).
--
-- The student app sets status to 'responded' (accept) or 'declined' (reject)
-- and stamps responded_at — see lib/supabase/invitation-queries.respondToInvitation.
-- HR reads the same vocabulary (InviteStatus in hr-queries.ts).
--
-- Run this in Supabase Dashboard -> SQL Editor (one-time).

alter table public.talent_invitations enable row level security;

drop policy if exists "student_respond_own_invitations" on public.talent_invitations;
create policy "student_respond_own_invitations" on public.talent_invitations
  for update to authenticated
  using (student_id in (select id from public.students where user_id = auth.uid()))
  with check (student_id in (select id from public.students where user_id = auth.uid()));

-- Sanity check.
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'talent_invitations'
order by policyname;
