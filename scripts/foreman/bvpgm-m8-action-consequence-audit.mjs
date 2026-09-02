#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { chromium } from "playwright";

const ROOT = process.cwd();
const BASE = "http://127.0.0.1:3000";
const OUTPUT = path.join(ROOT, "foreman/receipts/browser-proof/bvpgm-m8-actions");
const allRoutes = [
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
const routeArg = process.argv.indexOf("--route");
const requestedRoute = routeArg >= 0 ? process.argv[routeArg + 1] : null;
const routes = requestedRoute ? allRoutes.filter(([, route]) => route === requestedRoute) : allRoutes;
if (!routes.length) throw new Error(`Unknown --route ${requestedRoute}`);
const forbiddenMemberDestinations = [
  "/operator",
  "/tinkerden",
  "/thinkit",
  "/soledash",
  "/nerdkle",
  "file:"
];
const destructivePattern = /delete|remove|clear|reset|sign out|log out|withdraw|discard/i;

fs.mkdirSync(OUTPUT, { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.addCookies([{
  name: "werkles_bellows_owner",
  value: "bellows_owner_4185d54c-e055-4929-91a0-6181bf461384",
  url: BASE
}]);

const routeResults = [];
const hrefs = new Set();

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

try {
  for (const [name, route] of routes) {
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") runtimeErrors.push(message.text());
    });
    page.on("pageerror", (error) => runtimeErrors.push(error.message));
    console.log(`AUDIT ${route}`);
    const response = await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 15_000 });
    await page.waitForTimeout(225);

    const inventory = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
      };
      const labelOf = (element) => (
        element.getAttribute("aria-label") ||
        element.getAttribute("title") ||
        element.labels?.[0]?.textContent ||
        element.closest("label")?.textContent ||
        element.textContent ||
        ""
      ).trim().replace(/\s+/g, " ");
      const links = [...document.querySelectorAll("a[href]")].filter(visible).map((element) => ({
        label: labelOf(element).slice(0, 120),
        href: element.href,
        target: element.target,
        download: element.hasAttribute("download")
      }));
      const buttons = [...document.querySelectorAll("button")].filter(visible).map((element, index) => {
        return {
          index,
          label: labelOf(element).slice(0, 120),
          type: element.type,
          disabled: element.disabled,
          ariaPressed: element.getAttribute("aria-pressed"),
          ariaExpanded: element.getAttribute("aria-expanded"),
          ariaCurrent: element.getAttribute("aria-current"),
          selected: Boolean(element.getAttribute("aria-current")) || element.getAttribute("aria-selected") === "true" || /active|selected|current/.test(element.className),
          html: element.outerHTML.slice(0, 360)
        };
      });
      const summaries = [...document.querySelectorAll("summary")].filter(visible).map((element, index) => {
        return { index, label: labelOf(element).slice(0, 120), open: element.parentElement?.open || false };
      });
      return { links, buttons, summaries };
    });

    for (const link of inventory.links) {
      if (link.href.startsWith(BASE)) hrefs.add(new URL(link.href).pathname + new URL(link.href).search);
    }

    const malformedLinks = inventory.links.filter((link) =>
      !link.label ||
      link.href.endsWith("#") ||
      link.href.startsWith("javascript:") ||
      forbiddenMemberDestinations.some((prefix) => link.href.includes(prefix))
    );
    const inertButtons = [];

    for (const button of inventory.buttons) {
      if (
        !button.label || button.disabled || button.type === "submit" || button.type === "reset" ||
        button.selected || button.ariaPressed === "true" || destructivePattern.test(button.label)
      ) continue;

      await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 15_000 });
      await page.waitForTimeout(125);
      const locator = page.locator("button:visible").nth(button.index);
      if (!(await locator.count()) || !(await locator.isVisible())) continue;
      const before = await page.evaluate(() => ({
        url: location.href,
        body: document.body.innerText,
        dialogs: document.querySelectorAll("[role=dialog],dialog[open]").length
      }));
      const beforeAttrs = await locator.evaluate((element) => ({
        pressed: element.getAttribute("aria-pressed"),
        expanded: element.getAttribute("aria-expanded"),
        disabled: element.disabled,
        text: element.textContent,
        className: element.className
      }));
      try {
        await locator.scrollIntoViewIfNeeded({ timeout: 1_500 });
        await locator.click({ timeout: 3_000, noWaitAfter: true });
        await page.waitForTimeout(175);
      } catch (error) {
        inertButtons.push({ ...button, reason: `click failed: ${error.message.slice(0, 900)}` });
        continue;
      }
      const after = await page.evaluate(() => ({
        url: location.href,
        body: document.body.innerText,
        dialogs: document.querySelectorAll("[role=dialog],dialog[open]").length
      }));
      const afterAttrs = await locator.evaluate((element) => ({
        pressed: element.getAttribute("aria-pressed"),
        expanded: element.getAttribute("aria-expanded"),
        disabled: element.disabled,
        text: element.textContent,
        className: element.className
      })).catch(() => null);
      const changed =
        before.url !== after.url || digest(before.body) !== digest(after.body) ||
        before.dialogs !== after.dialogs || JSON.stringify(beforeAttrs) !== JSON.stringify(afterAttrs);
      if (!changed) inertButtons.push({ ...button, reason: "no visible, state, dialog, or navigation consequence" });
    }

    const inertSummaries = [];
    for (const summary of inventory.summaries) {
      await page.goto(`${BASE}${route}`, { waitUntil: "load", timeout: 15_000 });
      await page.waitForTimeout(125);
      const locator = page.locator("summary:visible").nth(summary.index);
      if (!(await locator.count()) || !(await locator.isVisible())) continue;
      const before = await locator.evaluate((element) => Boolean(element.parentElement?.open));
      await locator.click();
      const after = await locator.evaluate((element) => Boolean(element.parentElement?.open));
      if (before === after) inertSummaries.push(summary);
    }

    routeResults.push({
      name,
      route,
      status: response?.status() || null,
      links: inventory.links,
      buttonCount: inventory.buttons.length,
      summaryCount: inventory.summaries.length,
      malformedLinks,
      inertButtons,
      inertSummaries,
      runtimeErrors
    });
    await page.close();
  }
} finally {
  await context.close();
  await browser.close();
}

