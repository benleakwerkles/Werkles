import { createHash, createPublicKey, verify } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

const LEDGER_SCHEMA = "werkles.pookakind-authority-gate-ledger/v1" as const;
const SCOPE_SCHEMA = "werkles.pookakind-authority-gate-scope/v1" as const;
const RECEIPT_SCHEMA = "werkles.pookakind-operator-gate-receipt/v1" as const;
const MAX_GATES = 512;
const MAX_APPROVAL_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;
const TOKEN = /^[A-Za-z0-9][A-Za-z0-9._:-]{1,127}$/;
const ACTION = /^[A-Z][A-Z0-9_]{2,127}$/;
const SHA256 = /^[a-f0-9]{64}$/;
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export type PookaKindGateScope = {
  schema: typeof SCOPE_SCHEMA;
  machine: string;
  project_id: string;
  provider: string;
  action_class: string;
  scope_sha256: string;
};

export type PookaKindGateState =
  | "WAITING_FOR_OPERATOR"
  | "APPROVED"
  | "REJECTED"
  | "REVOKED"
  | "EXPIRED";

export type PookaKindGateRecord = {
  gate_id: string;
  fingerprint_sha256: string;
  scope: PookaKindGateScope;
  state: PookaKindGateState;
  first_seen_at: string;
  last_seen_at: string;
  duplicate_count: number;
  operator_notification_count: number;
  next_operator_notification_allowed_at: null;
  resolution_receipt_id: string | null;
  resolution_receipt_sha256: string | null;
  approval_expires_at: string | null;
};

type GateLedger = {
  schema: typeof LEDGER_SCHEMA;
  revision: number;
  gates: PookaKindGateRecord[];
  content_sha256: string;
};

export type PookaKindOperatorGateReceipt = {
  schema: typeof RECEIPT_SCHEMA;
  receipt_id: string;
  gate_id: string;
  fingerprint_sha256: string;
  decision: "APPROVED" | "REJECTED" | "REVOKED";
  granted_by: "BEN_OPERATOR";
  issued_at: string;
  expires_at: string | null;
  operator_key_fingerprint_sha256: string;
  signature_base64: string;
};

const SCOPE_KEYS = ["action_class", "machine", "project_id", "provider", "schema", "scope_sha256"].sort();
const RECEIPT_KEYS = ["decision", "expires_at", "fingerprint_sha256", "gate_id", "granted_by", "issued_at", "operator_key_fingerprint_sha256", "receipt_id", "schema", "signature_base64"].sort();
const RECORD_KEYS = ["approval_expires_at", "duplicate_count", "fingerprint_sha256", "first_seen_at", "gate_id", "last_seen_at", "next_operator_notification_allowed_at", "operator_notification_count", "resolution_receipt_id", "resolution_receipt_sha256", "scope", "state"].sort();

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function instant(value: string, code: string) {
  if (typeof value !== "string" || !ISO.test(value)) throw new Error(code);
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== value) throw new Error(code);
  return parsed;
}

function validateScope(value: unknown): PookaKindGateScope {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("GATE_SCOPE_INVALID");
  const scope = value as PookaKindGateScope;
  if (Object.keys(scope).sort().join("|") !== SCOPE_KEYS.join("|")
    || scope.schema !== SCOPE_SCHEMA
    || !TOKEN.test(scope.machine)
    || !TOKEN.test(scope.project_id)
    || !ACTION.test(scope.provider)
    || !ACTION.test(scope.action_class)
    || !SHA256.test(scope.scope_sha256)) throw new Error("GATE_SCOPE_INVALID");
  return structuredClone(scope);
}

export function pookaKindGateFingerprint(scope: PookaKindGateScope) {
  return sha256(canonical(validateScope(scope)));
}

function gateId(fingerprint: string) {
  return `gate.${fingerprint}`;
}

function receiptPayload(receipt: PookaKindOperatorGateReceipt) {
  const { signature_base64: _signature, ...payload } = receipt;
  return canonical(payload);
}

export function pookaKindOperatorGateReceiptPayload(receipt: PookaKindOperatorGateReceipt) {
  return receiptPayload(receipt);
}

