#!/usr/bin/env node
/**
 * Issue a mission-specific VPGM command across the AEYE Edge network.
 *
 * The role-sync issuer (crew-relay-network-command.mjs) only ever sends
 * ROLE_AWARENESS_SYNC, and its paste block points cousins at a file path on
 * Sally that they cannot open. This issuer reads a mission file and writes a
 * SELF-CONTAINED paste block per seat, because the paste block is the only
 * thing that actually reaches the cousin's chat window.
 *
 *   node foreman/crew-dispatch/crew-vpgm-command.mjs issue --mission <file>
 *   node foreman/crew-dispatch/crew-vpgm-command.mjs show --cousin ENDER
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildOutgoingMetadata,
  buildRelayMetadataBlock,
  loadSchema,
  paths,
  ensureRelayDirs,
  truncateHash,
  computeCockpitHashes,
  inboxStatus,
  formatInboxAlarm
} from "./crew-relay-lib.mjs";
import { read, nowIso } from "../../scripts/foreman/_foreman-core.mjs";

const ROLES_PATH = "foreman/crew-dispatch/crew-network-roles.json";
const LATEST_MANIFEST = "foreman/crew-dispatch/LATEST_NETWORK_COMMAND.json";
const TABS_CONFIG = "foreman/crew-dispatch/crew-tabs.config.json";

function abs(rel) {
  return path.join(process.cwd(), rel);
}

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}-${pad(
    d.getUTCHours()
  )}${pad(d.getUTCMinutes())}`;
}

function bullets(list) {
  return list.map((item) => `- ${item}`).join("\n");
}

function numbered(list) {
  return list.map((item, i) => `${i + 1}. ${item}`).join("\n\n");
}

/**
 * The paste block is the deliverable. A cousin cannot read the repo, so
 * everything needed to answer has to survive a single Ctrl+V.
 */
function buildPasteBlock({ mission, cousinId, cousin, brief, hashes, packetFile, custodyToken }) {
  return `[WERKLES VPGM — ${mission.missionId} ${mission.version}]

${cousin.name} (${cousin.seat}, ${cousin.platform}). Your lane: ${cousin.lane}

CUSTODY_TOKEN: ${custodyToken}

This is a real work request from the Werkles Foreman, not a role-sync ping. Everything
you need is in this message — do not ask for repo files.

SLICE UNDER REVIEW
${mission.slice}

CONTEXT
${bullets(mission.sharedContext)}

WHAT THE MEMBER ACTUALLY SEES (verbatim strings)
${bullets(mission.liveStrings)}

KNOWN GAPS (already admitted — do not spend your answer rediscovering these)
${bullets(mission.knownGaps)}

--- YOUR ASSIGNMENT ---

V (vision): ${brief.vision}

P (pull): ${brief.pull}

G (go) — work these, in this order:

${numbered(brief.go)}

M (momentum): ${brief.momentum}

OUT OF LANE: ${brief.outOfLane}

--- HOW TO ANSWER ---

Reply as a markdown document Ben can save to foreman/handoffs/inbox/ as
FROM_${cousinId}_${mission.missionId}_${mission.version}.md

OPEN your reply with this exact block, filled in. It is how the cockpit proves the
packet reached you rather than a composer, a wrong tab, or a stale thread:

RECEIVED
CUSTODY_TOKEN: ${custodyToken}
COUSIN: ${cousinId}
PACKET: ${packetFile}
LANE_CHECK: IN_LANE | OUT_OF_LANE — <one line>
BLOCKER: NONE | <exact>

End your reply with this exact block, filled in:

## Relay metadata

\`\`\`json
{
  "schemaVersion": "${hashes.schemaVersion}",
  "cousin": "${cousinId}",
  "custody_token": "${custodyToken}",
  "VERDICT": "<one line>",
  "CONFIDENCE": "HIGH | LOW",
  "UNKNOWNS": "none | <list> | outside my lane",
  "source_packet_id": "${packetFile.replace(/\.md$/, "")}",
  "source_packet_file": "${packetFile}",
  "nextActionHash": "${hashes.nextActionHash}",
  "currentStateHash": ${hashes.currentStateHash ? `"${hashes.currentStateHash}"` : "null"}
}
\`\`\`

Do not recommend deploy, push, SQL apply, secret entry, or spending money. Those are
Operator gates. Say what you would do and stop.
`;
}

