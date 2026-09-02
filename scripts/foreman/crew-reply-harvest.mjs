#!/usr/bin/env node
/**
 * Reply harvester — pull a cousin's answer out of a provider transcript and land
 * it in `foreman/handoffs/inbox/` as a receipt.
 *
 * Canon: foreman/VPGM_OPERATING_CANON.md
 *
 * Posting was solved by crew-dispatch-send.mjs. Custody was not. Canon P.7 is
 * explicit that POSTED does not prove the receiver has the packet, and only the
 * addressed receiver returning RECEIVED with its own computed packet hash does.
 * Until this existed, getting an answer back into the repo was a manual copy,
 * which is exactly the Operator burden the cockpit is supposed to remove.
 *
 * This performs ONE state read per seat. It is not a poller, watcher, or loop
 * (canon M.6): it reads, writes what it found, and exits.
 *
 *   node scripts/foreman/crew-reply-harvest.mjs read    [--cousins A,B]
 *   node scripts/foreman/crew-reply-harvest.mjs harvest [--cousins A,B]
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const PORT = Number(process.env.AEYE_CDP_PORT || 9335);
const DESKTOP_CONFIG = path.join(ROOT, "foreman/crew-dispatch/desktop-seats.config.json");
const LEDGER = path.join(ROOT, "foreman/crew-dispatch/DISPATCH_LEDGER.jsonl");
const INBOX = path.join(ROOT, "foreman/handoffs/inbox");
const SHOT_DIR = path.join(ROOT, "foreman/receipts/courier-proof");

const sha256 = (s) => crypto.createHash("sha256").update(s, "utf8").digest("hex");
const nowIso = () => new Date().toISOString();
const stamp = () => nowIso().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");

const SEATS = {
  PETRA: {
    name: "Petra / ChatGPT",
    host: "chatgpt.com",
    replies: ['[data-message-author-role="assistant"]'],
    generating: ['button[data-testid="stop-button"]', 'button[aria-label*="Stop" i]']
  },
  SKYBRO: {
    name: "Skybro / Gemini",
    host: "gemini.google.com",
    replies: ["message-content", ".model-response-text", "model-response"],
    generating: ['button[aria-label*="Stop" i]', "button.stop-icon"]
  },
  ENDER: {
    name: "Ender / Claude",
    host: "claude.ai",
    replies: ['div[data-testid="assistant-message"]', "div.font-claude-message", "div.font-claude-response"],
    generating: ['button[aria-label*="Stop" i]']
  },
  BEAN: {
    name: "Bean / DeepSeek",
    host: "chat.deepseek.com",
    replies: ["div._4f9bf79", "div[class*='markdown']"],
    generating: ['div[role="button"][aria-label*="Stop" i]']
  },
  COMPUTER: {
    name: "Computer / Perplexity",
    host: "perplexity.ai",
    replies: ['div[id^="markdown-content"]', "div.prose"],
    generating: ['button[aria-label*="Stop" i]']
  }
};

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

/**
 * Latest consumed dispatch per cousin — the leg whose reply we are owed.
 *
 * Provider transcript rendering can normalize Markdown after Send. The courier
 * records that as POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT: the send action was
 * consumed and must never be retried, but a later reply that echoes that leg's
 * custody token can still be harvested and validated. Ignoring those rows made
 * the harvester fall back to an older POSTED_NOT_CUSTODY leg and stamp a current
 * answer with stale packet metadata.
 */
function postedLegs() {
  const byCousin = new Map();
  for (const row of ledgerRows()) {
    const consumed =
      row.result === "POSTED_NOT_CUSTODY" ||
      row.result === "POSTED_PARTIAL_OR_MUTATED__DO_NOT_REPEAT";
    if (!consumed || row.sendActionExecuted !== true) continue;
    byCousin.set(row.cousinId, row);
  }
  return byCousin;
}

