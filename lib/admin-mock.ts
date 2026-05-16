export interface AdminProfile {
  name: string;
  email: string;
  prodi: string;
  fakultas: string;
  university: string;
  role: string;
  initials: string;
}

export const adminProfile: AdminProfile = {
  name: "Rina Setiawati, A.Md.",
  email: "rina.setiawati@univnusantara.ac.id",
  prodi: "Sistem Informasi",
  fakultas: "Fakultas Ilmu Komputer",
  university: "Universitas Nusantara",
  role: "Staff TU Prodi",
  initials: "RS",
};

export interface ProdiStatus {
  name: string;
  status: "active" | "pending" | "planned";
  note: string;
  isCurrent?: boolean;
}

export const prodiIntegrationStatus: ProdiStatus[] = [
  {
    name: "Sistem Informasi",
    status: "active",
    note: "Terintegrasi via admin lokal",
    isCurrent: true,
  },
  {
    name: "Teknik Informatika",
    status: "planned",
    note: "Menunggu integrasi SSO",
  },
  {
    name: "Sistem Komputer",
    status: "planned",
    note: "Menunggu integrasi SSO",
  },
  {
    name: "Teknologi Informasi",
    status: "planned",
    note: "Menunggu integrasi SSO",
  },
  {
    name: "Manajemen Informatika",
    status: "planned",
    note: "Menunggu integrasi SSO",
  },
];

export interface MataKuliahItem {
  kode: string;
  nama: string;
  sks: number;
  semester: number;
  deskripsi: string;
}

export const initialMataKuliah: MataKuliahItem[] = [
  {
    kode: "SD",
    nama: "Struktur Data",
    sks: 3,
    semester: 3,
    deskripsi:
      "Konsep struktur data linear dan non-linear beserta algoritma traversalnya.",
  },
  {
    kode: "BD",
    nama: "Basis Data",
    sks: 3,
    semester: 4,
    deskripsi:
      "Perancangan basis data relasional, normalisasi, dan query SQL kompleks.",
  },
  {
    kode: "JK",
    nama: "Jaringan Komputer",
    sks: 3,
    semester: 4,
    deskripsi:
      "Arsitektur jaringan, model OSI/TCP-IP, dan praktik routing dasar.",
  },
  {
    kode: "PW",
    nama: "Pemrograman Web",
    sks: 3,
    semester: 5,
    deskripsi: "Pengembangan aplikasi web full-stack dengan framework modern.",
  },
  {
    kode: "AD",
    nama: "Analisis Data",
    sks: 3,
    semester: 5,
    deskripsi:
      "Eksplorasi, visualisasi, dan analisis statistik data menggunakan Python.",
  },
  {
    kode: "SE",
    nama: "Software Engineering",
    sks: 3,
    semester: 5,
    deskripsi:
      "Metodologi pengembangan perangkat lunak, dokumentasi, dan pengujian.",
  },
  {
    kode: "KI",
    nama: "Keamanan Informasi",
    sks: 3,
    semester: 6,
    deskripsi: "Prinsip CIA, kriptografi dasar, dan keamanan aplikasi web.",
  },
  {
    kode: "ML",
    nama: "Machine Learning",
    sks: 3,
    semester: 7,
    deskripsi: "Algoritma supervised/unsupervised learning dan evaluasi model.",
  },
];

export const mataKuliahOptions = initialMataKuliah.map((m) => m.nama);

export function getMataKuliahByKode(kode: string): MataKuliahItem | undefined {
  return initialMataKuliah.find(
    (m) => m.kode.toLowerCase() === kode.toLowerCase(),
  );
}

export function getMataKuliahByNama(nama: string): MataKuliahItem | undefined {
  return initialMataKuliah.find((m) => m.nama === nama);
}

export interface MahasiswaItem {
  id: number;
  nim: string;
  name: string;
  email: string;
  angkatan: string;
  status: "active" | "inactive";
  lastLogin: string;
}

