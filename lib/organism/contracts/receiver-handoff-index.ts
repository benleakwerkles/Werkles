import { access, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import { ORGANISM_CONTRACT_RECEIPT_DIR, ORGANISM_CONTRACT_EVENTS_PATH } from "./storage";
import { type OrganismEvent, validateOrganismEvent } from "./event";
import { type OrganismReceipt, validateOrganismReceipt } from "./receipt";

type JsonRecord = Record<string, unknown>;

export const RECEIVER_HANDOFF_ROOT = path.join(process.cwd(), "foreman", "handoffs", "receiver-bundles");

export type ReceiverHandoffState =
  | "posted"
  | "returned_unposted"
  | "template_return_blocked"
  | "pending_receiver"
  | "template_review"
  | "invalid";

export type ReceiverHandoffIndexRecord = {
  bundle_id: string;
  bundle_path: string;
  packet_id: string;
  receiver: string;
  lane: string;
  generated_at: string;
  endpoint: string;
  handoff_path: string;
  packet_path: string;
  receipt_template_path: string;
  returned_receipt_path: string;
  contract_receipt_path: string;
  template_status: string;
  template_blocked_reason: string | null;
  returned_receipt_id: string;
  returned_status: string;
  returned_receiver: string;
  contract_event_joined: boolean;
  state: ReceiverHandoffState;
  post_command: string;
  synthetic_proof: boolean;
  synthetic_reason: string;
  truth_boundary: string;
};

export type ReceiverHandoffIndex = {
  ok: true;
  source_path: string;
  count: number;
  posted_count: number;
  returned_unposted_count: number;
  template_return_blocked_count: number;
  pending_count: number;
  invalid_count: number;
  malformed_count: number;
  records: ReceiverHandoffIndexRecord[];
};

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function repoRel(filePath: string) {
  return slash(path.relative(process.cwd(), filePath));
}

function abs(filePath: string) {
  return path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
}

function field(value: unknown, fallback = "UNKNOWN") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function timeValue(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJson(filePath: string): Promise<JsonRecord | null> {
  try {
    return JSON.parse(await readFile(filePath, "utf8")) as JsonRecord;
  } catch {
    return null;
  }
}

async function readReceipt(filePath: string): Promise<{ value: OrganismReceipt | null; malformed: boolean; invalid: boolean }> {
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    const validation = validateOrganismReceipt(parsed);
    if (!validation.ok) return { value: null, malformed: false, invalid: true };
    return { value: validation.value, malformed: false, invalid: false };
  } catch {
    return { value: null, malformed: true, invalid: false };
  }
}

async function readEvents(): Promise<OrganismEvent[]> {
  try {
    const raw = await readFile(ORGANISM_CONTRACT_EVENTS_PATH, "utf8");
    return raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        try {
          const parsed = JSON.parse(line) as unknown;
          const validation = validateOrganismEvent(parsed);
          return validation.ok ? validation.value : null;
        } catch {
          return null;
        }
      })
      .filter((event): event is OrganismEvent => Boolean(event));
  } catch {
    return [];
  }
}

