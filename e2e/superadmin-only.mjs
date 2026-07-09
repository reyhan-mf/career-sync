// Capture the SUPERADMIN role screens (the 4th role, previously blocked on creds).
import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";

const BASE = "http://127.0.0.1:3000";
const OUT = "e2e/screenshots";
mkdirSync(OUT, { recursive: true });
let n = 19; // continue after HR (…19)

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
  const page = await login(ctx, "reyhan@superadmin.com", "superadmin123");
  await shot(page, "superadmin-dashboard", "Superadmin · Dashboard Sistem");
  await page.goto(`${BASE}/superadmin/admins`, { waitUntil: "domcontentloaded" });
  await shot(page, "superadmin-admins", "Superadmin · Kelola Admin Prodi & Prodi");
  await ctx.close();
  console.log("\nSUPERADMIN done.");
} finally {
  await browser.close();
}
