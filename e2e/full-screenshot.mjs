// Full black-box E2E screenshot pass across all 4 roles. Writes into a fresh
// e2e_new/ folder (sibling of e2e/) so it never mixes with older runs.
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "e2e_new";
mkdirSync(OUT, { recursive: true });

let n = 0;

// Skeleton placeholders all use the `animate-pulse` Tailwind class (see
// components/ui/skeleton.tsx). Poll until none remain instead of a fixed
// delay — client-side navigations (link clicks) fire their Supabase fetch
// AFTER the route change, so "networkidle" alone isn't a reliable signal.
async function waitForSkeletonsGone(page, timeout = 20000) {
  try {
    await page.waitForFunction(
      () => document.querySelectorAll(".animate-pulse").length === 0,
      { timeout },
    );
  } catch {
    console.log(`    [warn] skeleton still visible after ${timeout}ms, screenshotting anyway`);
  }
}

async function shot(page, name, label) {
  n += 1;
  const id = String(n).padStart(2, "0");
  await page.waitForLoadState("networkidle").catch(() => {});
  await waitForSkeletonsGone(page);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${id}-${name}.png`, fullPage: true });
  console.log(`  [${id}] ${label}  ->  ${page.url()}`);
}

async function login(ctx, email, password) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForSelector("#email", { state: "visible" });
  await page.waitForTimeout(2000);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 90000 });
  return page;
}

const browser = await chromium.launch();
try {
  // ---------- STUDENT ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(ctx, "reyhan.3du@upi.edu", "123123123");
    await shot(page, "student-dashboard", "Mahasiswa · Dashboard");
    await page.goto(`${BASE}/student/profile`, { waitUntil: "domcontentloaded" });
    await shot(page, "student-profile", "Mahasiswa · Profil & Transkrip");
    await page.goto(`${BASE}/student/job-matching`, { waitUntil: "domcontentloaded" });
    await shot(page, "student-jobmatching", "Mahasiswa · Job Matching");
    const firstJob = page.locator('a[href^="/student/jobs/"]').first();
    if (await firstJob.count()) {
      await firstJob.click();
      await shot(page, "student-job-detail", "Mahasiswa · Detail Lowongan");
      const analysisTab = page.getByRole("button", { name: /Analisis Kompetensi/i });
      if (await analysisTab.count()) {
        await analysisTab.click();
        await shot(page, "student-competency", "Mahasiswa · Analisis Kompetensi");
      }
    }
    await page.goto(`${BASE}/student/applications`, { waitUntil: "domcontentloaded" });
    await shot(page, "student-applications", "Mahasiswa · Lacak Lamaran");
    await page.goto(`${BASE}/student/invitations`, { waitUntil: "domcontentloaded" });
    await shot(page, "student-invitations", "Mahasiswa · Undangan Talent");
    await page.goto(`${BASE}/notifications`, { waitUntil: "domcontentloaded" });
    await shot(page, "student-notifications", "Mahasiswa · Notifikasi");
    await ctx.close();
  }

  // ---------- ADMIN PRODI ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(ctx, "alfiansyah@telu.edu", "123123123");
    await shot(page, "admin-dashboard", "Admin · Dashboard Prodi");
    await page.goto(`${BASE}/admin/users`, { waitUntil: "domcontentloaded" });
    await shot(page, "admin-users", "Admin · Kelola Mahasiswa");
    await page.goto(`${BASE}/admin/clo`, { waitUntil: "domcontentloaded" });
    await shot(page, "admin-clo-list", "Admin · Daftar Mata Kuliah (CLO)");
    const firstMk = page.locator('a[href^="/admin/clo/"]').first();
    if (await firstMk.count()) {
      await firstMk.click();
      await shot(page, "admin-clo-detail", "Admin · Kelola CLO per Matkul");
    }
    await page.goto(`${BASE}/admin/grades`, { waitUntil: "domcontentloaded" });
    await shot(page, "admin-grades-list", "Admin · Daftar Matkul (Nilai)");
    const firstGr = page.locator('a[href^="/admin/grades/"]').first();
    if (await firstGr.count()) {
      await firstGr.click();
      await shot(page, "admin-grades-matrix", "Admin · Matriks Penilaian");
    }
    await ctx.close();
  }

  // ---------- HR ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(ctx, "alisya@crht.com", "123123123");
    await shot(page, "hr-dashboard", "HR · Dashboard Rekrutmen");
    await page.goto(`${BASE}/hr/jobs`, { waitUntil: "domcontentloaded" });
    await shot(page, "hr-jobs", "HR · Kelola Lowongan");
    const firstJob = page.locator('a[href^="/hr/jobs/"]').first();
    if (await firstJob.count()) {
      await firstJob.click();
      await shot(page, "hr-job-detail", "HR · Detail Lowongan");
    }
    await page.goto(`${BASE}/hr/applicants`, { waitUntil: "domcontentloaded" });
    await shot(page, "hr-applicants", "HR · Tinjau Pelamar");

    await page.goto(`${BASE}/hr/talent-pool`, { waitUntil: "domcontentloaded" });
    await shot(page, "hr-talent-pool-picker", "HR · Talent Pool (pemilih lowongan)");
    const firstJobCard = page.locator('a[href^="/hr/talent-pool/"]').first();
    if (await firstJobCard.count()) {
      await firstJobCard.click();
      await shot(page, "hr-talent-pool-job", "HR · Talent Pool per Lowongan");
      const firstTalent = page.locator('button[title="Lihat detail"]').first();
      if (await firstTalent.count()) {
        await firstTalent.click();
        await page.waitForTimeout(800);
        await shot(page, "hr-talent-pool-job-detail", "HR · Talent Pool per Lowongan (modal)");
      }
    }

    await page.goto(`${BASE}/hr/profile`, { waitUntil: "domcontentloaded" });
    await shot(page, "hr-profile", "HR · Profil & Keamanan");
    await ctx.close();
  }

  // ---------- SUPERADMIN ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(ctx, "reyhan@superadmin.com", "superadmin123");
    await shot(page, "superadmin-dashboard", "Superadmin · Dashboard Sistem");
    await page.goto(`${BASE}/superadmin/admins`, { waitUntil: "domcontentloaded" });
    await shot(page, "superadmin-admins", "Superadmin · Kelola Admin Prodi");
    const firstEdit = page.locator('table button').first();
    if (await firstEdit.count()) {
      await firstEdit.click();
      await page.waitForTimeout(500);
      await shot(page, "superadmin-admin-edit-modal", "Superadmin · Edit Admin (Reset Password)");
    }
    await ctx.close();
  }

  console.log(`\nDONE. ${n} screenshots -> ${OUT}`);
} finally {
  await browser.close();
}
