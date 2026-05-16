"use client";

import Icon from "@/components/ui/Icon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState } from "react";
import ChangePasswordModal from "./ChangePasswordModal";

/* ── Dummy data: Mata Kuliah → CLOs with grades ── */
const coursesData = [
  // ── Semester 1 ──
  {
    id: "MK-01",
    name: "Matematika Diskrit",
    semester: 1,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami konsep logika proposisi dan predikat serta penerapannya dalam pembuktian",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO2",
        description:
          "Mampu menerapkan teori himpunan, relasi, dan fungsi dalam pemecahan masalah komputasi",
        grade: "A-",
        weight: 0.9,
      },
      {
        code: "CLO3",
        description:
          "Memahami konsep kombinatorika, probabilitas diskrit, dan teori graf dasar",
        grade: "B+",
        weight: 0.8,
      },
    ],
  },
  {
    id: "MK-02",
    name: "Logika Pemrograman",
    semester: 1,
    sks: 2,
    clos: [
      {
        code: "CLO1",
        description:
          "Mampu menyusun algoritma dasar menggunakan pseudocode dan flowchart",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO2",
        description:
          "Mampu mengimplementasikan algoritma dasar (percabangan, perulangan, fungsi) dalam Python",
        grade: "A",
        weight: 1.0,
      },
    ],
  },
  {
    id: "MK-03",
    name: "Pengantar Ilmu Komputer",
    semester: 1,
    sks: 2,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami sejarah dan perkembangan ilmu komputer serta cabang-cabang bidang ilmunya",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO2",
        description:
          "Mengenal komponen utama sistem komputer: hardware, software, dan representasi data biner",
        grade: "A",
        weight: 1.0,
      },
    ],
  },
  // ── Semester 2 ──
  {
    id: "MK-04",
    name: "Algoritma & Struktur Data",
    semester: 2,
    sks: 4,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami dan mengimplementasikan struktur data linear: array, linked list, stack, dan queue",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO2",
        description:
          "Memahami dan mengimplementasikan struktur data non-linear: tree, graph, dan heap",
        grade: "B",
        weight: 0.7,
      },
      {
        code: "CLO3",
        description:
          "Mampu menganalisis kompleksitas waktu dan ruang algoritma menggunakan notasi Big-O",
        grade: "A-",
        weight: 0.9,
      },
    ],
  },
  {
    id: "MK-05",
    name: "Pemrograman Berorientasi Objek",
    semester: 2,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Mampu menerapkan konsep OOP: enkapsulasi, inheritance, polimorfisme, dan abstraksi",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO2",
        description:
          "Mampu merancang sistem menggunakan UML (class diagram dan use case diagram)",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO3",
        description:
          "Mampu mengimplementasikan design pattern dasar: Singleton, Factory, dan Observer",
        grade: "B",
        weight: 0.7,
      },
    ],
  },
  // ── Semester 3 ──
  {
    id: "MK-06",
    name: "Sistem Operasi",
    semester: 3,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami konsep proses, thread, penjadwalan CPU, dan manajemen memori",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO2",
        description:
          "Memahami konsep sinkronisasi proses, mutual exclusion, dan penanganan deadlock",
        grade: "B",
        weight: 0.7,
      },
      {
        code: "CLO3",
        description:
          "Mampu menggunakan perintah dasar sistem operasi Linux/Unix dan shell scripting",
        grade: "A-",
        weight: 0.9,
      },
    ],
  },
  {
    id: "MK-07",
    name: "Jaringan Komputer",
    semester: 3,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami model OSI dan TCP/IP beserta protokol dan fungsi tiap layer",
        grade: "B",
        weight: 0.7,
      },
      {
        code: "CLO2",
        description:
          "Mampu melakukan konfigurasi jaringan dasar: IP addressing, subnetting, dan routing statis",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO3",
        description:
          "Memahami konsep keamanan jaringan dasar: firewall, VPN, dan protokol SSL/TLS",
        grade: "B-",
        weight: 0.6,
      },
    ],
  },
  // ── Semester 4 ──
  {
    id: "MK-08",
    name: "Basis Data",
    semester: 4,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Mampu merancang dan mengimplementasikan skema database relasional (normalisasi hingga 3NF)",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO2",
        description:
          "Mampu menulis query SQL kompleks termasuk JOIN, subquery, dan fungsi agregasi",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO3",
        description:
          "Mampu melakukan optimasi query dan indexing untuk meningkatkan performa database",
        grade: "B",
        weight: 0.7,
      },
    ],
  },
  {
    id: "MK-09",
    name: "Rekayasa Perangkat Lunak",
    semester: 4,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami siklus hidup pengembangan perangkat lunak (SDLC) dan berbagai modelnya",
        grade: "A-",
        weight: 0.9,
      },
      {
        code: "CLO2",
        description:
          "Mampu melakukan analisis kebutuhan dan menyusun dokumen Software Requirements Specification",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO3",
        description:
          "Mampu merancang arsitektur sistem menggunakan diagram UML (sequence, activity, component)",
        grade: "B",
        weight: 0.7,
      },
    ],
  },
  // ── Semester 5 ──
  {
    id: "MK-10",
    name: "Pemrograman Web",
    semester: 5,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Mampu membuat REST API menggunakan framework modern (Laravel/Express)",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO2",
        description:
          "Mampu membangun antarmuka web responsif dengan HTML, CSS, dan JavaScript/React",
        grade: "A-",
        weight: 0.9,
      },
      {
        code: "CLO3",
        description:
          "Mampu melakukan deployment aplikasi web ke server production",
        grade: "B+",
        weight: 0.8,
      },
    ],
  },
  {
    id: "MK-11",
    name: "Software Engineering",
    semester: 5,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Mampu menerapkan metodologi Agile/Scrum dalam pengembangan perangkat lunak tim",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO2",
        description:
          "Mampu menggunakan version control (Git) secara kolaboratif dan mengelola CI/CD pipeline",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO3",
        description:
          "Mampu menulis unit test dan integration test yang efektif menggunakan testing framework",
        grade: "B+",
        weight: 0.8,
      },
    ],
  },
  // ── Semester 6 ──
  {
    id: "MK-12",
    name: "Pengembangan Aplikasi Mobile",
    semester: 6,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Mampu membuat aplikasi Android menggunakan Kotlin dan Jetpack Compose",
        grade: "C+",
        weight: 0.5,
      },
      {
        code: "CLO2",
        description:
          "Mampu mengintegrasikan REST API dan menangani state management dalam aplikasi mobile",
        grade: "B",
        weight: 0.7,
      },
      {
        code: "CLO3",
        description:
          "Mampu mempublikasikan aplikasi ke Google Play Store sesuai standar dan kebijakan Google",
        grade: "C",
        weight: 0.4,
      },
    ],
  },
  {
    id: "MK-13",
    name: "Keamanan Informasi",
    semester: 6,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami konsep kriptografi dasar: enkripsi simetris, asimetris, dan fungsi hash",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO2",
        description:
          "Mampu melakukan vulnerability assessment dan penetration testing dasar pada aplikasi web",
        grade: "B",
        weight: 0.7,
      },
      {
        code: "CLO3",
        description:
          "Memahami standar keamanan OWASP Top 10 dan mampu menerapkan mitigasinya dalam kode",
        grade: "A-",
        weight: 0.9,
      },
    ],
  },
  // ── Semester 7 ──
  {
    id: "MK-14",
    name: "Kecerdasan Buatan",
    semester: 7,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami konsep dasar machine learning: supervised learning, unsupervised learning, dan reinforcement learning",
        grade: "B",
        weight: 0.7,
      },
      {
        code: "CLO2",
        description:
          "Mampu mengimplementasikan dan melatih model ML menggunakan Python dan scikit-learn",
        grade: "B-",
        weight: 0.6,
      },
      {
        code: "CLO3",
        description:
          "Mampu mengevaluasi performa model menggunakan metrik yang tepat dan melakukan hyperparameter tuning",
        grade: "C+",
        weight: 0.5,
      },
    ],
  },
  {
    id: "MK-15",
    name: "Sistem Informasi Manajemen",
    semester: 7,
    sks: 3,
    clos: [
      {
        code: "CLO1",
        description:
          "Memahami peran dan komponen Sistem Informasi Manajemen dalam mendukung pengambilan keputusan organisasi",
        grade: "B+",
        weight: 0.8,
      },
      {
        code: "CLO2",
        description:
          "Mampu menganalisis proses bisnis dan merancang solusi sistem informasi yang sesuai kebutuhan organisasi",
        grade: "B",
        weight: 0.7,
      },
      {
        code: "CLO3",
        description:
          "Mampu membuat laporan analisis Business Intelligence menggunakan tools visualisasi data",
        grade: "B+",
        weight: 0.8,
      },
    ],
  },
  // ── Semester 8 ──
  {
    id: "MK-16",
    name: "Skripsi",
    semester: 8,
    sks: 6,
    clos: [
      {
        code: "CLO1",
        description:
          "Mampu mengidentifikasi masalah penelitian yang relevan dan merumuskan solusi berbasis ilmu komputer",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO2",
        description:
          "Mampu menyusun literature review yang komprehensif dan membangun landasan teori yang kuat",
        grade: "A-",
        weight: 0.9,
      },
      {
        code: "CLO3",
        description:
          "Mampu merancang, mengimplementasikan, dan mengevaluasi solusi secara sistematis dan terukur",
        grade: "A",
        weight: 1.0,
      },
      {
        code: "CLO4",
        description:
          "Mampu mempresentasikan dan mempertahankan hasil penelitian secara ilmiah di hadapan dewan penguji",
        grade: "A",
        weight: 1.0,
      },
    ],
  },
];