function receiptFileFor(receiptId: string) {
  const safeId = receiptId
    .trim()
    .replace(/[^A-Za-z0-9_.-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return path.join(ORGANISM_CONTRACT_RECEIPT_DIR, `${safeId}.json`);
}

function truthBoundary(params: {
  state: ReceiverHandoffState;
  template: OrganismReceipt | null;
  returned: OrganismReceipt | null;
  contractReceiptPath: string;
}) {
  if (params.state === "posted") {
    if (params.returned && params.returned.status !== "completed") {
      return `Returned receipt status is ${params.returned.status}; contract receipt posted at ${params.contractReceiptPath}.`;
    }
    const boundary = params.returned?.what_did_not_change.find((item) => /completion|downstream|fixture|template/i.test(item));
    return boundary ?? `Returned receipt ${params.returned?.receipt_id ?? "UNKNOWN"} posted at ${params.contractReceiptPath}.`;
  }

  if (params.state === "returned_unposted") {
    return "Returned receipt exists locally but has not been found in the canonical contract receipt store.";
  }

  if (params.state === "template_return_blocked") {
    return "Returned receipt still contains TEMPLATE_NOT_FILLED and must not be posted as receiver work.";
  }

  if (params.state === "pending_receiver") {
    return "Receiver handoff is waiting on a non-template returned receipt.";
  }

  if (params.state === "template_review") {
    return "Receipt template is not in the expected blocked TEMPLATE_NOT_FILLED state; review before handoff.";
  }

  return "Handoff bundle is malformed or missing required files.";
}

function isUnfilledTemplate(receipt: OrganismReceipt | null) {
  if (!receipt) return false;
  return (
    receipt.blocked_reason === "TEMPLATE_NOT_FILLED" ||
    receipt.what_changed.includes("TEMPLATE_NOT_FILLED") ||
    receipt.what_was_attempted.includes("TEMPLATE_NOT_FILLED") ||
    receipt.proof.some((proof) => proof.value.includes("TEMPLATE_NOT_FILLED"))
  );
}

function receiptMarkerText(receipt: OrganismReceipt | null) {
  if (!receipt) return "";
  return [
    receipt.receiver,
    receipt.what_was_attempted,
    ...receipt.what_changed,
    ...receipt.what_did_not_change,
    receipt.next_safe_action,
    ...receipt.proof.map((proof) => proof.value),
  ].join("\n");
}

function syntheticReason(params: {
  bundleId: string;
  receiver: string;
  returnedReceiver: string;
  template: OrganismReceipt | null;
  returned: OrganismReceipt | null;
}) {
  if (/(^|_)(smoke|fixture)(_|$)|receipts_ready_post_success|ui_post_|ui_fill_|fill_return_|api_create_/i.test(params.bundleId)) {
    return "bundle_id_marks_smoke_or_fixture";
  }

  if (/(Smoke|Fixture)@/i.test(`${params.receiver}\n${params.returnedReceiver}`)) {
    return "receiver_marks_smoke_or_fixture";
  }

  if (/\b(smoke|fixture|synthetic)\b/i.test(`${receiptMarkerText(params.returned)}\n${receiptMarkerText(params.template)}`)) {
    return "receipt_text_marks_smoke_or_fixture";
  }

  return "operator_handoff";
}

function stateFor(params: {
  template: OrganismReceipt | null;
  returned: OrganismReceipt | null;
  contractReceiptExists: boolean;
  manifestOk: boolean;
}) {
  if (!params.manifestOk || !params.template) return "invalid" satisfies ReceiverHandoffState;
  if (isUnfilledTemplate(params.returned)) return "template_return_blocked" satisfies ReceiverHandoffState;
  if (params.returned && params.contractReceiptExists) return "posted" satisfies ReceiverHandoffState;
  if (params.returned) return "returned_unposted" satisfies ReceiverHandoffState;
  if (params.template.status === "blocked" && params.template.blocked_reason === "TEMPLATE_NOT_FILLED") {
    return "pending_receiver" satisfies ReceiverHandoffState;
  }
  return "template_review" satisfies ReceiverHandoffState;
}

export async function readReceiverHandoffIndex(limit = 25): Promise<ReceiverHandoffIndex> {
  const [entries, events] = await Promise.all([
    readdir(RECEIVER_HANDOFF_ROOT, { withFileTypes: true }).catch(() => []),
    readEvents(),
  ]);
  let malformed = 0;
  let invalid = 0;
  const records: ReceiverHandoffIndexRecord[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const bundleDir = path.join(RECEIVER_HANDOFF_ROOT, entry.name);
    const manifestPath = path.join(bundleDir, "manifest.json");
    const templatePath = path.join(bundleDir, "receipt-template.json");
    const returnedPath = path.join(bundleDir, "returned-receipt.json");
    const manifest = await readJson(manifestPath);
    if (!manifest) {
      malformed += 1;
      continue;
    }

    const packetPath = field((manifest.bundle_paths as JsonRecord | undefined)?.packet, repoRel(path.join(bundleDir, "packet.json")));
    const packetCopy = await readJson(abs(packetPath));
    const template = await readReceipt(templatePath);
    if (template.malformed) malformed += 1;
    if (template.invalid) invalid += 1;

    const hasReturned = await exists(returnedPath);
    const returned = hasReturned ? await readReceipt(returnedPath) : { value: null, malformed: false, invalid: false };
    if (returned.malformed) malformed += 1;
    if (returned.invalid) invalid += 1;

    const returnedReceiptId = returned.value?.receipt_id ?? "NO_RETURNED_RECEIPT";
    const contractReceiptPath = returned.value ? receiptFileFor(returned.value.receipt_id) : "";
    const contractReceiptExists = Boolean(contractReceiptPath && (await exists(contractReceiptPath)));
    const state = stateFor({
      template: template.value,
      returned: returned.value,
      contractReceiptExists,
      manifestOk: true,
    });
    if (state === "invalid") invalid += 1;

    const joinedEvent = events.some(
      (event) =>
        event.packet_id === field(manifest.packet_id) &&
        event.receipt_id === returnedReceiptId &&
        event.event_type === "packet_receipted",
    );
    const fileStat = await stat(manifestPath).catch(() => null);

    const receiver = field(manifest.receiver);
    const returnedReceiver = returned.value?.receiver ?? "UNKNOWN";
    const synthetic = syntheticReason({
      bundleId: entry.name,
      receiver,
      returnedReceiver,
      template: template.value,
      returned: returned.value,
    });

    records.push({
      bundle_id: entry.name,
      bundle_path: repoRel(bundleDir),
      packet_id: field(manifest.packet_id),
      receiver,
      lane: field(packetCopy?.lane, field((manifest as { lane?: unknown }).lane, "UNKNOWN")),
      generated_at: field(manifest.generated_at, fileStat?.mtime.toISOString() ?? "UNKNOWN"),
      endpoint: field(manifest.endpoint),
      handoff_path: field((manifest.bundle_paths as JsonRecord | undefined)?.handoff, repoRel(path.join(bundleDir, "HANDOFF.md"))),
      packet_path: packetPath,
      receipt_template_path: field(
        (manifest.bundle_paths as JsonRecord | undefined)?.receiptTemplate,
        repoRel(templatePath),
      ),
      returned_receipt_path: hasReturned ? repoRel(returnedPath) : "NO_RETURNED_RECEIPT",
      contract_receipt_path: contractReceiptExists ? repoRel(contractReceiptPath) : "NO_CONTRACT_RECEIPT",
      template_status: template.value?.status ?? "invalid",
      template_blocked_reason: template.value?.blocked_reason ?? null,
      returned_receipt_id: returnedReceiptId,
      returned_status: returned.value?.status ?? "missing",
      returned_receiver: returnedReceiver,
      contract_event_joined: joinedEvent,
      state,
      post_command: field(manifest.post_command),
      synthetic_proof: synthetic !== "operator_handoff",
      synthetic_reason: synthetic,
      truth_boundary: truthBoundary({
        state,
        template: template.value,
        returned: returned.value,
        contractReceiptPath: contractReceiptExists ? repoRel(contractReceiptPath) : "NO_CONTRACT_RECEIPT",
      }),
    });
  }

  records.sort((a, b) => timeValue(b.generated_at) - timeValue(a.generated_at));
  const limited = records.slice(0, limit);

  return {
    ok: true,
    source_path: repoRel(RECEIVER_HANDOFF_ROOT),
    count: limited.length,
    posted_count: records.filter((record) => record.state === "posted").length,
    returned_unposted_count: records.filter((record) => record.state === "returned_unposted").length,
    template_return_blocked_count: records.filter((record) => record.state === "template_return_blocked").length,
    pending_count: records.filter((record) => record.state === "pending_receiver").length,
    invalid_count: invalid + records.filter((record) => record.state === "invalid").length,
    malformed_count: malformed,
    records: limited,
  };
}
