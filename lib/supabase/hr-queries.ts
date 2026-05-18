import { supabase } from "./client";

// ─── Types ────────────────────────────────────────────────────────────────────

export type JobStatus = "processing" | "active" | "closing" | "closed" | "draft";
export type JobType = "Full-time" | "Part-time" | "Internship" | "Contract";
export type ApplicationStatus = "new" | "reviewed" | "interview" | "accepted" | "rejected";

export interface Job {
  id: string;
  hr_id: string | null;
  company_id: string | null;
  title: string;
  location: string | null;
  job_type: JobType | null;
  description: string | null;
  status: JobStatus;
  salary: string | null;
  category: string | null;
  posted_at: string | null;
  deadline: string | null;
  closed_at: string | null;
}

export interface JobWithSkills extends Job {
  job_skills: { skill: string }[];
  requirements: { id: string; req_text: string; position: number }[];
}

export interface Application {
  id: string;
  student_id: string | null;
  job_id: string | null;
  match_score: number | null;
  status: ApplicationStatus;
  applied_at: string | null;
  updated_at: string | null;
}

export interface ApplicationWithDetails extends Application {
  students: { nim: string; name: string; angkatan: number | null; prodi_id: string | null } | null;
  jobs: { title: string; company_id: string | null } | null;
}

// ─── Jobs ─────────────────────────────────────────────────────────────────────

export async function getJobs(hrId?: string) {
  let q = supabase
    .from("jobs")
    .select(`*, job_skills ( skill ), requirements ( id, req_text, position )`)
    .order("posted_at", { ascending: false });
  if (hrId) q = q.eq("hr_id", hrId);
  const { data, error } = await q;
  if (error) throw error;
  return data as JobWithSkills[];
}

export async function createJob(
  job: Omit<Job, "id" | "posted_at" | "closed_at">,
  skills: string[],
  qualifications: string[],
) {
  const { data: newJob, error: jobErr } = await supabase
    .from("jobs")
    .insert({
      hr_id: job.hr_id,
      company_id: job.company_id,
      title: job.title,
      location: job.location,
      job_type: job.job_type,
      description: job.description,
      status: job.status,
      salary: job.salary,
      category: job.category,
      deadline: job.deadline,
    })
    .select()
    .single();
  if (jobErr) throw jobErr;

  if (skills.length) {
    const { error: skillErr } = await supabase
      .from("job_skills")
      .insert(skills.map((skill) => ({ job_id: newJob.id, skill })));
    if (skillErr) throw skillErr;
  }

  if (qualifications.length) {
    const { error: reqErr } = await supabase
      .from("requirements")
      .insert(
        qualifications.map((req_text, i) => ({
          job_id: newJob.id,
          req_text,
          position: i,
        })),
      );
    if (reqErr) throw reqErr;
  }

  return newJob as Job;
}

export async function updateJob(
  id: string,
  job: Partial<Omit<Job, "id" | "posted_at" | "closed_at">>,
  skills?: string[],
  qualifications?: string[],
) {
  const { data, error } = await supabase
    .from("jobs")
    .update(job)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;

  if (skills !== undefined) {
    await supabase.from("job_skills").delete().eq("job_id", id);
    if (skills.length) {
      const { error: skillErr } = await supabase
        .from("job_skills")
        .insert(skills.map((skill) => ({ job_id: id, skill })));
      if (skillErr) throw skillErr;
    }
  }

  if (qualifications !== undefined) {
    await supabase.from("requirements").delete().eq("job_id", id);
    if (qualifications.length) {
      const { error: reqErr } = await supabase
        .from("requirements")
        .insert(
          qualifications.map((req_text, i) => ({
            job_id: id,
            req_text,
            position: i,
          })),
        );
      if (reqErr) throw reqErr;
    }
  }

  return data as Job;
}

export async function deleteJob(id: string) {
  await supabase.from("job_skills").delete().eq("job_id", id);
  await supabase.from("requirements").delete().eq("job_id", id);
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

// ─── Applications ─────────────────────────────────────────────────────────────

export async function getApplications(jobId?: string) {
  let q = supabase
    .from("applications")
    .select(`*, students ( nim, name, angkatan, prodi_id ), jobs ( title, company_id )`)
    .order("applied_at", { ascending: false });
  if (jobId) q = q.eq("job_id", jobId);
  const { data, error } = await q;
  if (error) throw error;
  return data as ApplicationWithDetails[];
}

export async function updateApplicationStatus(id: string, status: ApplicationStatus) {
  const { error } = await supabase
    .from("applications")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

// ─── Talent Invitations ───────────────────────────────────────────────────────

export async function getTalentPool() {
  const { data, error } = await supabase
    .from("students")
    .select(`
      id, nim, name, angkatan, prodi_id,
      talent_invitations ( id, status, job_id )
    `)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function inviteTalent(hrId: string, studentId: string, jobId: string) {
  const { error } = await supabase
    .from("talent_invitations")
    .insert({ hr_id: hrId, student_id: studentId, job_id: jobId, status: "invited" });
  if (error) throw error;
}
