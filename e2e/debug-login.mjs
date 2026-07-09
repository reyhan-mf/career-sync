import { chromium } from "@playwright/test";
const BASE = "http://127.0.0.1:3000";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
page.on("console", (m) => console.log("CONSOLE:", m.type(), m.text()));
page.on("pageerror", (e) => console.log("PAGEERROR:", e.message));
page.on("requestfailed", (r) => console.log("REQFAIL:", r.url(), r.failure()?.errorText));

await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
await page.waitForLoadState("networkidle").catch(() => {});
await page.waitForTimeout(4000);

// Is React hydrated? Test the show-password toggle (a client onClick).
const before = await page.locator("#password").getAttribute("type");
await page.locator('button[type="button"]').first().click().catch(() => {});
await page.waitForTimeout(300);
const after = await page.locator("#password").getAttribute("type");
console.log(`HYDRATION CHECK: password type ${before} -> ${after} (changed = hydrated)`);

await page.fill("#email", "reyhan.3du@upi.edu");
await page.fill("#password", "123123123");
console.log("submitting...");
await page.click('button[type="submit"]');
await page.waitForTimeout(6000);
console.log("URL after submit:", page.url());
const err = await page.locator(".bg-error-container").first().textContent().catch(() => null);
console.log("visible error box:", err);
await page.screenshot({ path: "e2e/screenshots/_debug-login.png", fullPage: true });
await browser.close();
