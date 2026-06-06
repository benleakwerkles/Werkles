#!/usr/bin/env node
/**
 * Relay Courier shared library — dispatch policy, lock, context health, verification.
 * Primary defense: dispatch class + structural markers — regex is secondary only.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT, abs, read, exists, nowIso, byteLength, append } from "./_foreman-core.mjs";

const CONFIG_REL = "foreman/crew-dispatch/relay-courier.config.json";
const POLICY_REL = "foreman/crew-dispatch/dispatch-policy.json";
const TABS_REL = "foreman/crew-dispatch/crew-tabs.config.json";

let _config = null;
let _policy = null;

export function loadCourierConfig() {
  if (_config) return _config;
  _config = JSON.parse(read(CONFIG_REL));
  return _config;
}

export function loadDispatchPolicy() {
  if (_policy) return _policy;
  _policy = JSON.parse(read(POLICY_REL));
  return _policy;
}

export function loadTabsConfig() {
  return JSON.parse(read(TABS_REL));
}

/** Five Aeye cousins in fixed relay order — not infra tabs (Foreman, GitHub, …). */
export const RELAY_COUSIN_IDS = ["PETRA", "SKYBRO", "ENDER", "BEAN", "COMPUTER"];

const EXTERNAL_AI_HOSTS = [
  "chatgpt.com",
  "gemini.google.com",
  "claude.ai",
  "deepseek.com",
  "perplexity.ai",
];

/**
 * Verify cousin → tabIndex → URL mapping (config + optional network manifest).
 * External AI hosts are never dashboard-embeddable — Edge Dispatch Bay only.
 */
export function verifyTabDestination(cousinId, options = {}) {
  const id = String(cousinId || "").toUpperCase();
  const tabs = loadTabsConfig();
  const tab = tabs.tabs.find((t) => t.id === id);
  const errors = [];
  const warnings = [];

  if (!tab) {
    return { ok: false, cousinId: id, errors: [`${id} not in crew-tabs.config.json`], warnings: [] };
  }

  if (!tab.tabIndex || tab.tabIndex < 1) {
    errors.push(`Invalid tabIndex ${tab.tabIndex} for ${id}`);
  }

  if (tab.tabIndex > 9) {
    warnings.push(
      `Tab ${tab.tabIndex} exceeds Ctrl+N shortcut range (1–9) — PS courier may not focus ${id} reliably`
    );
  }

  const dupes = tabs.tabs.filter((t) => t.tabIndex === tab.tabIndex && t.id !== id);
  if (dupes.length) {
    errors.push(`Duplicate tabIndex ${tab.tabIndex}: ${dupes.map((d) => d.id).join(", ")}`);
  }

  if (options.checkManifest !== false) {
    const manifestPath = abs("foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json");
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
      const mc = manifest.cousins?.find((c) => c.cousinId === id);
      if (mc) {
        if (Number(mc.edgeTabIndex) !== Number(tab.tabIndex)) {
          errors.push(
            `Manifest tab ${mc.edgeTabIndex} != config tab ${tab.tabIndex} for ${id} — re-issue network sync`
          );
        }
      } else if (RELAY_COUSIN_IDS.includes(id)) {
        warnings.push(`${id} missing from LATEST_NETWORK_COMMAND.json`);
      }
    } else if (RELAY_COUSIN_IDS.includes(id)) {
      warnings.push("No LATEST_NETWORK_COMMAND.json — network tab mapping unchecked");
    }
  }

  const url = tab.url || "";
  const externalAi = EXTERNAL_AI_HOSTS.some((h) => url.includes(h));

  return {
    ok: errors.length === 0,
    cousinId: id,
    tabIndex: tab.tabIndex,
    name: tab.name,
    url,
    externalAiHost: externalAi,
    embeddableInDashboard: !externalAi,
    embedNote: externalAi ? "Use Edge Dispatch Bay — vendor blocks iframe embedding" : null,
    errors,
    warnings,
  };
}

export function verifyAllRelayTabDestinations(options = {}) {
  const cousins = RELAY_COUSIN_IDS.map((id) => verifyTabDestination(id, options));
  const errors = cousins.flatMap((r) => r.errors.map((e) => `${r.cousinId}: ${e}`));
  const warnings = cousins.flatMap((r) => r.warnings.map((w) => `${r.cousinId}: ${w}`));
  return {
    ok: errors.length === 0,
    cousins,
    errors,
    warnings,
  };
}

export function loadContextHealth() {
  const cfg = loadCourierConfig();
  if (!exists(cfg.contextHealth)) return null;
  return JSON.parse(read(cfg.contextHealth));
}

export function saveContextHealth(data) {
  const cfg = loadCourierConfig();
  data.updatedAt = nowIso();
  fs.writeFileSync(abs(cfg.contextHealth), JSON.stringify(data, null, 2), "utf8");
}

export function loadRelayLock() {
  const cfg = loadCourierConfig();
  if (!exists(cfg.relayLock)) {
    return { status: "IDLE", message: "Lock file missing" };
  }
  return JSON.parse(read(cfg.relayLock));
}

