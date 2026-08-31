#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE = "http://127.0.0.1:3000";
const OUTPUT = path.join(ROOT, "foreman/receipts/browser-proof/bvpgm-m8-copy");
const cases = [
  {
    name: "intake",
    route: "/bellows/intake",
    required: ["Continue where you left off", "Your last Intake is still here.", "Continue with my last Intake"],
    forbidden: ["Betsy walkthrough", "last local Intake", "local walkthrough storage", "Saved on Betsy only"],
    colorCheck: { selector: ".concierge-intake-page__recovery > p:not(.eyebrow)", expected: "rgb(244, 226, 177)" }
  },
  {
    name: "login",
    route: "/login",
    required: ["Pick up where you left off.", "practice member work saved in this browser"],
    forbidden: ["local server", "local test-member work on Betsy"]
  },
  {
    name: "evidence-brief",
    route: "/bellows/library/proof-before-reliance",
    required: ["Build an Evidence Brief.", "Next check or outside review"],
    forbidden: ["Next bounded check or Human Gate"]
  }
];
const viewports = [
  ["desktop", { width: 1440, height: 1000 }],
  ["mobile", { width: 390, height: 844 }]
];

fs.mkdirSync(OUTPUT, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const results = [];

try {
  for (const [viewportName, viewport] of viewports) {
    const context = await browser.newContext({ viewport });
    await context.addCookies([{
      name: "werkles_bellows_owner",
      value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
      url: BASE
    }]);
    for (const testCase of cases) {
      const page = await context.newPage();
      const runtimeErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") runtimeErrors.push(message.text());
      });
      page.on("pageerror", (error) => runtimeErrors.push(error.message));
      const response = await page.goto(`${BASE}${testCase.route}`, { waitUntil: "load", timeout: 30_000 });
      await page.waitForTimeout(250);
      const body = await page.locator("body").textContent() || "";
      const audit = await page.evaluate(() => ({
        overlay: Boolean(document.querySelector("[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay")),
        documentWidth: document.documentElement.scrollWidth,
        viewportWidth: innerWidth,
        headerLinks: [...document.querySelectorAll("header a[href],header button")].filter((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        }).length
      }));
      const failures = [];
      if (response?.status() !== 200) failures.push(`HTTP ${response?.status() || "NONE"}`);
      for (const phrase of testCase.required) if (!body.includes(phrase)) failures.push(`missing: ${phrase}`);
      for (const phrase of testCase.forbidden) if (body.includes(phrase)) failures.push(`still visible: ${phrase}`);
      if (testCase.colorCheck) {
        const color = await page.locator(testCase.colorCheck.selector).first().evaluate((element) => getComputedStyle(element).color);
        if (color !== testCase.colorCheck.expected) failures.push(`contrast color ${color}, expected ${testCase.colorCheck.expected}`);
      }
      if (audit.overlay) failures.push("framework error overlay");
      if (audit.documentWidth > audit.viewportWidth) failures.push(`horizontal overflow ${audit.documentWidth}/${audit.viewportWidth}`);
      if (audit.headerLinks < 3) failures.push(`shared header controls ${audit.headerLinks}`);
      if (runtimeErrors.length) failures.push(`${runtimeErrors.length} runtime errors`);
      const screenshot = path.join(OUTPUT, `${viewportName}-${testCase.name}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
      results.push({ viewport: viewportName, ...testCase, status: failures.length ? "FAIL" : "PASS", failures, runtimeErrors, screenshot: path.relative(ROOT, screenshot).replaceAll("\\", "/") });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((result) => result.status === "FAIL");
const manifest = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  status: failed.length ? "FAIL" : "PASS",
  checks: results.length,
  passed: results.length - failed.length,
  failed: failed.length,
  failures: failed.map(({ viewport, route, failures }) => ({ viewport, route, failures })),
  results
};
fs.writeFileSync(path.join(OUTPUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...manifest, results: undefined }, null, 2));
if (failed.length) process.exitCode = 1;
