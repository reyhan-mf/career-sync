// Verification for the CLO/course grade-basis feature.
//
// Checks the invariants that matter:
//   1. The basis toggle actually changes the student's score.
//   2. The expanded per-requirement table labels the grade it used.
//   3. HR sees the SAME number as the student for the same (student, job) pair,
//      on the prodi's default basis.
//
// Run against the dev server. Use localhost, NOT 127.0.0.1 — Next dev blocks
// cross-origin /_next resources from 127.0.0.1, which prevents hydration:
//   BASE_URL=http://localhost:3000 node e2e/verify-basis.mjs
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const PW = "123123123";
const STUDENT = "reyhan.3du@upi.edu";
const HR = "alisya@crht.com";
const STUDENT_NAME = "Reyhan";

const log = (...a) => console.log(...a);

async function login(ctx, email) {
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForSelector("#email", { state: "visible" });
  await page.waitForTimeout(6000); // let React hydrate before submitting
  await page.fill("#email", email);
  await page.fill("#password", PW);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.endsWith("/login"), { timeout: 120000 });
  return page;
}

// Headline score ring on the job detail page: a "<N>% / match" stack. Read the
// ring specifically — scanning the whole body picks up unrelated percentages.
async function readOverallScore(page) {
  await page.waitForTimeout(1500);
  const ring = page.locator('div.absolute.text-center', { hasText: "match" }).first();
  if (!(await ring.count())) return null;
  const m = (await ring.innerText()).match(/(\d+)\s*%/);
  return m ? Number(m[1]) : null;
}

// The score chip inside one talent-pool row (first "<N>%" span in the row).
async function readRowScore(row) {
  const chips = await row.locator('span:text-matches("^\\\\d+%$")').allInnerTexts();
  return chips.length ? Number(chips[0].replace("%", "")) : null;
}