export function writeRelayLock(patch) {
  const cfg = loadCourierConfig();
  const current = loadRelayLock();
  const next = { ...current, ...patch, updatedAt: nowIso() };
  fs.writeFileSync(abs(cfg.relayLock), JSON.stringify(next, null, 2), "utf8");
  return next;
}

export function acquireRelayLock(meta = {}) {
  clearStaleRelayLockIfNeeded();
  const lock = loadRelayLock();
  if (lock.status === "RUNNING") {
    return {
      ok: false,
      blocked: true,
      error: "COURIER RUNNING — DO NOT CLICK EDGE",
      lock,
    };
  }
  const runId = crypto.randomUUID();
  const next = writeRelayLock({
    status: "RUNNING",
    pid: process.pid,
    startedAt: nowIso(),
    completedAt: null,
    courierRunId: runId,
    cousin: meta.cousin || null,
    packetFile: meta.packetFile || null,
    message: "COURIER RUNNING — DO NOT CLICK EDGE",
  });
  return { ok: true, runId, lock: next };
}

export function releaseRelayLock(outcome, meta = {}) {
  const status = outcome === "success" ? "COMPLETE" : "FAILED";
  return writeRelayLock({
    status,
    pid: null,
    completedAt: nowIso(),
    message: meta.message || `Courier ${status.toLowerCase()}`,
    error: meta.error || null,
  });
}

const STALE_LOCK_MS = 2 * 60 * 1000;

/** Clear RUNNING lock when courier hung (PowerShell/WMI timeout). */
export function clearStaleRelayLockIfNeeded(maxAgeMs = STALE_LOCK_MS) {
  const lock = loadRelayLock();
  if (lock.status !== "RUNNING") return { cleared: false, lock };

  const started = Date.parse(lock.startedAt || lock.updatedAt || 0);
  if (!started || Number.isNaN(started)) {
    releaseRelayLock("failed", { message: "Stale lock cleared (missing startedAt)" });
    return { cleared: true, lock: loadRelayLock(), reason: "missing startedAt" };
  }

  const ageMs = Date.now() - started;
  if (ageMs < maxAgeMs) {
    return { cleared: false, lock, ageMs };
  }

  releaseRelayLock("failed", {
    message: `Stale lock cleared after ${Math.round(ageMs / 1000)}s (courier likely hung)`,
    error: lock.error || "courier timeout",
  });
  appendCourierLog(`STALE LOCK CLEARED — was RUNNING ${Math.round(ageMs / 1000)}s cousin=${lock.cousin || "?"}`);
  return { cleared: true, lock: loadRelayLock(), ageMs };
}

export function forceReleaseRelayLock(reason = "Operator unlock") {
  const lock = loadRelayLock();
  if (lock.status !== "RUNNING") {
    return { ok: true, alreadyIdle: true, lock };
  }
  releaseRelayLock("failed", { message: reason });
  appendCourierLog(`FORCE UNLOCK — ${reason}`);
  return { ok: true, lock: loadRelayLock() };
}

export function appendCourierLog(line) {
  const cfg = loadCourierConfig();
  const rel = cfg.courierLog;
  append(rel, `\n## ${nowIso()}\n- ${line}\n`);
}

export function appendSendLog(line) {
  const cfg = loadCourierConfig();
  append(cfg.sendLog, `\n## ${nowIso()}\n- ${line}\n`);
}

function loadRateLimitState() {
  const cfg = loadCourierConfig();
  const p = abs(cfg.autoSendRateLimitFile);
  if (!fs.existsSync(p)) return { events: [] };
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return { events: [] };
  }
}

function saveRateLimitState(state) {
  const cfg = loadCourierConfig();
  fs.writeFileSync(abs(cfg.autoSendRateLimitFile), JSON.stringify(state, null, 2), "utf8");
}

export function checkAutoSendRateLimit(cousinId) {
  const policy = loadDispatchPolicy();
  const limit = policy.classes.AUTO_SEND.rateLimit;
  const windowMs = limit.windowMinutes * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  const state = loadRateLimitState();
  const recent = state.events.filter(
    (e) => e.cousin === cousinId && Date.parse(e.at) >= cutoff
  );
  if (recent.length >= limit.maxPerCousin) {
    return {
      ok: false,
      error: `AUTO_SEND rate limit: max ${limit.maxPerCousin} per ${limit.windowMinutes}m for ${cousinId}`,
    };
  }
  return { ok: true, remaining: limit.maxPerCousin - recent.length };
}

export function recordAutoSend(cousinId, packetFile) {
  const state = loadRateLimitState();
  state.events.push({ cousin: cousinId, at: nowIso(), packetFile });
  const policy = loadDispatchPolicy();
  const windowMs = policy.classes.AUTO_SEND.rateLimit.windowMinutes * 60 * 1000;
  const cutoff = Date.now() - windowMs;
  state.events = state.events.filter((e) => Date.parse(e.at) >= cutoff);
  saveRateLimitState(state);
}

export function extractRelayMetadata(markdown) {
  const blockRe = /##\s*Relay metadata\s*\r?\n\r?\n```json\r?\n([\s\S]*?)\r?\n```/i;
  const match = markdown.match(blockRe);
  if (!match) return { ok: false, error: "Missing relay metadata block", metadata: null };
  try {
    return { ok: true, metadata: JSON.parse(match[1]), error: null };
  } catch (e) {
    return { ok: false, error: `Malformed metadata: ${e.message}`, metadata: null };
  }
}

