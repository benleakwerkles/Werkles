import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  BookLoopRouterError,
  runBookLoopRouter,
  sha256LfUtf8
} from "../harvey-book-loop-router-lib.mjs";

const manifestPath = "control/release.json";
const sourcePacketPath = "packets/source.md";
const returnPath = "returns/source-result.md";
const destinationPacketPath = "packets/destination.md";
const transitionReceiptPath = "foreman/harvey/book-loop/receipts/source-to-destination.json";

function sourcePacket() {
  return `# Source

Packet ID: \`F_SWANSON_002_TEST\`  
Status: \`SEALED__READY_FOR_SWANSON\`  
Target: \`SWANSON_LEAD_BUILDER @ DOSS\`  
Authority: \`READ_AND_PROPOSE_ONLY\`
`;
}

function destinationPacket() {
  return `# Destination

Packet ID: \`F_ORSON_000_TEST\`  
Status: \`SEALED__READY_FOR_ORSON\`  
Target: \`ORSON_BOOK_STEWARD @ BETSY\`  
Authority: \`READ_BOUNDED_EVIDENCE__WRITE_ONE_RETURN\`
`;
}

function pointer(sourceHash) {
  return `# Current Harvey Builder Packet

Status: \`READY_FOR_SWANSON\`  
Target: \`SWANSON_LEAD_BUILDER @ DOSS\`  
Packet ID: \`F_SWANSON_002_TEST\`  
Packet path: \`${sourcePacketPath}\`  
Packet SHA-256: \`${sourceHash}\`  
Authority: \`READ_AND_PROPOSE_ONLY\`
`;
}

async function write(root, relative, value) {
  const target = path.join(root, ...relative.split("/"));
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, value, "utf8");
}

async function read(root, relative) {
  return fs.readFile(path.join(root, ...relative.split("/")));
}

async function makeFixture() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "harvey-book-loop-"));
  const source = sourcePacket();
  const result = `RECEIVED\nPACKET_ID: F_SWANSON_002_TEST\nCOMPLETED\n`;
  const destination = destinationPacket();
  const sourceHash = sha256LfUtf8(source);
  const pointerText = pointer(sourceHash);
  const manifest = {
    schema: "werkles.harvey-book-loop-release/v0",
    manifest_id: "FROM_FOREMAN_ORSON_000_TEST",
    status: "READY_FOR_ROUTER",
    hash_algorithm: "SHA256_LF_UTF8_V1",
    source: {
      packet_id: "F_SWANSON_002_TEST",
      packet_path: sourcePacketPath,
      packet_sha256: sourceHash,
      target: "SWANSON_LEAD_BUILDER @ DOSS",
      return_path: returnPath,
      return_sha256: sha256LfUtf8(result),
      terminal_marker: "COMPLETED"
    },
    destination: {
      packet_id: "F_ORSON_000_TEST",
      packet_path: destinationPacketPath,
      packet_sha256: sha256LfUtf8(destination),
      target: "ORSON_BOOK_STEWARD @ BETSY",
      status: "SEALED__READY_FOR_ORSON",
      authority: "READ_BOUNDED_EVIDENCE__WRITE_ONE_RETURN"
    },
    pointer: {
      path: "CURRENT_PACKET.md",
      expected_sha256: sha256LfUtf8(pointerText),
      status: "READY_FOR_ORSON",
      transition_receipt_path: transitionReceiptPath
    },
    claim_boundary: "POINTER_ADVANCEMENT_ONLY__NO_DELIVERY_OR_ACCEPTANCE_CLAIM"
  };
  await Promise.all([
    write(root, sourcePacketPath, source),
    write(root, returnPath, result),
    write(root, destinationPacketPath, destination),
    write(root, "CURRENT_PACKET.md", pointerText),
    write(root, manifestPath, `${JSON.stringify(manifest, null, 2)}\n`),
    write(root, "dirty/tracked-sentinel.txt", "preserve tracked\n"),
    write(root, "dirty/untracked-sentinel.txt", "preserve untracked\n")
  ]);
  return { root, manifest, pointerText };
}

async function updateManifest(root, mutate) {
  const raw = JSON.parse((await read(root, manifestPath)).toString("utf8"));
  mutate(raw);
  await write(root, manifestPath, `${JSON.stringify(raw, null, 2)}\n`);
}

