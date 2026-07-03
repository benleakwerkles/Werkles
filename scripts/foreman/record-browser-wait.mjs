import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "foreman", "receipts", "browser-capture", "playwright-video");
const startUrl = "https://dashboard.stripe.com/login?redirect=%2Ftest%2Fproducts";
const marker = path.join(outDir, "RECORDING.json");
const pidFile = path.join(outDir, "RECORDER.pid");

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  marker,
  JSON.stringify(
    {
      status: "waiting_for_clip_ready",
      startedAt: new Date().toISOString(),
      startUrl,
      outDir,
      stopHint: "Say Clip ready in chat to finalize video"
    },
    null,
    2
  )
);

const browser = await chromium.launch({ headless: false });
const context = await browser.newContext({
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  viewport: { width: 1280, height: 720 }
});
const page = await context.newPage();
await page.goto(startUrl, { waitUntil: "domcontentloaded" });

fs.writeFileSync(pidFile, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }, null, 2));
console.log("READY", page.url());
console.log("WAITING_FOR_CLIP_READY");

process.on("SIGINT", () => process.exit(0));
process.on("SIGTERM", () => process.exit(0));

// Hold open until stop script or manual kill after user says Clip ready
await new Promise(() => {});
