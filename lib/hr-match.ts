// Match scoring + display helpers for HR pages.
//
// IMPORTANT: the HR-side score MUST equal what the student sees on their own
// pages, otherwise the same (student, job) pair shows two different numbers.
// The student score comes from the Postgres RPC `student_job_matches`:
//
//   round( avg( sim * grade / 100 ) * 100 )   over a job's requirements
//
// where `sim` is each requirement's cosine similarity to its nearest CLO
// (the req_best_clo table) and `grade` is the student's 0-100 grade (a missing
// grade counts as 0). We reproduce that exact formula here from the same
// req_best_clo rows + grades, so the talent pool / dashboard never diverge
// from the student job pages.
//
// The RPC takes a `p_mode` argument that selects WHICH grade weights `sim`:
//
//   'clo'    → the student's grade on the matched CLO        (student_clos)
//   'course' → the final grade of the matkul owning that CLO (student_matkul,
//              or the CLO average — resolved by the student_course_grade view)
//
// The similarity term is identical in both. `matchScoreFromRbc` mirrors both
// branches, so the invariant above holds per mode as well — see the `basis`
// option below.

import type {
  JobWithSkills,
  ReqBestCloRow,
  TalentCLOGrade,
  TalentCourseGrade,
} from "@/lib/supabase/hr-queries";
import type { AssessmentMode } from "@/lib/supabase/superadmin-queries";

// cloId -> grade (0-100) for one student. Non-numeric grades are omitted and
// treated as 0 by the scorer.
export function gradesByCloId(grades: TalentCLOGrade[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of grades) {
    if (typeof g.grade === "number") m.set(g.clo_id, g.grade);
  }
  return m;
}

// matkulId -> final course grade (0-100) for one student.
export function gradesByMatkulId(grades: TalentCourseGrade[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const g of grades) {
    if (Number.isFinite(g.grade)) m.set(g.matkul_id, g.grade);
  }
  return m;
}

// Everything needed to score on the 'course' basis: the student's per-matkul
// grades plus the clo→matkul lookup that maps a req_best_clo row onto one.
export interface CourseBasis {
  basis: Extract<AssessmentMode, "course">;
  gradeByMatkul: Map<string, number>;
  cloToMatkul: Record<string, string>;
}

// studentId -> (matkulId -> grade). Built once per page from the flat view rows.
export function courseGradeMapsByStudent(
  rows: TalentCourseGrade[],
): Map<string, Map<string, number>> {
  const m = new Map<string, Map<string, number>>();
  for (const r of rows) {
    if (!Number.isFinite(r.grade)) continue;
    const inner = m.get(r.student_id) ?? new Map<string, number>();
    inner.set(r.matkul_id, r.grade);
    m.set(r.student_id, inner);
  }
  return m;
}

/**
 * The basis a student's prodi records grades on — the default for that student.
 */
export function assessmentModeOf(
  prodiId: string | null | undefined,
  prodiModes: Record<string, { assessment_mode: AssessmentMode }>,
): AssessmentMode {
  if (!prodiId) return "clo";
  return prodiModes[prodiId]?.assessment_mode ?? "clo";
}

/**
 * What HR asked the list to be scored on. "auto" keeps every student on their
 * own prodi's basis; the other two apply one basis to the whole list.
 */
export type HrGradeBasis = "auto" | AssessmentMode;

export interface ResolvedBasis {
  /** The basis actually used for this student. */
  mode: AssessmentMode;
  /** Pass to matchScoreFromRbc; undefined when `mode` is 'clo'. */
  course?: CourseBasis;
  /** True when the request was overridden because the data isn't there. */
  fellBack: boolean;
}

/**
 * Resolve one student's scoring basis under an HR-selected override.
 *
 * The course basis is always available — `student_course_grade` derives a
 * per-matkul grade from the CLO average when a prodi has no direct entries.
 * The CLO basis is NOT: a prodi that only records final course grades has no
 * `student_clos` rows at all, and forcing it would score those students 0 and
 * drop them out of the ranking entirely. So a forced 'clo' falls back to the
 * student's own prodi basis, and `fellBack` lets the UI say so.
 */
export function resolveTalentBasis(
  studentId: string,
  prodiId: string | null | undefined,
  prodiModes: Record<string, { assessment_mode: AssessmentMode }>,
  gradeMaps: Map<string, Map<string, number>>,
  cloToMatkul: Record<string, string>,
  requested: HrGradeBasis = "auto",
  hasCloGrades = true,
): ResolvedBasis {
  const prodiMode = assessmentModeOf(prodiId, prodiModes);
  let mode: AssessmentMode;
  let fellBack = false;
  if (requested === "auto") {
    mode = prodiMode;
  } else if (requested === "clo") {
    mode = hasCloGrades ? "clo" : prodiMode;
    fellBack = !hasCloGrades && mode !== "clo";
  } else {
    mode = "course";
  }
  return {
    mode,
    course:
      mode === "course"
        ? {
            basis: "course",
            gradeByMatkul: gradeMaps.get(studentId) ?? new Map(),
            cloToMatkul,
          }
        : undefined,
    fellBack,
  };
}

/**
 * Build the `course` argument of `matchScoreFromRbc` for one student on their
 * prodi's own basis, or undefined when that basis is CLO.
 */
export function courseBasisFor(
  studentId: string,
  prodiId: string | null | undefined,
  prodiModes: Record<string, { assessment_mode: AssessmentMode }>,
  gradeMaps: Map<string, Map<string, number>>,
  cloToMatkul: Record<string, string>,
): CourseBasis | undefined {
  return resolveTalentBasis(studentId, prodiId, prodiModes, gradeMaps, cloToMatkul)
    .course;
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
//
// Pass `course` to weight by the matkul's final grade instead of the CLO's;
// omit it for the default CLO basis.
export function matchScoreFromRbc(
  gradeByClo: Map<string, number>,
  rbcRows: ReqBestCloRow[],
  course?: CourseBasis,
): number | null {
  if (rbcRows.length === 0) return null;
  let sum = 0;
  for (const r of rbcRows) {
    let grade = 0;
    if (r.best_clo_id) {
      if (course) {
        // Same two hops the RPC makes: req → best CLO → its matkul → grade.
        const matkulId = course.cloToMatkul[r.best_clo_id];
        grade = matkulId ? course.gradeByMatkul.get(matkulId) ?? 0 : 0;
      } else {
        grade = gradeByClo.get(r.best_clo_id) ?? 0;
      }
    }
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
  course?: CourseBasis,
): { job: JobWithSkills; score: number } | null {
  let best: { job: JobWithSkills; score: number } | null = null;
  for (const j of jobs) {
    const score = matchScoreFromRbc(gradeByClo, rbcByJob.get(j.id) ?? [], course);
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
