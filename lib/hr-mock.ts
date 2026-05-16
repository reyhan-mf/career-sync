// ─────────────────────────────────────────────────────────────
// HR (Company) mock data
// ─────────────────────────────────────────────────────────────

export interface HRProfile {
  name: string;
  email: string;
  role: string;
  initials: string;
}

export const hrProfile: HRProfile = {
  name: "Rama Adipratama",
  email: "rama.adipratama@tokopedia.com",
  role: "Senior Talent Acquisition",
  initials: "RA",
};

export interface CompanyProfile {
  id: string;
  name: string;
  tagline: string;
  industry: string;
  location: string;
  size: string;
  founded: string;
  website: string;
  logoIcon: string;
  logoBgClass: string;
  logoTextClass: string;
  verified: boolean;
  description: string;
}

export const companyProfile: CompanyProfile = {
  id: "tokopedia",
  name: "Tokopedia",
  tagline: "Mulai aja dulu.",
  industry: "E-commerce & Marketplace",
  location: "Jakarta Selatan, Indonesia",
  size: "5.000+ karyawan",
  founded: "2009",
  website: "tokopedia.com",
  logoIcon: "storefront",
  logoBgClass: "bg-green-50",
  logoTextClass: "text-green-700",
  verified: true,
  description:
    "Marketplace terbesar di Indonesia yang menghubungkan jutaan UMKM dengan konsumen di seluruh Nusantara. Kami terus mencari talenta digital terbaik untuk membentuk masa depan e-commerce.",
};

// ─────────────────────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────────────────────

export type JobStatus = "active" | "closing" | "closed" | "draft";
export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship";

export interface HRJob {
  id: number;
  title: string;
  location: string;
  type: JobType;
  category: string;
  salary: string;
  applicants: number;
  deadline: string;
  status: JobStatus;
  posted: string;
  description: string;
  qualificationSkills: string[];
  skills: string[];
}

export const initialHRJobs: HRJob[] = [
  {
    id: 1,
    title: "Frontend Developer",
    location: "Jakarta",
    type: "Full-time",
    category: "Web",
    salary: "Rp 10-18 jt",
    applicants: 12,
    deadline: "30 Mei 2026",
    status: "active",
    posted: "10 Mei 2026",
    description:
      "Membangun antarmuka web berskala besar menggunakan React dan TypeScript.",
    qualificationSkills: [
      "Mampu membangun komponen React reusable",
      "Mengerti state management modern",
      "Menguasai TypeScript dan tooling frontend",
    ],
    skills: ["React", "TypeScript", "Next.js", "Tailwind"],
  },
  {
    id: 2,
    title: "Data Analyst",
    location: "Bandung",
    type: "Full-time",
    category: "Data",
    salary: "Rp 8-13 jt",
    applicants: 8,
    deadline: "25 Mei 2026",
    status: "active",
    posted: "5 Mei 2026",
    description:
      "Menganalisis data transaksi untuk mendukung keputusan bisnis.",
    qualificationSkills: [
      "Menguasai SQL untuk query analitik",
      "Menggunakan Python untuk data cleaning",
      "Memahami statistik dasar untuk insight",
    ],
    skills: ["SQL", "Python", "Tableau", "Statistics"],
  },
  {
    id: 3,
    title: "Backend Developer",
    location: "Jakarta",
    type: "Full-time",
    category: "Web",
    salary: "Rp 12-20 jt",
    applicants: 15,
    deadline: "1 Jun 2026",
    status: "active",
    posted: "8 Mei 2026",
    description: "Mengembangkan API dan layanan backend yang scalable.",
    qualificationSkills: [
      "Membangun REST API dengan performa tinggi",
      "Merancang schema database relasional",
      "Mengelola deployment berbasis container",
    ],
    skills: ["Go", "PostgreSQL", "Kubernetes", "REST API"],
  },
  {
    id: 4,
    title: "System Administrator",
    location: "Surabaya",
    type: "Contract",
    category: "DevOps",
    salary: "Rp 9-14 jt",
    applicants: 5,
    deadline: "15 Mei 2026",
    status: "closing",
    posted: "1 Mei 2026",
    description:
      "Mengelola infrastruktur server dan keamanan jaringan internal.",
    qualificationSkills: [
      "Mengelola server Linux dan scripting",
      "Mengonfigurasi container runtime",
      "Memantau performa dan keamanan jaringan",
    ],
    skills: ["Linux", "Docker", "Networking", "Bash"],
  },
  {
    id: 5,
    title: "UI/UX Designer",
    location: "Yogyakarta",
    type: "Part-time",
    category: "Design",
    salary: "Rp 6-10 jt",
    applicants: 7,
    deadline: "20 Mei 2026",
    status: "closed",
    posted: "25 Apr 2026",
    description: "Mendesain pengalaman pengguna yang intuitif untuk aplikasi.",
    qualificationSkills: [
      "Membuat user flow dan wireframe",
      "Menjalankan usability testing",
      "Menerjemahkan riset ke design system",
    ],
    skills: ["Figma", "Design System", "User Research"],
  },
];

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
};