function validateRecord(value: unknown): PookaKindGateRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("GATE_RECORD_INVALID");
  const record = value as PookaKindGateRecord;
  const fingerprint = pookaKindGateFingerprint(record.scope);
  if (Object.keys(record).sort().join("|") !== RECORD_KEYS.join("|")
    || record.fingerprint_sha256 !== fingerprint
    || record.gate_id !== gateId(fingerprint)
    || !["WAITING_FOR_OPERATOR", "APPROVED", "REJECTED", "REVOKED", "EXPIRED"].includes(record.state)
    || !Number.isSafeInteger(record.duplicate_count) || record.duplicate_count < 0
    || !Number.isSafeInteger(record.operator_notification_count) || record.operator_notification_count < 1
    || record.next_operator_notification_allowed_at !== null) throw new Error("GATE_RECORD_INVALID");
  const first = instant(record.first_seen_at, "GATE_RECORD_TIME_INVALID");
  const last = instant(record.last_seen_at, "GATE_RECORD_TIME_INVALID");
  if (last < first) throw new Error("GATE_RECORD_TIME_INVALID");
  const resolved = record.state !== "WAITING_FOR_OPERATOR";
  if (resolved !== Boolean(record.resolution_receipt_id && record.resolution_receipt_sha256)) throw new Error("GATE_RECORD_RESOLUTION_INVALID");
  if (record.state === "APPROVED" && record.approval_expires_at === null) throw new Error("GATE_RECORD_RESOLUTION_INVALID");
  if (record.approval_expires_at !== null) instant(record.approval_expires_at, "GATE_RECORD_TIME_INVALID");
  return structuredClone(record);
}

function documentHash(value: Omit<GateLedger, "content_sha256">) {
  return sha256(canonical(value));
}

function initialLedger(): GateLedger {
  const body = { schema: LEDGER_SCHEMA, revision: 0, gates: [] as PookaKindGateRecord[] };
  return { ...body, content_sha256: documentHash(body) };
}

function validateLedger(value: unknown): GateLedger {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("GATE_LEDGER_INVALID");
  const ledger = value as GateLedger;
  if (Object.keys(ledger).sort().join("|") !== ["content_sha256", "gates", "revision", "schema"].sort().join("|")
    || ledger.schema !== LEDGER_SCHEMA
    || !Number.isSafeInteger(ledger.revision) || ledger.revision < 0
    || !Array.isArray(ledger.gates) || ledger.gates.length > MAX_GATES) throw new Error("GATE_LEDGER_INVALID");
  const gates = ledger.gates.map(validateRecord);
  const ids = new Set<string>();
  const fingerprints = new Set<string>();
  for (const gate of gates) {
    if (ids.has(gate.gate_id) || fingerprints.has(gate.fingerprint_sha256)) throw new Error("GATE_LEDGER_DUPLICATE_GATE");
    ids.add(gate.gate_id); fingerprints.add(gate.fingerprint_sha256);
  }
  const body = { schema: LEDGER_SCHEMA, revision: ledger.revision, gates };
  if (ledger.content_sha256 !== documentHash(body)) throw new Error("GATE_LEDGER_INTEGRITY_FAILED");
  return { ...body, content_sha256: ledger.content_sha256 };
}

export class PookaKindAuthorityGateMemory {
  private readonly ledgerPath: string;
  private readonly lockPath: string;
  private readonly operatorPublicKeyPem: string;
  private readonly operatorKeyFingerprint: string;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(input: { ledger_path: string; operator_public_key_pem: string; operator_key_fingerprint_sha256: string }) {
    if (!input || typeof input !== "object" || Array.isArray(input)
      || Object.keys(input).sort().join("|") !== ["ledger_path", "operator_key_fingerprint_sha256", "operator_public_key_pem"].sort().join("|")
      || typeof input.ledger_path !== "string" || input.ledger_path.length < 1
      || typeof input.operator_public_key_pem !== "string" || input.operator_public_key_pem.length < 1
      || !SHA256.test(input.operator_key_fingerprint_sha256)) throw new Error("GATE_MEMORY_CONFIGURATION_INVALID");
    const key = createPublicKey(input.operator_public_key_pem);
    const der = key.export({ type: "spki", format: "der" });
    if (createHash("sha256").update(der).digest("hex") !== input.operator_key_fingerprint_sha256) throw new Error("GATE_MEMORY_OPERATOR_KEY_MISMATCH");
    this.ledgerPath = input.ledger_path;
    this.lockPath = `${input.ledger_path}.lock`;
    this.operatorPublicKeyPem = input.operator_public_key_pem;
    this.operatorKeyFingerprint = input.operator_key_fingerprint_sha256;
  }