async function expectCode(promise, code) {
  await assert.rejects(promise, (error) => error instanceof BookLoopRouterError && error.code === code);
}

test("dry-run validates without creating a lock, pointer, receipt, or unrelated change", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fs.rm(fixture.root, { recursive: true, force: true }));
  const beforePointer = await read(fixture.root, "CURRENT_PACKET.md");
  const trackedBefore = await read(fixture.root, "dirty/tracked-sentinel.txt");
  const untrackedBefore = await read(fixture.root, "dirty/untracked-sentinel.txt");

  const result = await runBookLoopRouter({ mailboxRoot: fixture.root, releaseManifestPath: manifestPath });

  assert.equal(result.status, "READY");
  assert.equal(result.writes_performed, 0);
  assert.deepEqual(await read(fixture.root, "CURRENT_PACKET.md"), beforePointer);
  assert.deepEqual(await read(fixture.root, "dirty/tracked-sentinel.txt"), trackedBefore);
  assert.deepEqual(await read(fixture.root, "dirty/untracked-sentinel.txt"), untrackedBefore);
  await assert.rejects(fs.stat(path.join(fixture.root, "foreman")), { code: "ENOENT" });
});

test("apply advances the pointer, writes a claim-limited receipt, and exact replay is a no-op", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fs.rm(fixture.root, { recursive: true, force: true }));

  const applied = await runBookLoopRouter({ mailboxRoot: fixture.root, releaseManifestPath: manifestPath, apply: true });
  assert.equal(applied.status, "APPLIED");
  assert.equal(applied.writes_performed, 2);
  const pointerAfter = (await read(fixture.root, "CURRENT_PACKET.md")).toString("utf8");
  assert.match(pointerAfter, /Packet ID: `F_ORSON_000_TEST`/);
  assert.match(pointerAfter, /SENT.*not delivery/s);
  const receipt = JSON.parse((await read(fixture.root, transitionReceiptPath)).toString("utf8"));
  assert.equal(receipt.status, "POINTER_ADVANCED__NO_DELIVERY_OR_ACCEPTANCE_CLAIM");
  assert.equal(receipt.destination_packet_id, "F_ORSON_000_TEST");

  const pointerStat = await fs.stat(path.join(fixture.root, "CURRENT_PACKET.md"));
  const replay = await runBookLoopRouter({ mailboxRoot: fixture.root, releaseManifestPath: manifestPath, apply: true });
  const replayStat = await fs.stat(path.join(fixture.root, "CURRENT_PACKET.md"));
  assert.equal(replay.status, "NOOP");
  assert.equal(replay.writes_performed, 0);
  assert.equal(replayStat.mtimeMs, pointerStat.mtimeMs);
});