async function connectChrome() {
  let info = null;
  try {
    const res = await fetch(`http://127.0.0.1:${PORT}/json/version`, { signal: AbortSignal.timeout(1500) });
    info = res.ok ? await res.json() : null;
  } catch {
    info = null;
  }
  if (!info) throw new Error(`No Chrome on 127.0.0.1:${PORT}`);
  const { chromium } = await import("playwright");
  return { kind: "chrome", browser: await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`) };
}

function loadDesktopSeat(cousinId) {
  if (!fs.existsSync(DESKTOP_CONFIG)) return null;
  const cfg = JSON.parse(fs.readFileSync(DESKTOP_CONFIG, "utf8"));
  return cfg.seats?.[cousinId] || null;
}

async function connectDesktop(cousinId, leg) {
  const seat = loadDesktopSeat(cousinId);
  if (!seat) throw new Error(`No desktop seat config for ${cousinId}`);
  const port = seat.cdpPort;
  let info = null;
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(1500) });
    info = res.ok ? await res.json() : null;
  } catch {
    info = null;
  }
  if (!info) throw new Error(`No desktop CDP on 127.0.0.1:${port} for ${cousinId}`);
  const puppeteer = await import("puppeteer-core");
  const browser = await puppeteer.default.connect({ browserURL: `http://127.0.0.1:${port}`, defaultViewport: null });
  const pages = await browser.pages();
  const threadHint = leg.urlAfter || leg.route?.url || "";
  const page =
    pages.find((p) => threadHint && p.url() === threadHint) ||
    pages.find((p) => p.url().includes("/search/")) ||
    pages.find((p) => seat.pageUrlPrefer?.includes(p.url())) ||
    pages.find((p) => seat.pageUrlIncludes?.some((h) => p.url().includes(h))) ||
    pages[0];
  if (!page) throw new Error(`No desktop page for ${cousinId}`);
  /* Harvest in the background; never steal the Operator's active window. */
  return { kind: "desktop", browser, page, puppeteer: true };
}

async function connectForLeg(cousinId, leg) {
  if (leg?.surface === "desktop") return connectDesktop(cousinId, leg);
  return connectChrome();
}

function pageForSeat(browser, seat, desktopPage = null) {
  if (desktopPage) return desktopPage;
  for (const page of browser.contexts().flatMap((c) => c.pages())) {
    try {
      if (page.url().includes(seat.host)) return page;
    } catch {
      /* dead page */
    }
  }
  return null;
}

/**
 * Reads the reply text. Provider message containers are tried first; if none
 * match, falls back to whatever follows the tail of our own packet in the page
 * text, which is provider-agnostic and survives UI churn.
 */
async function readReply(page, seat, tailMarker, isPuppeteer = false) {
  if (isPuppeteer) {
    const generating = false;
    for (const selector of seat.replies) {
      const nodes = await page.$$eval(selector, (els) => els.map((el) => (el.innerText || "").trim())).catch(() => []);
      if (nodes.length) {
        const text = nodes[nodes.length - 1];
        if (text.length > 40) return { text, via: selector, generating };
      }
    }
    const body = await page.evaluate(() => document.body.innerText || "");
    const idx = tailMarker ? body.lastIndexOf(tailMarker) : -1;
    if (idx >= 0) {
      const after = body.slice(idx + tailMarker.length).trim();
      if (after.length > 40) return { text: after, via: "text-after-packet-tail", generating };
    }
    return { text: "", via: null, generating };
  }
  return page
    .evaluate(
      ({ selectors, stopSelectors, tail }) => {
        const generating = stopSelectors.some((s) => {
          const el = document.querySelector(s);
          return el && el.offsetParent !== null;
        });

        for (const selector of selectors) {
          const nodes = [...document.querySelectorAll(selector)];
          if (nodes.length) {
            const text = (nodes[nodes.length - 1].innerText || "").trim();
            if (text.length > 40) return { text, via: selector, generating };
          }
        }

        const body = document.body.innerText || "";
        const idx = tail ? body.lastIndexOf(tail) : -1;
        if (idx >= 0) {
          const after = body.slice(idx + tail.length).trim();
          if (after.length > 40) return { text: after, via: "text-after-packet-tail", generating };
        }
        return { text: "", via: null, generating };
      },
      { selectors: seat.replies, stopSelectors: seat.generating, tail: tailMarker }
    )
    .catch(() => ({ text: "", via: null, generating: false }));
}

/**
 * Canon P.7 custody, as amended by Swanson 2026-08-03.
 *
 * The correction that matters: an echoed challenge nonce proves *correlation* —
 * this response is to this packet — and nothing more. It does not prove the
 * respondent is the intended account, that the work was performed, or that the
 * answer is valid. Awarding CUSTODY_PROVED on the echo alone is exactly the
 * overclaim the canon exists to prevent, and the first cut did it.
 *
 * So the echo now yields CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING, and
 * CUSTODY_PROVED is reachable only when challenge, identity, route, capability,
 * and dependency checks all pass.
 */
function custodyFrom(replyText, packetSha256, custodyToken, checks = {}) {
  const hasReceived = /^\s*RECEIVED\b/im.test(replyText);
  const hashEcho = replyText.includes(packetSha256) || replyText.includes(packetSha256.slice(0, 16));
  /* Exact echo only. A nonce is worth nothing if a prefix match will satisfy it. */
  const tokenEcho = Boolean(custodyToken) && replyText.includes(custodyToken);

  if (tokenEcho || (hasReceived && hashEcho)) {
    const basis = tokenEcho ? `challenge nonce ${custodyToken}` : "receiver-computed packet hash";
    /* Identity, route, capability and dependency are proved by the dispatch leg
       and the validator, not by the reply text. Until every one is in hand the
       state is explicitly pending, never proved. */
    const pending = ["identity", "route", "capability", "dependency"].filter((k) => checks[k] !== true);
    if (pending.length > 0) {
      return {
        custody: "CUSTODY_CHALLENGE_ECHOED__IDENTITY_PENDING",
        why: `Receiver echoed the ${basis}, which proves this response correlates to this packet. Still unproved: ${pending.join(", ")}. Correlation is not identity.`
      };
    }
    return {
      custody: "CUSTODY_PROVED",
      why: `Receiver echoed the ${basis}, and identity, route, capability and dependency checks all passed.`
    };
  }

  if (hasReceived) {
    return {
      custody: "RECEIVED_WITHOUT_CUSTODY_CHALLENGE",
      why: "RECEIVED block present, but neither the challenge nonce nor a matching packet hash was echoed."
    };
  }
  if (custodyToken) {
    return {
      custody: "CUSTODY_CHALLENGE_NOT_ECHOED",
      why: `Substantive reply present, but the packet's challenge nonce ${custodyToken} was not echoed. The seat answered without confirming which packet it holds.`
    };
  }
  return {
    custody: "REPLY_WITHOUT_RECEIVED_BLOCK",
    why: "Substantive reply present, but no canon RECEIVED block. This cycle's packets were cut before canon was installed and never asked for one, so custody is not provable for this cycle."
  };
}

function inboxFile(cousinId, missionId) {
  return path.join(INBOX, `FROM_${cousinId}_${missionId}_${stamp()}.md`);
}

/**
 * Cousins are asked to close with a relay metadata block. When they comply, those
 * are the values that matter — especially the cockpit hashes, which are what let
 * the validator catch a seat answering against stale instructions. Stamping fresh
 * hashes here instead would make every harvested receipt look current and destroy
 * the staleness check, so absent fields stay null.
 */
function echoedMetadata(replyText) {
  const grab = (key) => {
    const m = replyText.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*)"`));
    return m ? m[1] : null;
  };
  return {
    schemaVersion: grab("schemaVersion"),
    verdict: grab("VERDICT"),
    confidence: grab("CONFIDENCE"),
    unknowns: grab("UNKNOWNS"),
    nextActionHash: grab("nextActionHash"),
    currentStateHash: grab("currentStateHash"),
    custodyToken: grab("custody_token")
  };
}