  private serial<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work, work);
    this.queue = result.then(() => undefined, () => undefined);
    return result;
  }

  private async withCrossProcessLock<T>(work: () => Promise<T>): Promise<T> {
    try { await fs.mkdir(this.lockPath); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("GATE_LEDGER_BUSY");
      throw error;
    }
    try { return await work(); }
    finally { await fs.rm(this.lockPath, { recursive: true, force: true }); }
  }

  private async read(): Promise<GateLedger> {
    try { return validateLedger(JSON.parse(await fs.readFile(this.ledgerPath, "utf8"))); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return initialLedger();
      throw error;
    }
  }

  private async write(ledger: Omit<GateLedger, "content_sha256">) {
    const next = validateLedger({ ...ledger, content_sha256: documentHash(ledger) });
    await fs.mkdir(path.dirname(this.ledgerPath), { recursive: true });
    const temporary = `${this.ledgerPath}.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`;
    try {
      await fs.writeFile(temporary, `${JSON.stringify(next, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
      await fs.rename(temporary, this.ledgerPath);
    } finally { await fs.rm(temporary, { force: true }).catch(() => undefined); }
    return next;
  }

  async register(scopeInput: PookaKindGateScope, observedAt: string) {
    const scope = validateScope(scopeInput);
    const now = instant(observedAt, "GATE_OBSERVED_TIME_INVALID");
    return this.serial(() => this.withCrossProcessLock(async () => {
      const ledger = await this.read();
      const fingerprint = pookaKindGateFingerprint(scope);
      const id = gateId(fingerprint);
      const existing = ledger.gates.find((gate) => gate.gate_id === id);
      if (!existing) {
        if (ledger.gates.length >= MAX_GATES) throw new Error("GATE_LEDGER_CAPACITY_EXCEEDED");
        const gate: PookaKindGateRecord = {
          gate_id: id, fingerprint_sha256: fingerprint, scope, state: "WAITING_FOR_OPERATOR",
          first_seen_at: observedAt, last_seen_at: observedAt, duplicate_count: 0,
          operator_notification_count: 1, next_operator_notification_allowed_at: null,
          resolution_receipt_id: null, resolution_receipt_sha256: null, approval_expires_at: null
        };
        await this.write({ schema: LEDGER_SCHEMA, revision: ledger.revision + 1, gates: [...ledger.gates, gate].sort((a, b) => a.gate_id.localeCompare(b.gate_id)) });
        return { result: "NEW_GATE_REGISTERED" as const, gate: structuredClone(gate), operator_notification_eligible: true, secret_entry_authorized: false, provider_action_authorized: false };
      }
      if (canonical(existing.scope) !== canonical(scope)) throw new Error("GATE_FINGERPRINT_COLLISION_OR_CORRUPTION");
      if (now < instant(existing.last_seen_at, "GATE_RECORD_TIME_INVALID")) throw new Error("GATE_CLOCK_REGRESSION");
      const gate = structuredClone(existing);
      gate.last_seen_at = observedAt;
      gate.duplicate_count += 1;
      let result: "SUPPRESSED_DUPLICATE" | "GATE_ALREADY_RESOLVED" | "APPROVAL_EXPIRED_REVIEW_REQUIRED";
      let notify = false;
      if (gate.state === "WAITING_FOR_OPERATOR") result = "SUPPRESSED_DUPLICATE";
      else if (gate.state === "APPROVED" && now >= instant(gate.approval_expires_at!, "GATE_RECORD_TIME_INVALID")) {
        gate.state = "EXPIRED";
        gate.operator_notification_count += 1;
        result = "APPROVAL_EXPIRED_REVIEW_REQUIRED";
        notify = true;
      } else result = "GATE_ALREADY_RESOLVED";
      await this.write({ schema: LEDGER_SCHEMA, revision: ledger.revision + 1, gates: ledger.gates.map((item) => item.gate_id === id ? gate : item) });
      return { result, gate, operator_notification_eligible: notify, secret_entry_authorized: false, provider_action_authorized: false };
    }));
  }

  private async applyOperatorReceiptLocked(receiptInput: PookaKindOperatorGateReceipt, appliedAt: string) {
    const now = instant(appliedAt, "GATE_RECEIPT_APPLIED_TIME_INVALID");
    if (!receiptInput || typeof receiptInput !== "object" || Array.isArray(receiptInput)
      || Object.keys(receiptInput).sort().join("|") !== RECEIPT_KEYS.join("|")) throw new Error("GATE_OPERATOR_RECEIPT_INVALID");
    const receipt = structuredClone(receiptInput);
    const issued = instant(receipt.issued_at, "GATE_OPERATOR_RECEIPT_TIME_INVALID");
    if (receipt.schema !== RECEIPT_SCHEMA || !TOKEN.test(receipt.receipt_id)
      || receipt.granted_by !== "BEN_OPERATOR" || !["APPROVED", "REJECTED", "REVOKED"].includes(receipt.decision)
      || !SHA256.test(receipt.fingerprint_sha256) || receipt.gate_id !== gateId(receipt.fingerprint_sha256)
      || receipt.operator_key_fingerprint_sha256 !== this.operatorKeyFingerprint
      || typeof receipt.signature_base64 !== "string" || receipt.signature_base64.length < 16
      || issued > now) throw new Error("GATE_OPERATOR_RECEIPT_INVALID");
    if (!verify(null, Buffer.from(receiptPayload(receipt), "utf8"), this.operatorPublicKeyPem, Buffer.from(receipt.signature_base64, "base64"))) {
      throw new Error("GATE_OPERATOR_RECEIPT_SIGNATURE_INVALID");
    }
    const ledger = await this.read();
    const existing = ledger.gates.find((gate) => gate.gate_id === receipt.gate_id);
    if (!existing || existing.fingerprint_sha256 !== receipt.fingerprint_sha256) throw new Error("GATE_OPERATOR_RECEIPT_SCOPE_MISMATCH");
    if (now < instant(existing.last_seen_at, "GATE_RECORD_TIME_INVALID") || issued < instant(existing.first_seen_at, "GATE_RECORD_TIME_INVALID")) throw new Error("GATE_CLOCK_REGRESSION");
    const receiptSha = sha256(receiptPayload(receipt));
    if (existing.resolution_receipt_id === receipt.receipt_id && existing.resolution_receipt_sha256 === receiptSha) {
      return { result: "RECEIPT_REPLAY_IDEMPOTENT" as const, gate: structuredClone(existing), secret_entry_authorized: false, provider_action_authorized: false };
    }
    if (["REJECTED", "REVOKED"].includes(existing.state) && receipt.decision === "APPROVED") throw new Error("GATE_DENIAL_OR_REVOCATION_PRECEDENCE");
    if (existing.state === "APPROVED" && receipt.decision === "REJECTED") throw new Error("GATE_REVOCATION_REQUIRED");
    let expires: string | null = null;
    if (receipt.decision === "APPROVED") {
      if (receipt.expires_at === null) throw new Error("GATE_OPERATOR_RECEIPT_EXPIRY_REQUIRED");
      const expiry = instant(receipt.expires_at, "GATE_OPERATOR_RECEIPT_TIME_INVALID");
      if (expiry <= now || expiry - issued > MAX_APPROVAL_LIFETIME_MS) throw new Error("GATE_OPERATOR_RECEIPT_EXPIRED_OR_OVERLONG");
      expires = receipt.expires_at;
    } else if (receipt.expires_at !== null) throw new Error("GATE_OPERATOR_RECEIPT_EXPIRY_FORBIDDEN");
    const gate: PookaKindGateRecord = {
      ...existing, state: receipt.decision, last_seen_at: appliedAt,
      resolution_receipt_id: receipt.receipt_id, resolution_receipt_sha256: receiptSha, approval_expires_at: expires
    };
    await this.write({ schema: LEDGER_SCHEMA, revision: ledger.revision + 1, gates: ledger.gates.map((item) => item.gate_id === gate.gate_id ? gate : item) });
    return { result: "OPERATOR_RECEIPT_APPLIED" as const, gate,
      gate_condition_acknowledged: receipt.decision === "APPROVED", secret_entry_authorized: false,
      provider_action_authorized: false, recurring_operation_authorized: false, notification_retry_created: false };
  }

  async applyOperatorReceipt(receiptInput: PookaKindOperatorGateReceipt, appliedAt: string) {
    return this.serial(() => this.withCrossProcessLock(() => this.applyOperatorReceiptLocked(receiptInput, appliedAt)));
  }

  async applyOperatorReceiptWithCustody<T>(receiptInput: PookaKindOperatorGateReceipt, appliedAt: string, custody: (resolution: Awaited<ReturnType<PookaKindAuthorityGateMemory["applyOperatorReceiptLocked"]>>) => Promise<T>) {
    if (typeof custody !== "function") throw new Error("GATE_CUSTODY_CALLBACK_REQUIRED");
    return this.serial(() => this.withCrossProcessLock(async () => custody(await this.applyOperatorReceiptLocked(receiptInput, appliedAt))));
  }

  async snapshot() {
    const ledger = await this.read();
    return structuredClone(ledger);
  }
}