function hasStructuralBlock(content, policy) {
  const markers = [
    ...(policy.classes.BLOCKED.markers || []),
    ...(policy.blockedContent.structuralMarkers || []),
  ];
  const upper = content.toUpperCase();
  return markers.some((m) => upper.includes(String(m).toUpperCase()));
}

function hasNeverLoadPattern(content, policy) {
  const lower = content.toLowerCase();
  return (policy.blockedContent.neverLoadPatterns || []).some((p) => lower.includes(p.toLowerCase()));
}

function regexSecondaryWarnings(content, policy) {
  if (!policy.secretScan?.regexSecondaryOnly) return [];
  const warnings = [];
  for (const pattern of policy.secretScan.regexPatterns || []) {
    if (new RegExp(pattern, "i").test(content)) {
      warnings.push(`Secondary regex hint matched — treat as BLOCKED until reviewed`);
      break;
    }
  }
  return warnings;
}

export function classifyPacket(metadata, content, options = {}) {
  const policy = loadDispatchPolicy();
  const template = metadata?.template || metadata?.command || metadata?.packet_template;
  const explicitClass = metadata?.dispatch_class || metadata?.dispatchClass;

  if (hasStructuralBlock(content, policy) || metadata?.DO_NOT_SEND === true) {
    return { dispatchClass: "BLOCKED", reason: "DO_NOT_SEND or CLASS_C marker" };
  }

  if (explicitClass === "BLOCKED" || explicitClass === "CLASS_C") {
    return { dispatchClass: "BLOCKED", reason: "Explicit BLOCKED class" };
  }

  const autonomousTemplates = [
    "AUTONOMOUS_ROUND_TRIP_TEST",
    "AUTONOMOUS_ROUND_TRIP_TEST_SKYBRO",
    "HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST",
    "WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW",
  ];
  if (
    autonomousTemplates.includes(template) ||
    metadata?.autonomous_round_trip_test === true ||
    metadata?.dispatch_class === "AUTONOMOUS_ROUND_TRIP_TEST"
  ) {
    return {
      dispatchClass: "AUTONOMOUS_ROUND_TRIP_TEST",
      reason: "Approved autonomous round-trip test — send requires explicit test flag",
      template: template || "AUTONOMOUS_ROUND_TRIP_TEST",
    };
  }

  if (template && policy.approvedLockedTemplates[template]) {
    const tpl = policy.approvedLockedTemplates[template];
    const dispatchClass = tpl.dispatchClass || "AUTO_SEND";
    return {
      dispatchClass,
      reason: `Approved locked template: ${template}`,
      template,
    };
  }

  if (metadata?.command === "ROLE_AWARENESS_SYNC") {
    return { dispatchClass: "AUTO_SEND", reason: "Network ROLE_AWARENESS_SYNC", template: "ROLE_AWARENESS_SYNC" };
  }

  if (explicitClass === "AUTO_SEND" || explicitClass === "CLASS_A") {
    return { dispatchClass: "AUTO_SEND", reason: "Explicit AUTO_SEND — must pass guards" };
  }

  return { dispatchClass: "AUTO_LOAD_HUMAN_SEND", reason: "Default CLASS B — stop before Send" };
}

