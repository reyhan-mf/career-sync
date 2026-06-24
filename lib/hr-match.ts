// Match scoring + display helpers for HR pages.
//
// IMPORTANT: the HR-side score MUST equal what the student sees on their own
// pages, otherwise the same (student, job) pair shows two different numbers.
// The student score comes from the Postgres RPC `student_job_matches`:
//
//   round( avg( sim * grade / 100 ) * 100 )   over a job's requirements
//
// where `sim` is each requirement's cosine similarity to its nearest CLO
// (the req_best_clo table) and `grade` is the student's 0-100 grade on that CLO
// (a missing grade counts as 0). We reproduce that exact formula here from the
// same req_best_clo rows + grades, so the talent pool / dashboard never diverge
// from the student job pages.

import type {
  JobWithSkills,
  ReqBestCloRow,
  TalentCLOGrade,
} from "@/lib/supabase/hr-queries";

// cloId -> grade (0-100) for one student. Non-numeric grades are omitted and
// treated as 0 by the scorer.
export function gradesByCloId(grades: TalentCLOGrade[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of grades) {
    if (typeof g.grade === "number") m.set(g.clo_id, g.grade);
  }
  return m;
}

// requirement→best-CLO rows grouped by job id.
export function rbcByJobId(rows: ReqBestCloRow[]): Map<string, ReqBestCloRow[]> {
  const m = new Map<string, ReqBestCloRow[]>();
  for (const r of rows) {
    const list = m.get(r.job_id) ?? [];
    list.push(r);
    m.set(r.job_id, list);
  }
  return m;
}

// Score for one (student, job) pair, 0-100 — identical to the student-side
// `student_job_matches` RPC. Returns null when the job has no embedded
// requirements (no req_best_clo rows), mirroring the student list where such a
// job simply has no score yet.
export function matchScoreFromRbc(
  gradeByClo: Map<string, number>,
  rbcRows: ReqBestCloRow[],
): number | null {
  if (rbcRows.length === 0) return null;
  let sum = 0;
  for (const r of rbcRows) {
    const grade = r.best_clo_id ? gradeByClo.get(r.best_clo_id) ?? 0 : 0;
    sum += r.sim * (grade / 100);
  }
  return Math.round((sum / rbcRows.length) * 100);
}

// Find a student's best-matching job from `jobs`, using the same per-pair score
// as the student side. Returns null when no job yields a score.
export function bestMatchJob(
  gradeByClo: Map<string, number>,
  jobs: JobWithSkills[],
  rbcByJob: Map<string, ReqBestCloRow[]>,
): { job: JobWithSkills; score: number } | null {
  let best: { job: JobWithSkills; score: number } | null = null;
  for (const j of jobs) {
    const score = matchScoreFromRbc(gradeByClo, rbcByJob.get(j.id) ?? []);
    if (score == null) continue;
    if (!best || score > best.score) best = { job: j, score };
  }
  return best;
}

// Distinct skills extracted from CLO text whose grade ≥ 75 (~"B+" range on the
// old 4-scale). Used to give the HR a quick "what is this student strong at" hint.
export function studentSkills(grades: TalentCLOGrade[]): string[] {
  const out = new Set<string>();
  for (const g of grades) {
    if (typeof g.grade !== "number" || g.grade < 75) continue;
    const text = g.clos?.clo_text ?? "";
    text
      .split(/[^A-Za-z0-9+#.]+/)
      .filter((w) => /^[A-Z]/.test(w) || /\.(js|ts|py)$/i.test(w))
      .forEach((w) => out.add(w));
  }
  return [...out].slice(0, 8);
}
