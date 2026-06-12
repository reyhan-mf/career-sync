import { supabase } from "./client";

// In-app notifications. Rows are created server-side by the triggers installed
// in migration 20260612_notifications.sql (application status changes, new
// applications, talent invitations + responses). The client only reads them and
// marks them read — it never inserts, so no cross-user INSERT policy is needed.

export interface NotificationRow {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string | null;
}

/** Most-recent notifications for the logged-in user. */
export async function getMyNotifications(limit = 50): Promise<NotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as NotificationRow[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) throw error;
}

// ─── Presentation ───────────────────────────────────────────────────────────

export interface NotificationView {
  title: string;
  body: string;
  icon: string;
  color: string;
  href: string | null;
}

function str(payload: Record<string, unknown> | null, key: string): string | null {
  const v = payload?.[key];
  return typeof v === "string" ? v : null;
}

const APP_STATUS_LABEL: Record<string, string> = {
  new: "diterima",
  reviewed: "sedang ditinjau",
  interview: "masuk tahap interview",
  accepted: "diterima",
  rejected: "ditolak",
};

/**
 * Map a stored notification row to display copy. Falls back to a generic shape
 * for unknown types so a future trigger can't break this page.
 */
export function describeNotification(n: NotificationRow): NotificationView {
  const p = n.payload;
  const jobTitle = str(p, "job_title") ?? "lowongan";
  switch (n.type) {
    case "application_status": {
      const status = str(p, "status") ?? "";
      const label = APP_STATUS_LABEL[status] ?? "diperbarui";
      return {
        title: "Status lamaran diperbarui",
        body: `Lamaran Anda untuk "${jobTitle}" kini ${label}.`,
        icon: status === "accepted" ? "check_circle" : status === "rejected" ? "cancel" : "work_history",
        color: status === "accepted" ? "text-green-600" : status === "rejected" ? "text-error" : "text-primary",
        href: "/student/applications",
      };
    }
    case "new_application": {
      const student = str(p, "student_name") ?? "Seorang mahasiswa";
      return {
        title: "Lamaran baru masuk",
        body: `${student} melamar untuk posisi "${jobTitle}".`,
        icon: "person_add",
        color: "text-primary",
        href: "/hr/applicants",
      };
    }
    case "talent_invitation": {
      const company = str(p, "company_name") ?? "Sebuah perusahaan";
      return {
        title: "Undangan dari perusahaan",
        body: `${company} mengundang Anda untuk melamar "${jobTitle}".`,
        icon: "forward_to_inbox",
        color: "text-tertiary",
        href: "/student/invitations",
      };
    }
    case "invitation_response": {
      const student = str(p, "student_name") ?? "Seorang kandidat";
      const status = str(p, "status");
      const verb = status === "declined" ? "menolak" : "menerima";
      return {
        title: "Respons undangan talent",
        body: `${student} ${verb} undangan Anda untuk "${jobTitle}".`,
        icon: status === "declined" ? "person_off" : "how_to_reg",
        color: status === "declined" ? "text-error" : "text-green-600",
        href: "/hr/talent-pool",
      };
    }
    default: {
      const body = str(p, "message") ?? "Anda memiliki notifikasi baru.";
      return { title: n.type || "Notifikasi", body, icon: "notifications", color: "text-primary", href: null };
    }
  }
}

export function relativeTime(iso: string | null): string {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;
  return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}