export async function verifyPacketForCourier(packetPath, options = {}) {
  const policy = loadDispatchPolicy();
  const absPath = path.isAbsolute(packetPath) ? packetPath : abs(packetPath);
  if (!fs.existsSync(absPath)) {
    return { ok: false, status: "MISSING", errors: ["Packet file not found"] };
  }

  const raw = fs.readFileSync(absPath, "utf8");
  const size = byteLength(raw);
  const parsed = extractRelayMetadata(raw);
  const errors = [];
  const warnings = [];

  if (!parsed.ok) errors.push(parsed.error);

  const metadata = parsed.metadata || {};
  const cousin = String(metadata.cousin || options.cousinId || "").toUpperCase();
  const classification = classifyPacket(metadata, raw, options);

  if (classification.dispatchClass === "BLOCKED") {
    errors.push(`CLASS C BLOCKED: ${classification.reason}`);
  }

  if (hasNeverLoadPattern(raw, policy)) {
    errors.push("CLASS C BLOCKED: prohibited content pattern (structural)");
  }

  warnings.push(...regexSecondaryWarnings(raw, policy));

  const maxBytes = policy.classes.AUTO_SEND.maxPacketBytes;
  if (classification.dispatchClass === "AUTO_SEND" && size > maxBytes) {
    errors.push(`Packet size ${size} exceeds AUTO_SEND cap ${maxBytes}`);
  }

  if (options.verifyFresh !== false && parsed.ok) {
    const libPath = path.join(ROOT, "foreman/crew-dispatch/crew-relay-lib.mjs");
    const { pathToFileURL } = await import("node:url");
    const { isPacketStale } = await import(pathToFileURL(libPath).href);
    const stale = isPacketStale(metadata);
    if (stale.stale) errors.push(`STALE: ${stale.reason}`);
    if (classification.dispatchClass === "AUTO_SEND" && stale.stale) {
      errors.push("AUTO_SEND blocked on stale hashes");
    }
  }

  const health = loadContextHealth();
  const cousinHealth = health?.cousins?.[cousin];
  if (cousinHealth?.resetRecommended || cousinHealth?.status === "STALE") {
    warnings.push(`Context health: reset recommended for ${cousin}`);
    if (classification.dispatchClass === "AUTO_SEND") {
      errors.push("AUTO_SEND blocked — context STALE or RESET_RECOMMENDED");
    }
  }

  if (classification.dispatchClass === "AUTONOMOUS_ROUND_TRIP_TEST") {
    warnings.push("AUTONOMOUS_ROUND_TRIP_TEST — production send doctrine unchanged; explicit flag only");
  }

  const tabs = loadTabsConfig();
  const tab = tabs.tabs.find((t) => t.id === cousin);
  if (cousin && !tab) errors.push(`Destination cousin ${cousin} not in tabs config`);

  if (cousin) {
    const tabVerify = verifyTabDestination(cousin, { checkManifest: true });
    errors.push(...tabVerify.errors.map((e) => `Tab verify: ${e}`));
    warnings.push(...tabVerify.warnings);
  }

  if (classification.dispatchClass === "AUTO_SEND") {
    const allowed = policy.classes.AUTO_SEND.allowedCousins;
    if (cousin && !allowed.includes(cousin)) {
      errors.push(`AUTO_SEND cousin ${cousin} not allowlisted`);
    }
    const rate = checkAutoSendRateLimit(cousin);
    if (!rate.ok) errors.push(rate.error);
  }

  return {
    ok: errors.length === 0,
    status: errors.length ? "BLOCKED" : "OK",
    dispatchClass: classification.dispatchClass,
    classification,
    metadata,
    cousin,
    tab,
    pastePath: options.pastePath || null,
    size,
    errors,
    warnings,
    humanGate:
      classification.dispatchClass === "AUTO_LOAD_HUMAN_SEND"
        ? "STOP BEFORE SEND — review paste then Send manually"
        : classification.dispatchClass === "AUTO_SEND"
          ? "AUTO_SEND permitted by policy — still logged"
          : "HUMAN GATE REQUIRED",
  };
}

export function resolvePasteForCousin(cousinId, kind = "network") {
  const id = cousinId.toUpperCase();
  const tabs = loadTabsConfig();

  if (kind === "network") {
    const manifestPath = abs("foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json");
    if (!fs.existsSync(manifestPath)) throw new Error("No network command — issue ROLE_AWARENESS_SYNC first");
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const cousin = manifest.cousins.find((c) => c.cousinId === id);
    if (!cousin) throw new Error(`${id} not in network manifest`);
    const pastePath = abs(cousin.pastePath);
    if (!fs.existsSync(pastePath)) throw new Error(`Paste missing: ${cousin.pastePath}`);
    return {
      cousinId: id,
      tabIndex: cousin.edgeTabIndex,
      name: cousin.name,
      pastePath,
      packetFile: cousin.packetFile ? abs(cousin.packetFile) : null,
      kind: "network",
      template: "ROLE_AWARENESS_SYNC",
    };
  }

  const tab = tabs.tabs.find((t) => t.id === id);
  if (!tab?.pasteBlock) throw new Error(`No pasteBlock for ${id}`);
  const pastePath = abs(tab.pasteBlock);
  if (!fs.existsSync(pastePath)) throw new Error(`Paste missing: ${tab.pasteBlock}`);
  return {
    cousinId: id,
    tabIndex: tab.tabIndex,
    name: tab.name,
    pastePath,
    packetFile: null,
    kind: "dispatch",
    template: null,
  };
}

export async function isPlaywrightInstalled() {
  try {
    await import("playwright");
    return true;
  } catch {
    return false;
  }
}

export async function tryPlaywrightPaste(options) {
  try {
    const pw = await import("playwright");
    return {
      ok: false,
      skipped: true,
      reason: "Playwright package present but Edge paste automation not configured — using PS fallback",
      playwrightAvailable: Boolean(pw),
    };
  } catch {
    return { ok: false, skipped: true, reason: "Playwright not installed", playwrightAvailable: false };
  }
}

const AUTONOMOUS_SEND_FLAG = "ALLOW_AUTONOMOUS_ROUND_TRIP_SEND";

export const RECEIVED_TOKENS = {
  primary: "AUTONOMOUS_ROUND_TRIP_RECEIVED",
  short: "RECEIVED",
  patterns: [
    /\bAUTONOMOUS_ROUND_TRIP_RECEIVED\b/i,
    /^RECEIVED\s*$/im,
    /\bRECEIVED\b/i,
  ],
};

export function detectReceivedToken(text) {
  const hay = String(text || "");
  if (RECEIVED_TOKENS.patterns[0].test(hay)) {
    return { matched: true, kind: "primary", token: RECEIVED_TOKENS.primary };
  }
  if (RECEIVED_TOKENS.patterns[1].test(hay)) {
    return { matched: true, kind: "short_line", token: RECEIVED_TOKENS.short };
  }
  if (RECEIVED_TOKENS.patterns[2].test(hay)) {
    return { matched: true, kind: "short_word", token: RECEIVED_TOKENS.short };
  }
  return { matched: false, kind: null, token: null };
}

