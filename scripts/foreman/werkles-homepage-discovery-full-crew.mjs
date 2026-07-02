#!/usr/bin/env node
/**
 * WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW — ENDER, SKYBRO, COMPUTER.
 *
 *   npm run WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ROOT, abs, nowIso, read } from "./_foreman-core.mjs";
import { runAutonomousRoundTrip, timestampSlug } from "./autonomous-round-trip-lib.mjs";
import {
  buildOutgoingMetadata,
  buildRelayMetadataBlock,
  ensureRelayDirs,
  paths,
} from "../../foreman/crew-dispatch/crew-relay-lib.mjs";

const TEMPLATE_ID = "WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW";

const COUSINS = [
  {
    id: "ENDER",
    lens: "UX / structure / conversion — hero clarity, crucible gate, signup flow, visual hierarchy",
  },
  {
    id: "SKYBRO",
    lens: "Positioning / narrative / category — what Werkles is, who it's for, story arc vs alternatives",
  },
  {
    id: "COMPUTER",
    lens: "Market / competitor / trust — category norms, competitor homepages, credibility signals, citations",
  },
];

const missionDescription =
  "Review current Werkles homepage direction. Return top 3 problems, top 3 opportunities, one recommended hero message, and one thing not to change. Discovery only — no rewrite, no code.";

function buildShortPaste({ packetId, metadata, cousin, role }) {
  const cousinCfg = COUSINS.find((c) => c.id === cousin);
  return [
    `Werkles ${TEMPLATE_ID}`,
    "",
    `To: ${cousin} (${role.platform})`,
    `Packet: ${packetId}`,
    `Lens: ${cousinCfg?.lens}`,
    "",
    "Start with RECEIVED on its own line, then:",
    "1. Top 3 homepage problems",
    "2. Top 3 homepage opportunities",
    "3. One recommended hero message",
    "4. One thing not to change",
    "",
    "No code. No deploy. No SQL.",
  ];
}

function expandTemplate(template, tokens) {
  let out = template;
  for (const [k, v] of Object.entries(tokens)) {
    out = out.split(`{{${k}}}`).join(String(v ?? ""));
  }
  return out;
}

export function handoffToPetra(receipts) {
  ensureRelayDirs();
  const cards = JSON.parse(read("foreman/crew-dispatch/crew-role-cards.json"));
  const petra = cards.cousins.PETRA;
  const packetId = `TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_${timestampSlug()}`;
  const packetFileName = `${packetId}.md`;
  const metadata = {
    ...buildOutgoingMetadata("PETRA"),
    packet_id: packetId,
    source_packet_file: packetFileName,
    template: "WERKLES_HOMEPAGE_DISCOVERY_PETRA_SYNTHESIS",
    dispatch_class: "AUTO_LOAD_HUMAN_SEND",
    human_gate_required: true,
    synthesis_sources: receipts.map((r) => r.processedReceipt),
  };

  const findings = receipts
    .map((r) => {
      const body = fs.existsSync(abs(r.processedReceipt))
        ? fs.readFileSync(abs(r.processedReceipt), "utf8")
        : "(receipt missing)";
      const summaryMatch = body.match(/## Summary\s+([\s\S]*?)(?=\n---|\n## )/);
      const summary = summaryMatch ? summaryMatch[1].trim() : body.slice(0, 2000);
      return `### ${r.cousin} (${r.lens})\n\nSource: \`${r.processedReceipt}\`\n\n${summary}`;
    })
    .join("\n\n---\n\n");

  const body = `# To Petra (Comptroller): Werkles homepage discovery synthesis

## Status

**PETRA SYNTHESIS HANDOFF** — generated ${metadata.generated_at}.

Ben/Codex captured cousin discovery receipts. Petra synthesizes — no implementation.

---

## Mission

Synthesize the three cousin homepage discovery receipts into:

1. Consolidated top problems (deduped, ranked)
2. Consolidated top opportunities (deduped, ranked)
3. One recommended hero message (with rationale)
4. One thing not to change (with rationale)
5. **GO / CONDITIONAL GO / NO-GO** for homepage rewrite scope

Lane: gate verdict / routing — not implementation patches.

---

## Cousin receipts

${findings}

---

## Relay metadata

${buildRelayMetadataBlock(metadata)}
`;

  const packetPath = path.join(paths().outbox, packetFileName);
  fs.writeFileSync(packetPath, body, "utf8");

  const pastePath = abs("foreman/handoffs/outbox/PETRA_PASTE_BLOCK.txt");
  const paste = [
    `# Petra synthesis — ${TEMPLATE_ID}`,
    "",
    `Synthesize homepage discovery from ENDER, SKYBRO, COMPUTER receipts.`,
    `Packet: ${packetId}`,
    "",
    "Return GO/CONDITIONAL GO/NO-GO for homepage rewrite scope.",
    "Lane: gate verdict only — no code patches.",
    "",
    "---",
    "",
    body.trim(),
  ].join("\n");
  fs.writeFileSync(pastePath, paste, "utf8");

  const handoffPath = abs("foreman/crew-dispatch/WERKLES_HOMEPAGE_DISCOVERY_PETRA_HANDOFF.json");
  const handoff = {
    template: TEMPLATE_ID,
    petraPacket: path.relative(ROOT, packetPath),
    petraPasteBlock: path.relative(ROOT, pastePath),
    synthesisSources: receipts,
    generatedAt: nowIso(),
    message: "Petra synthesis packet ready in outbox — human Send on ChatGPT tab 1",
  };
  fs.writeFileSync(handoffPath, JSON.stringify(handoff, null, 2), "utf8");
  return handoff;
}

async function main() {
  const args = process.argv.slice(2);
  const generateOnly = args.includes("--generate-only");
  const execute = args.includes("--execute");
  const proofPath = abs("foreman/crew-dispatch/WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_PROOF.json");
  const startedAt = nowIso();
  const results = [];

  for (const target of COUSINS) {
    const proofRel = `foreman/crew-dispatch/WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_${target.id}.json`;
    const result = await runAutonomousRoundTrip({
      cousinId: target.id,
      templateId: TEMPLATE_ID,
      missionDescription,
      buildShortPaste,
      packetIdPrefix: `TO_${target.id}_WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW`,
      proofManifestRel: proofRel,
      verdictPrefix: "WERKLES_HOMEPAGE_DISCOVERY",
      generateOnly,
      allowSend: execute || undefined,
      tokenMode: "any",
    });
    results.push({
      cousin: target.id,
      lens: target.lens,
      status: result.status,
      failureKind: result.failureKind || null,
      inboxResponse: result.artifacts?.inboxResponse || null,
      processedReceipt: result.artifacts?.processedReceipt || null,
      processedSummary: result.artifacts?.processedSummary || null,
      proof: proofRel,
    });
  }

  const allPass = results.every((r) => r.status === "PASS");
  const passed = results.filter((r) => r.status === "PASS").length;

  let petraHandoff = null;
  if (allPass && !generateOnly) {
    petraHandoff = handoffToPetra(results);
  }

  const summary = {
    template: TEMPLATE_ID,
    startedAt,
    finishedAt: nowIso(),
    status: generateOnly ? "GENERATE_ONLY" : allPass ? "PASS" : passed > 0 ? "PARTIAL" : "FAIL",
    passed,
    failed: results.length - passed,
    results,
    petraHandoff: petraHandoff
      ? {
          packet: petraHandoff.petraPacket,
          pasteBlock: petraHandoff.petraPasteBlock,
          manifest: "foreman/crew-dispatch/WERKLES_HOMEPAGE_DISCOVERY_PETRA_HANDOFF.json",
        }
      : null,
  };
  fs.writeFileSync(proofPath, JSON.stringify(summary, null, 2), "utf8");

  console.log(JSON.stringify(summary, null, 2));
  console.log(`\n${TEMPLATE_ID}: ${summary.status}`);
  process.exit(summary.status === "PASS" || summary.status === "GENERATE_ONLY" ? 0 : 1);
}

const isCli =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  main().catch((e) => {
    console.error(e.message || String(e));
    process.exit(1);
  });
}
