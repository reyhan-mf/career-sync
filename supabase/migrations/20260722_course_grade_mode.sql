-- Mode penilaian: nilai per CLO vs nilai per mata kuliah.
--
-- Latar: dalam praktik OBE setiap prodi punya rumusan CLO/CPMK di kurikulumnya,
-- tetapi tidak semua kampus MEREKAM NILAI mahasiswa di level CLO — banyak yang
-- hanya menyimpan nilai akhir per mata kuliah. Sistem ini semula mengunci nilai
-- di `student_clos`, sehingga kampus tipe kedua tidak bisa memakainya.
--
-- Yang berubah HANYA sumber angka nilainya, bukan cara pencocokannya:
--
--   mode 'clo'    : skor = avg( sim(req, CLO_terdekat) × nilai_CLO    / 100 ) × 100
--   mode 'course' : skor = avg( sim(req, CLO_terdekat) × nilai_MATKUL / 100 ) × 100
--
-- Similarity tetap datang dari embedding teks CLO lewat `req_best_clo` — tabel
-- itu dan trigger `refresh_req_best_clo` sama sekali tidak disentuh di sini.
--
-- Jalankan di Supabase Dashboard -> SQL Editor.

-- ─── 1. Flag mode di level prodi ─────────────────────────────────────────────
-- Ini fakta ketersediaan data institusi, bukan preferensi pengguna, jadi
-- tempatnya di `prodi` (sejajar dengan `integration_status`). Default 'clo'
-- membuat semua prodi yang sudah ada berperilaku persis seperti sebelumnya.

alter table public.prodi
  add column if not exists assessment_mode text not null default 'clo';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'prodi_assessment_mode_check'
  ) then
    alter table public.prodi
      add constraint prodi_assessment_mode_check
      check (assessment_mode in ('clo', 'course'));
  end if;
end
$$;

-- Admin prodi boleh mengubah mode penilaian prodinya sendiri (sebelumnya
-- `prodi` hanya bisa di-UPDATE superadmin). Cakupannya memang satu baris prodi
-- miliknya — kolom lain (name/fakultas) ikut bisa diubah, dan itu diterima.
drop policy if exists prodi_admin_update_own on public.prodi;
create policy prodi_admin_update_own on public.prodi
  for update to authenticated
  using      (public.is_admin() and id = public.current_admin_prodi_id())
  with check (public.is_admin() and id = public.current_admin_prodi_id());

-- ─── 2. Nilai akhir per mata kuliah ──────────────────────────────────────────
-- Diisi langsung oleh admin pada prodi ber-mode 'course'. Prodi ber-mode 'clo'
-- boleh membiarkannya kosong — view di bagian 3 menurunkan nilainya dari
-- rata-rata CLO.

create table if not exists public.student_matkul (
  student_id uuid not null references public.students(id) on delete cascade,
  matkul_id  uuid not null references public.matkul(id)   on delete cascade,
  grade      smallint check (grade is null or (grade >= 0 and grade <= 100)),
  primary key (student_id, matkul_id)
);

create index if not exists student_matkul_matkul_idx on public.student_matkul (matkul_id);

alter table public.student_matkul enable row level security;

-- Policy dicerminkan persis dari `student_clos` supaya hak akses nilai tidak
-- berbeda hanya karena granularitasnya berbeda.
drop policy if exists student_read_own_matkul on public.student_matkul;
create policy student_read_own_matkul on public.student_matkul
  for select to authenticated
  using (student_id in (select s.id from public.students s where s.user_id = auth.uid()));

drop policy if exists hr_read_student_matkul on public.student_matkul;
create policy hr_read_student_matkul on public.student_matkul
  for select to authenticated
  using (public.current_hr_id() is not null);

drop policy if exists student_matkul_admin_all on public.student_matkul;
create policy student_matkul_admin_all on public.student_matkul
  for all to authenticated
  using (
    public.is_superadmin()
    or (public.is_admin() and exists (
      select 1 from public.students s
      where s.id = student_matkul.student_id
        and s.prodi_id = public.current_admin_prodi_id()
    ))
  );

grant select, insert, update, delete on public.student_matkul to authenticated;
grant all on public.student_matkul to service_role;

-- ─── 3. Resolver nilai mata kuliah ───────────────────────────────────────────
-- Satu sumber kebenaran untuk kedua tipe prodi: baris eksplisit di
-- student_matkul menang; kalau tidak ada, nilai diturunkan dari rata-rata CLO
-- mahasiswa pada matkul tersebut. `source` dipakai UI untuk menandai mana yang
-- diinput langsung dan mana yang turunan.
--
-- security_invoker: view tunduk pada RLS tabel di bawahnya, sehingga mahasiswa
-- tetap hanya melihat nilainya sendiri dan HR melihat semua.

create or replace view public.student_course_grade
with (security_invoker = true) as
select distinct on (student_id, matkul_id)
  student_id, matkul_id, grade, source