export function isAutonomousRoundTripSendAllowed(options = {}) {
  if (options.allowSend === true) return true;
  const env = process.env[AUTONOMOUS_SEND_FLAG];
  return (
    env === "1" ||
    env === "true" ||
    process.env.AUTONOMOUS_ROUND_TRIP_TEST === "1" ||
    process.env.HOMEPAGE_REWRITE_DISCOVERY_SMOKE_TEST === "1"
  );
}

const COUSIN_PLATFORM = {
  PETRA: "chatgpt",
  SKYBRO: "gemini",
  ENDER: "claude",
  BEAN: "deepseek",
  COMPUTER: "perplexity",
};

const PLATFORM_UI = {
  claude: {
    host: "claude.ai",
    newPath: "/new",
    composer: [
      "div.ProseMirror[contenteditable='true']",
      'div[contenteditable="true"]',
      '[data-testid="chat-input"]',
      "div.ProseMirror",
    ],
    send: [
      'button[aria-label="Send message"]',
      'button[aria-label="Send Message"]',
      'button[data-testid="send-button"]',
      'button[aria-label="Send"]',
    ],
    assistant: '[data-testid="assistant-message"]',
    label: "Claude",
  },
  gemini: {
    host: "gemini.google.com",
    newPath: "/app",
    composer: [
      "div.ql-editor[contenteditable='true']",
      "rich-textarea",
      'div[contenteditable="true"]',
      "textarea",
    ],
    send: [
      'button[aria-label="Send message"]',
      'button.send-button',
      "button.mat-mdc-button",
      'button[aria-label="Send"]',
    ],
    assistant: "[data-message-author-role='model'], .model-response-text",
    label: "Gemini",
  },
  perplexity: {
    host: "perplexity.ai",
    newPath: "/",
    composer: [
      "textarea[placeholder*='Ask']",
      "textarea",
      '[contenteditable="true"]',
      "#ask-input",
    ],
    send: [
      'button[aria-label="Submit"]',
      'button[aria-label="Send"]',
      "button.bg-super",
      "button[type='submit']",
    ],
    assistant: ".prose, [class*='answer'], [class*='markdown']",
    label: "Perplexity",
  },
  chatgpt: {
    host: "chatgpt.com",
    newPath: "/",
    composer: ["#prompt-textarea", "textarea", 'div[contenteditable="true"]'],
    send: ['button[data-testid="send-button"]', 'button[aria-label="Send"]'],
    assistant: "[data-message-author-role='assistant']",
    label: "ChatGPT",
  },
  deepseek: {
    host: "deepseek.com",
    newPath: "/",
    composer: ["textarea", 'div[contenteditable="true"]'],
    send: ['button[aria-label="Send"]', "button.type-submit"],
    assistant: ".ds-markdown, [class*='assistant']",
    label: "DeepSeek",
  },
};

export async function checkAutonomousPreflight() {
  const cfg = loadCourierConfig();
  const profileDir = abs(cfg.edgeProfileDir);
  const errors = [];
  if (!fs.existsSync(profileDir)) {
    errors.push(`Edge profile missing: ${cfg.edgeProfileDir}`);
  }
  const lock = loadRelayLock();
  if (lock.status === "RUNNING") {
    errors.push("Relay lock RUNNING — wait or run relay-courier.mjs unlock");
  }
  let playwright;
  try {
    playwright = await import("playwright");
  } catch (e) {
    errors.push(`Playwright not installed: ${e.message}`);
    return { ok: false, mode: "missing_playwright", errors };
  }
  for (const port of [9222, 9223, 9333]) {
    try {
      const browser = await playwright.chromium.connectOverCDP(`http://127.0.0.1:${port}`);
      await browser.close().catch(() => {});
      return { ok: true, mode: "cdp", port, errors: [] };
    } catch {
      /* next */
    }
  }
  const sandbox = abs("foreman/.edge-playwright-autonomous-sandbox");
  if (fs.existsSync(sandbox)) {
    return { ok: true, mode: "sandbox_available", errors: [] };
  }
  try {
    const probe = await playwright.chromium.launchPersistentContext(profileDir, {
      channel: "msedge",
      headless: true,
      timeout: 8000,
    });
    await probe.close().catch(() => {});
    return { ok: true, mode: "profile_ready", errors: [] };
  } catch (e) {
    if (/already in use|existing browser session/i.test(e.message)) {
      return {
        ok: false,
        mode: "profile_locked",
        errors: [
          "Edge profile locked by Aeye Crew Bay — close Edge, enable CDP on port 9222, or use sandbox login once",
        ],
      };
    }
    errors.push(e.message);
  }
  return { ok: errors.length === 0, mode: "unknown", errors };
}

function platformForCousin(cousinId) {
  const key = COUSIN_PLATFORM[String(cousinId).toUpperCase()];
  return PLATFORM_UI[key] || PLATFORM_UI.claude;
}

async function findComposer(page, platform) {
  const selectors = platform.composer;
  for (const sel of selectors) {
    const loc = page.locator(sel).last();
    if ((await loc.count()) > 0) {
      await loc.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
      return loc;
    }
  }
  return null;
}

