// Live black-box E2E: logs in through the real UI as each role and captures
// full-page screenshots of every key screen. Run against the dev server (:3000).
//   node e2e/blackbox.mjs
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const OUT = "e2e/screenshots";
mkdirSync(OUT, { recursive: true });

const results = [];
let n = 0;

async function shot(page, name, label) {
  n += 1;
  const id = String(n).padStart(2, "0");
  const file = `${OUT}/${id}-${name}.png`;
  // let client-side data providers settle
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: file, fullPage: true });
  const url = page.url();
  console.log(`  [${id}] ${label}  ->  ${url}`);
  results.push({ id, label, url, file });
}

async function login(context, email, password) {
  const page = await context.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForSelector("#email", { state: "visible" });
  // Give React time to hydrate so the submit is handled client-side (SPA
  // redirect) instead of a native form GET. First dev-compile is slow.
  await page.waitForTimeout(3000);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 90000 });
  return page;
}

async function run() {
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
      await shot(page, "student-jobmatching", "Mahasiswa · Job Matching (skor kecocokan)");
      // open first job detail
      const firstJob = page.locator('a[href^="/student/jobs/"]').first();
      if (await firstJob.count()) {
        await firstJob.click();
        await shot(page, "student-job-detail", "Mahasiswa · Detail Lowongan (ring skor)");
        const analysisTab = page.getByRole("button", { name: /Analisis Kompetensi/i });
        if (await analysisTab.count()) {
          await analysisTab.click();
          await shot(page, "student-competency", "Mahasiswa · Analisis Kompetensi (breakdown)");
        }
      }
      await page.goto(`${BASE}/student/applications`, { waitUntil: "domcontentloaded" });
      await shot(page, "student-applications", "Mahasiswa · Lacak Lamaran");
      await page.goto(`${BASE}/student/invitations`, { waitUntil: "domcontentloaded" });
      await shot(page, "student-invitations", "Mahasiswa · Undangan Talent");
      await ctx.close();
    }

    // ---------- ADMIN PRODI ----------
    {
      const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      const page = await login(ctx, "wahyu@upi.edu", "123123123");
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
        await shot(page, "admin-grades-matrix", "Admin · Matriks Penilaian (mhs × CLO)");
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
      await shot(page, "hr-talent-pool", "HR · Talent Pool");
      await page.goto(`${BASE}/hr/profile`, { waitUntil: "domcontentloaded" });
      await shot(page, "hr-profile", "HR · Profil Perusahaan");
      await ctx.close();
    }

    console.log(`\nDONE. ${results.length} screenshots ->  ${OUT}`);
  } finally {
    await browser.close();
  }
}

run().catch((e) => {
  console.error("E2E FAILED:", e);
  process.exit(1);
});
