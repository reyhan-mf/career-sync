import { supabase } from "./client";

// Talent invitations from the student's point of view. HR creates a row with
// status "invited" (see hr-queries.inviteTalent); the student then accepts
// ("responded") or rejects ("declined"). HR reads the same status vocabulary
// — see InviteStatus in hr-queries.ts.

export type StudentInviteStatus = "invited" | "responded" | "declined";

export interface StudentInvitation {
  id: string;
  hr_id: string | null;
  job_id: string | null;
  status: StudentInviteStatus;
  sent_at: string | null;
  responded_at: string | null;
  // Embedded job + company. Null when the linked job is no longer readable
  // (e.g. it was closed — students can only read active/closing jobs via RLS).
  jobs: {
    title: string;
    location: string | null;
    job_type: string | null;
    company: { name: string; logo_icon: string | null } | null;
  } | null;
}

const INVITATION_SELECT = `id, hr_id, job_id, status, sent_at, responded_at,
  jobs:job_id ( title, location, job_type, company:company_id ( name, logo_icon ) )`;

/** All invitations addressed to a student, newest first. */
export async function getMyInvitations(studentId: string): Promise<StudentInvitation[]> {
  const { data, error } = await supabase
    .from("talent_invitations")
    .select(INVITATION_SELECT)
    .eq("student_id", studentId)
    .order("sent_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as unknown as StudentInvitation[];
}

/**
 * Accept or decline an invitation. Accepting maps to the DB status
 * "responded" (what HR's talent pool reads as "Merespon"); declining maps to
 * "declined". Requires the student-update RLS policy on talent_invitations
 * (migration 20260612_student_invitation_response.sql).
 */
export async function respondToInvitation(
  id: string,
  accept: boolean,
): Promise<StudentInvitation> {
  const { data, error } = await supabase
    .from("talent_invitations")
    .update({
      status: accept ? "responded" : "declined",
      responded_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(INVITATION_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as StudentInvitation;
}
