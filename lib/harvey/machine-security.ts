import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import {
  HARVEY_MACHINE_HOSTNAMES,
  HarveyControlError,
  type HarveyMachine,
  type HarveyMachineActor,
  type HarveyOperatorActor,
  normalizeMachine
} from "@/lib/harvey/machine-control";

const MAX_WRITE_BODY_BYTES = 16 * 1024;
const MACHINE_SIGNATURE_WINDOW_SECONDS = 90;
// A request signed at the maximum accepted future skew remains valid for twice the window from receipt.
const MACHINE_NONCE_RETENTION_SECONDS = MACHINE_SIGNATURE_WINDOW_SECONDS * 2 + 30;
const MAX_RETAINED_NONCES_PER_MACHINE = 256;

type MachineRequestEnvelope = {
  machine: HarveyMachine;
  hostname: string;
  agentId: string;
  secret: string;
  timestamp: string;
  nonce: string;
  signature: string;
};

export type HarveyWriteBody = {
  body: Record<string, unknown>;
  rawBody: string;
};

function bearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) throw new HarveyControlError("AUTHORIZATION_REQUIRED", 401);
  return match[1];
}

function valueMatches(actual: string, expected: string) {
  const actualBytes = Buffer.from(actual, "utf8");
  const expectedBytes = Buffer.from(expected, "utf8");
  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function authenticateOperatorRequest(request: Request): HarveyOperatorActor {
  const actual = bearerToken(request);
  const expected = process.env.HARVEY_OPERATOR_TOKEN?.trim() ?? "";
  if (!expected) throw new HarveyControlError("OPERATOR_CREDENTIAL_NOT_CONFIGURED", 503);
  if (!valueMatches(actual, expected)) throw new HarveyControlError("INVALID_OPERATOR_CREDENTIAL", 401);
  return { role: "operator", operator_id: "harvey-cockpit" };
}

function configuredMachineSecrets() {
  const source = process.env.HARVEY_AGENT_SECRETS_JSON?.trim() ?? "";
  if (!source) throw new HarveyControlError("MACHINE_CREDENTIALS_NOT_CONFIGURED", 503);
  try {
    return JSON.parse(source) as Record<string, unknown>;
  } catch {
    throw new HarveyControlError("MACHINE_CREDENTIALS_INVALID", 503);
  }
}

function expectedAgentId(machine: HarveyMachine, hostname: string) {
  return `handeye-${machine.toLowerCase()}-${hostname.toLowerCase()}`;
}

export function assertMachineRequestEnvelope(request: Request): MachineRequestEnvelope {
  const machineHeader = request.headers.get("x-harvey-machine");
  if (!machineHeader) throw new HarveyControlError("AUTHENTICATION_REQUIRED", 401);
  const machine = normalizeMachine(machineHeader);
  const hostname = HARVEY_MACHINE_HOSTNAMES[machine];
  const agentId = (request.headers.get("x-harvey-agent-id") ?? "").trim();
  if (!agentId) throw new HarveyControlError("AUTHENTICATION_REQUIRED", 401);
  if (agentId !== expectedAgentId(machine, hostname)) throw new HarveyControlError("AGENT_BINDING_MISMATCH", 403);

  const timestamp = (request.headers.get("x-harvey-timestamp") ?? "").trim();
  const timestampSeconds = Number(timestamp);
  if (!/^\d{10}$/.test(timestamp) || !Number.isSafeInteger(timestampSeconds)) {
    throw new HarveyControlError("REQUEST_TIMESTAMP_INVALID", 401);
  }
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > MACHINE_SIGNATURE_WINDOW_SECONDS) {
    throw new HarveyControlError("REQUEST_TIMESTAMP_EXPIRED", 401);
  }

  const nonce = (request.headers.get("x-harvey-nonce") ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(nonce)) throw new HarveyControlError("REQUEST_NONCE_INVALID", 401);
  const signature = (request.headers.get("x-harvey-signature") ?? "").trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(signature)) throw new HarveyControlError("REQUEST_SIGNATURE_REQUIRED", 401);

  const configured = configuredMachineSecrets();
  const secret = String(configured[machine] ?? "").trim();
  if (!secret) throw new HarveyControlError("MACHINE_CREDENTIAL_NOT_CONFIGURED", 503);
  return { machine, hostname, agentId, secret, timestamp, nonce, signature };
}

