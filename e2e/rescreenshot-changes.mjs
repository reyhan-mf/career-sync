// Re-screenshot only the pages touched by: talent-pool redesign, sidebar
// cleanup (Bantuan removed everywhere; Notifikasi removed for admin/superadmin),
// and superadmin admins page (Status Integrasi removed, Reset Password added).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3000";
const OUT = "e2e/screenshots";
mkdirSync(OUT, { recursive: true });

async function shot(page, name, label) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`  [ok] ${label}  ->  ${page.url()}`);
}

async function login(ctx, email, password) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForSelector("#email", { state: "visible" });
  await page.waitForTimeout(1500);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 90000 });
  return page;
}

const browser = await chromium.launch();
try {
  // ---------- HR ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(ctx, "alisya@crht.com", "123123123");
    await shot(page, "hr-dashboard-new", "HR · Dashboard (sidebar tanpa Bantuan)");

    await page.goto(`${BASE}/hr/talent-pool`, { waitUntil: "domcontentloaded" });
    await shot(page, "hr-talent-pool-picker-new", "HR · Talent Pool (pemilih lowongan)");

    const firstJobCard = page.locator('a[href^="/hr/talent-pool/"]').first();
    if (await firstJobCard.count()) {
      await firstJobCard.click();
      await shot(page, "hr-talent-pool-job-new", "HR · Talent Pool per Lowongan");

      const firstTalent = page.locator('button[title="Lihat detail"]').first();
      if (await firstTalent.count()) {
        await firstTalent.click();
        await page.waitForTimeout(800);
        await shot(page, "hr-talent-pool-job-detail-modal-new", "HR · Talent Pool per Lowongan (modal detail)");
      }
    }

    await page.goto(`${BASE}/hr/profile`, { waitUntil: "domcontentloaded" });
    await shot(page, "hr-profile-new", "HR · Profil (2FA dihapus)");
    await ctx.close();
  }

  // ---------- ADMIN PRODI ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(ctx, "alfiansyah@telu.edu", "123123123");
    await shot(page, "admin-dashboard-new", "Admin · Dashboard (sidebar tanpa Bantuan/Notifikasi)");
    await ctx.close();
  }

  // ---------- SUPERADMIN ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(ctx, "reyhan@superadmin.com", "superadmin123");
    await shot(page, "superadmin-dashboard-new", "Superadmin · Dashboard (sidebar tanpa Bantuan/Notifikasi)");
    await page.goto(`${BASE}/superadmin/admins`, { waitUntil: "domcontentloaded" });
    await shot(page, "superadmin-admins-new", "Superadmin · Kelola Admin Prodi (tanpa Status Integrasi)");
    await ctx.close();
  }

  console.log("\nRe-screenshot selesai.");
} finally {
  await browser.close();
}