export const jobStatusColor: Record<JobStatus, string> = {
  active: "bg-green-50 text-green-700",
  closing: "bg-tertiary-fixed text-on-tertiary-container",
  closed: "bg-surface-container text-on-surface-variant",
  draft: "bg-surface-container text-on-surface-variant",
};

// ─────────────────────────────────────────────────────────────
// Applicants — they applied to one of our jobs
// ─────────────────────────────────────────────────────────────

export type ApplicantStatus =
  | "new"
  | "reviewed"
  | "interview"
  | "accepted"
  | "rejected";

export interface HRApplicant {
  id: number;
  name: string;
  jobId: number;
  position: string;
  match: number;
  university: string;
  major: string;
  gpa: string;
  experience: string;
  skills: string[];
  cloMatches: ApplicantCloMatch[];
  date: string;
  status: ApplicantStatus;
  email: string;
}

export interface ApplicantCloMatch {
  clo: string;
  score: number;
  qualification: string;
}

export const initialApplicants: HRApplicant[] = [
  {
    id: 1,
    name: "Budi Santoso",
    jobId: 1,
    position: "Frontend Developer",
    match: 92,
    university: "ITB",
    major: "Teknik Informatika",
    gpa: "3.85",
    experience: "1 tahun (Internship)",
    skills: ["React", "TypeScript", "Tailwind"],
    cloMatches: [
      { clo: "CLO1", score: 90, qualification: "React + TypeScript" },
      { clo: "CLO2", score: 84, qualification: "UI component design" },
    ],
    date: "10 Mei 2026",
    status: "new",
    email: "budi.santoso@students.itb.ac.id",
  },
  {
    id: 2,
    name: "Siti Rahayu",
    jobId: 2,
    position: "Data Analyst",
    match: 88,
    university: "UI",
    major: "Sistem Informasi",
    gpa: "3.72",
    experience: "Fresh Graduate",
    skills: ["SQL", "Python", "Tableau"],
    cloMatches: [
      { clo: "CLO1", score: 87, qualification: "SQL analytics" },
      { clo: "CLO2", score: 79, qualification: "Python data wrangling" },
    ],
    date: "9 Mei 2026",
    status: "reviewed",
    email: "siti.rahayu@ui.ac.id",
  },
  {
    id: 3,
    name: "Andi Pratama",
    jobId: 3,
    position: "Backend Developer",
    match: 85,
    university: "UGM",
    major: "Ilmu Komputer",
    gpa: "3.60",
    experience: "2 tahun",
    skills: ["Go", "PostgreSQL", "Docker"],
    cloMatches: [
      { clo: "CLO2", score: 88, qualification: "PostgreSQL schema" },
      { clo: "CLO3", score: 76, qualification: "Go services" },
    ],
    date: "8 Mei 2026",
    status: "interview",
    email: "andi.pratama@ugm.ac.id",
  },
  {
    id: 4,
    name: "Dewi Lestari",
    jobId: 5,
    position: "UI/UX Designer",
    match: 79,
    university: "ITS",
    major: "Desain Komunikasi Visual",
    gpa: "3.45",
    experience: "Fresh Graduate",
    skills: ["Figma", "Design System"],
    cloMatches: [
      { clo: "CLO1", score: 78, qualification: "Design system" },
      { clo: "CLO2", score: 72, qualification: "User research" },
    ],
    date: "7 Mei 2026",
    status: "rejected",
    email: "dewi.lestari@its.ac.id",
  },
  {
    id: 5,
    name: "Rizky Aditya",
    jobId: 1,
    position: "Frontend Developer",
    match: 91,
    university: "BINUS",
    major: "Computer Science",
    gpa: "3.78",
    experience: "1 tahun",
    skills: ["React", "Next.js", "TypeScript"],
    cloMatches: [
      { clo: "CLO1", score: 92, qualification: "React + Next.js" },
      { clo: "CLO2", score: 83, qualification: "TypeScript tooling" },
    ],
    date: "6 Mei 2026",
    status: "new",
    email: "rizky.aditya@binus.ac.id",
  },
  {
    id: 6,
    name: "Maya Putri",
    jobId: 2,
    position: "Data Analyst",
    match: 83,
    university: "UNPAD",
    major: "Statistika",
    gpa: "3.55",
    experience: "Fresh Graduate",
    skills: ["SQL", "Python", "R"],
    cloMatches: [
      { clo: "CLO1", score: 84, qualification: "Statistics modeling" },
      { clo: "CLO2", score: 80, qualification: "SQL reporting" },
    ],
    date: "5 Mei 2026",
    status: "accepted",
    email: "maya.putri@unpad.ac.id",
  },
  {
    id: 7,
    name: "Raka Wibawa",
    jobId: 3,
    position: "Backend Developer",
    match: 76,
    university: "Telkom University",
    major: "Teknik Informatika",
    gpa: "3.40",
    experience: "Fresh Graduate",
    skills: ["Node.js", "MongoDB"],
    cloMatches: [
      { clo: "CLO2", score: 75, qualification: "Node.js API" },
      { clo: "CLO3", score: 68, qualification: "MongoDB" },
    ],
    date: "4 Mei 2026",
    status: "reviewed",
    email: "raka.wibawa@telkomuniversity.ac.id",
  },
  {
    id: 8,
    name: "Nadia Pertiwi",
    jobId: 1,
    position: "Frontend Developer",
    match: 81,
    university: "UGM",
    major: "Ilmu Komputer",
    gpa: "3.65",
    experience: "Fresh Graduate",
    skills: ["React", "JavaScript"],
    cloMatches: [
      { clo: "CLO1", score: 81, qualification: "React fundamentals" },
      { clo: "CLO2", score: 74, qualification: "Frontend tooling" },
    ],
    date: "3 Mei 2026",
    status: "interview",
    email: "nadia.pertiwi@ugm.ac.id",
  },
];

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

