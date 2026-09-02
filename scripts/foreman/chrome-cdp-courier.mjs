#!/usr/bin/env node
/**
 * Chrome CDP courier — deliver a cousin paste block into a chat composer over the
 * DevTools protocol.
 *
 * Why this exists: the Edge courier focuses a window and fires SendKeys Ctrl+V, which
 * steals the Operator's cursor on every delivery and cannot prove the text landed.
 * CDP input needs no OS focus and lets us read the composer back afterwards.
 *
 * Hard stop: this never presses Enter and never clicks Send. Insert + verify only.
 *
 *   node scripts/foreman/chrome-cdp-courier.mjs launch [--cousins ENDER,BEAN]
 *   node scripts/foreman/chrome-cdp-courier.mjs status
 *   node scripts/foreman/chrome-cdp-courier.mjs deliver --cousin ENDER
 *   node scripts/foreman/chrome-cdp-courier.mjs deliver --all
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = process.cwd();
const PORT = Number(process.env.AEYE_CDP_PORT || 9335);
/* Outside the repo on purpose: a live Chrome profile under foreman/ holds a lock on
   Default/Network/Cookies, and `next build` globs the project root and dies EBUSY. */
const PROFILE_DIR = path.join(os.homedir(), ".werkles-aeye-crew-profile");
const MANIFEST = "foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json";
const SHOT_DIR = path.join(ROOT, "foreman", "receipts", "courier-proof");

const CHROME_CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  path.join(process.env.LOCALAPPDATA || "", "Google/Chrome/Application/chrome.exe")
];

/**
 * Composer selectors per provider, most specific first. `host` is matched against
 * the tab URL so an already-open tab is reused instead of opening another.
 */
const SEATS = {
  PETRA: {
    name: "Petra / ChatGPT",
    url: "https://chatgpt.com/",
    host: "chatgpt.com",
    composers: ["div#prompt-textarea[contenteditable='true']", "div[contenteditable='true']", "textarea"]
  },
  SKYBRO: {
    name: "Skybro / Gemini",
    url: "https://gemini.google.com/app",
    host: "gemini.google.com",
    composers: ["div.ql-editor[contenteditable='true']", "div[contenteditable='true']", "textarea"]
  },
  ENDER: {
    name: "Ender / Claude",
    url: "https://claude.ai/new",
    host: "claude.ai",
    composers: ["div.ProseMirror[contenteditable='true']", "div[contenteditable='true']", "textarea"]
  },
  BEAN: {
    name: "Bean / DeepSeek",
    url: "https://chat.deepseek.com/",
    host: "chat.deepseek.com",
    composers: ["textarea#chat-input", "textarea", "div[contenteditable='true']"]
  },
  COMPUTER: {
    name: "Computer / Perplexity",
    url: "https://www.perplexity.ai/",
    host: "perplexity.ai",
    composers: ["textarea[placeholder]", "div[contenteditable='true']", "textarea"]
  }
};

function findChrome() {
  for (const c of CHROME_CANDIDATES) {
    if (c && fs.existsSync(c)) return c;
  }
  throw new Error("Chrome not found");
}

function readManifest() {
  const p = path.join(ROOT, MANIFEST);
  if (!fs.existsSync(p)) throw new Error(`No manifest at ${MANIFEST} — issue a VPGM command first`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function pasteFor(cousinId) {
  const manifest = readManifest();
  const row = manifest.cousins.find((c) => c.cousinId === cousinId);
  if (!row) throw new Error(`${cousinId} not in manifest`);
  const abs = path.join(ROOT, row.pastePath);
  if (!fs.existsSync(abs)) throw new Error(`Paste block missing: ${row.pastePath}`);
  return { text: fs.readFileSync(abs, "utf8"), row, manifest };
}

async function cdpAlive() {
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`, { signal: AbortSignal.timeout(1500) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function launch(cousinIds) {
  if (await cdpAlive()) return { ok: true, alreadyRunning: true, port: PORT };

  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const urls = cousinIds.map((id) => SEATS[id].url);
  const args = [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${PROFILE_DIR}`,
    "--no-first-run",
    "--no-default-browser-check",
    "--new-window",
    ...urls
  ];

  spawn(findChrome(), args, { detached: true, stdio: "ignore", windowsHide: false }).unref();

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const info = await cdpAlive();
    if (info) return { ok: true, alreadyRunning: false, port: PORT, browser: info.Browser };
  }
  return { ok: false, error: `Chrome did not expose CDP on ${PORT} within 20s` };
}

