import { chromium } from "playwright";

/**
 * Read-only: reports how much text each cousin composer is currently holding.
 * Used to confirm a dispatch is still parked and recoverable before anything
 * touches the browser. Never types, never clicks, never sends.
 */

const PORT = Number(process.env.AEYE_CDP_PORT || 9335);

const SEATS = [
  ["PETRA", "chatgpt.com", "div#prompt-textarea[contenteditable='true']"],
  ["SKYBRO", "gemini.google.com", "div.ql-editor[contenteditable='true']"],
  ["ENDER", "claude.ai", "div.ProseMirror[contenteditable='true']"],
  ["COMPUTER", "perplexity.ai", "div[contenteditable='true']"],
  ["BEAN", "deepseek.com", "div[contenteditable='true']"],
];

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
const pages = browser.contexts().flatMap((c) => c.pages());
const rows = [];

for (const [id, host, selector] of SEATS) {
  const page = pages.find((p) => p.url().includes(host));
  if (!page) {
    rows.push({ seat: id, tab: false });
    continue;
  }
  let chars = -1;
  try {
    chars = await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      return el ? (el.innerText || "").length : -1;
    }, selector);
  } catch {
    chars = -2;
  }
  rows.push({
    seat: id,
    tab: true,
    url: page.url(),
    composerChars: chars,
    parked: chars > 1000,
  });
}

console.log(JSON.stringify(rows, null, 2));
process.exit(0);