function buildPacket({ mission, cousinId, cousin, brief, metadata, pasteBlock }) {
  return `# Werkles VPGM — ${mission.missionId} ${mission.version}

**To ${cousin.name}** (${cousin.seat} · ${cousin.platform} · Edge tab ${cousin.edgeTabIndex})
**Issued by:** ${mission.issuedBy}
**Doctrine:** STOP BEFORE SEND — Foreman prepares and pastes; Ben clicks Send.

## Slice under review

${mission.slice}

## Context handed to the cousin

${bullets(mission.sharedContext)}

## Verbatim member-facing strings

${bullets(mission.liveStrings)}

## Known gaps disclosed up front

${bullets(mission.knownGaps)}

## Assignment

- **V:** ${brief.vision}
- **P:** ${brief.pull}
- **M:** ${brief.momentum}
- **Out of lane:** ${brief.outOfLane}

### G — work items

${numbered(brief.go)}

## Expected return

\`foreman/handoffs/inbox/FROM_${cousinId}_${mission.missionId}_${mission.version}.md\`
with a filled \`## Relay metadata\` block. Validate with
\`node foreman/crew-dispatch/crew-response-intake.mjs validate\`.

## Paste block delivered to the chat tab

\`\`\`text
${pasteBlock}
\`\`\`

---

${buildRelayMetadataBlock(metadata)}
`;
}

export function issueVpgmCommand(missionRelPath) {
  ensureRelayDirs();
  const schema = loadSchema();
  const mission = JSON.parse(read(missionRelPath));
  const rolesDoc = JSON.parse(read(ROLES_PATH));
  const tabsDoc = JSON.parse(read(TABS_CONFIG));
  const hashesRaw = computeCockpitHashes();
  const hashes = { ...hashesRaw, schemaVersion: schema.schemaVersion };
  const ts = timestampSlug();
  const issuedAt = nowIso();
  const outbox = paths().outbox;

  const cousins = [];

  for (const [cousinId, brief] of Object.entries(mission.cousins)) {
    const cousin = rolesDoc.cousins[cousinId];
    if (!cousin) throw new Error(`Mission names unknown cousin: ${cousinId}`);

    const packetId = `TO_${cousinId}_VPGM_${mission.missionId}_${mission.version}_${ts}`;
    const packetFile = `${packetId}.md`;

    /* Canon P.7 wants the receiver to return a computed packet hash. A chat cousin
       cannot compute sha256, so custody uses a single-dispatch challenge nonce it
       must echo back verbatim.
 
       Naming, per Swanson's ruling of 2026-08-03: this is a custody
       challenge/correlation nonce, not a password, credential, or durable secret.
       It proves correlation — that this response is to this packet — and nothing
       else. It does not prove provider account identity on its own.
 
       Width: 128 bits. The first cut used randomBytes(5), which is 40 bits. At 40
       bits a nonce is inside brute-force range and, worse, it invites a receiver
       to guess a plausible-looking value rather than copy the one it was given —
       the same hallucination failure that made receiver-computed hashing
       unusable in the first place. */
    const custodyToken = `CUSTODY-${cousinId}-${crypto.randomBytes(16).toString("hex").toUpperCase()}`;
    const pasteBlock = buildPasteBlock({ mission, cousinId, cousin, brief, hashes, packetFile, custodyToken });

    const metadata = {
      ...buildOutgoingMetadata(cousinId),
      custody_token: custodyToken,
      packet_id: packetId,
      source_packet_file: packetFile,
      network_command: mission.missionId,
      network_command_version: mission.version,
      role_lane: cousin.lane,
      human_gate_required: true,
      edge_tab_index: cousin.edgeTabIndex,
      edge_url: cousin.edgeUrl
    };

    fs.writeFileSync(
      path.join(outbox, packetFile),
      buildPacket({ mission, cousinId, cousin, brief, metadata, pasteBlock }),
      "utf8"
    );

    /* Write both paste-block names: the roles doc and crew-tabs.config.json
       disagree, and the courier may resolve either one. */
    const pasteNames = new Set([
      cousin.pasteBlockSuffix,
      path.basename(tabsDoc.tabs.find((t) => t.id === cousinId)?.pasteBlock || `${cousinId}_PASTE_BLOCK.txt`)
    ]);
    const pastePaths = [];
    for (const name of pasteNames) {
      const full = path.join(outbox, name);
      fs.writeFileSync(full, pasteBlock, "utf8");
      pastePaths.push(path.relative(process.cwd(), full).replace(/\\/g, "/"));
    }

    cousins.push({
      cousinId,
      name: cousin.name,
      platform: cousin.platform,
      edgeTabIndex: cousin.edgeTabIndex,
      packetId,
      packetFile,
      packetPath: `foreman/handoffs/outbox/${packetFile}`,
      pasteBlockSuffix: cousin.pasteBlockSuffix,
      pastePath: pastePaths[0],
      pastePathsAll: pastePaths,
      pasteChars: pasteBlock.length,
      nextActionHashTrunc: truncateHash(metadata.nextActionHash)
    });
  }

  cousins.sort((a, b) => a.edgeTabIndex - b.edgeTabIndex);

  const manifest = {
    ok: true,
    command: mission.missionId,
    version: mission.version,
    issued_at: issuedAt,
    timestamp_slug: ts,
    mission_file: missionRelPath,
    masterCommandFile: `foreman/handoffs/outbox/RELAY_VPGM_${mission.missionId}_${mission.version}_${ts}.md`,
    cousins,
    doctrine: rolesDoc.networkDoctrine
  };

  const master = `# Werkles VPGM Command Issued — ${mission.missionId} ${mission.version}

**Issued:** ${issuedAt}
**Issued by:** ${mission.issuedBy}
**Mission file:** \`${missionRelPath}\`
**Doctrine:** STOP BEFORE SEND

Each cousin's paste block is self-contained. A cousin cannot read Sally's filesystem, so
the entire brief travels in the paste.

| Tab | Cousin | Packet | Paste block | Chars |
|-----|--------|--------|-------------|-------|
${cousins
  .map(
    (c) =>
      `| ${c.edgeTabIndex} | ${c.name} (${c.cousinId}) | \`${c.packetFile}\` | \`${c.pastePath}\` | ${c.pasteChars} |`
  )
  .join("\n")}

