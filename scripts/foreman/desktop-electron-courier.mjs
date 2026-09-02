#!/usr/bin/env node
/**
 * Desktop Electron courier — VPGM dispatch to native Claude / Perplexity apps.
 *
 * Electron apps accept --remote-debugging-port when launched. If CDP is not up,
 * Foreman restarts the target process with a dedicated port (not the Operator).
 *
 *   node scripts/foreman/desktop-electron-courier.mjs prove --cousins COMPUTER
 *   node scripts/foreman/desktop-electron-courier.mjs dispatch --cousins COMPUTER,ENDER
 *   node scripts/foreman/desktop-electron-courier.mjs ensure-cdp --cousins COMPUTER
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";

const ROOT = process.cwd();
const CONFIG_PATH = "foreman/crew-dispatch/desktop-seats.config.json";
const MANIFEST = "foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json";
const LEDGER = path.join(ROOT, "foreman/crew-dispatch/DISPATCH_LEDGER.jsonl");
const SHOT_DIR = path.join(ROOT, "foreman/receipts/courier-proof");
const PROJECT_ID = "WERKLES_COM";

const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const nowIso = () => new Date().toISOString();

function expand(p) {
  return p.replace(/%LOCALAPPDATA%/g, process.env.LOCALAPPDATA || "").replace(/%USERPROFILE%/g, os.homedir());
}

function loadConfig() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, CONFIG_PATH), "utf8"));
  return raw.seats;
}

function readManifest() {
  const p = path.join(ROOT, MANIFEST);
  if (!fs.existsSync(p)) throw new Error(`No manifest at ${MANIFEST}`);
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function packetFor(cousinId) {
  const manifest = readManifest();
  const row = manifest.cousins.find((c) => c.cousinId === cousinId);
  if (!row) throw new Error(`${cousinId} not in manifest`);
  const abs = path.join(ROOT, row.pastePath);
  if (!fs.existsSync(abs)) throw new Error(`Paste block missing: ${row.pastePath}`);
  const text = fs.readFileSync(abs, "utf8");
  const hash = sha256(text);
  return {
    text,
    hash,
    row,
    submissionId: `${manifest.commandId || manifest.missionId || "VPGM"}:${cousinId}:${hash.slice(0, 12)}`
  };
}

function markers(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  return { head: lines[0].slice(0, 52), tail: lines[lines.length - 1].slice(-52) };
}

function ledgerRows() {
  if (!fs.existsSync(LEDGER)) return [];
  return fs
    .readFileSync(LEDGER, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function appendLedger(record) {
  fs.mkdirSync(path.dirname(LEDGER), { recursive: true });
  fs.appendFileSync(LEDGER, `${JSON.stringify(record)}\n`, "utf8");
}

function priorAcceptance(submissionId) {
  return ledgerRows().find(
    (r) =>
      r.submissionId === submissionId &&
      ["POSTED_NOT_CUSTODY", "UNKNOWN_SUBMISSION_STATE__DO_NOT_REPEAT"].includes(r.result)
  );
}

function resolveExe(seat) {
  for (const candidate of seat.launchCandidates) {
    const p = expand(candidate);
    if (p && fs.existsSync(p)) return p;
  }
  if (seat.processName?.toLowerCase() === "claude.exe") {
    try {
      const out = execFileSync(
        "powershell.exe",
        [
          "-NoProfile",
          "-Command",
          "(Get-AppxPackage *Claude* | Select-Object -First 1 -ExpandProperty InstallLocation)"
        ],
        { encoding: "utf8" }
      ).trim();
      if (out) {
        const p = path.join(out, "app", "claude.exe");
        if (fs.existsSync(p)) return p;
      }
    } catch {
      /* fall through */
    }
  }
  return null;
}

async function cdpAlive(port) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch {
    return false;
  }
}