async function fillComposer(page, composer, text) {
  await composer.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.press("Backspace");

  const filled = await composer.evaluate((el, t) => {
    el.focus();
    while (el.firstChild) el.removeChild(el.firstChild);
    const lines = t.split("\n").filter(Boolean);
    for (const line of lines) {
      const p = document.createElement("p");
      p.textContent = line;
      el.appendChild(p);
    }
    el.dispatchEvent(
      new InputEvent("input", { inputType: "insertText", data: t, bubbles: true, cancelable: true })
    );
    return (el.innerText || el.textContent || "").trim().length > 10;
  }, text);

  if (!filled) {
    await page.evaluate(async (t) => {
      await navigator.clipboard.writeText(t);
    }, text);
    await page.keyboard.press("Control+v");
  }
  await page.waitForTimeout(1000);
}

async function clickSendButton(page, platform) {
  const selectors = [...platform.send, "fieldset button[type='button']"];
  for (const sel of selectors) {
    const btn = page.locator(sel).last();
    if ((await btn.count()) === 0) continue;
    await btn.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
    const enabled = await btn.isEnabled().catch(() => false);
    if (!enabled) continue;
    await btn.click({ timeout: 8000 });
    return { ok: true, selector: sel };
  }
  await page.keyboard.press("Control+Enter");
  return { ok: true, selector: "Control+Enter" };
}

async function countAssistantMessages(page, platform) {
  return page.evaluate((assistantSel) => {
    const custom = document.querySelectorAll(assistantSel);
    if (custom.length) return custom.length;
    const byTestId = document.querySelectorAll('[data-testid="assistant-message"]');
    if (byTestId.length) return byTestId.length;
    const model = document.querySelectorAll("[data-message-author-role='model']");
    if (model.length) return model.length;
    const turns = [...document.querySelectorAll("[data-test-render-count]")].filter(
      (t) => !t.querySelector('[data-testid="user-message"]')
    );
    return turns.length;
  }, platform.assistant);
}

async function waitForAssistantReply(page, platform, baselineCount, timeoutMs = 180000) {
  await page
    .waitForFunction(
      (base) => {
        const streaming = document.querySelectorAll('[data-is-streaming="true"]').length;
        const model = document.querySelectorAll("[data-message-author-role='model']").length;
        const byTestId = document.querySelectorAll('[data-testid="assistant-message"]').length;
        const count = byTestId || model;
        return count > base && streaming === 0;
      },
      baselineCount,
      { timeout: timeoutMs }
    )
    .catch(() => null);

  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const streaming = await page.locator('[data-is-streaming="true"]').count();
    if (streaming === 0) {
      const text = await scrapeLastAssistantText(page, platform, baselineCount);
      if (text && text.length > 10) return text;
    }
    await page.waitForTimeout(1500);
  }
  throw new Error(`Timed out waiting for ${platform.label} reply (${timeoutMs}ms)`);
}

async function scrapeLastAssistantText(page, platform, baselineCount = 0) {
  return page.evaluate(
    ({ base, assistantSel }) => {
      const streaming = document.querySelectorAll('[data-is-streaming="true"]');
      if (streaming.length) return null;

      const pushText = (el, arr) => {
        const t = (el.innerText || el.textContent || "").trim();
        if (t.length > 5) arr.push(t);
      };

      const candidates = [];
      const custom = document.querySelectorAll(assistantSel);
      if (custom.length > base) {
        pushText(custom[custom.length - 1], candidates);
        return candidates[candidates.length - 1] || null;
      }

      const byTestId = document.querySelectorAll('[data-testid="assistant-message"]');
      if (byTestId.length > base) {
        pushText(byTestId[byTestId.length - 1], candidates);
        return candidates[candidates.length - 1] || null;
      }

      const model = document.querySelectorAll("[data-message-author-role='model']");
      if (model.length > base) {
        pushText(model[model.length - 1], candidates);
        return candidates[candidates.length - 1] || null;
      }

      const turns = [...document.querySelectorAll("[data-test-render-count]")].filter(
        (t) => !t.querySelector('[data-testid="user-message"]')
      );
      if (turns.length > base) {
        pushText(turns[turns.length - 1], candidates);
        return candidates[candidates.length - 1] || null;
      }

      document.querySelectorAll('[data-is-streaming="false"]').forEach((el) => pushText(el, candidates));
      return candidates.length ? candidates[candidates.length - 1] : null;
    },
    { base: baselineCount, assistantSel: platform.assistant }
  );
}

/**
 * Cousin autonomous round-trip: paste → send (explicit flag) → scrape reply.
 * Does NOT change production humanSendGate doctrine.
 */
