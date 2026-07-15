import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { HARVEY_MACHINES } from "@/lib/harvey/machine-control";
import { assertCockpitArtifactSafe, resolveCockpitArtifactPath } from "@/lib/harvey/cockpit-artifact-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MANIFEST_PATH = "foreman/harvey/HARVEY_COCKPIT_ARTIFACT_MANIFEST_20260713.json";
const PINNED_MANIFEST_SHA256 = "368ad278a1b2fd3e139aba1c27477f7145ecc72f74b1de028360a389e3152407";
const MAX_BUNDLE_BYTES = 512 * 1024;

type CockpitManifest = {
  schema: "werkles.harvey-cockpit-artifact-manifest/v1";
  packet_id: string;
  artifacts: Array<{ path: string; bytes: number; sha256: string }>;
};

async function readCurrentCockpit() {
  const root = process.cwd();
  const manifestBytes = await fs.readFile(await resolveCockpitArtifactPath(root, MANIFEST_PATH));
  const manifestHash = createHash("sha256").update(manifestBytes).digest("hex");
  if (manifestHash !== PINNED_MANIFEST_SHA256) throw new Error("COCKPIT_MANIFEST_HASH_MISMATCH");
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as CockpitManifest;
  if (manifest.schema !== "werkles.harvey-cockpit-artifact-manifest/v1" || !manifest.packet_id || !Array.isArray(manifest.artifacts)) {
    throw new Error("COCKPIT_MANIFEST_INVALID");
  }
  if (manifest.artifacts.length < 1 || manifest.artifacts.length > 64) throw new Error("COCKPIT_MANIFEST_INVALID");

  let bundleBytes = 0;
  const artifacts = await Promise.all(manifest.artifacts.map(async (entry) => {
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 1 || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw new Error("COCKPIT_MANIFEST_INVALID");
    }
    const content = await fs.readFile(await resolveCockpitArtifactPath(root, entry.path));
    assertCockpitArtifactSafe(content);
    bundleBytes += content.byteLength;
    if (bundleBytes > MAX_BUNDLE_BYTES) throw new Error("COCKPIT_BUNDLE_TOO_LARGE");
    const actualHash = createHash("sha256").update(content).digest("hex");
    if (content.byteLength !== entry.bytes || actualHash !== entry.sha256) throw new Error("COCKPIT_ARTIFACT_HASH_MISMATCH");
    return { path: entry.path, encoding: "base64", bytes: content.byteLength, sha256: actualHash, content_base64: content.toString("base64") };
  }));

  return {
    packet_id: manifest.packet_id,
    source: "DOSS_LOCAL_COCKPIT",
    publication: "LOCAL_READY_REMOTE_PUBLICATION_NOT_AUTHORIZED",
    manifest: {
      path: MANIFEST_PATH,
      encoding: "base64",
      sha256: manifestHash,
      content_base64: manifestBytes.toString("base64")
    },
    artifacts
  };
}

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("machine") ?? "";
  const machine = HARVEY_MACHINES.find((item) => item.toLowerCase() === requested.toLowerCase());
  if (!machine) return NextResponse.json({ ok: false, error: "UNKNOWN_MACHINE" }, { status: 400 });

  const directory = path.join(process.cwd(), "data", "tinkerden", "outbox", "knock-20260712");
  try {
    const suffix = `_${machine.toUpperCase()}_20260712.json`;
    const names = (await fs.readdir(directory)).filter((name) => name.endsWith(suffix)).sort();
    const [packets, current_cockpit] = await Promise.all([
      Promise.all(names.map(async (name) => JSON.parse(await fs.readFile(path.join(directory, name), "utf8")))),
      readCurrentCockpit()
    ]);
    return NextResponse.json({ ok: true, machine, count: packets.length, packets, current_cockpit });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "KNOCK_READ_FAILED" }, { status: 500 });
  }
}