/**
 * The relay schema requires assignment fields on every reply. They describe what
 * was asked of the seat, not what the seat concluded, so they are copied from the
 * dispatch record and the packet's own text rather than inferred from the answer.
 */
function assignmentFields(cousinId, leg) {
  const roles = JSON.parse(
    fs.readFileSync(path.join(ROOT, "foreman/crew-dispatch/crew-network-roles.json"), "utf8")
  );
  const card = roles.cousins?.[cousinId] || {};

  let doNot = null;
  let command = null;
  const paste = path.join(ROOT, "foreman/handoffs/outbox", `${cousinId}_NETWORK_PASTE_BLOCK.txt`);
  if (fs.existsSync(paste)) {
    const raw = fs.readFileSync(paste, "utf8");
    doNot = (raw.match(/^OUT OF LANE:\s*(.+)$/m) || [null, null])[1];
  }
  const packet = path.join(ROOT, "foreman/handoffs/outbox", leg.packetFile || "");
  if (leg.packetFile && fs.existsSync(packet)) {
    const raw = fs.readFileSync(packet, "utf8");
    const cmd = raw.match(/"network_command"\s*:\s*"([^"]+)"/);
    const ver = raw.match(/"network_command_version"\s*:\s*"([^"]+)"/);
    if (cmd) command = `${cmd[1]}${ver ? ` ${ver[1]}` : ""}`;
  }

  return {
    platform: card.platform || null,
    role: card.seat || null,
    lane: card.lane || null,
    requestedAction: command ? `Independent red-team review — ${command}. Findings only.` : null,
    targetFiles: "none — review only; this seat was not asked to change files",
    doNot
  };
}

