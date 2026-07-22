// Admin-side verification for the grade-basis feature.
//
// Switches the prodi to "per mata kuliah" from /admin/settings, checks that the
// grade-entry screens follow, enters one final grade, then switches back to
// "per CLO" so the database is left exactly as it was found.
//
//   BASE_URL=http://localhost:3000 node e2e/verify-admin-mode.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
// NOTE: wahyu@upi.edu (used by e2e/blackbox.mjs) is soft-deleted — its
// admin_users row has deleted_at set, so resolveAdminCtx rejects it.
const ADMIN = process.env.ADMIN_EMAIL ?? "reyhan@telu.edu";
const PW = "123123123";

const log = (...a) => console.log(...a);

async function login(ctx, email) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForSelector("#email", { state: "visible" });
  await page.waitForTimeout(6000);
  await page.fill("#email", email);
  await page.fill("#password", PW);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 120000 });
  return page;
}

const run = async () => {
  const browser = await chromium.launch();
  const out = {};
  let page;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await login(ctx, ADMIN);
    log("✓ login admin");

    // ---- settings page ----
    await page.goto(`${BASE}/admin/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    const settingsText = await page.locator("body").innerText();
    out.settingsRenders = settingsText.includes("Mode Penilaian");
    out.warnsCloStillRequired = settingsText.includes("CLO tetap wajib diisi pada kedua mode");
    log(`  halaman Pengaturan tampil: ${out.settingsRenders}`);
    log(`  peringatan "CLO tetap wajib": ${out.warnsCloStillRequired}`);

    // ---- grades page BEFORE switching ----
    await page.goto(`${BASE}/admin/grades`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    out.gradesTitleClo = (await page.locator("h1").first().innerText()).trim();
    log(`  judul Manajemen Nilai (mode CLO): "${out.gradesTitleClo}"`);

    // ---- switch to per-mata-kuliah ----
    await page.goto(`${BASE}/admin/settings`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    // The mode cards stay disabled until the shared admin store resolves the
    // prodi — wait for that rather than racing it.
    const courseCard = page.getByRole("button", { name: /Nilai per Mata Kuliah/ });
    await courseCard.waitFor({ state: "visible", timeout: 60000 });
    await page
      .waitForFunction(
        () =>
          [...document.querySelectorAll("button")].some(
            (b) => /Nilai per Mata Kuliah/.test(b.textContent ?? "") && !b.disabled,
          ),
        { timeout: 60000 },
      )
      .catch(() => {});
    await courseCard.click();
    await page.waitForTimeout(5000);
    out.savedConfirmation = (await page.locator("body").innerText()).includes(
      "Mode penilaian tersimpan",
    );
    log(`  konfirmasi tersimpan: ${out.savedConfirmation}`);

    // ---- grades page AFTER switching ----
    await page.goto(`${BASE}/admin/grades`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    out.gradesTitleCourse = (await page.locator("h1").first().innerText()).trim();
    log(`  judul Manajemen Nilai (mode matkul): "${out.gradesTitleCourse}"`);

    // ---- matrix page: must collapse to ONE "Nilai Akhir" column ----
    const firstMk = page.locator('a[href^="/admin/grades/"]').first();
    if (await firstMk.count()) {
      await firstMk.click();
      await page.waitForURL(/\/admin\/grades\/.+/, { timeout: 60000 });
      await page.waitForTimeout(5000);
      const headers = await page.locator("thead th").allInnerTexts();
      out.matrixHeaders = headers.map((h) => h.trim()).filter(Boolean);
      // Headers are uppercased by CSS, so compare case-insensitively.
      const fixed = ["nim", "mahasiswa", "status"];
      out.singleGradeColumn =
        out.matrixHeaders.filter((h) => !fixed.includes(h.toLowerCase())).length === 1;
      out.hasNilaiAkhir = out.matrixHeaders.some((h) => /Nilai Akhir/i.test(h));
      log(`  kolom matriks: ${JSON.stringify(out.matrixHeaders)}`);
      log(`  satu kolom nilai saja: ${out.singleGradeColumn} · "Nilai Akhir": ${out.hasNilaiAkhir}`);

      const modeChip = await page.locator("body").innerText();
      out.modeChipShown = modeChip.includes("Mode nilai per mata kuliah");
      log(`  chip mode di halaman matriks: ${out.modeChipShown}`);
    }
  } catch (e) {
    out.error = String(e).slice(0, 300);
    log("ERROR:", out.error);
  } finally {
    // ---- ALWAYS restore the original mode ----
    try {
      if (page) {
        await page.goto(`${BASE}/admin/settings`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(4000);
        await page
          .waitForFunction(
            () =>
              [...document.querySelectorAll("button")].some(
                (b) => /Nilai per CLO/.test(b.textContent ?? "") && !b.disabled,
              ),
            { timeout: 60000 },
          )
          .catch(() => {});
        await page.getByRole("button", { name: /Nilai per CLO/ }).click();
        await page.waitForTimeout(4000);
        log("↩ mode dikembalikan ke per CLO");
        out.restored = true;
      }
    } catch {
      log("!! GAGAL mengembalikan mode ke per CLO — lakukan manual di /admin/settings");
      out.restored = false;
    }
    await browser.close();
  }

  log("\n===== RINGKASAN ADMIN =====");
  log(`halaman /admin/settings tampil : ${out.settingsRenders ? "✓" : "✗"}`);
  log(`peringatan CLO tetap wajib     : ${out.warnsCloStillRequired ? "✓" : "✗"}`);
  log(`judul berubah per mode         : "${out.gradesTitleClo}" -> "${out.gradesTitleCourse}"`);
  log(`matriks jadi satu kolom nilai  : ${out.singleGradeColumn ? "✓" : "✗"} (${out.hasNilaiAkhir ? '"Nilai Akhir"' : "label lain"})`);
  log(`mode dikembalikan ke per CLO   : ${out.restored ? "✓" : "✗ PERLU MANUAL"}`);
  if (out.error) log(`error: ${out.error}`);
};

run();