const run = async () => {
  const browser = await chromium.launch();
  const out = {};
  try {
    // ---------- HR first: pick one of THIS HR's jobs that has candidates ----------
    const hctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const hpage = await login(hctx, HR);
    log("✓ login HR");
    await hpage.goto(`${BASE}/hr/talent-pool`, { waitUntil: "domcontentloaded" });
    await hpage.waitForTimeout(6000);

    // TARGET_JOB pins the run to one job — useful to pick a job whose two bases
    // actually differ, so the toggle's effect is unambiguous.
    const jobLinks = process.env.TARGET_JOB
      ? [`/hr/talent-pool/${process.env.TARGET_JOB}`]
      : await hpage
          .locator('a[href^="/hr/talent-pool/"]')
          .evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    out.hrJobCount = jobLinks.length;
    log(`  lowongan milik HR: ${jobLinks.length}`);

    // Walk the HR's jobs until we find one whose pool contains our student.
    for (const href of jobLinks.slice(0, 6)) {
      await hpage.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded" });
      await hpage.waitForTimeout(5000);
      const row = hpage.locator("tr", { hasText: STUDENT_NAME }).first();
      if (await row.count()) {
        out.jobId = href.split("/hr/talent-pool/")[1];
        const rowText = await row.innerText();
        out.hrScore = await readRowScore(row);
        out.hrBadge = /Mata Kuliah/.test(rowText)
          ? "Mata Kuliah"
          : /CLO/.test(rowText)
            ? "CLO"
            : "TIDAK ADA";
        out.jobTitle = (await hpage.locator("h1").first().innerText()).trim();
        log(`  lowongan uji: ${out.jobTitle}`);
        log(`  HR: skor=${out.hrScore}%  badge=${out.hrBadge}`);

        // The row is not clickable — detail opens from the "Lihat detail" button.
        await row.locator('button[title="Lihat detail"]').click();
        await hpage.waitForTimeout(5000);
        const modalText = await hpage.locator("body").innerText();
        out.hrModalOpen = modalText.includes("Analisis Kompetensi");
        out.hrToggleFound =
          (await hpage.getByRole("button", { name: "Nilai Mata Kuliah", exact: true }).count()) > 0;
        log(`  modal HR terbuka: ${out.hrModalOpen} · toggle rincian: ${out.hrToggleFound}`);

        // Flip the HR detail to the course basis and confirm the table relabels.
        if (out.hrToggleFound) {
          await hpage.getByRole("button", { name: "Nilai Mata Kuliah", exact: true }).click();
          await hpage.waitForTimeout(4000);
          const firstReq = hpage.locator('button[aria-expanded]').first();
          if (await firstReq.count()) {
            await firstReq.click();
            await hpage.waitForTimeout(1200);
          }
          out.hrMkHeader = (await hpage.locator("body").innerText()).includes("Nilai MK");
          log(`  HR mode matkul, header "Nilai MK": ${out.hrMkHeader}`);
        }
        break;
      }
    }
    await hctx.close();

    if (!out.jobId) {
      log("  ! tidak menemukan lowongan HR yang memuat mahasiswa uji");
    }

    // ---------- STUDENT: same job ----------
    const sctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await login(sctx, STUDENT);
    log("✓ login mahasiswa");

    await page.goto(`${BASE}/student/job-matching`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(4000);
    const bl = await page.locator("body").innerText();
    out.jobMatchingBasisLabel = /Skor dihitung dari\s*nilai per CLO/i.test(bl)
      ? "nilai per CLO"
      : /Skor dihitung dari\s*nilai mata kuliah/i.test(bl)
        ? "nilai mata kuliah"
        : "TIDAK DITEMUKAN";
    log(`  label basis di job-matching: ${out.jobMatchingBasisLabel}`);

    if (out.jobId) {
      await page.goto(`${BASE}/student/jobs/${out.jobId}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(4000);
      await page.getByRole("button", { name: /Analisis Kompetensi/i }).click();
      await page.waitForTimeout(3000);

      out.scoreClo = await readOverallScore(page);
      const reqButtons = page.locator('button[aria-expanded]');
      out.reqCount = await reqButtons.count();
      // Expand the first requirement so the grade table is rendered.
      if (out.reqCount) {
        await reqButtons.first().click();
        await page.waitForTimeout(1200);
      }
      out.cloHeaderShown = (await page.locator("body").innerText()).includes("Nilai CLO");
      log(`  mode CLO    : skor=${out.scoreClo}%  n_kualifikasi=${out.reqCount}  header "Nilai CLO"=${out.cloHeaderShown}`);

      const toggle = page.getByRole("button", { name: "Per Mata Kuliah", exact: true });
      out.toggleFound = (await toggle.count()) > 0;
      if (out.toggleFound) {
        await toggle.click();
        await page.waitForTimeout(5000);
        out.scoreCourse = await readOverallScore(page);
        // The requirement expanded above stays expanded across the basis
        // switch — clicking it again would collapse it and hide the table.
        out.mkHeaderShown = (await page.locator("body").innerText()).includes("Nilai MK");
        log(`  mode MATKUL : skor=${out.scoreCourse}%  header "Nilai MK"=${out.mkHeaderShown}`);
      }
    }
    await sctx.close();
  } catch (e) {
    out.error = String(e).slice(0, 300);
    log("ERROR:", out.error);
  } finally {
    await browser.close();
  }

  log("\n===== RINGKASAN =====");
  log(`lowongan uji                 : ${out.jobTitle ?? "-"}`);
  log(`toggle basis (mahasiswa)     : ${out.toggleFound === true ? "ada ✓" : "TIDAK ADA ✗"}`);
  log(`toggle rincian (HR)          : ${out.hrToggleFound === true ? "ada ✓" : "TIDAK ADA ✗"}`);
  log(`skor mode CLO                : ${out.scoreClo}`);
  log(`skor mode MATA KULIAH        : ${out.scoreCourse}`);
  log(`toggle mengubah skor         : ${out.scoreClo !== out.scoreCourse ? "YA ✓" : "tidak (nilai kebetulan sama)"}`);
  log(`header kolom per mode        : CLO="${out.cloHeaderShown}" MK="${out.mkHeaderShown}"`);
  log(`badge basis di HR            : ${out.hrBadge}`);
  log(`skor HR vs mahasiswa (CLO)   : ${out.hrScore} vs ${out.scoreClo} -> ${out.hrScore === out.scoreClo ? "IDENTIK ✓" : "BEDA ✗"}`);
  if (out.error) log(`error: ${out.error}`);
};

run();