export async function runAutonomousRoundTripCousin(options = {}) {
  const cousinId = String(options.cousinId || "ENDER").toUpperCase();
  const templateId = options.templateId || "AUTONOMOUS_ROUND_TRIP_TEST";
  const allowSend = isAutonomousRoundTripSendAllowed(options);
  if (!allowSend) {
    return {
      ok: false,
      status: "BLOCKED",
      error: `Send blocked — set ${AUTONOMOUS_SEND_FLAG}=1 or pass allowSend:true`,
      humanGate: "Explicit test flag required for automated Send",
    };
  }

  const cfg = loadCourierConfig();
  const tabs = loadTabsConfig();
  const cousinTab = tabs.tabs.find((t) => t.id === cousinId);
  if (!cousinTab) {
    return { ok: false, error: `${cousinId} tab missing from crew-tabs.config.json` };
  }

  const platform = platformForCousin(cousinId);
  const pasteText = options.pasteText;
  if (!pasteText || !pasteText.trim()) {
    return { ok: false, error: "pasteText required" };
  }

  let playwright;
  try {
    playwright = await import("playwright");
  } catch (e) {
    return { ok: false, error: `Playwright not installed: ${e.message}` };
  }

  const profileDir = abs(cfg.edgeProfileDir);
  if (!fs.existsSync(profileDir)) {
    return {
      ok: false,
      error: `Edge profile missing: ${cfg.edgeProfileDir} — open Aeye Crew Bay once`,
    };
  }

  const lock = acquireRelayLock({
    cousin: cousinId,
    packetFile: options.packetFile || templateId,
  });
  if (!lock.ok) {
    return { ok: false, blocked: true, error: lock.error, lock: lock.lock };
  }

  let context = null;
  let cdpBrowser = null;
  let profileMode = "profile";
  const targetUrl = cousinTab.url || `https://${platform.host}/`;
  const timeoutMs = options.timeoutMs || 120000;

  async function launchEdgeContext(userDataDir) {
    try {
      return await playwright.chromium.launchPersistentContext(userDataDir, {
        channel: "msedge",
        headless: false,
        viewport: null,
        args: ["--disable-blink-features=AutomationControlled"],
      });
    } catch {
      return playwright.chromium.launchPersistentContext(userDataDir, {
        headless: false,
        viewport: null,
      });
    }
  }

  async function tryConnectLiveEdge(playwright) {
    for (const port of [9222, 9223, 9333]) {
      try {
        const browser = await playwright.chromium.connectOverCDP(`http://127.0.0.1:${port}`);
        const context = browser.contexts()[0];
        if (context) {
          appendCourierLog(`AUTONOMOUS_ROUND_TRIP_TEST connected over CDP :${port}`);
          return { context, cdp: true, browser };
        }
      } catch {
        /* try next port */
      }
    }
    return null;
  }

  function sandboxProfileDir() {
    return abs("foreman/.edge-playwright-autonomous-sandbox");
  }

  function sandboxProfileCopy(srcDir) {
    const dest = sandboxProfileDir();
    try {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
        fs.cpSync(srcDir, dest, {
          recursive: true,
          force: true,
          filter: (src) => !/\\(SingletonLock|lockfile|LOCK)$/i.test(src),
        });
      }
      return dest;
    } catch (e) {
      appendCourierLog(`AUTONOMOUS_ROUND_TRIP_TEST sandbox copy failed: ${e.message}`);
      if (fs.existsSync(dest)) {
        appendCourierLog("AUTONOMOUS_ROUND_TRIP_TEST using partial sandbox profile");
        return dest;
      }
      return null;
    }
  }

  try {
    appendCourierLog(`${templateId} START — ${cousinId} Playwright send (explicit flag)`);
    appendSendLog(`${templateId} — automated Send permitted by explicit test flag only`);

    const live = await tryConnectLiveEdge(playwright);
    if (live) {
      context = live.context;
      cdpBrowser = live.browser;
      profileMode = "cdp";
    } else {
      try {
        context = await launchEdgeContext(profileDir);
        profileMode = "profile";
      } catch (e) {
        const locked = /already in use|existing browser session/i.test(e.message);
        if (!locked) throw e;
        const sandbox = sandboxProfileCopy(profileDir) || sandboxProfileDir();
        if (!fs.existsSync(sandbox)) {
          throw new Error(
            "Edge profile locked by Aeye Crew Bay — close Edge, or restart Edge with --remote-debugging-port=9222"
          );
        }
        appendCourierLog(`${templateId} profile locked — launching sandbox: ${sandbox}`);
        context = await launchEdgeContext(sandbox);
        profileMode = "sandbox";
      }
    }

    const page =
      context.pages().find((p) => p.url().includes(platform.host)) ||
      context.pages()[0] ||
      (await context.newPage());
    const base = new URL(targetUrl);
    const chatUrl = `${base.origin}${platform.newPath}`;
    await page.goto(chatUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(3000);

    const composer = await findComposer(page, platform);
    if (!composer) {
      throw new Error(
        `${platform.label} composer not found — log into ${platform.host} in Edge profile first`
      );
    }

    await fillComposer(page, composer, pasteText);

    const baselineCount = await countAssistantMessages(page, platform);
    const sendResult = await clickSendButton(page, platform);
    appendCourierLog(
      `${templateId} ${cousinId} SEND via ${sendResult.selector} (baseline=${baselineCount} mode=${profileMode})`
    );

    await page.waitForTimeout(3000);
    let composerText = await composer.evaluate((el) => (el.innerText || el.textContent || "").trim());
    if (composerText.length > 20) {
      appendCourierLog(`${templateId} WARN — composer still has text; retrying send`);
      await clickSendButton(page, platform);
      await page.waitForTimeout(3000);
      composerText = await composer.evaluate((el) => (el.innerText || el.textContent || "").trim());
      if (composerText.length > 20) {
        throw new Error(`Send did not clear composer — check ${platform.label} login or send button`);
      }
    }

    const scraped = await waitForAssistantReply(page, platform, baselineCount, timeoutMs);
    const token = detectReceivedToken(scraped);
    const received = token.matched && token.kind === "primary";

    releaseRelayLock("success", { message: `${templateId} ${cousinId} complete` });

    return {
      ok: Boolean(scraped && scraped.trim().length > 10),
      status: received ? "RECEIVED" : token.matched ? "REPLY_SHORT_TOKEN" : "REPLY_WITHOUT_TOKEN",
      scrapedText: scraped,
      receivedToken: received,
      tokenMatchKind: token.kind,
      sendResult,
      profileMode,
      targetUrl: page.url(),
      humanGate: received ? "NONE — test proof complete" : "Reply missing primary RECEIVED token",
    };
  } catch (e) {
    appendCourierLog(`${templateId} ${cousinId} FAIL: ${e.message}`);
    releaseRelayLock("failed", { message: `${templateId} failed`, error: e.message });
    return { ok: false, status: "FAIL", error: e.message, profileMode };
  } finally {
    if (cdpBrowser) {
      await cdpBrowser.close().catch(() => {});
    } else if (context) {
      await context.close().catch(() => {});
    }
  }
}

