-- Bug fix: HR-added job qualifications never showed their CLO + weight (%) on the
-- student "Analisis Kompetensi" breakdown, and were excluded from the overall
-- match score.
--
-- Root cause: req_best_clo (requirement -> nearest CLO + similarity) was a
-- MATERIALIZED VIEW that only updated on a manual `REFRESH`. The breakdown RPC
-- (student_job_match_breakdown) and score RPC (student_job_matches) INNER JOIN
-- it, so requirements added after the last refresh had no row and were dropped.
--
-- Fix: turn req_best_clo into a real table maintained incrementally by a trigger,
-- so every requirement gets its mapping the moment it's inserted / re-embedded —
-- no manual refresh, no staleness.
--
-- NOTE: already applied to the remote project via MCP (migration version
-- 20260621144015). Kept here so the repo history matches the database.

-- 1. Replace the matview with a table of identical shape, populated by the
--    matview's own defining query.
drop materialized view if exists public.req_best_clo;

create table public.req_best_clo (
  requirement_id uuid primary key,
  job_id         uuid,
  best_clo_id    uuid,
  sim            numeric
);

insert into public.req_best_clo (requirement_id, job_id, best_clo_id, sim)
select r.id, r.job_id, nn.id, (1 - (r.embedding <=> nn.embedding))::numeric
from public.requirements r
cross join lateral (
  select c.id, c.embedding
  from public.clos c
  where c.embedding is not null
  order by r.embedding <=> c.embedding
  limit 1
) nn
where r.embedding is not null;

-- 2. Indexes mirroring the old matview + FK cascade so editing a job
--    (delete + reinsert of its requirements) auto-removes stale rows.
create index req_best_clo_job_idx on public.req_best_clo (job_id);
create index req_best_clo_clo_idx on public.req_best_clo (best_clo_id);
alter table public.req_best_clo
  add constraint req_best_clo_requirement_id_fkey
  foreign key (requirement_id) references public.requirements(id) on delete cascade;

-- 3. Access: clients read only; all writes go through the definer trigger.
alter table public.req_best_clo enable row level security;
create policy req_best_clo_read on public.req_best_clo
  for select to anon, authenticated using (true);
grant select on public.req_best_clo to anon, authenticated;
grant all    on public.req_best_clo to service_role;

-- 4. Incremental maintenance: on insert / embedding change, recompute just that
--    one requirement's nearest CLO (~157 vector ops) and upsert it.
create or replace function public.refresh_req_best_clo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_best_clo_id uuid;
  v_distance double precision;
begin
  if new.embedding is null then
    return new;
  end if;

  select c.id, (new.embedding <=> c.embedding)
    into v_best_clo_id, v_distance
  from public.clos c
  where c.embedding is not null
  order by new.embedding <=> c.embedding
  limit 1;

  if v_best_clo_id is null then
    return new;
  end if;

  insert into public.req_best_clo (requirement_id, job_id, best_clo_id, sim)
  values (new.id, new.job_id, v_best_clo_id, round((1 - v_distance)::numeric, 6))
  on conflict (requirement_id) do update
    set job_id      = excluded.job_id,
        best_clo_id = excluded.best_clo_id,
        sim         = excluded.sim;

  return new;
end;
$$;

drop trigger if exists trg_refresh_req_best_clo on public.requirements;
create trigger trg_refresh_req_best_clo
after insert or update of embedding on public.requirements
for each row
execute function public.refresh_req_best_clo();

-- It's a trigger function, not an API endpoint — don't expose it as an RPC.
-- (The trigger still fires; trigger execution doesn't require EXECUTE.)
revoke execute on function public.refresh_req_best_clo() from public, anon, authenticated;
