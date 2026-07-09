// Re-run only the ADMIN flow with the active admin account (alfiansyah@telu.edu,
// prodi 84a4936f which owns the 46 matkul + 157 CLO + graded students).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:3000";
const OUT = "e2e/screenshots";
mkdirSync(OUT, { recursive: true });
let n = 7; // continue numbering after the 07 student shots; overwrite 08-11

async function shot(page, name, label) {
  n += 1;
  const id = String(n).padStart(2, "0");
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);
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
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await login(ctx, "alfiansyah@telu.edu", "123123123");
  await shot(page, "admin-dashboard", "Admin · Dashboard Prodi");
  await page.goto(`${BASE}/admin/users`, { waitUntil: "domcontentloaded" });
  await shot(page, "admin-users", "Admin · Kelola Mahasiswa");
  await page.goto(`${BASE}/admin/clo`, { waitUntil: "domcontentloaded" });
  await shot(page, "admin-clo-list", "Admin · Daftar Mata Kuliah (CLO)");
  const firstMk = page.locator('a[href^="/admin/clo/"]').first();
  if (await firstMk.count()) { await firstMk.click(); await shot(page, "admin-clo-detail", "Admin · Kelola CLO per Matkul"); }
  await page.goto(`${BASE}/admin/grades`, { waitUntil: "domcontentloaded" });
  await shot(page, "admin-grades-list", "Admin · Daftar Matkul (Nilai)");
  const firstGr = page.locator('a[href^="/admin/grades/"]').first();
  if (await firstGr.count()) { await firstGr.click(); await shot(page, "admin-grades-matrix", "Admin · Matriks Penilaian (mhs × CLO)"); }
  await ctx.close();
  console.log("\nADMIN re-run done.");
} finally {
  await browser.close();
}