test("transition receipt conflicts fail before pointer mutation and replay verifies the receipt", async (t) => {
  const conflict = await makeFixture();
  t.after(() => fs.rm(conflict.root, { recursive: true, force: true }));
  const pointerBefore = await read(conflict.root, "CURRENT_PACKET.md");
  await write(conflict.root, transitionReceiptPath, "{\"conflict\":true}\n");
  await expectCode(runBookLoopRouter({ mailboxRoot: conflict.root, releaseManifestPath: manifestPath, apply: true }), "BOOK_LOOP_TRANSITION_RECEIPT_CONFLICT");
  assert.deepEqual(await read(conflict.root, "CURRENT_PACKET.md"), pointerBefore);

  const recovery = await makeFixture();
  t.after(() => fs.rm(recovery.root, { recursive: true, force: true }));
  await runBookLoopRouter({ mailboxRoot: recovery.root, releaseManifestPath: manifestPath, apply: true });
  await fs.rm(path.join(recovery.root, ...transitionReceiptPath.split("/")));
  const dryRun = await runBookLoopRouter({ mailboxRoot: recovery.root, releaseManifestPath: manifestPath });
  assert.equal(dryRun.status, "RECOVERY_REQUIRED");
  assert.equal(dryRun.code, "BOOK_LOOP_TRANSITION_RECEIPT_REQUIRED");
  const repaired = await runBookLoopRouter({ mailboxRoot: recovery.root, releaseManifestPath: manifestPath, apply: true });
  assert.equal(repaired.status, "RECOVERED");

  await write(recovery.root, transitionReceiptPath, "{\"tampered\":true}\n");
  await expectCode(runBookLoopRouter({ mailboxRoot: recovery.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_TRANSITION_RECEIPT_CONFLICT");

  const preexisting = await makeFixture();
  t.after(() => fs.rm(preexisting.root, { recursive: true, force: true }));
  await runBookLoopRouter({ mailboxRoot: preexisting.root, releaseManifestPath: manifestPath, apply: true });
  await write(preexisting.root, "CURRENT_PACKET.md", preexisting.pointerText);
  const pointerOnly = await runBookLoopRouter({ mailboxRoot: preexisting.root, releaseManifestPath: manifestPath, apply: true });
  assert.equal(pointerOnly.status, "APPLIED");
  assert.equal(pointerOnly.writes_performed, 1);
});

test("hash, terminal-state, missing-packet, and stale-pointer failures fail closed", async (t) => {
  const fixtures = [];
  t.after(async () => Promise.all(fixtures.map((fixture) => fs.rm(fixture.root, { recursive: true, force: true }))));

  const wrongHash = await makeFixture();
  fixtures.push(wrongHash);
  await write(wrongHash.root, returnPath, "PACKET_ID: F_SWANSON_002_TEST\nCHANGED\nCOMPLETED\n");
  await expectCode(runBookLoopRouter({ mailboxRoot: wrongHash.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_RETURN_HASH_MISMATCH");

  const nonterminal = await makeFixture();
  fixtures.push(nonterminal);
  const working = "PACKET_ID: F_SWANSON_002_TEST\nWORKING\n";
  await write(nonterminal.root, returnPath, working);
  await updateManifest(nonterminal.root, (manifest) => { manifest.source.return_sha256 = sha256LfUtf8(working); });
  await expectCode(runBookLoopRouter({ mailboxRoot: nonterminal.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_RETURN_NOT_TERMINAL");

  const empty = await makeFixture();
  fixtures.push(empty);
  await fs.rm(path.join(empty.root, ...destinationPacketPath.split("/")));
  await expectCode(runBookLoopRouter({ mailboxRoot: empty.root, releaseManifestPath: manifestPath }), "PACKET_QUEUE_EMPTY");

  const stale = await makeFixture();
  fixtures.push(stale);
  await write(stale.root, "CURRENT_PACKET.md", "moved\n");
  await expectCode(runBookLoopRouter({ mailboxRoot: stale.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_POINTER_MOVED");

  const missingSource = await makeFixture();
  fixtures.push(missingSource);
  await fs.rm(path.join(missingSource.root, ...sourcePacketPath.split("/")));
  await expectCode(runBookLoopRouter({ mailboxRoot: missingSource.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_SOURCE_PACKET_NOT_FOUND");
});

test("manifest cannot declare SENT terminal, unsealed destinations, or ambiguous routing fields", async (t) => {
  const fixtures = [];
  t.after(async () => Promise.all(fixtures.map((fixture) => fs.rm(fixture.root, { recursive: true, force: true }))));

  const sent = await makeFixture();
  fixtures.push(sent);
  await updateManifest(sent.root, (manifest) => { manifest.source.terminal_marker = "SENT"; });
  await expectCode(runBookLoopRouter({ mailboxRoot: sent.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_TERMINAL_MARKER_INVALID");

  const unsealed = await makeFixture();
  fixtures.push(unsealed);
  const draft = destinationPacket().replace("SEALED__READY_FOR_ORSON", "DRAFT");
  await write(unsealed.root, destinationPacketPath, draft);
  await updateManifest(unsealed.root, (manifest) => {
    manifest.destination.status = "DRAFT";
    manifest.destination.packet_sha256 = sha256LfUtf8(draft);
  });
  await expectCode(runBookLoopRouter({ mailboxRoot: unsealed.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_DESTINATION_NOT_SEALED");

  const duplicate = await makeFixture();
  fixtures.push(duplicate);
  const ambiguous = `${destinationPacket()}\nTarget: \`ORSON_BOOK_STEWARD @ BETSY\`\n`;
  await write(duplicate.root, destinationPacketPath, ambiguous);
  await updateManifest(duplicate.root, (manifest) => { manifest.destination.packet_sha256 = sha256LfUtf8(ambiguous); });
  await expectCode(runBookLoopRouter({ mailboxRoot: duplicate.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_PACKET_FORMAT_INVALID");

  const duplicateReturn = await makeFixture();
  fixtures.push(duplicateReturn);
  const ambiguousReturn = "PACKET_ID: F_SWANSON_002_TEST\nPACKET_ID: F_SWANSON_002_TEST\nCOMPLETED\n";
  await write(duplicateReturn.root, returnPath, ambiguousReturn);
  await updateManifest(duplicateReturn.root, (manifest) => { manifest.source.return_sha256 = sha256LfUtf8(ambiguousReturn); });
  await expectCode(runBookLoopRouter({ mailboxRoot: duplicateReturn.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_RETURN_PACKET_MISMATCH");
});

test("path traversal and symlinked packet paths are rejected", async (t) => {
  const traversal = await makeFixture();
  t.after(() => fs.rm(traversal.root, { recursive: true, force: true }));
  await updateManifest(traversal.root, (manifest) => { manifest.destination.packet_path = "../outside.md"; });
  await expectCode(runBookLoopRouter({ mailboxRoot: traversal.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_DESTINATION_PACKET_PATH_INVALID");

  const linked = await makeFixture();
  t.after(() => fs.rm(linked.root, { recursive: true, force: true }));
  const outside = path.join(linked.root, "outside.md");
  await fs.writeFile(outside, destinationPacket(), "utf8");
  const target = path.join(linked.root, ...destinationPacketPath.split("/"));
  await fs.rm(target);
  try {
    await fs.symlink(outside, target, "file");
  } catch (error) {
    if (["EPERM", "EACCES"].includes(error?.code)) return;
    throw error;
  }
  await expectCode(runBookLoopRouter({ mailboxRoot: linked.root, releaseManifestPath: manifestPath }), "BOOK_LOOP_LINK_FORBIDDEN");

  const lockLinked = await makeFixture();
  t.after(() => fs.rm(lockLinked.root, { recursive: true, force: true }));
  const outsideDirectory = path.join(lockLinked.root, "outside-directory");
  await fs.mkdir(outsideDirectory);
  await fs.mkdir(path.join(lockLinked.root, "foreman"));
  try {
    await fs.symlink(outsideDirectory, path.join(lockLinked.root, "foreman", "harvey"), "junction");
  } catch (error) {
    if (["EPERM", "EACCES"].includes(error?.code)) return;
    throw error;
  }
  await expectCode(runBookLoopRouter({ mailboxRoot: lockLinked.root, releaseManifestPath: manifestPath, apply: true }), "BOOK_LOOP_DIRECTORY_LINK_FORBIDDEN");
});

test("concurrent applies produce one advancement and never corrupt the pointer", async (t) => {
  const fixture = await makeFixture();
  t.after(() => fs.rm(fixture.root, { recursive: true, force: true }));
  const results = await Promise.all(Array.from({ length: 16 }, async () => {
    try {
      return await runBookLoopRouter({ mailboxRoot: fixture.root, releaseManifestPath: manifestPath, apply: true });
    } catch (error) {
      return { status: "BLOCKED", code: error.code };
    }
  }));
  assert.equal(results.filter((result) => result.status === "APPLIED").length, 1);
  assert.ok(results.every((result) => ["APPLIED", "NOOP", "BLOCKED"].includes(result.status)));
  assert.ok(results.filter((result) => result.status === "BLOCKED").every((result) => result.code === "BOOK_LOOP_ROUTER_LOCKED"));
  assert.match((await read(fixture.root, "CURRENT_PACKET.md")).toString("utf8"), /Packet ID: `F_ORSON_000_TEST`/);
});

test("router implementation contains no process-launch, network, provider, or secret-manager surface", async () => {
  const source = await fs.readFile(new URL("../harvey-book-loop-router-lib.mjs", import.meta.url), "utf8");
  for (const forbidden of ["node:child_process", "node:http", "node:https", "node:net", "node:tls", "fetch(", "WebSocket", "gh ", "op "]) {
    assert.equal(source.includes(forbidden), false, forbidden);
  }
  assert.equal(createHash("sha256").update(source).digest("hex").length, 64);
  assert.equal(sha256LfUtf8("same\r\ntext\r"), sha256LfUtf8("same\ntext\n"));
});
