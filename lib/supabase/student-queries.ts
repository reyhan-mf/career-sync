import { supabase } from "./client";
import type { CLO, Matkul, Student, StudentCLO } from "./admin-queries";

export interface StudentProfile {
  student: Student;
  prodi: { id: string; name: string; fakultas: string | null } | null;
}

export interface CourseRecord {
  matkul: Matkul;
  clos: (CLO & { grade: string | null })[];
}

/**
 * Resolve the current logged-in student's row + their prodi. Throws when the
 * user is authenticated but no `students` row is linked to their auth id.
 */
export async function getCurrentStudentProfile(): Promise<StudentProfile> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Tidak ada sesi.");

  const { data, error } = await supabase
    .from("students")
    .select(`*, prodi:prodi_id ( id, name, fakultas )`)
    .eq("user_id", session.user.id)
    .maybeSingle();
  if (error) throw error;
  if (!data) {
    throw new Error("Akun Anda belum ditautkan ke data mahasiswa.");
  }

  const { prodi, ...student } = data as Student & {
    prodi: { id: string; name: string; fakultas: string | null } | null;
  };
  return { student: student as Student, prodi };
}

/**
 * Returns the matkul + CLO + grade transcript for the student. Only matkul
 * from the student's prodi are included. CLOs without a grade for this
 * student show grade=null.
 */
export async function getStudentTranscript(
  studentId: string,
  prodiId: string | null,
): Promise<CourseRecord[]> {
  // 1. matkul scoped to student's prodi
  let mq = supabase.from("matkul").select("*").order("semester").order("kode");
  if (prodiId) mq = mq.eq("prodi_id", prodiId);
  const { data: matkulRows, error: matkulErr } = await mq;
  if (matkulErr) throw matkulErr;
  const matkul = (matkulRows ?? []) as Matkul[];
  if (matkul.length === 0) return [];

  const matkulIds = matkul.map((m) => m.id);

  // 2. CLOs for those matkul
  const { data: closRows, error: closErr } = await supabase
    .from("clos")
    .select("id, matkul_id, clo_code, clo_text")
    .in("matkul_id", matkulIds)
    .order("clo_code");
  if (closErr) throw closErr;
  const clos = (closRows ?? []) as CLO[];

  // 3. Grades for this student across those CLOs
  const cloIds = clos.map((c) => c.id);
  let studentClos: StudentCLO[] = [];
  if (cloIds.length > 0) {
    const { data: scRows, error: scErr } = await supabase
      .from("student_clos")
      .select("student_id, clo_id, grade")
      .eq("student_id", studentId)
      .in("clo_id", cloIds);
    if (scErr) throw scErr;
    studentClos = (scRows ?? []) as StudentCLO[];
  }

  // 4. Assemble records — group CLOs by matkul, attach grade
  const gradeByClo = new Map(studentClos.map((sc) => [sc.clo_id, sc.grade]));
  const closByMatkul = new Map<string, (CLO & { grade: string | null })[]>();
  clos.forEach((c) => {
    const list = closByMatkul.get(c.matkul_id) ?? [];
    list.push({ ...c, grade: gradeByClo.get(c.id) ?? null });
    closByMatkul.set(c.matkul_id, list);
  });

  return matkul.map((mk) => ({
    matkul: mk,
    clos: closByMatkul.get(mk.id) ?? [],
  }));
}

// ─── Job listings (read-only for students) ─────────────────────────────────

export interface JobListing {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  category: string | null;
  salary: string | null;
  description: string | null;
  posted_at: string | null;
  deadline: string | null;
  job_skills: { skill: string }[];
}

export async function getActiveJobs(): Promise<JobListing[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select(`id, title, location, job_type, category, salary, description, posted_at, deadline, job_skills ( skill )`)
    .eq("status", "active")
    .order("posted_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as JobListing[];
}

// ─── Student's own applications ────────────────────────────────────────────

export interface StudentApplication {
  id: string;
  job_id: string | null;
  match_score: number | null;
  status: string;
  applied_at: string | null;
  jobs: { title: string; company_id: string | null } | null;
}

export async function getMyApplications(studentId: string): Promise<StudentApplication[]> {
  const { data, error } = await supabase
    .from("applications")
    .select(`id, job_id, match_score, status, applied_at, jobs ( title, company_id )`)
    .eq("student_id", studentId)
    .order("applied_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StudentApplication[];
}

// ─── Single job detail (for /student/jobs/[id]) ────────────────────────────

export interface JobDetail {
  id: string;
  title: string;
  location: string | null;
  job_type: string | null;
  category: string | null;
  salary: string | null;
  description: string | null;
  posted_at: string | null;
  deadline: string | null;
  status: string;
  company: {
    id: string;
    name: string;
    location: string | null;
    industry: string | null;
    logo_icon: string | null;
  } | null;
  job_skills: { skill: string }[];
  requirements: { id: string; req_text: string; position: number }[];
}

export async function getJobById(jobId: string): Promise<JobDetail | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select(
      `id, title, location, job_type, category, salary, description, posted_at, deadline, status,
       company:company_id ( id, name, location, industry, logo_icon ),
       job_skills ( skill ),
       requirements ( id, req_text, position )`
    )
    .eq("id", jobId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const detail = data as unknown as JobDetail;
  detail.requirements = [...(detail.requirements ?? [])].sort(
    (a, b) => a.position - b.position,
  );
  return detail;
}
