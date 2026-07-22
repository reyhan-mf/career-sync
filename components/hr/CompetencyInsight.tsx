"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReqMatchBreakdown } from "@/lib/supabase/student-queries";
import type { AssessmentMode } from "@/lib/supabase/superadmin-queries";

// Shared "Analisis Kompetensi" shown in the talent-pool and applicants modals:
// a per-requirement match of a student vs a job — which CLO each requirement
// maps to, the student's grade, and the grade-weighted contribution. Same RPC
// the student sees on /student/jobs/[id], so the numbers never diverge.
//
// The requirement is always matched to a CLO. `gradeBasis` only selects which
// grade weights that similarity: the CLO's own grade, or the final grade of the
// matkul owning it.

// Tailwind text-color for a 0-100 contribution score — mirrors the student
// job-detail page so HR sees the same color coding on the breakdown.
function scoreColor(score: number | null): string {
  if (score == null) return "text-on-surface-variant";
  if (score >= 85) return "text-green-600";
  if (score >= 70) return "text-primary";
  if (score >= 55) return "text-tertiary";
  return "text-error";
}

export interface CompetencyInsightProps {
  /** Job the analysis is computed against; when null the analysis is hidden. */
  jobTitle: string | null;
  breakdown: ReqMatchBreakdown[];
  loading: boolean;
  error: boolean;
  /**
   * Which grade produced `contribution` — must match the `mode` the breakdown
   * was fetched with, or the arithmetic shown to the user will not add up.
   */
  gradeBasis?: AssessmentMode;
}

// NOTE: render with a `key` tied to the student id so React remounts (and thus
// resets the expanded-rows state) when a different student is shown.
export default function CompetencyInsight({
  jobTitle,
  breakdown,
  loading,
  error,
  gradeBasis = "clo",
}: CompetencyInsightProps) {
  const isCourse = gradeBasis === "course";
  const gradeOf = (b: ReqMatchBreakdown) => (isCourse ? b.course_grade : b.grade);
  const [openReqs, setOpenReqs] = useState<Set<string>>(new Set());

  const toggleReq = (id: string) =>
    setOpenReqs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!jobTitle) return null;

  return (
    <div>
      <p className="font-label text-xs uppercase tracking-wider text-on-surface-variant mb-2">
        Analisis Kompetensi · {jobTitle}
      </p>
      {loading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded-xl" />
          ))}
        </div>
      )}
      {error && (
        <p className="font-body text-xs text-error">
          Gagal memuat analisis kompetensi.
        </p>
      )}
      {!loading && !error && breakdown.length === 0 && (
        <p className="font-body text-xs text-on-surface-variant">
          Belum ada data analisis kompetensi untuk lowongan ini.
        </p>
      )}
      {!loading && !error && breakdown.length > 0 && (
        <div className="space-y-2">
          {[...breakdown]
            .sort((a, b) => a.req_position - b.req_position)
            .map((b, idx) => {
              const reqKey = b.requirement_id;
              const isOpen = openReqs.has(reqKey);
              const hasClo = !!b.clo_code;
              const sim = Math.round(b.similarity * 100);
              return (
                <div
                  key={b.requirement_id}
                  className="rounded-xl bg-surface-container-low overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleReq(reqKey)}
                    aria-expanded={isOpen}
                    className="w-full text-left px-3 py-2.5 flex items-center gap-2 hover:bg-surface-container transition-colors"
                  >
                    <span className="font-label text-xs text-on-surface-variant shrink-0">
                      {idx + 1}.
                    </span>
                    <span className="flex-1 min-w-0 font-body text-xs font-semibold text-on-background">
                      {b.req_text}
                    </span>
                    <span
                      className={`font-label text-xs font-bold px-2 py-0.5 rounded bg-surface-container shrink-0 ${scoreColor(b.contribution)}`}
                    >
                      {b.contribution}%
                    </span>
                    <Icon
                      name="expand_more"
                      size={18}
                      className={`text-on-surface-variant shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-3 pb-3 pt-1">
                      {hasClo ? (
                        <table className="w-full border-collapse text-xs table-fixed">
                          <thead>
                            <tr className="border-b-2 border-outline-variant/40">
                              <th className="w-[30%] text-left font-label text-[10px] font-bold text-on-surface-variant px-2 py-1.5">
                                Matkul
                              </th>
                              <th className="w-[3.6rem] text-center font-label text-[10px] font-bold text-on-surface-variant px-2 py-1.5">
                                {isCourse ? "Nilai MK" : "Nilai CLO"}
                              </th>
                              <th className="text-left font-label text-[10px] font-bold text-on-surface-variant px-2 py-1.5">
                                CLO
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="align-top">
                              <td className="px-2 py-2 font-label text-[11px] text-on-surface">
                                {b.matkul_nama ?? "—"}
                              </td>
                              <td className="px-2 py-2 text-center font-label text-xs font-semibold text-on-surface">
                                {gradeOf(b) ?? "—"}
                              </td>
                              <td className="px-2 py-2 font-body text-[11px] text-on-surface leading-relaxed">
                                <span className="font-semibold text-primary">
                                  {b.clo_code}
                                </span>
                                {" — "}
                                {b.clo_text ?? "Teks CLO tidak tersedia."}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      ) : (
                        <p className="px-2 font-body text-[11px] text-on-surface-variant italic">
                          Tidak ada CLO yang relevan untuk kualifikasi ini.
                        </p>
                      )}
                      <p className="px-2 mt-1.5 font-label text-[10px] text-on-surface-variant">
                        Kemiripan {sim}% × {isCourse ? "nilai MK" : "nilai CLO"}{" "}
                        {gradeOf(b) ?? 0} ={" "}
                        <span className={`font-bold ${scoreColor(b.contribution)}`}>
                          {b.contribution}% kontribusi
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