function killProcess(processName) {
  try {
    execFileSync("taskkill", ["/F", "/IM", processName], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

async function ensureDesktopCdp(seat, { restart = true } = {}) {
  const port = seat.cdpPort;
  if (await cdpAlive(port)) return { ok: true, port, restarted: false };

  const exe = resolveExe(seat);
  if (!exe) {
    return {
      ok: false,
      port,
      error: `No executable found for ${seat.cousinId}. Checked: ${seat.launchCandidates.join(", ")}`
    };
  }

  if (restart) killProcess(seat.processName);
  spawn(exe, [`--remote-debugging-port=${port}`], { detached: true, stdio: "ignore", windowsHide: false }).unref();

  for (let i = 0; i < 30; i++) {
    if (await cdpAlive(port)) return { ok: true, port, restarted: true, exe };
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { ok: false, port, error: `CDP did not come up on ${port} after launching ${exe}` };
}

async function listTargets(port) {
  const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`CDP list failed on ${port}`);
  return res.json();
}

async function loadPuppeteer() {
  try {
    return await import("puppeteer-core");
  } catch {
    throw new Error("puppeteer-core required for desktop dispatch — run: npm install puppeteer-core");
  }
}

async function connectDesktop(seat) {
  const ensure = await ensureDesktopCdp(seat);
  if (!ensure.ok) throw new Error(ensure.error);

  const puppeteer = await loadPuppeteer();
  const port = seat.cdpPort;
  const browser = await puppeteer.default.connect({
    browserURL: `http://127.0.0.1:${port}`,
    defaultViewport: null
  });

  const pages = await browser.pages();
  const prefer = seat.pageUrlPrefer || [];
  const page =
    pages.find((p) => prefer.includes(p.url())) ||
    pages.find(
      (p) =>
        seat.pageUrlIncludes.some((h) => p.url().includes(h)) &&
        !/(count\.|service-worker|windows-app\/ask)/i.test(p.url())
    ) ||
    pages.find((p) => seat.pageUrlIncludes.some((h) => p.url().includes(h))) ||
    pages[0];

  if (!page) {
    await browser.disconnect();
    throw new Error(`No live page for ${seat.cousinId}`);
  }
  /* CDP can read and operate an Electron page without foregrounding its window.
     Keep the Operator's keyboard and mouse on the app they are using. */

  return { browser, page, ensure, port };
}

async function firstVisible(page, selectors) {
  for (const selector of selectors) {
    try {
      const handle = await page.$(selector);
      if (!handle) continue;
      const box = await handle.boundingBox();
      if (box && box.width > 0 && box.height > 0) return { handle, selector };
      await handle.dispose();
    } catch {
      /* try next */
    }
  }
  /* Perplexity desktop exposes a plain "Search" text button without aria-label. */
  try {
    const handle = await page.evaluateHandle(() => {
      const buttons = [...document.querySelectorAll("button")];
      return buttons.find((b) => /^search$/i.test((b.innerText || "").trim()) && !b.disabled) || null;
    });
    const el = handle.asElement();
    if (el) {
      const box = await el.boundingBox();
      if (box && box.width > 0 && box.height > 0) return { handle: el, selector: "button:text(Search)" };
      await el.dispose();
    } else {
      await handle.dispose();
    }
  } catch {
    /* no text button */
  }
  return { handle: null, selector: null };
}

async function accountEvidence(page) {
  return page
    .evaluate(() => {
      const out = {};
      const email = (document.body.innerText || "").match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
      if (email) out.email = email[0];
      const signInWall = /sign in|log in|create account|continue with google/i.test(
        (document.body.innerText || "").slice(0, 4000)
      );
      out.signInLanguageVisible = signInWall;
      return out;
    })
    .catch(() => ({}));
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

async function transcriptEcho(page, head, tail, sent) {
  return page
    .evaluate(
      ({ head, tail, sent }) => {
        const norm = (s) => s.replace(/\s+/g, " ").trim();
        const body = document.body.innerText || "";
        const h = body.indexOf(head);
        const t = tail ? body.lastIndexOf(tail) : -1;
        let bodyMatches = false;
        if (h >= 0 && t >= 0 && t > h) bodyMatches = norm(body.slice(h, t + tail.length)) === norm(sent);
        return {
          headFound: h >= 0,
          tailFound: t >= 0,
          bodyMatches,
          echoChars: h >= 0 && t >= 0 && t > h ? t + tail.length - h : h >= 0 ? -1 : 0,
          messageId: null
        };
      },
      { head, tail, sent }
    )
    .catch(() => ({ headFound: false, tailFound: false, bodyMatches: false, echoChars: 0, messageId: null }));
}

async function insertPacket(page, selector, text) {
  const handle = await page.$(selector);
  if (!handle) return false;
  await handle.focus();
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return;
    el.focus();
    if (el.tagName === "TEXTAREA") {
      el.value = "";
      el.dispatchEvent(new Event("input", { bubbles: true }));
    } else {
      const range = document.createRange();
      range.selectNodeContents(el);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, selector);
  const cdp = await page.createCDPSession();
  await cdp.send("Input.insertText", { text });
  return true;
}

async function proveRoute(seat) {
  const { submissionId, hash, row } = packetFor(seat.cousinId);
  const { browser, page, ensure, port } = await connectDesktop(seat);

  try {
    const proof = {
      cousinId: seat.cousinId,
      seat: seat.label,
      surface: "desktop",
      projectId: PROJECT_ID,
      cdpPort: port,
      submissionId,
      packetSha256: hash,
      packetFile: row.packetFile,
      readAt: nowIso(),
      cdpRestarted: ensure.restarted,
      url: page.url()
    };

    proof.account = await accountEvidence(page);
    const composer = await firstVisible(page, seat.composers);
    proof.composerSelector = composer.selector;
    const send = await firstVisible(page, seat.sendControls);
    proof.sendSelector = send.selector;
    proof.sendEnabled = send.handle
      ? !(await send.handle.evaluate((el) => el.disabled).catch(() => true))
      : false;

    const missing = [];
    if (!composer.selector) missing.push("composer not callable");
    /* Long-lived task transcripts may quote the words "sign in". Treat that as
       an account wall only when no callable composer is present. */
    if (proof.account.signInLanguageVisible && !composer.selector) missing.push("sign-in wall");

    if (missing.length) {
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      const shot = path.join(SHOT_DIR, `${seat.cousinId}_desktop_route_blocked.png`);
      await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      proof.screenshot = path.relative(ROOT, shot).replace(/\\/g, "/");
      const blocker =
        proof.account.signInLanguageVisible && !composer.selector
          ? "BLOCKED_RECEIVER_SIGNED_OUT"
          : "ROUTE_UNPROVED";
      return { ...proof, routeProved: false, blocker, missing };
    }

    return { ...proof, routeProved: true, blocker: null, missing: [] };
  } finally {
    await browser.disconnect().catch(() => {});
  }
}

async function dispatchSeat(seat) {
  const { text, hash, submissionId, row } = packetFor(seat.cousinId);
  const base = {
    at: nowIso(),
    projectId: PROJECT_ID,
    cousinId: seat.cousinId,
    seat: seat.label,
    surface: "desktop",
    submissionId,
    packetSha256: hash,
    packetFile: row.packetFile,
    sentBytes: Buffer.byteLength(text, "utf8"),
    sendActionExecuted: false,
    cursorKeyboardClipboardTouched: "NO",
    secretsAccessed: "NO"
  };

  const already = priorAcceptance(submissionId);
  if (already) {
    return {
      ...base,
      result: "UNKNOWN_SUBMISSION_STATE__DO_NOT_REPEAT",
      note: `SUBMISSION_ID already accepted at ${already.at} (${already.result}).`
    };
  }

  const route = await proveRoute(seat);
  if (!route.routeProved) {
    const record = { ...base, result: route.blocker, packetObligation: "STILL_OWED", route };
    appendLedger(record);
    return record;
  }

  const { browser, page } = await connectDesktop(seat);
  try {
  const composerHandle = await page.$(route.composerSelector);
  if (!composerHandle) {
    const record = {
      ...base,
      result: "COMPOSED_NOT_SENT",
      packetObligation: "STILL_OWED",
      route,
      note: "Composer missing after route proof on desktop."
    };
    appendLedger(record);
    return record;
  }
  const inserted = await insertPacket(page, route.composerSelector, text);
  if (!inserted) {
    const record = { ...base, result: "COMPOSED_NOT_SENT", packetObligation: "STILL_OWED", route, note: "insertPacket failed" };
    appendLedger(record);
    return record;
  }
  await new Promise((r) => setTimeout(r, 900));

  const composed = await readComposer(page, route.composerSelector);
  const { head, tail } = markers(text);
  base.charsInComposer = composed.length;

  if (!composed.includes(head.slice(0, 34)) || !composed.includes(tail.slice(-34))) {
    const record = {
      ...base,
      result: "COMPOSED_NOT_SENT",
      packetObligation: "STILL_OWED",
      route,
      note: "Composer readback failed on desktop surface."
    };
    appendLedger(record);
    return record;
  }

  const send = await firstVisible(page, seat.sendControls);
  const sendEnabled =
    send.handle && !(await send.handle.evaluate((el) => el.disabled || el.getAttribute("aria-disabled") === "true"));
  if (!send.handle || !sendEnabled) {
    const record = {
      ...base,
      result: send.handle ? "SEND_HANDS_UNAVAILABLE" : "SEND_CONTROL_UNAVAILABLE",
      packetObligation: "STILL_OWED",
      route,
      sendSelector: send.selector
    };
    appendLedger(record);
    return record;
  }

  await send.handle.click();
  base.sendActionExecuted = true;
  base.sendSelector = send.selector;
  base.sendInvokedAt = nowIso();

  let echo = { headFound: false, tailFound: false, bodyMatches: false, echoChars: 0 };
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 1500));
    echo = await transcriptEcho(page, head, tail, text);
    if (echo.bodyMatches) break;
  }

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const shot = path.join(SHOT_DIR, `${seat.cousinId}_desktop_posted.png`);
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});

  const proofRecord = {
    ...base,
    route,
    urlAfter: page.url(),
    transcriptEcho: echo,
    screenshot: path.relative(ROOT, shot).replace(/\\/g, "/")
  };

  if (echo.bodyMatches) {
    const record = { ...proofRecord, result: "POSTED_NOT_CUSTODY", packetObligation: "POSTED_AWAITING_CUSTODY" };
    appendLedger(record);
    return record;
  }

  if (echo.headFound) {
    const record = {
      ...proofRecord,
      result: "POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT",
      packetObligation: "CONSUMED_AMBIGUOUS",
      quarantined: true,
      assimilationAllowed: false,
      note: "Desktop send invoked; body mismatch — quarantined."
    };
    appendLedger(record);
    return record;
  }

  const record = {
    ...proofRecord,
    result: "UNKNOWN_SUBMISSION_STATE__DO_NOT_REPEAT",
    packetObligation: "STILL_OWED_UNVERIFIED"
  };
  appendLedger(record);
  return record;
  } finally {
    await browser.disconnect().catch(() => {});
  }
}

