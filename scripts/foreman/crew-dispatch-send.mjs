#!/usr/bin/env node
/**
 * VPGM dispatch with custody evidence.
 *
 * Canon: foreman/VPGM_OPERATING_CANON.md (verify hash before obeying).
 *
 * The previous courier stopped after inserting text and reported
 * LOADED_AWAITING_HUMAN_SEND. Canon P.3 is explicit that "text in a box is not
 * dispatch", and P.1 forbids asking the Operator to carry bytes while a safe
 * mechanical route exists. Three dispatches were reported successful today and
 * produced zero cousin responses; one composer silently cleared itself within
 * fifteen minutes, taking the packet with it.
 *
 * So this does the whole leg:
 *   1. Fresh route proof immediately before dispatch (P.1).
 *   2. Compose exact bytes, record COMPOSED_NOT_SENT (P.3).
 *   3. Invoke the provider's own Send control exactly once. No synthesized
 *      Enter, no OS focus, no physical mouse, no clipboard (P.2, P.4).
 *   4. Prove the outbound message exists in the destination transcript (P.5).
 *   5. Record POSTED_NOT_CUSTODY. Posting is not custody (P.6, P.7).
 *
 * One SUBMISSION_ID permits at most one provider-accepted dispatch (P.8). The
 * ledger enforces that across runs, so a re-run cannot double-post.
 *
 *   node scripts/foreman/crew-dispatch-send.mjs prove   [--cousins A,B]
 *   node scripts/foreman/crew-dispatch-send.mjs dispatch [--cousins A,B] [--all]
 *   node scripts/foreman/crew-dispatch-send.mjs ledger
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { connectCdp, discoverPortForSeat } from "./chrome-cdp-discover.mjs";

const ROOT = process.cwd();
const PORT = Number(process.env.AEYE_CDP_PORT || 0);
const MANIFEST = "foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json";
const LEDGER = path.join(ROOT, "foreman/crew-dispatch/DISPATCH_LEDGER.jsonl");
const SHOT_DIR = path.join(ROOT, "foreman/receipts/courier-proof");
const PROJECT_ID = "WERKLES_COM";

const SEATS = {
  PETRA: {
    name: "Petra / ChatGPT",
    host: "chatgpt.com",
    composers: ["div#prompt-textarea[contenteditable='true']", "div[contenteditable='true']", "textarea"],
    sendControls: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]', '#composer-submit-button'],
    nativeIdFromUrl: /\/c\/([0-9a-f-]{16,})/i
  },
  SKYBRO: {
    name: "Skybro / Gemini",
    host: "gemini.google.com",
    composers: ["div.ql-editor[contenteditable='true']", "div[contenteditable='true']", "textarea"],
    sendControls: ['button[aria-label*="Send" i]', "button.send-button", 'button[mattooltip*="Send" i]'],
    nativeIdFromUrl: /\/app\/([0-9a-f]{8,})/i
  },
  ENDER: {
    name: "Ender / Claude",
    host: "claude.ai",
    composers: ["div.ProseMirror[contenteditable='true']", "div[contenteditable='true']", "textarea"],
    sendControls: [
      'button[data-testid="chat-input-send"]',
      'button[aria-label="Send message"]',
      'button[aria-label*="Send" i]',
      'button[data-testid="send-button"]',
      'button[type="submit"]'
    ],
    nativeIdFromUrl: /\/chat\/([0-9a-f-]{16,})/i
  },
  BEAN: {
    name: "Bean / DeepSeek",
    host: "chat.deepseek.com",
    composers: ["textarea#chat-input", "textarea", "div[contenteditable='true']"],
    sendControls: ['div[role="button"][aria-label*="Send" i]', 'button[aria-label*="Send" i]', "div._7436101"],
    nativeIdFromUrl: /\/a\/chat\/s\/([0-9a-f-]{16,})/i
  },
  COMPUTER: {
    name: "Computer / Perplexity",
    host: "perplexity.ai",
    composers: ["div[contenteditable='true']", "textarea[placeholder]", "textarea"],
    sendControls: [
      'button[data-testid="submit-button"]',
      'button[aria-label*="Submit" i]',
      'button[aria-label*="Send" i]'
    ],
    nativeIdFromUrl: /\/search\/([\w-]{12,})/i
  }
};

const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const nowIso = () => new Date().toISOString();

function readManifest() {
  const p = path.join(ROOT, MANIFEST);
  if (!fs.existsSync(p)) throw new Error(`No manifest at ${MANIFEST} — issue a VPGM command first`);
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
    manifest,
    /* Bytes-derived, so an edited packet is a new submission rather than a
       forbidden second dispatch of the same one. */
    submissionId: `${manifest.commandId || manifest.missionId || "VPGM"}:${cousinId}:${hash.slice(0, 12)}`
  };
}

