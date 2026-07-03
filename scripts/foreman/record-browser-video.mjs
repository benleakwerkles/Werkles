import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "foreman", "receipts", "browser-capture", "playwright-video");
const durationMs = Number(process.env.RECORD_MS || 180000);
const startUrl = process.env.RECORD_URL || "https://dashboard.stripe.com/login?redirect=%2Ftest%2Fproducts";

fs.mkdirSync(outDir, { recursive: true });
const marker = path.join(outDir, "RECORDING.json");
fs.writeFileSync(
  marker,
  JSON.stringify({ status: "recording", startedAt: new Date().toISOString(), durationMs, startUrl, outDir }, null, 2)
);

try {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();
  await page.goto(startUrl, { waitUntil: "domcontentloaded" });
  console.log("RECORDING", outDir);
  await page.waitForTimeout(durationMs);
  const video = page.video();
  await context.close();
  await browser.close();
  const saved = video ? await video.path() : null;
  fs.writeFileSync(
    marker,
    JSON.stringify({ status: "done", finishedAt: new Date().toISOString(), videoPath: saved, outDir }, null, 2)
  );
  console.log("VIDEO_SAVED", saved || "none");
} catch (err) {
  fs.writeFileSync(marker, JSON.stringify({ status: "error", error: String(err), outDir }, null, 2));
  console.error(err);
  process.exit(1);
}