// ─────────────────────────────────────────────────────────────
// Talent Pool — passive candidates the company can invite
// ─────────────────────────────────────────────────────────────

export type InviteStatus =
  | "not_contacted"
  | "invited"
  | "responded"
  | "declined";

export interface HRTalent {
  id: number;
  name: string;
  university: string;
  major: string;
  gpa: string;
  match: number;
  bestMatchJobId: number;
  bestMatchJobTitle: string;
  skills: string[];
  cloMatches: TalentCloMatch[];
  graduated: string;
  experience: string;
  inviteStatus: InviteStatus;
  email: string;
  location: string;
}

export interface TalentCloMatch {
  clo: string;
  score: number;
  qualification: string;
}

export const initialTalents: HRTalent[] = [
  {
    id: 101,
    name: "Aldo Wijaya",
    university: "ITB",
    major: "Teknik Informatika",
    gpa: "3.92",
    match: 94,
    bestMatchJobId: 1,
    bestMatchJobTitle: "Frontend Developer",
    skills: ["React", "TypeScript", "Next.js", "GraphQL"],
    cloMatches: [
      { clo: "CLO1", score: 92, qualification: "React + TypeScript" },
      { clo: "CLO2", score: 84, qualification: "Next.js + GraphQL" },
    ],
    graduated: "Februari 2026",
    experience: "Fresh Graduate",
    inviteStatus: "not_contacted",
    email: "aldo.wijaya@students.itb.ac.id",
    location: "Bandung",
  },
  {
    id: 102,
    name: "Karina Maharani",
    university: "UI",
    major: "Ilmu Komputer",
    gpa: "3.88",
    match: 91,
    bestMatchJobId: 3,
    bestMatchJobTitle: "Backend Developer",
    skills: ["Go", "Kubernetes", "PostgreSQL"],
    cloMatches: [
      { clo: "CLO2", score: 89, qualification: "PostgreSQL + schema design" },
      { clo: "CLO3", score: 78, qualification: "Go services + Kubernetes" },
    ],
    graduated: "Agustus 2025",
    experience: "8 bulan (Internship Gojek)",
    inviteStatus: "invited",
    email: "karina.maharani@ui.ac.id",
    location: "Jakarta",
  },
  {
    id: 103,
    name: "Fajar Nugraha",
    university: "UGM",
    major: "Sistem Informasi",
    gpa: "3.75",
    match: 89,
    bestMatchJobId: 2,
    bestMatchJobTitle: "Data Analyst",
    skills: ["SQL", "Python", "Tableau", "PowerBI"],
    cloMatches: [
      { clo: "CLO1", score: 86, qualification: "SQL + dashboarding" },
      { clo: "CLO2", score: 80, qualification: "Python data wrangling" },
    ],
    graduated: "Februari 2026",
    experience: "Fresh Graduate",
    inviteStatus: "responded",
    email: "fajar.nugraha@ugm.ac.id",
    location: "Yogyakarta",
  },
  {
    id: 104,
    name: "Putri Anjani",
    university: "BINUS",
    major: "Computer Science",
    gpa: "3.70",
    match: 87,
    bestMatchJobId: 1,
    bestMatchJobTitle: "Frontend Developer",
    skills: ["React", "Tailwind", "Figma"],
    cloMatches: [
      { clo: "CLO1", score: 83, qualification: "React UI component" },
      { clo: "CLO2", score: 74, qualification: "Design handoff tooling" },
    ],
    graduated: "Agustus 2025",
    experience: "6 bulan",
    inviteStatus: "not_contacted",
    email: "putri.anjani@binus.ac.id",
    location: "Jakarta",
  },
  {
    id: 105,
    name: "Reza Aprilio",
    university: "ITS",
    major: "Teknik Informatika",
    gpa: "3.55",
    match: 84,
    bestMatchJobId: 3,
    bestMatchJobTitle: "Backend Developer",
    skills: ["Node.js", "MongoDB", "Redis"],
    cloMatches: [
      { clo: "CLO2", score: 81, qualification: "Node.js REST API" },
      { clo: "CLO3", score: 71, qualification: "MongoDB + Redis" },
    ],
    graduated: "Februari 2026",
    experience: "Fresh Graduate",
    inviteStatus: "not_contacted",
    email: "reza.aprilio@its.ac.id",
    location: "Surabaya",
  },
  {
    id: 106,
    name: "Lia Sundari",
    university: "UNPAD",
    major: "Statistika",
    gpa: "3.82",
    match: 86,
    bestMatchJobId: 2,
    bestMatchJobTitle: "Data Analyst",
    skills: ["R", "Python", "SQL", "Statistics"],
    cloMatches: [
      { clo: "CLO1", score: 85, qualification: "Statistical modeling" },
      { clo: "CLO2", score: 79, qualification: "SQL analytics" },
    ],
    graduated: "Februari 2026",
    experience: "Fresh Graduate",
    inviteStatus: "declined",
    email: "lia.sundari@unpad.ac.id",
    location: "Bandung",
  },
  {
    id: 107,
    name: "Bagus Priambodo",
    university: "Telkom University",
    major: "Teknik Informatika",
    gpa: "3.68",
    match: 82,
    bestMatchJobId: 1,
    bestMatchJobTitle: "Frontend Developer",
    skills: ["React", "Vue.js", "JavaScript"],
    cloMatches: [
      { clo: "CLO1", score: 82, qualification: "React + Vue component" },
      { clo: "CLO2", score: 70, qualification: "Frontend tooling" },
    ],
    graduated: "Agustus 2025",
    experience: "10 bulan (Internship)",
    inviteStatus: "not_contacted",
    email: "bagus.priambodo@telkomuniversity.ac.id",
    location: "Bandung",
  },
  {
    id: 108,
    name: "Galuh Permata",
    university: "ITB",
    major: "Sistem & Teknologi Informasi",
    gpa: "3.79",
    match: 81,
    bestMatchJobId: 4,
    bestMatchJobTitle: "System Administrator",
    skills: ["Linux", "Docker", "AWS"],
    cloMatches: [
      { clo: "CLO2", score: 88, qualification: "Linux administration" },
      { clo: "CLO3", score: 76, qualification: "Docker + AWS" },
    ],
    graduated: "Februari 2026",
    experience: "Fresh Graduate",
    inviteStatus: "not_contacted",
    email: "galuh.permata@students.itb.ac.id",
    location: "Bandung",
  },
];

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

// ─────────────────────────────────────────────────────────────
// Shared filter options
// ─────────────────────────────────────────────────────────────

export const universityOptions = [
  "ITB",
  "UI",
  "UGM",
  "ITS",
  "BINUS",
  "UNPAD",
  "Telkom University",
];

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