/** Distinctive first and last runs of the packet, used as transcript echo markers. */
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

/** P.8 — a SUBMISSION_ID that already reached the provider must never be re-sent. */
function priorAcceptance(submissionId) {
  return ledgerRows().find(
    (r) =>
      r.submissionId === submissionId &&
      ["POSTED_NOT_CUSTODY", "UNKNOWN_SUBMISSION_STATE__DO_NOT_REPEAT"].includes(r.result)
  );
}

async function connectForSeat(cousinId) {
  const seat = SEATS[cousinId];
  const discovery = await discoverPortForSeat(seat, { explicitPort: PORT || undefined });
  if (!discovery.port) {
    throw new Error(
      `${discovery.hint || "No Chrome with DevTools on localhost."} ` +
        `Your signed-in tabs are invisible until that Chrome is wired — not a second sign-in.`
    );
  }
  const connected = await connectCdp(discovery.port);
  return { ...connected, discovery };
}

function pagesOf(browser) {
  return browser.contexts().flatMap((c) => c.pages());
}

function pageForSeat(browser, seat) {
  for (const page of pagesOf(browser)) {
    try {
      if (page.url().includes(seat.host)) return page;
    } catch {
      /* page died mid-enumeration */
    }
  }
  return null;
}

async function firstVisible(page, selectors) {
  for (const selector of selectors) {
    try {
      const locator = page.locator(selector).first();
      if (await locator.isVisible({ timeout: 1200 })) return { locator, selector };
    } catch {
      /* next candidate */
    }
  }
  return { locator: null, selector: null };
}

/**
 * Account evidence read from rendered UI only — a displayed name or email is not
 * a secret. Cookies, tokens and storage are never touched.
 */
async function accountEvidence(page) {
  return page
    .evaluate(() => {
      const out = {};
      const email = (document.body.innerText || "").match(/[\w.+-]+@[\w-]+\.[\w.]{2,}/);
      if (email) out.email = email[0];
      const control = document.querySelector(
        '[data-testid*="profile" i],[aria-label*="account" i],[aria-label*="profile" i],img[alt*="avatar" i],[data-testid*="user" i]'
      );
      if (control) {
        out.accountControl =
          control.getAttribute("aria-label") ||
          control.getAttribute("alt") ||
          control.getAttribute("data-testid") ||
          null;
      }
      const signInWall = /sign in|log in|create account|continue with google/i.test(
        (document.body.innerText || "").slice(0, 4000)
      );
      out.signInLanguageVisible = signInWall;
      return out;
    })
    .catch(() => ({}));
}

/**
 * P.1 — fresh route proof. A visible tab or an open composer is explicitly NOT
 * route proof, so this reports each field separately and refuses on any gap.
 */