function seatList(args, seats) {
  const i = args.indexOf("--cousins");
  if (i >= 0 && args[i + 1]) return args[i + 1].split(",").map((s) => s.trim().toUpperCase());
  return Object.keys(seats);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";
  const seats = loadConfig();

  if (cmd === "ensure-cdp") {
    for (const id of seatList(args, seats)) {
      const seat = seats[id];
      if (!seat) throw new Error(`Unknown desktop seat ${id}`);
      const out = await ensureDesktopCdp(seat);
      console.log(`${id} ${out.ok ? "CDP_UP" : "CDP_FAIL"} port=${out.port}${out.restarted ? " restarted" : ""}`);
      if (!out.ok) console.error(out.error);
    }
    return;
  }

  if (cmd === "prove" || cmd === "dispatch") {
    const out = [];
    for (const id of seatList(args, seats)) {
      const seat = seats[id];
      if (!seat) throw new Error(`Unknown desktop seat ${id}`);
      const result = cmd === "prove" ? await proveRoute(seat) : await dispatchSeat(seat);
      out.push(result);
      console.log(`${id} ${result.result || (result.routeProved ? "ROUTE_PROVED" : result.blocker)}`);
    }
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  console.log(`Commands:
ensure-cdp [--cousins A,B]     Restart desktop app with CDP if needed.
prove      [--cousins A,B]     Route proof on desktop Electron surface.
dispatch   [--cousins A,B]     Full VPGM dispatch via desktop CDP.

Config: ${CONFIG_PATH}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err.message);
    process.exit(1);
  }
);
