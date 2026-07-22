// Verifies the grade-basis toggles on the LIST screens:
//   - /student/job-matching        (segmented toggle, re-ranks the student's jobs)
//   - /hr/talent-pool              (basis select, re-ranks the "Top N%" cards)
//   - /hr/talent-pool/[jobId]      (basis select, re-ranks the candidate table)
//
// Use localhost, not 127.0.0.1 — Next dev blocks /_next from 127.0.0.1 and the
// page never hydrates:
//   BASE_URL=http://localhost:3000 node e2e/verify-basis-toggles.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PW = "123123123";
const STUDENT = "reyhan.3du@upi.edu";
const HR = "alisya@crht.com";
// Job whose two bases differ noticeably (CLO 47 vs course 37).
const JOB = process.env.TARGET_JOB ?? "c2d71340-9b34-449f-8224-a47e1c8e816a";

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

// The match badge on each job card of /student/job-matching.
async function readJobCardScores(page) {
  await page.waitForTimeout(2500);
  const texts = await page.locator('a[href^="/student/jobs/"]').allInnerTexts();
  return texts
    .map((t) => {
      const m = t.match(/(\d+)\s*%/);
      return m ? Number(m[1]) : null;
    })
    .filter((v) => v != null)
    .slice(0, 8);
}

// Pick a shadcn Select by its current label, then choose an option.
async function chooseSelect(page, currentLabel, optionLabel) {
  const trigger = page.locator("button", { hasText: currentLabel }).first();
  await trigger.click();
  await page.getByRole("option", { name: optionLabel, exact: true }).click();
  await page.waitForTimeout(2500);
}

const run = async () => {
  const browser = await chromium.launch();
  const out = {};
  try {
    // ---------------- STUDENT: job-matching toggle ----------------
    const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(sctx, STUDENT);
    log("✓ login mahasiswa");
    await page.goto(`${BASE}/student/job-matching`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);

    out.studentToggleFound =
      (await page.getByRole("button", { name: /Nilai Mata Kuliah/ }).count()) > 0;
    out.scoresClo = await readJobCardScores(page);
    log(`  toggle di job-matching: ${out.studentToggleFound}`);
    log(`  skor 8 kartu (CLO)   : ${JSON.stringify(out.scoresClo)}`);

    if (out.studentToggleFound) {
      await page.getByRole("button", { name: /Nilai Mata Kuliah/ }).click();
      await page.waitForTimeout(6000); // scores are refetched from the RPC
      out.scoresCourse = await readJobCardScores(page);
      log(`  skor 8 kartu (MATKUL): ${JSON.stringify(out.scoresCourse)}`);
      out.studentScoresChanged =
        JSON.stringify(out.scoresClo) !== JSON.stringify(out.scoresCourse);

      // The choice must survive navigation to the job detail screen.
      const firstJob = page.locator('a[href^="/student/jobs/"]').first();
      await firstJob.click();
      await page.waitForURL(/\/student\/jobs\//, { timeout: 60000 });
      await page.waitForTimeout(3500);
      await page.getByRole("button", { name: /Analisis Kompetensi/i }).click();
      await page.waitForTimeout(2500);
      const pressed = await page
        .getByRole("button", { name: "Per Mata Kuliah", exact: true })
        .getAttribute("aria-pressed");
      out.studentBasisPersists = pressed === "true";
      log(`  pilihan bertahan ke detail: ${out.studentBasisPersists}`);
    }
    await sctx.close();

    // ---------------- HR: talent pool selects ----------------
    const hctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const hpage = await login(hctx, HR);
    log("✓ login HR");

    await hpage.goto(`${BASE}/hr/talent-pool/${JOB}`, { waitUntil: "domcontentloaded" });
    await hpage.waitForTimeout(6000);
    out.hrSelectFound = (await hpage.locator("button", { hasText: "Nilai: Sesuai Prodi" }).count()) > 0;
    log(`  select basis di talent pool: ${out.hrSelectFound}`);

    const readTable = async () => {
      const rows = await hpage.locator("tbody tr").allInnerTexts();
      return rows
        .map((t) => {
          const m = t.match(/(\d+)%/);
          return m ? Number(m[1]) : null;
        })
        .filter((v) => v != null);
    };
    out.hrScoresAuto = await readTable();
    log(`  skor kandidat (Sesuai Prodi) : ${JSON.stringify(out.hrScoresAuto)}`);

    if (out.hrSelectFound) {
      await chooseSelect(hpage, "Nilai: Sesuai Prodi", "Nilai: Per Mata Kuliah");
      out.hrScoresCourse = await readTable();
      out.hrBannerShown = (await hpage.locator("body").innerText()).includes(
        "Peringkat dibobot",
      );
      log(`  skor kandidat (Per Matkul)   : ${JSON.stringify(out.hrScoresCourse)}`);
      log(`  banner penjelasan tampil     : ${out.hrBannerShown}`);
      out.hrScoresChanged =
        JSON.stringify(out.hrScoresAuto) !== JSON.stringify(out.hrScoresCourse);

      // Selection is shared with the job-picker page. Navigate in-app (the
      // store lives in memory, so a hard reload legitimately resets it to the
      // "Sesuai Prodi" default).
      // Client-side nav fires no `load` event, so poll the URL instead of
      // using waitForURL (which waits for one by default).
      await hpage.locator('a[href="/hr/talent-pool"]').first().click();
      await hpage
        .waitForFunction(() => location.pathname === "/hr/talent-pool", { timeout: 30000 })
        .catch(() => {});
      await hpage.waitForTimeout(5000);
      out.pickerUrl = hpage.url();
      out.pickerSelectFound =
        (await hpage.locator("button", { hasText: "Nilai: Per Mata Kuliah" }).count()) > 0;
      log(`  pilihan tersinkron ke halaman pemilih: ${out.pickerSelectFound}`);
    }
    await hctx.close();
  } catch (e) {
    out.error = String(e).slice(0, 300);
    log("ERROR:", out.error);
  } finally {
    await browser.close();
  }

  log("\n===== RINGKASAN TOGGLE =====");
  log(`toggle di /student/job-matching     : ${out.studentToggleFound ? "ada ✓" : "TIDAK ADA ✗"}`);
  log(`toggle mengubah peringkat mahasiswa : ${out.studentScoresChanged ? "YA ✓" : "tidak ✗"}`);
  log(`pilihan bertahan ke detail lowongan : ${out.studentBasisPersists ? "YA ✓" : "tidak ✗"}`);
  log(`select basis di talent pool HR      : ${out.hrSelectFound ? "ada ✓" : "TIDAK ADA ✗"}`);
  log(`select mengubah peringkat HR        : ${out.hrScoresChanged ? "YA ✓" : "tidak ✗"}`);
  log(`banner penjelasan basis             : ${out.hrBannerShown ? "✓" : "✗"}`);
  log(`tersinkron ke halaman pemilih       : ${out.pickerSelectFound ? "✓" : "✗"}`);
  if (out.error) log(`error: ${out.error}`);
};

run();
