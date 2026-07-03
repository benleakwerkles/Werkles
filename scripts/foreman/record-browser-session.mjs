import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "..", "foreman", "receipts", "browser-capture", "playwright-video");
const startUrl = "https://dashboard.stripe.com/login?redirect=%2Ftest%2Fproducts";
const marker = path.join(outDir, "RECORDING.json");
const stopFile = path.join(outDir, "STOP.requested");

fs.mkdirSync(outDir, { recursive: true });
if (fs.existsSync(stopFile)) fs.unlinkSync(stopFile);

const browser = await chromium.launch({
  headless: false,
  args: ["--start-maximized", "--window-position=0,0"]
});
const context = await browser.newContext({
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
  viewport: null
});
const page = await context.newPage();
await page.goto(startUrl, { waitUntil: "domcontentloaded" });
try {
  await page.bringToFront();
} catch {
  // best effort
}

fs.writeFileSync(
  marker,
  JSON.stringify(
    {
      status: "recording",
      startedAt: new Date().toISOString(),
      startUrl,
      pageUrl: page.url(),
      outDir,
      stopFile,
      note: "Chromium window should be maximized on desktop"
    },
    null,
    2
  )
);

console.log("STRIPE_LOGIN_READY", page.url());
console.log("ACTION");

while (!fs.existsSync(stopFile)) {
  await page.waitForTimeout(500);
}

const video = page.video();
await context.close();
await browser.close();
const saved = video ? await video.path() : null;
fs.writeFileSync(
  marker,
  JSON.stringify({ status: "done", finishedAt: new Date().toISOString(), videoPath: saved, outDir }, null, 2)
);
console.log("VIDEO_SAVED", saved || "none");