from (
  select sm.student_id, sm.matkul_id, sm.grade::numeric as grade,
         'direct'::text as source, 1 as prio
    from public.student_matkul sm
   where sm.grade is not null

  union all

  select sc.student_id, c.matkul_id, round(avg(sc.grade))::numeric,
         'clo_avg'::text, 2
    from public.student_clos sc
    join public.clos c on c.id = sc.clo_id
   where sc.grade is not null
   group by sc.student_id, c.matkul_id
) t
order by student_id, matkul_id, prio;

grant select on public.student_course_grade to authenticated;

-- ─── 4. RPC pencocokan, digeneralisasi dengan p_mode ─────────────────────────
-- Ketiganya memakai pola yang sama: sim tetap dari req_best_clo, hanya suku
-- nilainya yang dipilih lewat p_mode. Signature lama di-drop dulu — menambah
-- argumen ber-default akan membuat overload ambigu bagi PostgREST, bukan
-- menggantikan fungsi lama.

drop function if exists public.student_job_matches(uuid, integer);
drop function if exists public.student_job_match_score(uuid, uuid);
drop function if exists public.student_job_match_breakdown(uuid, uuid);

-- Skor semua lowongan aktif untuk satu mahasiswa (dipakai daftar & ranking).
create or replace function public.student_job_matches(
  p_student_id uuid,
  p_limit      integer default 200,
  p_mode       text    default 'clo'
)
returns table(job_id uuid, score double precision)
language sql
stable
as $function$
  select rbc.job_id,
         round(avg(
           rbc.sim * coalesce(
             case when p_mode = 'course' then scg.grade else sc.grade::numeric end,
             0
           ) / 100.0
         ) * 100)::double precision as score
  from req_best_clo rbc
  join jobs j on j.id = rbc.job_id and j.status = 'active'
  left join clos c on c.id = rbc.best_clo_id
  left join student_clos sc
    on sc.clo_id = rbc.best_clo_id
   and sc.student_id = p_student_id
  left join student_course_grade scg
    on scg.matkul_id = c.matkul_id
   and scg.student_id = p_student_id
  group by rbc.job_id
  order by score desc
  limit p_limit;
$function$;

-- Skor satu pasangan (mahasiswa, lowongan).
create or replace function public.student_job_match_score(
  p_student_id uuid,
  p_job_id     uuid,
  p_mode       text default 'clo'
)
returns double precision
language sql
stable
as $function$
  select coalesce(
    round(avg(
      rbc.sim * coalesce(
        case when p_mode = 'course' then scg.grade else sc.grade::numeric end,
        0
      ) / 100.0
    ) * 100),
    0
  )::double precision
  from req_best_clo rbc
  left join clos c on c.id = rbc.best_clo_id
  left join student_clos sc
    on sc.clo_id = rbc.best_clo_id
   and sc.student_id = p_student_id
  left join student_course_grade scg
    on scg.matkul_id = c.matkul_id
   and scg.student_id = p_student_id
  where rbc.job_id = p_job_id;
$function$;

-- Rincian per kualifikasi: CLO mana yang cocok, nilainya berapa (kedua basis
-- dikembalikan sekaligus supaya UI bisa menampilkan keduanya), dan kontribusinya
-- terhadap skor akhir mengikuti p_mode.
create or replace function public.student_job_match_breakdown(
  p_student_id uuid,
  p_job_id     uuid,
  p_mode       text default 'clo'
)
returns table(
  requirement_id uuid,
  req_text       text,
  req_position   integer,
  similarity     double precision,
  best_clo_id    uuid,
  clo_code       text,
  clo_text       text,
  matkul_id      uuid,
  matkul_nama    text,
  grade          smallint,
  course_grade   numeric,
  grade_source   text,
  contribution   double precision
)
language sql
stable
as $function$
  select
    r.id,
    r.req_text,
    r.position,
    rbc.sim::double precision,
    rbc.best_clo_id,
    c.clo_code,
    c.clo_text,
    c.matkul_id,
    m.nama,
    sc.grade,
    scg.grade,
    scg.source,
    round(
      rbc.sim * coalesce(
        case when p_mode = 'course' then scg.grade else sc.grade::numeric end,
        0
      ) / 100.0 * 100
    )::double precision
  from requirements r
  join req_best_clo rbc on rbc.requirement_id = r.id
  left join clos c on c.id = rbc.best_clo_id
  left join matkul m on m.id = c.matkul_id
  left join student_clos sc
    on sc.clo_id = rbc.best_clo_id and sc.student_id = p_student_id
  left join student_course_grade scg
    on scg.matkul_id = c.matkul_id and scg.student_id = p_student_id
  where r.job_id = p_job_id
  order by r.position, r.id;
$function$;

-- ─── 5. Realtime untuk student_matkul ────────────────────────────────────────
-- Mengikuti pola 20260518_enable_realtime.sql: REPLICA IDENTITY FULL supaya
-- payload UPDATE/DELETE membawa baris lama, lalu daftarkan ke publication
-- (idempoten, aman dijalankan ulang).

alter table public.student_matkul replica identity full;

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'student_matkul'
  ) then
    alter publication supabase_realtime add table public.student_matkul;
  end if;
end
$$;

-- ─── 6. Muat ulang skema PostgREST ───────────────────────────────────────────
notify pgrst, 'reload schema';
