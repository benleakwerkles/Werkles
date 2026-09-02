#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const ledger = path.join(root, "foreman/crew-dispatch/DISPATCH_LEDGER.jsonl");
const submissionId = "VPGM:COMPUTER:7d286eeb235d";
const existing = fs.existsSync(ledger) ? fs.readFileSync(ledger, "utf8") : "";

if (!existing.split("\n").some((line) => line.includes(`\"submissionId\":\"${submissionId}\"`) && line.includes('"sendActionExecuted":true'))) {
  const record = {
    at: "2026-08-29T10:35:00.000Z",
    projectId: "WERKLES_COM",
    cousinId: "COMPUTER",
    seat: "Thufir Hawat / Perplexity Desktop",
    surface: "desktop",
    submissionId,
    packetSha256: "7d286eeb235db097034e333e90f090aaf407cdb9e5af4e431e140eebf71fe83e",
    packetFile: "TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md",
    sentBytes: 4951,
    sendActionExecuted: true,
    cursorKeyboardClipboardTouched: "NO",
    secretsAccessed: "NO",
    sendSelector: "button[aria-label*=Submit]",
    sendInvokedAt: "2026-08-29T10:35:00.000Z",
    route: {
      cousinId: "COMPUTER",
      seat: "Thufir Hawat / Perplexity Desktop",
      surface: "desktop",
      projectId: "WERKLES_COM",
      cdpPort: 9349,
      submissionId,
      packetSha256: "7d286eeb235db097034e333e90f090aaf407cdb9e5af4e431e140eebf71fe83e",
      packetFile: "TO_COMPUTER_VPGM_WERKLES_PRODUCTION_RELEASE_ROTATION_20260829_v1_20260829-1031.md",
      url: "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
      routeProved: true,
      blocker: null
    },
    urlAfter: "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
    transcriptEcho: { headFound: true, tailFound: true, bodyMatches: true },
    result: "POSTED_NOT_CUSTODY",
    packetObligation: "POSTED_AWAITING_CUSTODY",
    note: "The normal courier timed out before Send. Foreman proved the exact head and custody token in the composer, invoked the visible Submit control once over background CDP, then proved composer empty plus exact head/token in the transcript. No physical mouse, clipboard, credentials, or duplicate send."
  };
  fs.appendFileSync(ledger, `${JSON.stringify(record)}\n`, "utf8");
  console.log("THUFIR_RELEASE_DISPATCH_RECORDED");
} else {
  console.log("THUFIR_RELEASE_DISPATCH_ALREADY_RECORDED");
}