/** @deprecated use runAutonomousRoundTripCousin */
export async function runAutonomousRoundTripEnder(options = {}) {
  return runAutonomousRoundTripCousin({ ...options, cousinId: "ENDER" });
}

/**
 * No-send self-test: import Playwright, launch browser, verify tab config.
 * Must NOT paste into AI tabs or click Send.
 */
export async function runPlaywrightSelfTest() {
  const cfg = loadCourierConfig();
  const tabs = loadTabsConfig();
  const checks = [];
  const warnings = [];
  const failures = [];

  let playwright;
  try {
    playwright = await import("playwright");
    checks.push({ name: "playwright_import", ok: true });
  } catch (e) {
    failures.push(`playwright import failed: ${e.message}`);
    return {
      ok: false,
      status: "FAIL",
      checks,
      warnings,
      failures,
      humanGate: "NO SEND — self-test only",
    };
  }

  const petra = tabs.tabs.find((t) => t.id === "PETRA");
  if (!petra?.tabIndex) {
    failures.push("PETRA destination missing in crew-tabs.config.json");
  } else {
    checks.push({
      name: "destination_petra",
      ok: true,
      tabIndex: petra.tabIndex,
      url: petra.url,
    });
  }

  const foremanTab = tabs.tabs.find((t) => t.id === "FOREMAN");
  const edgeProfileRel = cfg.edgeProfileDir || "foreman/.edge-aeye-crew-profile";
  const edgeProfile = abs(edgeProfileRel);
  checks.push({
    name: "edge_profile_dir",
    ok: fs.existsSync(edgeProfile),
    path: edgeProfileRel,
  });
  if (!fs.existsSync(edgeProfile)) {
    warnings.push("Edge profile dir not created yet — open Aeye Crew Bay once");
  }

  const aiHosts = ["chatgpt.com", "gemini.google.com", "claude.ai", "deepseek.com", "perplexity.ai"];
  let browser = null;
  let launchChannel = "chromium";

  try {
    try {
      browser = await playwright.chromium.launch({ channel: "msedge", headless: true });
      launchChannel = "msedge";
    } catch {
      browser = await playwright.chromium.launch({ headless: true });
      launchChannel = "chromium";
    }
    checks.push({ name: "browser_launch", ok: true, channel: launchChannel });

    const page = await browser.newPage();
    await page.goto("about:blank");
    const blankOk = (await page.url()) === "about:blank";
    checks.push({ name: "page_control", ok: blankOk });

    if (foremanTab?.url) {
      try {
        await page.goto(foremanTab.url, {
          timeout: 8000,
          waitUntil: "domcontentloaded",
        });
        const reached = page.url().includes("4317") || page.url().includes("localhost");
        checks.push({ name: "foreman_tab_reachable", ok: reached, url: page.url() });
        if (!reached) warnings.push("Foreman tab URL did not resolve as expected");
      } catch (e) {
        warnings.push(`Foreman not reachable at ${foremanTab.url} — start foreman-control.cmd (${e.message})`);
        checks.push({ name: "foreman_tab_reachable", ok: false, skipped: true });
      }
    }

    for (const host of aiHosts) {
      if (page.url().includes(host)) {
        failures.push(`Self-test violated safe scope — navigated to ${host}`);
      }
    }
  } catch (e) {
    failures.push(`browser self-test failed: ${e.message}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }

  appendCourierLog(
    `SELF-TEST ${failures.length ? "FAIL" : "PASS"} channel=${launchChannel} — NO SEND`
  );

  return {
    ok: failures.length === 0,
    status: failures.length ? "FAIL" : "PASS",
    checks,
    warnings,
    failures,
    playwrightInstalled: true,
    launchChannel,
    humanGate: "NO SEND — self-test only; no AI tabs pasted",
    neverAutomated: cfg.fallback?.neverAutomates || ["send", "submit", "post"],
  };
}

export { ROOT, abs, nowIso };