function machineSignature(request: Request, rawBody: string, envelope: MachineRequestEnvelope) {
  const bodyHash = createHash("sha256").update(rawBody, "utf8").digest("hex");
  const pathname = new URL(request.url).pathname;
  const canonical = [
    request.method.toUpperCase(),
    pathname,
    envelope.machine,
    envelope.agentId,
    envelope.timestamp,
    envelope.nonce,
    bodyHash
  ].join("\n");
  return createHmac("sha256", envelope.secret).update(canonical, "utf8").digest("hex");
}

async function consumeMachineNonce(envelope: MachineRequestEnvelope) {
  const directory = path.join(process.cwd(), "data", "harvey", "machine-control", "nonces", envelope.machine.toLowerCase());
  await fs.mkdir(directory, { recursive: true });
  const noncePath = path.join(directory, `${envelope.nonce}.json`);
  let handle;
  try {
    handle = await fs.open(noncePath, "wx");
    await handle.writeFile(`${JSON.stringify({ timestamp: envelope.timestamp })}\n`, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new HarveyControlError("REQUEST_REPLAYED", 409);
    throw error;
  } finally {
    await handle?.close();
  }

  const entries = (await fs.readdir(directory, { withFileTypes: true }))
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"));
  const dated = (await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(directory, entry.name);
    try { return { path: entryPath, modified: (await fs.stat(entryPath)).mtimeMs }; }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }))).filter((entry): entry is { path: string; modified: number } => entry !== null);
  const expiryBoundary = Date.now() - MACHINE_NONCE_RETENTION_SECONDS * 1000;
  const expired = dated.filter((entry) => entry.modified < expiryBoundary);
  await Promise.all(expired.map((entry) => fs.unlink(entry.path).catch(() => undefined)));
  if (dated.length - expired.length > MAX_RETAINED_NONCES_PER_MACHINE) {
    await fs.unlink(noncePath).catch(() => undefined);
    throw new HarveyControlError("MACHINE_NONCE_CAPACITY_EXCEEDED", 503);
  }
}

export async function authenticateMachineRequest(
  request: Request,
  rawBody: string,
  prepared?: MachineRequestEnvelope
): Promise<HarveyMachineActor> {
  const envelope = prepared ?? assertMachineRequestEnvelope(request);
  const expected = machineSignature(request, rawBody, envelope);
  if (!valueMatches(envelope.signature, expected)) throw new HarveyControlError("INVALID_MACHINE_SIGNATURE", 401);
  await consumeMachineNonce(envelope);
  return {
    role: "machine",
    machine: envelope.machine,
    hostname: envelope.hostname,
    agent_id: envelope.agentId
  };
}

export async function readHarveyWriteBody(request: Request): Promise<HarveyWriteBody> {
  const advertisedLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(advertisedLength) && advertisedLength > MAX_WRITE_BODY_BYTES) {
    throw new HarveyControlError("REQUEST_BODY_TOO_LARGE", 413);
  }

  const reader = request.body?.getReader();
  if (!reader) throw new HarveyControlError("INVALID_JSON_BODY", 400);
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > MAX_WRITE_BODY_BYTES) {
      await reader.cancel("REQUEST_BODY_TOO_LARGE");
      throw new HarveyControlError("REQUEST_BODY_TOO_LARGE", 413);
    }
    chunks.push(value);
  }
  const rawBody = Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))).toString("utf8");
  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") throw new Error("not an object");
    return { body: parsed as Record<string, unknown>, rawBody };
  } catch {
    throw new HarveyControlError("INVALID_JSON_BODY", 400);
  }
}

export function harveyErrorResponse(error: unknown, fallback: string) {
  if (error instanceof HarveyControlError) return { error: error.message, status: error.status };
  return { error: fallback, status: 400 };
}
