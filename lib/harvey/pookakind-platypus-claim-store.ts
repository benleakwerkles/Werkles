import { createHash, randomUUID } from "node:crypto";
import {
  closeSync, existsSync, fsyncSync, linkSync, lstatSync, mkdirSync,
  openSync, readFileSync, realpathSync, rmSync, writeFileSync,
} from "node:fs";
import path from "node:path";

import { canonicalJson } from "./station-crypto-core.mjs";

const SHA256 = /^[a-f0-9]{64}$/;
const OPERATION_ID = /^platypus-[a-f0-9]{32}$/;
const CLAIM_FIELDS = ["capsule_sha256", "operation_id", "request_sha256", "schema", "state"];

type PlatypusClaim = Readonly<{
  schema: "pookakind.platypus-access-steward-claim/v1";
  operation_id: string;
  request_sha256: string;
  capsule_sha256: string;
  state: "CLAIMED_NOT_SUBMITTED";
}>;

function fail(code: string): never { throw new Error(code); }
function record(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function exact(value: Record<string, unknown>, keys: readonly string[]) { return Object.keys(value).sort().join("|") === [...keys].sort().join("|"); }
function digest(value: string | Buffer) { return createHash("sha256").update(value).digest("hex"); }
function inside(root: string, candidate: string) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function validateClaim(value: unknown): asserts value is PlatypusClaim {
  if (!record(value) || !exact(value, CLAIM_FIELDS)
    || value.schema !== "pookakind.platypus-access-steward-claim/v1"
    || value.state !== "CLAIMED_NOT_SUBMITTED"
    || typeof value.operation_id !== "string" || !OPERATION_ID.test(value.operation_id)
    || typeof value.request_sha256 !== "string" || !SHA256.test(value.request_sha256)
    || typeof value.capsule_sha256 !== "string" || !SHA256.test(value.capsule_sha256)) {
    fail("PLATYPUS_CLAIM_INVALID");
  }
}

function requireRegularFile(pathname: string) {
  const status = lstatSync(pathname);
  if (!status.isFile() || status.isSymbolicLink()) fail("PLATYPUS_CLAIM_STORE_BOUNDARY_INVALID");
}

function atomicExact(pathname: string, bytes: Buffer) {
  if (existsSync(pathname)) {
    requireRegularFile(pathname);
    if (!readFileSync(pathname).equals(bytes)) fail("PLATYPUS_CLAIM_REPLAY_CONFLICT");
    return "REPLAY_SAME_REQUEST" as const;
  }

  const temporary = `${pathname}.${process.pid}.${randomUUID()}.tmp`;
  let descriptor: number | undefined;
  try {
    descriptor = openSync(temporary, "wx", 0o600);
    writeFileSync(descriptor, bytes);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    try {
      linkSync(temporary, pathname);
      return "CREATED" as const;
    } catch (error) {
      if ((error as NodeJS.ErrnoException)?.code !== "EEXIST") throw error;
      requireRegularFile(pathname);
      if (!readFileSync(pathname).equals(bytes)) fail("PLATYPUS_CLAIM_REPLAY_CONFLICT");
      return "REPLAY_SAME_REQUEST" as const;
    }
  } finally {
    if (descriptor !== undefined) closeSync(descriptor);
    rmSync(temporary, { force: true });
  }
}

export function createPookaKindPlatypusClaimStore(configuration: { root: string }) {
  if (typeof configuration?.root !== "string" || !path.isAbsolute(configuration.root)) fail("PLATYPUS_CLAIM_STORE_INPUT_INVALID");

  let root: string;
  let claims: string;
  try {
    const configuredRoot = path.resolve(configuration.root);
    const rootStatus = lstatSync(configuredRoot);
    if (!rootStatus.isDirectory() || rootStatus.isSymbolicLink()) fail("PLATYPUS_CLAIM_STORE_BOUNDARY_INVALID");
    root = realpathSync(configuredRoot);

    const claimDirectory = path.join(root, "platypus-access-steward-claims");
    mkdirSync(claimDirectory, { recursive: true });
    const claimStatus = lstatSync(claimDirectory);
    if (!claimStatus.isDirectory() || claimStatus.isSymbolicLink()) fail("PLATYPUS_CLAIM_STORE_BOUNDARY_INVALID");
    claims = realpathSync(claimDirectory);
  } catch (error) {
    if ((error as Error)?.message?.startsWith("PLATYPUS_CLAIM_STORE_")) throw error;
    fail("PLATYPUS_CLAIM_STORE_BOUNDARY_INVALID");
  }
  if (!inside(root, claims)) fail("PLATYPUS_CLAIM_STORE_BOUNDARY_INVALID");

  return function claimPlatypusOperation(value: unknown) {
    validateClaim(value);
    const claimBytes = Buffer.from(`${canonicalJson(value)}\n`, "utf8");
    if (claimBytes.length > 4_096) fail("PLATYPUS_CLAIM_INVALID");
    const claimPath = path.join(claims, `${value.operation_id}.json`);
    const state = atomicExact(claimPath, claimBytes);
    return Object.freeze({
      schema: "pookakind.platypus-claim-store-receipt/v1" as const,
      operation_id: value.operation_id,
      request_sha256: value.request_sha256,
      capsule_sha256: value.capsule_sha256,
      claim_sha256: digest(claimBytes),
      state,
      provider_calls: 0 as const,
      otp_stored: false as const,
      recurring_operation_created: false as const,
      durability: "ATOMIC_CREATE_IF_ABSENT__FILE_FSYNC" as const,
      crash_policy: "AMBIGUOUS_RETRY_BLOCKED" as const,
    });
  };
}