const destinationResults = [];
for (const href of [...hrefs].sort()) {
  const response = await fetch(`${BASE}${href}`, { redirect: "manual" });
  destinationResults.push({ href, status: response.status, location: response.headers.get("location") });
}

const failures = [];
for (const result of routeResults) {
  if (result.status !== 200) failures.push(`${result.route}: HTTP ${result.status}`);
  if (result.malformedLinks.length) failures.push(`${result.route}: ${result.malformedLinks.length} malformed/forbidden links`);
  if (result.inertButtons.length) failures.push(`${result.route}: ${result.inertButtons.length} apparently inert buttons`);
  if (result.inertSummaries.length) failures.push(`${result.route}: ${result.inertSummaries.length} inert disclosures`);
  if (result.runtimeErrors.length) failures.push(`${result.route}: ${result.runtimeErrors.length} runtime errors`);
}
for (const destination of destinationResults) {
  if (![200, 302, 303, 307, 308].includes(destination.status)) failures.push(`${destination.href}: destination HTTP ${destination.status}`);
}

const report = {
  generatedAt: new Date().toISOString(),
  baseUrl: BASE,
  status: failures.length ? "FAIL" : "PASS",
  routes: routeResults.length,
  uniqueInternalDestinations: destinationResults.length,
  visibleLinks: routeResults.reduce((sum, result) => sum + result.links.length, 0),
  visibleButtons: routeResults.reduce((sum, result) => sum + result.buttonCount, 0),
  visibleDisclosures: routeResults.reduce((sum, result) => sum + result.summaryCount, 0),
  failures,
  routeResults,
  destinationResults
};
fs.writeFileSync(path.join(OUTPUT, "manifest.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...report, routeResults: undefined, destinationResults: undefined }, null, 2));
if (failures.length) process.exitCode = 1;
