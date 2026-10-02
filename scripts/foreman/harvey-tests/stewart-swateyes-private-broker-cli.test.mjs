import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { runStewartSwateyesPrivateBrokerFromFiles } from "../run-stewart-swateyes-private-broker-once.mjs";

test("one-shot caller rejects unscoped or oversized custody before any broker connect", async () => {
  const root = await mkdtemp(join(tmpdir(), "pk-private-broker-cli-"));
  const manifestPath = join(root, "manifest.json");
  const envelopePath = join(root, "operation.p7m");
  let connections = 0;
  const connect = () => { connections++; throw new Error("unexpected broker connect"); };
  try {
    await writeFile(envelopePath, "synthetic-envelope");
    await writeFile(manifestPath, JSON.stringify({ password: "do-not-forward" }));
    await assert.rejects(runStewartSwateyesPrivateBrokerFromFiles({ manifestPath, envelopePath, connect }),
      /PRIVATE_BROKER_MANIFEST_INVALID/);
    await writeFile(manifestPath, JSON.stringify({
      authorityRecord: {}, operatorAuthority: {}, observation: {}, swateyesRequest: {},
      swateyesAuthority: {}, brokerProof: {}, unspentAuthorityReceiptIds: [], consumedDispatchSha256s: [],
    }));
    await assert.rejects(runStewartSwateyesPrivateBrokerFromFiles({ manifestPath, envelopePath, connect }),
      /STEWART_BACKGROUND_CREDENTIAL|PRIVATE_BROKER/);
    await writeFile(envelopePath, Buffer.alloc(65_537));
    await assert.rejects(runStewartSwateyesPrivateBrokerFromFiles({ manifestPath, envelopePath, connect }),
      /PRIVATE_BROKER_INPUT_FILE_INVALID/);
    assert.equal(connections, 0);
  } finally { await rm(root, { recursive: true, force: true }); }
});