export const initialMahasiswa: MahasiswaItem[] = [
  {
    id: 1,
    nim: "21001",
    name: "Budi Santoso",
    email: "21001@student.ac.id",
    angkatan: "2021",
    status: "active",
    lastLogin: "Hari ini",
  },
  {
    id: 2,
    nim: "21002",
    name: "Siti Rahayu",
    email: "21002@student.ac.id",
    angkatan: "2021",
    status: "active",
    lastLogin: "Kemarin",
  },
  {
    id: 3,
    nim: "21003",
    name: "Andi Pratama",
    email: "21003@student.ac.id",
    angkatan: "2021",
    status: "inactive",
    lastLogin: "1 bulan lalu",
  },
  {
    id: 4,
    nim: "21004",
    name: "Dewi Lestari",
    email: "21004@student.ac.id",
    angkatan: "2021",
    status: "active",
    lastLogin: "3 hari lalu",
  },
  {
    id: 5,
    nim: "22001",
    name: "Rini Kusuma",
    email: "22001@student.ac.id",
    angkatan: "2022",
    status: "active",
    lastLogin: "Hari ini",
  },
  {
    id: 6,
    nim: "22002",
    name: "Fahri Ramadhan",
    email: "22002@student.ac.id",
    angkatan: "2022",
    status: "active",
    lastLogin: "2 hari lalu",
  },
];

export const angkatanOptions = ["2021", "2022", "2023", "2024"];

export interface CLOItem {
  id: string;
  deskripsi: string;
  mataKuliah: string;
}

export const initialCLOs: CLOItem[] = [
  {
    id: "PW-CLO-01",
    deskripsi:
      "Mampu membangun aplikasi web full-stack menggunakan React dan Node.js",
    mataKuliah: "Pemrograman Web",
  },
  {
    id: "PW-CLO-02",
    deskripsi: "Mampu menerapkan konsep REST API dalam pengembangan backend",
    mataKuliah: "Pemrograman Web",
  },
  {
    id: "PW-CLO-03",
    deskripsi:
      "Mampu mengimplementasikan autentikasi dan otorisasi pada aplikasi web",
    mataKuliah: "Pemrograman Web",
  },
  {
    id: "BD-CLO-01",
    deskripsi: "Mampu merancang skema basis data relasional menggunakan ERD",
    mataKuliah: "Basis Data",
  },
  {
    id: "BD-CLO-02",
    deskripsi: "Mampu menuliskan query SQL kompleks termasuk join dan subquery",
    mataKuliah: "Basis Data",
  },
  {
    id: "AD-CLO-01",
    deskripsi:
      "Mampu melakukan eksplorasi dan visualisasi data menggunakan Python",
    mataKuliah: "Analisis Data",
  },
  {
    id: "AD-CLO-02",
    deskripsi: "Mampu menerapkan metode statistik dasar untuk analisis data",
    mataKuliah: "Analisis Data",
  },
  {
    id: "AD-CLO-03",
    deskripsi:
      "Mampu membangun dashboard analitik sederhana menggunakan tools BI",
    mataKuliah: "Analisis Data",
  },
  {
    id: "SE-CLO-01",
    deskripsi:
      "Mampu menerapkan metodologi Agile dalam siklus pengembangan perangkat lunak",
    mataKuliah: "Software Engineering",
  },
  {
    id: "SE-CLO-02",
    deskripsi:
      "Mampu membuat dokumentasi teknis dan spesifikasi kebutuhan yang komprehensif",
    mataKuliah: "Software Engineering",
  },
];

export const gradeOptions = ["A", "A-", "B+", "B", "B-", "C+", "C", "D", "E"];
export const semesterOptions = [
  "2024/2025 Genap",
  "2024/2025 Ganjil",
  "2023/2024 Genap",
  "2023/2024 Ganjil",
];
export const sksOptions = ["1", "2", "3", "4", "5", "6"];

export interface GradeItem {
  id: number;
  nim: string;
  name: string;
  mataKuliah: string;
  clo: string;
  grade: string;
  score: number;
  semester: string;
}