## Delivery

\`\`\`text
node scripts/foreman/relay-courier.mjs deliver --cousin ENDER --kind network
\`\`\`

Courier focuses the Edge tab and pastes. **Ben clicks Send.** Then save each reply to
\`foreman/handoffs/inbox/FROM_{COUSIN}_${mission.missionId}_${mission.version}.md\` and run
\`node foreman/crew-dispatch/crew-response-intake.mjs validate\`.
`;

  fs.writeFileSync(abs(manifest.masterCommandFile), master, "utf8");
  fs.writeFileSync(abs(LATEST_MANIFEST), JSON.stringify(manifest, null, 2), "utf8");

  return manifest;
}

function main() {
  const args = process.argv.slice(2);
  const cmd = args[0] || "help";

  if (cmd === "issue") {
    const idx = args.indexOf("--mission");
    const missionPath = idx >= 0 ? args[idx + 1] : null;
    if (!missionPath) {
      console.error("Missing --mission <path to mission json>");
      process.exit(1);
    }

    /* Read before you ask. A VPGM packet was once dispatched asking Ender a
       question he had already answered in an unread inbox receipt.

       Scoped to this mission's own seats and lineage (Swanson, 2026-08-03): an
       owed reply blocks its own successor, not every unrelated project sharing a
       seat. */
    const mission = JSON.parse(fs.readFileSync(abs(missionPath), "utf8"));
    const missionCousins = Object.keys(mission.cousins || {});
    const inbox = inboxStatus({
      scopeToCousins: missionCousins.length > 0 ? missionCousins : undefined,
      scopeToMission: mission.missionId
    });
    if (inbox.total > 0 && !args.includes("--ack-inbox")) {
      console.error(formatInboxAlarm(inbox));
      console.error("");
      console.error(
        `Dispatch blocked for this lineage (${mission.missionId}, seats: ${missionCousins.join(", ") || "all"}).`
      );
      if (inbox.outOfScopeCount > 0) {
        console.error(
          `${inbox.outOfScopeCount} other unread receipt(s) exist outside this lineage and are not blocking.`
        );
      }
      console.error("Read and clear these first, or pass --ack-inbox if you have genuinely read them.");
      process.exit(1);
    }
    const manifest = issueVpgmCommand(missionPath);
    console.log(
      JSON.stringify(
        {
          command: `${manifest.command} ${manifest.version}`,
          master: manifest.masterCommandFile,
          manifest: LATEST_MANIFEST,
          cousins: manifest.cousins.map((c) => ({
            tab: c.edgeTabIndex,
            cousin: c.cousinId,
            paste: c.pastePath,
            chars: c.pasteChars
          }))
        },
        null,
        2
      )
    );
    return;
  }

  if (cmd === "show") {
    const idx = args.indexOf("--cousin");
    const wanted = idx >= 0 ? String(args[idx + 1]).toUpperCase() : null;
    const manifest = JSON.parse(read(LATEST_MANIFEST));
    const row = wanted ? manifest.cousins.find((c) => c.cousinId === wanted) : null;
    if (wanted && !row) {
      console.error(`Cousin ${wanted} not in latest manifest`);
      process.exit(1);
    }
    if (row) {
      console.log(read(row.pastePath));
      return;
    }
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }

  console.log(`Usage:
  node foreman/crew-dispatch/crew-vpgm-command.mjs issue --mission <file>
  node foreman/crew-dispatch/crew-vpgm-command.mjs show [--cousin ENDER]`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