async function connect() {
  const info = await cdpAlive();
  if (!info) throw new Error(`No Chrome listening on 127.0.0.1:${PORT} — run: launch`);
  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
  return browser;
}

function pagesOf(browser) {
  return browser.contexts().flatMap((c) => c.pages());
}

async function pageForSeat(browser, seat, { open = true } = {}) {
  for (const page of pagesOf(browser)) {
    let url = "";
    try {
      url = page.url();
    } catch {
      continue;
    }
    if (url.includes(seat.host)) return { page, opened: false };
  }
  if (!open) return { page: null, opened: false };
  const context = browser.contexts()[0];
  if (!context) throw new Error("No browser context");
  const page = await context.newPage();
  await page.goto(seat.url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {});
  return { page, opened: true };
}

async function findComposer(page, seat, perSelectorTimeout = 4000) {
  for (const selector of seat.composers) {
    const locator = page.locator(selector).first();
    try {
      await locator.waitFor({ state: "visible", timeout: perSelectorTimeout });
      return { locator, selector };
    } catch {
      /* try the next selector */
    }
  }
  return { locator: null, selector: null };
}

/**
 * Sign-in is an Operator gate, so the courier waits for it rather than failing and
 * making him come back to re-run the command. The tab is re-resolved on every poll:
 * a login flow can navigate, reopen, or replace the tab, which destroys any page
 * handle held across the wait.
 */
async function waitForComposer(browser, seat, waitMs) {
  const deadline = Date.now() + waitMs;
  for (;;) {
    let current = null;
    try {
      /* open:true so a tab discarded by Chrome's memory saver is recreated rather
         than stalling the wait until the Operator clicks it. */
      const resolved = await pageForSeat(browser, seat, { open: true });
      current = resolved.page;
      if (current) {
        const found = await findComposer(current, seat, 2000);
        if (found.locator) return { ...found, page: current };
      }
    } catch {
      /* tab closed mid-poll — resolve again on the next pass */
    }
    if (Date.now() >= deadline) return { locator: null, selector: null, page: current };
    await new Promise((r) => setTimeout(r, 3000));
  }
}

async function readComposer(page, selector) {
  return page
    .evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return "";
      return el.tagName === "TEXTAREA" ? el.value : el.innerText;
    }, selector)
    .catch(() => "");
}

async function deliverToSeat(browser, cousinId, waitMs = 0) {
  const seat = SEATS[cousinId];
  if (!seat) throw new Error(`Unknown seat ${cousinId}`);
  const { text, row } = pasteFor(cousinId);

  let { page, opened } = await pageForSeat(browser, seat);
  if (!page) return { cousinId, ok: false, status: "NO_TAB", seat: seat.name };
  if (opened) await page.waitForTimeout(2500);

  let locator;
  let selector;
  if (waitMs > 0) {
    const waited = await waitForComposer(browser, seat, waitMs);
    ({ locator, selector } = waited);
    if (waited.page) page = waited.page;
  } else {
    ({ locator, selector } = await findComposer(page, seat));
  }
  if (!locator) {
    return {
      cousinId,
      ok: false,
      status: "NO_COMPOSER",
      seat: seat.name,
      url: page.url(),
      /* No composer on a provider domain almost always means a sign-in wall. */
      hint: "Composer not found — sign in to this provider in the courier Chrome window, then re-run deliver"
    };
  }

  await locator.focus();
  /* insertText goes through CDP, so it needs no OS focus and cannot be captured by
     whatever window the Operator is actually working in. */
  await page.keyboard.insertText(text);
  await page.waitForTimeout(600);

  const landed = await readComposer(page, selector);
  const head = text.slice(0, 60).trim();
  const tailMarker = "Say what you would do and stop.";
  const verified = landed.includes(head.slice(0, 40)) && landed.includes(tailMarker);

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const shot = path.join(SHOT_DIR, `${cousinId}_composer_loaded.png`);
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});

  return {
    cousinId,
    ok: verified,
    status: verified ? "LOADED_AWAITING_HUMAN_SEND" : "PARTIAL_UNVERIFIED",
    seat: seat.name,
    url: page.url(),
    selector,
    packet: row.packetFile,
    charsSent: text.length,
    charsInComposer: landed.length,
    screenshot: path.relative(ROOT, shot).replace(/\\/g, "/"),
    humanGate: "STOP BEFORE SEND — text is in the composer; Operator presses Send"
  };
}