function receiptBody({ cousinId, seat, leg, reply, custody, via, url }) {
  const missionId = String(leg.submissionId || "").split(":")[0] || "VPGM";
  const echoed = echoedMetadata(reply);
  const assigned = assignmentFields(cousinId, leg);
  const q = (v) => (v ? `"${String(v).replace(/"/g, '\\"')}"` : "null");
  return `# FROM ${cousinId} — ${missionId}

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: ${seat}
- Provider route: ${url}
- Native thread ID: ${leg.nativeThreadId || "not exposed by provider"}
- Packet: ${leg.packetFile}
- PACKET_SHA256: ${leg.packetSha256}
- SUBMISSION_ID: ${leg.submissionId}
- Posted at: ${leg.sendInvokedAt || leg.at}
- Harvested at: ${nowIso()}
- Extracted via: ${via}
- Reply sha256: ${sha256(reply)}
- Reply chars: ${reply.length}
- CUSTODY: ${custody.custody} — ${custody.why}

---

${reply}

---

## Relay metadata

\`\`\`json
{
  "schemaVersion": ${q(echoed.schemaVersion)},
  "harvested_by": "FOREMAN_CDP_HARVEST_V1",
  "source": "${cousinId}",
  "cousin": "${cousinId}",
  "VERDICT": ${q(echoed.verdict)},
  "CONFIDENCE": ${q(echoed.confidence)},
  "UNKNOWNS": ${q(echoed.unknowns)},
  "source_packet_id": "${leg.packetFile.replace(/\.md$/, "")}",
  "source_packet_file": "${leg.packetFile}",
  "platform": ${q(assigned.platform)},
  "role": ${q(assigned.role)},
  "lane": ${q(assigned.lane)},
  "requested_action": ${q(assigned.requestedAction)},
  "target_files": ${q(assigned.targetFiles)},
  "DO_NOT": ${q(assigned.doNot)},
  "nextActionHash": ${q(echoed.nextActionHash)},
  "currentStateHash": ${q(echoed.currentStateHash)},
  "packet_sha256": "${leg.packetSha256}",
  "submission_id": "${leg.submissionId}",
  "provider_route": "${url}",
  "native_thread_id": ${JSON.stringify(leg.nativeThreadId || null)},
  "custody": "${custody.custody}",
  "custody_token_echoed": ${q(echoed.custodyToken)},
  "receiver_computed_hash": null,
  "generated_at": "${nowIso()}"
}
\`\`\`

> \`receiver_computed_hash\` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
`;
}

