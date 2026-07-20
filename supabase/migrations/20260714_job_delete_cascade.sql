-- Deleting a job used to fail once anyone was invited or had applied:
-- talent_invitations.job_id and applications.job_id referenced jobs(id) with no
-- ON DELETE action, so Postgres raised a foreign-key violation (23503) that the
-- UI surfaced as the catch-all "HR[99]".
--
-- Worse, deleteJob() worked around the missing cascade by deleting children one
-- statement at a time (job_skills, then requirements, then jobs). With no
-- transaction, a job that had invitations lost its requirements and skills
-- BEFORE the final delete failed — a botched delete silently destroyed the
-- job's qualifications and left the job in place.
--
-- Give both child tables ON DELETE CASCADE so a single `DELETE FROM jobs` is
-- atomic and complete, and the app never has to hand-delete children.
--
-- Run in Supabase Dashboard -> SQL Editor.

ALTER TABLE public.talent_invitations
  DROP CONSTRAINT IF EXISTS talent_invitations_job_id_fkey;
ALTER TABLE public.talent_invitations
  ADD CONSTRAINT talent_invitations_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.applications
  DROP CONSTRAINT IF EXISTS applications_job_id_fkey;
ALTER TABLE public.applications
  ADD CONSTRAINT applications_job_id_fkey
  FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Verify: both should now report ON DELETE CASCADE.
SELECT rel.relname AS child_table,
       c.conname,
       pg_get_constraintdef(c.oid) AS def
FROM pg_constraint c
JOIN pg_class rel ON rel.oid = c.conrelid
JOIN pg_class ref ON ref.oid = c.confrelid
WHERE c.contype = 'f'
  AND ref.relname = 'jobs'
ORDER BY rel.relname;