export const initialGrades: GradeItem[] = [
  {
    id: 1,
    nim: "21001",
    name: "Budi Santoso",
    mataKuliah: "Pemrograman Web",
    clo: "PW-CLO-01",
    grade: "A",
    score: 90,
    semester: "2024/2025 Genap",
  },
  {
    id: 2,
    nim: "21001",
    name: "Budi Santoso",
    mataKuliah: "Pemrograman Web",
    clo: "PW-CLO-02",
    grade: "A-",
    score: 86,
    semester: "2024/2025 Genap",
  },
  {
    id: 3,
    nim: "21001",
    name: "Budi Santoso",
    mataKuliah: "Pemrograman Web",
    clo: "PW-CLO-03",
    grade: "B+",
    score: 78,
    semester: "2024/2025 Genap",
  },
  {
    id: 4,
    nim: "21001",
    name: "Budi Santoso",
    mataKuliah: "Basis Data",
    clo: "BD-CLO-01",
    grade: "A-",
    score: 85,
    semester: "2024/2025 Genap",
  },
  {
    id: 5,
    nim: "21001",
    name: "Budi Santoso",
    mataKuliah: "Basis Data",
    clo: "BD-CLO-02",
    grade: "B+",
    score: 80,
    semester: "2024/2025 Genap",
  },
  {
    id: 6,
    nim: "21002",
    name: "Siti Rahayu",
    mataKuliah: "Pemrograman Web",
    clo: "PW-CLO-01",
    grade: "B+",
    score: 79,
    semester: "2024/2025 Genap",
  },
  {
    id: 7,
    nim: "21002",
    name: "Siti Rahayu",
    mataKuliah: "Pemrograman Web",
    clo: "PW-CLO-02",
    grade: "B",
    score: 75,
    semester: "2024/2025 Genap",
  },
  {
    id: 8,
    nim: "21002",
    name: "Siti Rahayu",
    mataKuliah: "Basis Data",
    clo: "BD-CLO-01",
    grade: "A",
    score: 90,
    semester: "2024/2025 Genap",
  },
  {
    id: 9,
    nim: "21003",
    name: "Andi Pratama",
    mataKuliah: "Analisis Data",
    clo: "AD-CLO-01",
    grade: "B+",
    score: 78,
    semester: "2024/2025 Genap",
  },
  {
    id: 10,
    nim: "21003",
    name: "Andi Pratama",
    mataKuliah: "Analisis Data",
    clo: "AD-CLO-02",
    grade: "B",
    score: 73,
    semester: "2024/2025 Genap",
  },
  {
    id: 11,
    nim: "21004",
    name: "Dewi Lestari",
    mataKuliah: "Software Engineering",
    clo: "SE-CLO-01",
    grade: "A",
    score: 92,
    semester: "2024/2025 Genap",
  },
  {
    id: 12,
    nim: "21004",
    name: "Dewi Lestari",
    mataKuliah: "Software Engineering",
    clo: "SE-CLO-02",
    grade: "A-",
    score: 87,
    semester: "2024/2025 Genap",
  },
];

export function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "bg-green-50 text-green-700";
  if (grade.startsWith("B")) return "bg-blue-50 text-blue-700";
  if (grade.startsWith("C"))
    return "bg-tertiary-fixed text-on-tertiary-container";
  return "bg-red-50 text-red-700";
}

// --- Superadmin / Admin account management ---

export interface SuperadminProfile {
  name: string;
  email: string;
  unit: string;
  university: string;
  role: string;
  initials: string;
}

export const superadminProfile: SuperadminProfile = {
  name: "Ir. Hendra Saputra, M.T.",
  email: "hendra.saputra@univnusantara.ac.id",
  unit: "UPT Teknologi Informasi & Komunikasi",
  university: "Universitas Nusantara",
  role: "Superadmin",
  initials: "HS",
};

export interface AdminAccount {
  id: number;
  name: string;
  email: string;
  prodi: string;
  status: "active" | "inactive";
  lastLogin: string;
  dateCreated: string;
}

export const initialAdminAccounts: AdminAccount[] = [
  {
    id: 1,
    name: "Dr. Andi Wibowo, M.Kom.",
    email: "andi.wibowo@univnusantara.ac.id",
    prodi: "Sistem Informasi",
    status: "active",
    lastLogin: "Hari ini, 09:14",
    dateCreated: "2025-08-12",
  },
  {
    id: 2,
    name: "Dewi Anggraini, S.Kom., M.T.",
    email: "dewi.anggraini@univnusantara.ac.id",
    prodi: "Sistem Informasi",
    status: "active",
    lastLogin: "Kemarin, 16:42",
    dateCreated: "2025-09-03",
  },
  {
    id: 3,
    name: "Rizky Hidayat, M.Kom.",
    email: "rizky.hidayat@univnusantara.ac.id",
    prodi: "Teknik Informatika",
    status: "inactive",
    lastLogin: "Belum pernah",
    dateCreated: "2026-01-18",
  },
];
