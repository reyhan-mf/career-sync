// HR (Company) shared constants + display helpers.
//
// Previously this file also exported dummy `companyProfile`, `hrProfile`,
// `initialHRJobs`, `initialApplicants`, and `initialTalents` arrays. Those
// have been removed — HR pages now consume real data via `hrDataStore`.

export type JobStatus = "active" | "closing" | "closed" | "draft" | "processing";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

export const jobTypeOptions: JobType[] = [
  "Full-time",
  "Part-time",
  "Contract",
  "Internship",
];

export const jobCategoryOptions = [
  "Web",
  "Mobile",
  "Data",
  "DevOps",
  "AI/ML",
  "Design",
  "Product",
  "Marketing",
];

export const jobStatusLabel: Record<JobStatus, string> = {
  active: "Aktif",
  closing: "Segera Tutup",
  closed: "Ditutup",
  draft: "Draft",
  processing: "Diproses",
};

export const jobStatusColor: Record<JobStatus, string> = {
  active: "bg-green-50 text-green-700",
  closing: "bg-tertiary-fixed text-on-tertiary-container",
  closed: "bg-surface-container text-on-surface-variant",
  draft: "bg-surface-container text-on-surface-variant",
  processing: "bg-blue-50 text-blue-700",
};

export type ApplicantStatus =
  | "new"
  | "reviewed"
  | "interview"
  | "accepted"
  | "rejected";

export const applicantStatusLabel: Record<ApplicantStatus, string> = {
  new: "Baru",
  reviewed: "Direview",
  interview: "Interview",
  accepted: "Diterima",
  rejected: "Ditolak",
};

export const applicantStatusColor: Record<ApplicantStatus, string> = {
  new: "bg-primary-fixed text-primary",
  reviewed: "bg-surface-container text-on-surface-variant",
  interview: "bg-blue-50 text-blue-700",
  accepted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-700",
};

export type InviteStatus =
  | "not_contacted"
  | "invited"
  | "responded"
  | "declined";

export const inviteStatusLabel: Record<InviteStatus, string> = {
  not_contacted: "Belum Diundang",
  invited: "Diundang",
  responded: "Merespon",
  declined: "Menolak",
};

export const inviteStatusColor: Record<InviteStatus, string> = {
  not_contacted: "bg-surface-container text-on-surface-variant",
  invited: "bg-primary-fixed text-primary",
  responded: "bg-green-50 text-green-700",
  declined: "bg-red-50 text-red-700",
};

export const matchRangeOptions = [
  { value: "all", label: "Semua Match" },
  { value: "high", label: "Tinggi (≥85%)" },
  { value: "mid", label: "Sedang (70–84%)" },
  { value: "low", label: "Rendah (<70%)" },
];

export function matchInRange(match: number, range: string) {
  if (range === "high") return match >= 85;
  if (range === "mid") return match >= 70 && match < 85;
  if (range === "low") return match < 70;
  return true;
}

export function matchColorClass(match: number) {
  if (match >= 85) return "text-green-700 bg-green-50";
  if (match >= 70) return "text-primary bg-primary-fixed";
  return "text-tertiary bg-tertiary-fixed";
}