async function run(cmd, ids) {
  const legs = postedLegs();
  const out = [];

  for (const cousinId of ids) {
    const seat = SEATS[cousinId];
    const leg = legs.get(cousinId);
    if (!seat) {
      out.push({ cousinId, status: "UNKNOWN_SEAT" });
      continue;
    }
    if (!leg) {
      out.push({ cousinId, status: "NO_POSTED_LEG", note: "Nothing posted for this seat, so no reply is owed." });
      continue;
    }

    let conn;
    try {
      conn = await connectForLeg(cousinId, leg);
    } catch (e) {
      out.push({ cousinId, status: "CONNECT_FAILED", error: e.message, packetObligation: "POSTED_AWAITING_CUSTODY" });
      continue;
    }

    const page = pageForSeat(conn.browser, seat, conn.page);
    if (!page) {
      out.push({ cousinId, status: "NO_TAB", packetObligation: "POSTED_AWAITING_CUSTODY" });
      if (conn.puppeteer) await conn.browser.disconnect().catch(() => {});
      continue;
    }

    /* Our packet's last line, used to locate the boundary between what we sent
       and what came back. */
    const pastePath = path.join(ROOT, "foreman/handoffs/outbox", `${cousinId}_NETWORK_PASTE_BLOCK.txt`);
    let tail = "";
    let custodyToken = null;
    if (fs.existsSync(pastePath)) {
      const raw = fs.readFileSync(pastePath, "utf8");
      const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
      tail = lines[lines.length - 1].slice(-52);
      custodyToken = (raw.match(/CUSTODY_TOKEN:\s*(CUSTODY-[\w-]+)/) || [null, null])[1];
    }

    const reply = await readReply(page, seat, tail, conn.puppeteer);
    const url = conn.puppeteer ? page.url() : page.url();

    if (!reply.text) {
      out.push({
        cousinId,
        status: reply.generating ? "REPLY_IN_PROGRESS" : "NO_REPLY_YET",
        url,
        packetObligation: "WAITING_FOR_RECEIVER_CUSTODY"
      });
      continue;
    }
    if (reply.generating) {
      out.push({
        cousinId,
        status: "REPLY_IN_PROGRESS",
        url,
        chars: reply.text.length,
        note: "Still generating — not harvesting a partial answer.",
        packetObligation: "WAITING_FOR_RECEIVER_CUSTODY"
      });
      continue;
    }

    const custody = custodyFrom(reply.text, leg.packetSha256, custodyToken);
    const record = {
      cousinId,
      status: "REPLY_AVAILABLE",
      url,
      via: reply.via,
      chars: reply.text.length,
      replySha256: sha256(reply.text),
      custody: custody.custody
    };

    if (cmd === "harvest") {
      fs.mkdirSync(INBOX, { recursive: true });
      const missionId = String(leg.submissionId || "").split(":")[0] || "VPGM";
      const file = inboxFile(cousinId, missionId);
      fs.writeFileSync(
        file,
        receiptBody({ cousinId, seat: seat.name, leg, reply: reply.text, custody, via: reply.via, url }),
        "utf8"
      );
      record.inboxFile = path.relative(ROOT, file).replace(/\\/g, "/");

      fs.mkdirSync(SHOT_DIR, { recursive: true });
      const shot = path.join(SHOT_DIR, `${cousinId}_reply.png`);
      if (conn.puppeteer) await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      else await page.screenshot({ path: shot, fullPage: false }).catch(() => {});
      record.screenshot = path.relative(ROOT, shot).replace(/\\/g, "/");
    }

    out.push(record);
    if (conn.puppeteer) await conn.browser.disconnect().catch(() => {});
  }

  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";
  if (cmd !== "read" && cmd !== "harvest") {
    console.log(`Commands:
read     [--cousins A,B]   One state read. Reports whether a reply exists. Writes nothing.
harvest  [--cousins A,B]   One state read, then writes each complete reply into the inbox.

Canon: foreman/VPGM_OPERATING_CANON.md — this is a single read, not a poller.`);
    return;
  }

  const i = args.indexOf("--cousins");
  const ids =
    i >= 0 && args[i + 1]
      ? args[i + 1].split(",").map((s) => s.trim().toUpperCase())
      : Object.keys(SEATS);

  const out = await run(cmd, ids);
  for (const row of out) console.log(`${row.cousinId} ${row.status}${row.custody ? ` ${row.custody}` : ""}`);
  console.log(JSON.stringify(out, null, 2));
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err.message);
    process.exit(1);
  }
);