/* ── Student Profile Data ── */
const studentData = {
  name: "Ahmad Rizki Pratama",
  nim: "21120123120001",
  prodi: "Teknik Informatika",
  fakultas: "Fakultas Ilmu Komputer",
  angkatan: 2023,
  status: "Aktif" as const,
  dosenWali: "Dr. Ir. Bambang Setiawan, M.Kom.",
  email: "ahmad.rizki@students.univ.ac.id",
};

function gradeColor(grade: string) {
  if (grade.startsWith("A")) return "text-green-700 bg-green-50";
  if (grade.startsWith("B")) return "text-blue-700 bg-blue-50";
  return "text-tertiary bg-tertiary-fixed";
}

function gradeToNumeric(grade: string): number {
  const map: Record<string, number> = {
    A: 4.0,
    "A-": 3.7,
    "B+": 3.3,
    B: 3.0,
    "B-": 2.7,
    "C+": 2.3,
    C: 2.0,
    "C-": 1.7,
    D: 1.0,
    E: 0,
  };
  return map[grade] ?? 0;
}

export default function ProfilePage() {
  const [expandedCourse, setExpandedCourse] = useState<string | null>(
    coursesData[0].id,
  );
  const [filterSemester, setFilterSemester] = useState("all");
  const [showChangePassword, setShowChangePassword] = useState(false);

  const totalCLOs = coursesData.reduce((acc, c) => acc + c.clos.length, 0);
  const allGrades = coursesData.flatMap((c) =>
    c.clos.map((cl) => gradeToNumeric(cl.grade)),
  );
  const avgGPA = (
    allGrades.reduce((a, b) => a + b, 0) / allGrades.length
  ).toFixed(2);

  const semesters = [...new Set(coursesData.map((c) => c.semester))].sort();
  const filteredCourses =
    filterSemester === "all"
      ? coursesData
      : coursesData.filter((c) => c.semester === Number(filterSemester));

  return (
    <>
      <ChangePasswordModal
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
      />

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-headline text-3xl font-bold text-on-background">
            Profil Mahasiswa
          </h1>
          <p className="font-body text-on-surface-variant">
            Informasi mahasiswa, data akademik, dan capaian pembelajaran per
            mata kuliah.
          </p>
        </div>

        {/* Student Profile Card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border p-6 relative">
          <button
            type="button"
            onClick={() => setShowChangePassword(true)}
            className="absolute top-4 right-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-label text-xs font-semibold text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors"
          >
            <Icon name="lock_reset" size={16} />
            Ganti Password
          </button>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="shrink-0 w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
              <span className="font-headline text-3xl font-bold text-on-primary">
                {studentData.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")}
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Nama Lengkap
                </p>
                <p className="font-body text-sm font-semibold text-on-background">
                  {studentData.name}
                </p>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  NIM
                </p>
                <p className="font-body text-sm font-semibold text-on-background">
                  {studentData.nim}
                </p>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Program Studi
                </p>
                <p className="font-body text-sm font-semibold text-on-background">
                  {studentData.prodi}
                </p>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Fakultas
                </p>
                <p className="font-body text-sm font-semibold text-on-background">
                  {studentData.fakultas}
                </p>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Angkatan
                </p>
                <p className="font-body text-sm font-semibold text-on-background">
                  {studentData.angkatan}
                </p>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Status
                </p>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-label text-xs font-bold text-green-700 bg-green-50">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
                  {studentData.status}
                </span>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Dosen Wali
                </p>
                <p className="font-body text-sm font-semibold text-on-background">
                  {studentData.dosenWali}
                </p>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  Email
                </p>
                <p className="font-body text-sm font-semibold text-on-background">
                  {studentData.email}
                </p>
              </div>
              <div>
                <p className="font-label text-[11px] uppercase tracking-wider text-on-surface-variant">
                  IPK
                </p>
                <p className="font-headline text-xl font-bold text-primary">
                  {avgGPA}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <div className="w-10 h-10 bg-primary-fixed rounded-xl flex items-center justify-center mb-3">
              <Icon name="menu_book" className="text-primary" size={20} />
            </div>
            <p className="font-label text-xs text-on-surface-variant">
              Mata Kuliah
            </p>
            <p className="font-headline text-2xl font-bold text-on-background">
              {coursesData.length}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">
              <Icon name="school" className="text-green-700" size={20} />
            </div>
            <p className="font-label text-xs text-on-surface-variant">
              Total CLO
            </p>
            <p className="font-headline text-2xl font-bold text-on-background">
              {totalCLOs}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <Icon name="trending_up" className="text-blue-700" size={20} />
            </div>
            <p className="font-label text-xs text-on-surface-variant">
              Rata-rata Nilai
            </p>
            <p className="font-headline text-2xl font-bold text-on-background">
              {avgGPA}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-5 shadow-ambient ghost-border">
            <div className="w-10 h-10 bg-tertiary-fixed rounded-xl flex items-center justify-center mb-3">
              <Icon name="emoji_events" className="text-tertiary" size={20} />
            </div>
            <p className="font-label text-xs text-on-surface-variant">
              Total SKS
            </p>
            <p className="font-headline text-2xl font-bold text-on-background">
              {coursesData.reduce((a, c) => a + c.sks, 0)}
            </p>
          </div>
        </div>

        {/* Filter Tabs + Courses Table — satu card */}
        <div className="bg-surface-container-lowest rounded-2xl shadow-ambient ghost-border overflow-hidden">
          {/* Tab header menempel di atas tabel */}
          <Tabs
            value={filterSemester}
            onValueChange={setFilterSemester}
            className="border-b border-outline-variant bg-surface-container-low"
          >
            <TabsList className="w-full rounded-none bg-transparent h-auto p-0 gap-0">
              <TabsTrigger
                value="all"
                className="flex-1 rounded-none px-5 h-11 border-b-2 border-transparent -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-none whitespace-nowrap font-medium"
              >
                Semua
              </TabsTrigger>
              {semesters.map((s) => (
                <TabsTrigger
                  key={s}
                  value={String(s)}
                  className="flex-1 rounded-none px-5 h-11 border-b-2 border-transparent -mb-px data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-surface-container-lowest data-[state=active]:shadow-none whitespace-nowrap font-medium"
                >
                  Semester {s}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Courses Table */}
          <Table>
            <TableHeader>
              <TableRow className="bg-surface-container-low hover:bg-surface-container-low">
                <TableHead className="w-18">Kode</TableHead>
                <TableHead>Mata Kuliah</TableHead>
                <TableHead className="w-20 text-center">Semester</TableHead>
                <TableHead className="w-16 text-center">SKS</TableHead>
                <TableHead className="w-16 text-center">CLO</TableHead>
                <TableHead className="w-24 text-center">Nilai</TableHead>
                <TableHead className="w-12 text-right">
                  {/* expand */}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => {
                const isExpanded = expandedCourse === course.id;
                const courseAvg =
                  course.clos.reduce(
                    (sum, clo) => sum + gradeToNumeric(clo.grade),
                    0,
                  ) / course.clos.length;
                const avgLetter =
                  courseAvg >= 3.7
                    ? "A"
                    : courseAvg >= 3.3
                      ? "B+"
                      : courseAvg >= 3.0
                        ? "B"
                        : courseAvg >= 2.7
                          ? "B-"
                          : courseAvg >= 2.3
                            ? "C+"
                            : courseAvg >= 2.0
                              ? "C"
                              : "D";

                return (
                  <React.Fragment key={course.id}>
                    {/* Course Row */}
                    <TableRow
                      onClick={() =>
                        setExpandedCourse(isExpanded ? null : course.id)
                      }
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <span className="font-label text-[11px] font-bold text-primary bg-primary-fixed/60 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {course.id}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-body text-sm font-medium text-on-background">
                          {course.name}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-label text-sm text-on-surface-variant">
                          {course.semester}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-label text-sm text-on-surface-variant">
                          {course.sks}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-label text-sm font-bold text-on-background">
                          {course.clos.length}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label text-xs font-bold ${gradeColor(avgLetter)}`}
                        >
                          {avgLetter}
                          <span className="font-normal text-[10px] opacity-70">
                            ({courseAvg.toFixed(1)})
                          </span>
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Icon
                          name={isExpanded ? "expand_less" : "expand_more"}
                          className="text-on-surface-variant"
                          size={20}
                        />
                      </TableCell>
                    </TableRow>

                    {/* Expanded CLO Detail Rows — always rendered, animated via CSS */}
                    <TableRow
                      className={`bg-surface-container-low/50 hover:bg-surface-container-low/50 ${
                        isExpanded ? "" : "border-0"
                      }`}
                    >
                      <TableCell colSpan={7} className="p-0 border-0">
                        <div
                          className={`grid transition-all duration-300 ease-in-out ${
                            isExpanded
                              ? "grid-rows-[1fr] opacity-100"
                              : "grid-rows-[0fr] opacity-0"
                          }`}
                        >
                          <div className="overflow-hidden">
                            <div className="py-2 px-4">
                              <span className="font-label text-[10px] uppercase tracking-wider text-on-surface-variant">
                                Course Learning Outcomes (CLO)
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                    {course.clos.map((clo) => (
                      <TableRow
                        key={`${course.id}-${clo.code}`}
                        className={`bg-surface-container-low/30 hover:bg-surface-container-low/50 ${
                          isExpanded ? "" : "border-0"
                        }`}
                      >
                        <TableCell colSpan={5} className="p-0 border-0">
                          <div
                            className={`grid transition-all duration-300 ease-in-out ${
                              isExpanded
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="pl-14 py-3 pr-4 flex items-center gap-2">
                                <span className="font-label text-xs font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded whitespace-nowrap">
                                  {clo.code}
                                </span>
                                <span className="font-body text-sm text-on-surface-variant">
                                  {clo.description}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-0 border-0 text-center">
                          <div
                            className={`grid transition-all duration-300 ease-in-out ${
                              isExpanded
                                ? "grid-rows-[1fr] opacity-100"
                                : "grid-rows-[0fr] opacity-0"
                            }`}
                          >
                            <div className="overflow-hidden">
                              <div className="py-3 px-4">
                                <span
                                  className={`inline-flex px-2.5 py-1 rounded-full font-label text-xs font-bold ${gradeColor(
                                    clo.grade,
                                  )}`}
                                >
                                  {clo.grade}
                                </span>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-0 border-0" />
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <Icon
              name="school"
              className="text-outline mx-auto mb-4"
              size={48}
            />
            <p className="font-headline text-lg text-on-surface-variant">
              Tidak ada mata kuliah untuk semester ini
            </p>
          </div>
        )}
      </div>
    </>
  );
}
