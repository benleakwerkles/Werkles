import { lstat, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

import { runStewartSwateyesPrivateBroker } from "../../lib/harvey/stewart-swateyes-private-broker.mjs";

const MANIFEST_FIELDS = [
  "authorityRecord", "operatorAuthority", "observation", "swateyesRequest",
  "swateyesAuthority", "brokerProof", "unspentAuthorityReceiptIds",
  "consumedDispatchSha256s",
];

async function boundedFile(path, max) {
  const info = await lstat(path);
  if (!info.isFile() || info.size < 1 || info.size > max)
    throw new Error("PRIVATE_BROKER_INPUT_FILE_INVALID");
  const bytes = await readFile(path);
  if (bytes.length !== info.size) throw new Error("PRIVATE_BROKER_INPUT_FILE_CHANGED");
  return bytes;
}

/** Agent-side bridge only. The separate-SID broker alone opens credential custody. */
export async function runStewartSwateyesPrivateBrokerFromFiles({
  manifestPath, envelopePath, connect, now,
}) {
  const manifestBytes = await boundedFile(manifestPath, 65_536);
  let manifest;
  try { manifest = JSON.parse(manifestBytes.toString("utf8")); }
  catch { throw new Error("PRIVATE_BROKER_MANIFEST_INVALID"); }
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)
    || Object.keys(manifest).sort().join("|") !== [...MANIFEST_FIELDS].sort().join("|"))
    throw new Error("PRIVATE_BROKER_MANIFEST_INVALID");
  const signedEnvelope = await boundedFile(envelopePath, 65_536);
  return runStewartSwateyesPrivateBroker({
    ...manifest, signedEnvelope,
    ...(connect ? { connect } : {}), ...(now === undefined ? {} : { now }),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv.length !== 6 || process.argv[2] !== "--manifest" || process.argv[4] !== "--envelope")
    throw new Error("PRIVATE_BROKER_CLI_ARGS_INVALID");
  const receipt = await runStewartSwateyesPrivateBrokerFromFiles({
    manifestPath: process.argv[3], envelopePath: process.argv[5],
  });
  process.stdout.write(`${JSON.stringify(receipt)}\n`);
  if (receipt.state !== "SUBMITTED_ONCE_PROVIDER_UNVERIFIED") process.exitCode = 1;
}