async function status() {
  const info = await cdpAlive();
  if (!info) return { ok: false, running: false, port: PORT, profile: path.relative(ROOT, PROFILE_DIR) };
  const browser = await connect();
  const seats = [];
  for (const [cousinId, seat] of Object.entries(SEATS)) {
    const { page } = await pageForSeat(browser, seat, { open: false });
    if (!page) {
      seats.push({ cousinId, seat: seat.name, tab: false, signedIn: null });
      continue;
    }
    const { selector } = await findComposer(page, seat);
    seats.push({
      cousinId,
      seat: seat.name,
      tab: true,
      url: page.url(),
      composer: selector,
      signedIn: Boolean(selector)
    });
  }
  /* Never browser.close() a CDP-attached Chrome: it tears down the Operator's window
     and any other courier connected to it. Dropping the socket is enough. */
  return { ok: true, running: true, port: PORT, browser: info.Browser, seats };
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";
  const arg = (flag) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : null;
  };

  if (cmd === "launch") {
    const list = (arg("--cousins") || "ENDER,BEAN").split(",").map((s) => s.trim().toUpperCase());
    for (const id of list) if (!SEATS[id]) throw new Error(`Unknown seat ${id}`);
    console.log(JSON.stringify(await launch(list), null, 2));
    return;
  }

  if (cmd === "status") {
    console.log(JSON.stringify(await status(), null, 2));
    return;
  }

  if (cmd === "deliver") {
    const all = args.includes("--all");
    const list = arg("--cousins");
    const one = arg("--cousin");
    const ids = all
      ? readManifest().cousins.map((c) => c.cousinId).filter((id) => SEATS[id])
      : (list || one || "").split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    if (ids.length === 0 || ids.some((id) => !SEATS[id])) {
      console.error("Usage: deliver --cousin ENDER | --cousins ENDER,BEAN | --all");
      process.exit(1);
    }
    const waitMs = Math.max(0, Number(arg("--wait-login") || 0)) * 1000;
    const browser = await connect();
    /* One connection, seats in parallel: each seat's sign-in lands whenever the
       Operator gets to it, and no seat blocks another. */
    const results = await Promise.all(
      ids.map(async (id) => {
        const r = await deliverToSeat(browser, id, waitMs).catch((e) => ({
          cousinId: id,
          ok: false,
          status: "ERROR",
          error: e.message
        }));
        console.log(`COURIER ${r.cousinId} ${r.status}`);
        return r;
      })
    );
    const ok = results.every((r) => r.ok);
    console.log(JSON.stringify({ ok, results }, null, 2));
    process.exit(ok ? 0 : 1);
  }

  console.log(`Chrome CDP courier — no focus stealing, verifies the composer

  launch [--cousins ENDER,BEAN]
  status
  deliver --cousin ENDER [--wait-login 900]
  deliver --all [--wait-login 900]

Never presses Enter. Never clicks Send.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(JSON.stringify({ ok: false, error: e.message }, null, 2));
    process.exit(1);
  });
}
