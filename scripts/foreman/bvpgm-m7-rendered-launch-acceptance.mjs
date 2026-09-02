#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE = "http://127.0.0.1:3000";
const OUTPUT = path.join(ROOT, "foreman/receipts/browser-proof/bvpgm-m7");
const routes = [
  ["home", "/"],
  ["login", "/login"],
  ["intake", "/bellows/intake"],
  ["recommendations", "/bellows/recommendations"],
  ["workshop", "/dashboard/blueprints"],
  ["match-deck", "/dashboard/intros"],
  ["formation", "/dashboard/werkles/formation?candidate=ghost_095"],
  ["personal-bellows", "/bellows/personal"],
  ["crucible", "/dashboard/crucible"],
  ["membership", "/membership"]
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
    await context.addCookies([
      {
        name: "werkles_bellows_owner",
        value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
        url: BASE
      }
    ]);

    for (const [name, route] of routes) {
      const page = await context.newPage();
      const consoleErrors = [];
      const pageErrors = [];
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));

      const response = await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 30_000 });
      await page.waitForTimeout(250);
      const audit = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
        };
        const labelOf = (element) =>
          (
            element.getAttribute("aria-label") ||
            element.getAttribute("title") ||
            element.labels?.[0]?.textContent ||
            element.closest("label")?.textContent ||
            element.textContent ||
            element.querySelector("img")?.getAttribute("alt") ||
            ""
          ).trim();
        const interactive = [...document.querySelectorAll("a[href],button,input,select,textarea,summary")].filter(visible);
        const unlabeled = interactive
          .filter((element) => !labelOf(element) && element.getAttribute("type") !== "hidden")
          .map((element) => element.outerHTML.slice(0, 180));
        const tinyTargets = interactive
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { label: labelOf(element).slice(0, 80), tag: element.tagName, width: rect.width, height: rect.height };
          })
          .filter((item) => item.width < 24 || item.height < 24);
        const smallText = [...document.querySelectorAll("body *")]
          .filter((element) => visible(element) && element.children.length === 0 && (element.textContent || "").trim())
          .map((element) => ({
            text: element.textContent.trim().slice(0, 80),
            fontSize: Number.parseFloat(getComputedStyle(element).fontSize),
            tag: element.tagName.toLowerCase(),
            className: typeof element.className === "string" ? element.className : "",
            parentClassName: typeof element.parentElement?.className === "string" ? element.parentElement.className : "",
            scopeClassName: [element.parentElement, element.parentElement?.parentElement, element.parentElement?.parentElement?.parentElement]
              .map((parent) => (typeof parent?.className === "string" ? parent.className : ""))
              .find(Boolean) || ""
          }))
          .filter((item) => item.fontSize < 12);
        const visibleImages = [...document.images].filter(visible).map((image) => ({
          alt: image.alt,
          src: image.currentSrc || image.src,
          width: image.getBoundingClientRect().width,
          height: image.getBoundingClientRect().height
        }));
        const buttons = [...document.querySelectorAll("button,a[href]")].filter(visible);
        const actionSignals = buttons.map((element) => {
          const style = getComputedStyle(element);
          return {
            label: labelOf(element).slice(0, 80),
            cursor: style.cursor,
            borderStyle: style.borderStyle,
            borderWidth: style.borderWidth,
            background: style.backgroundColor,
            shadow: style.boxShadow
          };
        });
        return {
          title: document.title,
          textCharacters: document.body.innerText.trim().length,
          overlay: Boolean(document.querySelector("[data-nextjs-dialog],.vite-error-overlay,#webpack-dev-server-client-overlay")),
          viewportWidth: innerWidth,
          documentWidth: document.documentElement.scrollWidth,
          headerVisible: [...document.querySelectorAll("header")].some(visible),
          navLinks: [...document.querySelectorAll("header a[href],header button")].filter(visible).length,
          visibleImages,
          unlabeled,
          tinyTargets,
          smallText,
          actionSignals
        };
      });

      const screenshot = path.join(OUTPUT, `${viewportName}-${name}.png`);
      await page.screenshot({ path: screenshot, fullPage: false });
      const failures = [];
      if (response?.status() !== 200) failures.push(`HTTP ${response?.status() || "NONE"}`);
      if (audit.textCharacters < 400) failures.push(`thin body: ${audit.textCharacters} characters`);
      if (audit.overlay) failures.push("framework error overlay");
      if (audit.documentWidth > audit.viewportWidth) failures.push(`horizontal overflow ${audit.documentWidth}/${audit.viewportWidth}`);
      if (!audit.headerVisible || audit.navLinks < 3) failures.push(`shared header/nav absent (${audit.navLinks} controls)`);
      if (audit.visibleImages.length < 1) failures.push("no visible grounding image");
      if (audit.unlabeled.length) failures.push(`${audit.unlabeled.length} unlabeled controls`);
      if (audit.smallText.length) failures.push(`${audit.smallText.length} visible text nodes below 12px`);
      if (consoleErrors.length || pageErrors.length) failures.push(`${consoleErrors.length + pageErrors.length} runtime errors`);

      results.push({
        viewport: viewportName,
        route,
        name,
        status: failures.length ? "FAIL" : "PASS",
        failures,
        consoleErrors,
        pageErrors,
        screenshot: path.relative(ROOT, screenshot).replaceAll("\\", "/"),
        audit
      });
      await page.close();
    }
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = results.filter((result) => result.status === "FAIL");
const manifest = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  status: failures.length ? "FAIL" : "PASS",
  routes: routes.length,
  viewports: viewports.length,
  checks: results.length,
  passed: results.length - failures.length,
  failed: failures.length,
  failures: failures.map(({ viewport, route, failures: reasons, screenshot }) => ({ viewport, route, reasons, screenshot })),
  results
};
fs.writeFileSync(path.join(OUTPUT, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...manifest, results: undefined }, null, 2));
if (failures.length) process.exitCode = 1;
