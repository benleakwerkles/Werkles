#!/usr/bin/env node
/**
 * SkyPooka mobile smoke test — boots the Next.js server, loads every SkyPooka
 * route at an iPhone-class viewport, checks for error states, and saves
 * screenshots for Ben review.
 *
 * Usage:
 *   node scripts/foreman/skypooka-mobile-smoke.mjs            # uses `next start` (requires prior build)
 *   node scripts/foreman/skypooka-mobile-smoke.mjs --dev      # uses `next dev`
 *   node scripts/foreman/skypooka-mobile-smoke.mjs --base-url http://127.0.0.1:3000   # reuse running server
 *
 * Output: foreman/skypooka/smoke/<timestamp>/*.png + SMOKE_RESULT.json
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const PORT = Number(process.env.SKYPOOKA_SMOKE_PORT || 3311);
const USE_DEV = process.argv.includes("--dev");

function readArgValue(name, fallback = null) {
  const index = process.argv.indexOf(name);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];
  return fallback;
}

const EXTERNAL_BASE_URL = readArgValue("--base-url");

const ROUTES = [
  { route: "/skypooka", name: "field" },
  { route: "/skypooka/intent", name: "intent" },
  { route: "/skypooka/gates", name: "gates" },
  { route: "/skypooka/nerdkle", name: "nerdkle" }
];

const VIEWPORT = { width: 390, height: 844 }; // iPhone 14/15 class

function stamp() {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
}

async function waitForServer(baseUrl, timeoutMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(`${baseUrl}/api/skypooka/feed`, { cache: "no-store" });
      if (response.ok) return;
    } catch {
      // keep waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  throw new Error(`Server at ${baseUrl} did not become ready in ${timeoutMs}ms`);
}

async function portInUse(baseUrl) {
  try {
    await fetch(baseUrl, { cache: "no-store" });
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const { chromium } = await import("playwright");

  const outDir = path.join(REPO_ROOT, "foreman", "skypooka", "smoke", stamp());
  fs.mkdirSync(outDir, { recursive: true });

  let server = null;
  let baseUrl = EXTERNAL_BASE_URL;

  if (!baseUrl) {
    baseUrl = `http://127.0.0.1:${PORT}`;
    if (await portInUse(baseUrl)) {
      throw new Error(
        `Port ${PORT} is already serving. A stale server would smoke-test an old build. `
        + `Stop it, pick another port via SKYPOOKA_SMOKE_PORT, or pass --base-url to test the running server intentionally.`
      );
    }
    const nextBin = path.join(REPO_ROOT, "node_modules", "next", "dist", "bin", "next");
    const args = [nextBin, USE_DEV ? "dev" : "start", "-p", String(PORT)];
    console.log(`Starting Next.js (${USE_DEV ? "dev" : "start"}) on :${PORT}…`);
    server = spawn(process.execPath, args, {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
      env: { ...process.env, PORT: String(PORT) }
    });
    server.stdout.on("data", (chunk) => process.stdout.write(`[next] ${chunk}`));
    server.stderr.on("data", (chunk) => process.stderr.write(`[next] ${chunk}`));
  }

  const results = [];
  let browser = null;

  try {
    await waitForServer(baseUrl);
    console.log(`Server ready at ${baseUrl}`);

    browser = await chromium.launch();
    const context = await browser.newContext({
      viewport: VIEWPORT,
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
      userAgent:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
    });
    const page = await context.newPage();

    for (const { route, name } of ROUTES) {
      const url = `${baseUrl}${route}`;
      const entry = { route, name, url, ok: false, error: null, screenshot: null };
      try {
        const response = await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
        const status = response?.status() ?? 0;
        if (status >= 400) throw new Error(`HTTP ${status}`);

        await page.waitForTimeout(500);

        const errorText = await page.locator(".skypooka-error").first().textContent().catch(() => null);
        if (errorText) throw new Error(`skypooka-error rendered: ${errorText.trim()}`);

        const headerVisible = await page.locator(".skypooka-header h1").first().isVisible().catch(() => false);
        if (!headerVisible) throw new Error("SkyPooka header not visible");

        const shot = path.join(outDir, `${name}.png`);
        await page.screenshot({ path: shot, fullPage: true });
        entry.ok = true;
        entry.screenshot = path.relative(REPO_ROOT, shot).replace(/\\/g, "/");
        console.log(`PASS ${route} -> ${entry.screenshot}`);
      } catch (error) {
        entry.error = error instanceof Error ? error.message : String(error);
        const shot = path.join(outDir, `${name}-FAIL.png`);
        await page.screenshot({ path: shot, fullPage: true }).catch(() => {});
        entry.screenshot = fs.existsSync(shot) ? path.relative(REPO_ROOT, shot).replace(/\\/g, "/") : null;
        console.error(`FAIL ${route}: ${entry.error}`);
      }
      results.push(entry);
    }
  } finally {
    if (browser) await browser.close().catch(() => {});
    if (server) {
      server.kill("SIGTERM");
      await new Promise((resolve) => setTimeout(resolve, 1500));
      if (!server.killed) server.kill("SIGKILL");
    }
  }

  const pass = results.every((entry) => entry.ok);
  const summary = {
    generated_at: new Date().toISOString(),
    base_url: baseUrl,
    viewport: VIEWPORT,
    mode: EXTERNAL_BASE_URL ? "external" : USE_DEV ? "dev" : "start",
    pass,
    results
  };
  const summaryPath = path.join(outDir, "SMOKE_RESULT.json");
  fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  console.log(`\nSMOKE ${pass ? "PASS" : "FAIL"} — ${path.relative(REPO_ROOT, summaryPath).replace(/\\/g, "/")}`);
  process.exit(pass ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