async function proveRoute(browser, cousinId) {
  const seat = SEATS[cousinId];
  const { submissionId, hash, row } = packetFor(cousinId);
  const page = pageForSeat(browser, seat);

  const proof = {
    cousinId,
    seat: seat.name,
    projectId: PROJECT_ID,
    roleAtMachine: `${cousinId}@${seat.name.split(" / ")[1]}`,
    provider: seat.host,
    submissionId,
    packetSha256: hash,
    packetFile: row.packetFile,
    readAt: nowIso(),
    tab: Boolean(page)
  };

  if (!page) {
    return { ...proof, routeProved: false, blocker: "ROUTE_UNPROVED", missing: ["no tab on provider host"] };
  }

  proof.url = page.url();
  proof.nativeId = (proof.url.match(seat.nativeIdFromUrl) || [null, null])[1] || null;
  proof.account = await accountEvidence(page);

  const composer = await firstVisible(page, seat.composers);
  proof.composerSelector = composer.selector;

  const send = await firstVisible(page, seat.sendControls);
  proof.sendSelector = send.selector;
  proof.sendEnabled = send.locator ? await send.locator.isEnabled().catch(() => false) : false;

  const missing = [];
  const noAccount = !proof.account.email && !proof.account.accountControl;
  if (!composer.selector) missing.push("composer not callable");
  if (noAccount) missing.push("no account identity evidence");
  /* A usable composer with no account identity is an anonymous session, not an
     ambiguous route: Perplexity and others answer while signed out, and a reply
     in an anonymous session is unattributable and unrecoverable. Canon treats
     that as receiver-signed-out, which is an Operator gate. */
  if (proof.account.signInLanguageVisible && (noAccount || !composer.selector)) missing.push("sign-in wall");

  /* A send control that is absent while the composer is empty is normal: most
     providers only enable Send once there is text. Its absence is judged again
     after composing, not here. */
  if (missing.length) {
    fs.mkdirSync(SHOT_DIR, { recursive: true });
    const shot = path.join(SHOT_DIR, `${cousinId}_route_blocked.png`);
    await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
    proof.screenshot = path.relative(ROOT, shot).replace(/\\/g, "/");

    /* Swanson 2026-08-03: do not overclaim signed-out from missing evidence alone.
       Absence of proof is not proof of absence, and the two cases need different
       hands — a login wall needs the Operator, an unprovable identity may only
       need a better selector. Positive sign-in evidence is required to say the
       receiver is signed out; otherwise the honest state is that the account
       could not be proved. Both fail closed; only one is a Human Gate. */
    let blocker;
    if (proof.account.signInLanguageVisible) blocker = "BLOCKED_RECEIVER_SIGNED_OUT";
    else if (composer.selector && noAccount) blocker = "ROUTE_UNPROVED_ACCOUNT_IDENTITY";
    else blocker = "ROUTE_UNPROVED";

    return { ...proof, routeProved: false, blocker, missing };
  }

  return { ...proof, routeProved: true, blocker: null, missing: [] };
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

/**
 * P.5 — the outbound message must be findable in the destination transcript.
 *
 * `sent` is the full packet. Markers locate the span; the span is then compared
 * against the sent bytes under a deterministic normalization, because a provider
 * may legitimately alter whitespace while never legitimately altering words.
 */
async function transcriptEcho(page, head, tail, sent) {
  return page
    .evaluate(
      ({ head, tail, sent }) => {
        /* Deterministic normalization, applied identically to both sides:
           collapse all whitespace runs and trim. Anything surviving this that
           still differs is a real content difference, not a rendering artifact. */
        const norm = (s) => s.replace(/\s+/g, " ").trim();
        const body = document.body.innerText || "";
        const h = body.indexOf(head);
        const t = tail ? body.lastIndexOf(tail) : -1;
        let bodyMatches = false;
        if (h >= 0 && t >= 0 && t > h) {
          bodyMatches = norm(body.slice(h, t + tail.length)) === norm(sent);
        }
        let messageId = null;
        if (h >= 0) {
          /* Walk text nodes to find the element carrying the echo, then look for a
             provider message id on it or its ancestors. */
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let node;
          while ((node = walker.nextNode())) {
            if (node.nodeValue && node.nodeValue.includes(head.slice(0, 30))) {
              let el = node.parentElement;
              for (let i = 0; el && i < 12; i++, el = el.parentElement) {
                for (const attr of el.getAttributeNames?.() || []) {
                  if (/message[-_]?id|data-message|turn-id/i.test(attr)) {
                    messageId = `${attr}=${el.getAttribute(attr)}`;
                    break;
                  }
                }
                if (messageId) break;
              }
              break;
            }
          }
        }
        return {
          headFound: h >= 0,
          tailFound: t >= 0,
          bodyMatches,
          echoChars: h >= 0 && t >= 0 && t > h ? t + tail.length - h : h >= 0 ? -1 : 0,
          messageId
        };
      },
      { head, tail, sent }
    )
    .catch(() => ({ headFound: false, tailFound: false, bodyMatches: false, echoChars: 0, messageId: null }));
}

async function dispatchSeat(browser, cousinId) {
  const seat = SEATS[cousinId];
  const { text, hash, submissionId, row } = packetFor(cousinId);
  const base = {
    at: nowIso(),
    projectId: PROJECT_ID,
    cousinId,
    seat: seat.name,
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
      note: `SUBMISSION_ID already reached the provider at ${already.at} with result ${already.result}. P.8 forbids a second accepted dispatch.`
    };
  }

  const route = await proveRoute(browser, cousinId);
  if (!route.routeProved) {
    const record = {
      ...base,
      result: route.blocker,
      packetObligation: "STILL_OWED",
      route,
      note: `Route not proved: ${route.missing.join("; ")}. Nothing composed, nothing sent.`
    };
    appendLedger(record);
    return record;
  }

  const page = pageForSeat(browser, seat);
  const composer = page.locator(route.composerSelector).first();

  /* Clear anything stale so the provider receives exact packet bytes and nothing
     else. selectText + insertText replaces; no clipboard, no OS keystrokes. */
  await composer.focus();
  const existing = await readComposer(page, route.composerSelector);
  if (existing.trim().length > 0) {
    await page.evaluate((sel) => {
      const el = document.querySelector(sel);
      if (!el) return;
      if (el.tagName === "TEXTAREA") {
        el.value = "";
        el.dispatchEvent(new Event("input", { bubbles: true }));
      } else {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel2 = window.getSelection();
        sel2.removeAllRanges();
        sel2.addRange(range);
      }
    }, route.composerSelector);
  }

  await page.keyboard.insertText(text);
  await page.waitForTimeout(900);

  const composed = await readComposer(page, route.composerSelector);
  const { head, tail } = markers(text);
  const composedOk = composed.includes(head.slice(0, 34)) && composed.includes(tail.slice(-34));
  base.charsInComposer = composed.length;

  if (!composedOk) {
    const record = {
      ...base,
      result: "COMPOSED_NOT_SENT",
      packetObligation: "STILL_OWED",
      route,
      note: "Composer did not read back head and tail of the exact bytes. Not sending an unverified packet."
    };
    appendLedger(record);
    return record;
  }

  /* Send control is judged now: most providers only enable it once text exists. */
  const send = await firstVisible(page, seat.sendControls);
  if (!send.locator) {
    const record = {
      ...base,
      result: "SEND_CONTROL_UNAVAILABLE",
      packetObligation: "STILL_OWED",
      route,
      note: "Bytes are composed but no supported Send control was found. Not synthesizing Enter."
    };
    appendLedger(record);
    return record;
  }
  if (!(await send.locator.isEnabled().catch(() => false))) {
    const record = {
      ...base,
      result: "SEND_HANDS_UNAVAILABLE",
      packetObligation: "STILL_OWED",
      route,
      sendSelector: send.selector,
      note: "Send control present but disabled. Not synthesizing Enter."
    };
    appendLedger(record);
    return record;
  }

  const urlBefore = page.url();
  /* Exactly one invocation of the provider's own control, dispatched through CDP.
     No OS focus, no physical mouse, no keystroke synthesis. */
  await send.locator.click({ timeout: 15000, noWaitAfter: true });
  base.sendActionExecuted = true;
  base.sendSelector = send.selector;
  base.sendInvokedAt = nowIso();

  let echo = { headFound: false, tailFound: false, bodyMatches: false, echoChars: 0, messageId: null };
  let composerEmptied = false;
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(1500);
    const left = await readComposer(page, route.composerSelector);
    composerEmptied = left.trim().length < 40;
    echo = await transcriptEcho(page, head, tail, text);
    if (echo.bodyMatches) break;
  }

  const urlAfter = page.url();
  const nativeIdAfter = (urlAfter.match(seat.nativeIdFromUrl) || [null, null])[1] || null;

  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const shot = path.join(SHOT_DIR, `${cousinId}_posted.png`);
  await page.screenshot({ path: shot, fullPage: false }).catch(() => {});

  const proofRecord = {
    ...base,
    route,
    urlBefore,
    urlAfter,
    nativeThreadId: nativeIdAfter,
    composerEmptied,
    transcriptEcho: echo,
    providerMessageEventId: echo.messageId,
    screenshot: path.relative(ROOT, shot).replace(/\\/g, "/")
  };

  /* P.5 is strict: a click, a spinner, or an emptied composer is not proof. The
     packet's own bytes must be readable in the destination transcript.

     Amended by Swanson 2026-08-03: head-plus-tail proves framing only. It does not
     prove the middle survived. A provider that truncates or mutates the interior
     while preserving both ends passes a marker check and delivers a mutilated
     instruction the receiver will confidently obey. Framing is now the cheap
     pre-filter; the decision is made on normalized full-body equality. */
  if (echo.bodyMatches) {
    const record = { ...proofRecord, result: "POSTED_NOT_CUSTODY", packetObligation: "POSTED_AWAITING_CUSTODY" };
    appendLedger(record);
    return record;
  }

  if (echo.headFound) {
    /* Terminal for this leg. Send was invoked and accepted, so the SUBMISSION_ID is
       consumed: this must not revert to COMPOSED_NOT_SENT, because partial
       instructions may already be executing at the receiver. No automatic resend,
       and the leg is quarantined from assimilation. */
    const record = {
      ...proofRecord,
      result: "POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT",
      packetObligation: "CONSUMED_AMBIGUOUS",
      quarantined: true,
      assimilationAllowed: false,
      observedSpan: { echoChars: echo.echoChars, sentChars: text.length, tailFound: echo.tailFound },
      note:
        "Send was invoked once and the packet head appears in the transcript, but the transcript body " +
        "does not match the sent bytes. The interior may be truncated or mutated and the receiver may " +
        "already be acting on a partial instruction. SUBMISSION_ID is consumed. No automatic resend; " +
        "this leg is quarantined from assimilation and requires an Operator decision."
    };
    appendLedger(record);
    return record;
  }

  const record = {
    ...proofRecord,
    result: "UNKNOWN_SUBMISSION_STATE__DO_NOT_REPEAT",
    packetObligation: "STILL_OWED_UNVERIFIED",
    note:
      "Send was invoked once but no transcript echo was found at all. " +
      "Canon forbids a retry without evidence of rejection."
  };
  appendLedger(record);
  return record;
}

function seatList(args) {
  const i = args.indexOf("--cousins");
  if (args.includes("--all")) return readManifest().cousins.map((c) => c.cousinId).filter((id) => SEATS[id]);
  if (i >= 0 && args[i + 1]) return args[i + 1].split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
  return Object.keys(SEATS);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";

  if (cmd === "ledger") {
    console.log(JSON.stringify(ledgerRows(), null, 2));
    return;
  }

  if (cmd === "prove" || cmd === "dispatch") {
    const ids = seatList(args);
    for (const id of ids) if (!SEATS[id]) throw new Error(`Unknown seat ${id}`);
    const out = [];
    for (const id of ids) {
      /* Sequential on purpose: one provider-accepted dispatch at a time keeps the
         ledger honest if the process dies mid-run. Attach to whichever Chrome
         actually has this cousin signed in — not a fixed crew profile by default. */
      const { browser, port, discovery } = await connectForSeat(id);
      const row =
        cmd === "prove"
          ? await proveRoute(browser, id)
          : await dispatchSeat(browser, id);
      if (discovery.seatState && !discovery.signedIn && row.blocker === "BLOCKED_RECEIVER_SIGNED_OUT") {
        row.cdpPort = port;
        row.cdpHint =
          port === 9335
            ? "Automation reached crew Chrome (:9335) at sign-in. Your signed-in DeepSeek is likely in normal Chrome without DevTools — quit Chrome, run: node scripts/foreman/ensure-operator-chrome-cdp.mjs"
            : "DevTools reached this Chrome but the seat is still at sign-in.";
      } else if (port) {
        row.cdpPort = port;
      }
      out.push(row);
      const last = out[out.length - 1];
      console.log(`${id} ${last.result || (last.routeProved ? "ROUTE_PROVED" : last.blocker)}`);
    }
    console.log(JSON.stringify(out, null, 2));
    return;
  }

  console.log(`Commands:
prove    [--cousins A,B|--all]   Fresh route proof only. Composes nothing, sends nothing.
dispatch [--cousins A,B|--all]   Route proof, compose, invoke Send once, prove transcript echo.
ledger                            Every dispatch attempt with its result.

Canon: foreman/VPGM_OPERATING_CANON.md`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err.message);
    process.exit(1);
  }
);
