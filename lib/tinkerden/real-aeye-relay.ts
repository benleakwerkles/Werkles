import { createHash, randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type RealAeyeRelayStatus = "WAITING_FOR_CODEX_THREAD_BRIDGE" | "ARTIFACT" | "BLOCKER";

export type RealAeyeRelayRequest = {
  schema: "tinkerden_real_aeye_relay_request_v0";
  relay_id: string;
  created_at: string;
  status: RealAeyeRelayStatus;
  source_surface: string;
  destination_id: string | null;
  destination_label: string;
  stream: string;
  command: string;
  command_packet_id: string | null;
  command_receipt_id: string | null;
  aeye_receipt_id: string | null;
  command_packet_path: string | null;
  command_receipt_path: string | null;
  success_criteria: string[];
  bridge_required: true;
  node_runtime_can_create_codex_thread: false;
  limitation: string;
};

export type RealAeyeRelayReceipt = {
  schema: "tinkerden_real_aeye_relay_receipt_v0";
  relay_id: string;
  receipt_id: string;
  created_at: string;
  status: RealAeyeRelayStatus;
  thread_id: string | null;
  source_surface: string;
  destination_label: string;
  command_packet_id: string | null;
  command_receipt_id: string | null;
  prompt_sent: string;
  answer_text: string;
  proof_chain: {
    new_chat_created: boolean;
    new_query_sent: boolean;
    packet_left: boolean;
    packet_received_by_aeye_thread: boolean;
    answer_returned: boolean;
    answer_received_by_origin: boolean;
  };
  missing_proof: string[];
  request_path: string;
  response_path: string;
  receipt_path: string;
  origin_return: {
    schema: "tinkerden_origin_dash_return_v0";
    origin_surface: string;
    origin_return_path: string;
    status: "ANSWER_RECEIVED_BY_ORIGIN" | "ANSWER_RETURN_READBACK_FAILED";
    answer_sha256: string;
    readback_sha256: string;
    readback_match: boolean;
    returned_at: string;
    readback_at: string;
  } | null;
  limitation: string;
};

type CreateRelayInput = {
  command: string;
  destination_id?: string | null;
  destination_label?: string | null;
  source_surface?: string | null;
  stream?: string | null;
  command_packet_id?: string | null;
  command_receipt_id?: string | null;
  aeye_receipt_id?: string | null;
  packet_path?: string | null;
  receipt_path?: string | null;
};

type CompleteRelayInput = {
  relay_id: string;
  thread_id?: string | null;
  prompt_sent?: string | null;
  answer_text?: string | null;
  status?: RealAeyeRelayStatus | null;
};

const BASE_DIR = path.join("tinkerden", "aeye-relay");
const REQUESTS_DIR = path.join(BASE_DIR, "requests");
const RESPONSES_DIR = path.join(BASE_DIR, "responses");
const RECEIPTS_DIR = path.join(BASE_DIR, "receipts");
const ORIGIN_DASH_DIR = path.join(BASE_DIR, "origin-dash");
const EVENTS_PATH = path.join(BASE_DIR, "events.jsonl");

function repoPath(relativePath: string) {
  return path.join(process.cwd(), relativePath);
}

function slash(value: string) {
  return value.split(path.sep).join("/");
}

function safeName(value: string) {
  return value.replace(/[^a-zA-Z0-9_.-]/g, "_");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
}

function text(value: string | null | undefined, fallback = "") {
  return value && value.trim() ? value.trim() : fallback;
}

async function writeJson(relativePath: string, value: Record<string, unknown>) {
  await mkdir(path.dirname(repoPath(relativePath)), { recursive: true });
  await writeFile(repoPath(relativePath), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function appendJsonl(relativePath: string, value: Record<string, unknown>) {
  await mkdir(path.dirname(repoPath(relativePath)), { recursive: true });
  await writeFile(repoPath(relativePath), `${JSON.stringify(value)}\n`, { encoding: "utf8", flag: "a" });
}

async function readJson<T>(relativePath: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(repoPath(relativePath), "utf8")) as T;
  } catch {
    return null;
  }
}

async function listJsonFiles(relativeDir: string) {
  try {
    const entries = await readdir(repoPath(relativeDir), { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
      .map((entry) => slash(path.join(relativeDir, entry.name)));
  } catch {
    return [];
  }
}

export function realAeyeRelayPaths(relayId: string) {
  return {
    request_path: slash(path.join(REQUESTS_DIR, `${relayId}.json`)),
    response_path: slash(path.join(RESPONSES_DIR, `${relayId}.json`)),
    receipt_path: slash(path.join(RECEIPTS_DIR, `${relayId}.receipt.json`)),
    events_path: slash(EVENTS_PATH)
  };
}

async function writeOriginDashReturn(input: {
  request: RealAeyeRelayRequest;
  relay_id: string;
  response_path: string;
  answer_text: string;
}) {
  const originSurface = text(input.request.source_surface, "UNKNOWN_ORIGIN");
  const answerSha256 = sha256(input.answer_text);
  const returnedAt = new Date().toISOString();
  const originReturnPath = slash(path.join(ORIGIN_DASH_DIR, safeName(originSurface), `${input.relay_id}.origin-return.json`));
  const originReturn = {
    schema: "tinkerden_origin_dash_return_v0",
    relay_id: input.relay_id,
    command_packet_id: input.request.command_packet_id,
    command_receipt_id: input.request.command_receipt_id,
    source_surface: originSurface,
    origin_surface: originSurface,
    destination_label: input.request.destination_label,
    response_path: input.response_path,
    answer_text: input.answer_text,
    answer_sha256: answerSha256,
    status: "ANSWER_RETURNED_TO_ORIGIN_DASH",
    returned_at: returnedAt
  };

  await writeJson(originReturnPath, originReturn);

  const readback = await readJson<Record<string, unknown>>(originReturnPath);
  const readbackAnswer = text(typeof readback?.answer_text === "string" ? readback.answer_text : "");
  const readbackSha256 = sha256(readbackAnswer);
  const readbackMatch =
    readback?.schema === "tinkerden_origin_dash_return_v0" &&
    readback?.relay_id === input.relay_id &&
    readback?.origin_surface === originSurface &&
    readback?.answer_sha256 === answerSha256 &&
    readbackSha256 === answerSha256;

  return {
    schema: "tinkerden_origin_dash_return_v0" as const,
    origin_surface: originSurface,
    origin_return_path: originReturnPath,
    status: readbackMatch ? ("ANSWER_RECEIVED_BY_ORIGIN" as const) : ("ANSWER_RETURN_READBACK_FAILED" as const),
    answer_sha256: answerSha256,
    readback_sha256: readbackSha256,
    readback_match: readbackMatch,
    returned_at: returnedAt,
    readback_at: new Date().toISOString()
  };
}

export async function createRealAeyeRelayRequest(input: CreateRelayInput) {
  const command = text(input.command);
  if (!command) throw new Error("COMMAND_REQUIRED");

  const relayId = `real_aeye_relay_${stamp()}_${randomBytes(3).toString("hex")}`;
  const paths = realAeyeRelayPaths(relayId);
  const request: RealAeyeRelayRequest = {
    schema: "tinkerden_real_aeye_relay_request_v0",
    relay_id: relayId,
    created_at: new Date().toISOString(),
    status: "WAITING_FOR_CODEX_THREAD_BRIDGE",
    source_surface: text(input.source_surface, "TinkerDen@Betsy"),
    destination_id: text(input.destination_id, "") || null,
    destination_label: text(input.destination_label, "Unassigned Aeye"),
    stream: text(input.stream, "FERAL / TINKERDEN"),
    command,
    command_packet_id: text(input.command_packet_id, "") || null,
    command_receipt_id: text(input.command_receipt_id, "") || null,
    aeye_receipt_id: text(input.aeye_receipt_id, "") || null,
    command_packet_path: text(input.packet_path, "") || null,
    command_receipt_path: text(input.receipt_path, "") || null,
    success_criteria: [
      "A. new chat in any Aeye anywhere",
      "B. new query",
      "C. activity originating from Nerdkle Organism prompting",
      "D. proof packet left",
      "E. proof packet was received",
      "F. proof packet was answered",
      "G. proof answer was received"
    ],
    bridge_required: true,
    node_runtime_can_create_codex_thread: false,
    limitation:
      "Next.js/Node can queue the relay request, but a Codex thread bridge or future authenticated daemon must create/read the actual Aeye chat."
  };

  await writeJson(paths.request_path, request);
  await appendJsonl(EVENTS_PATH, {
    event_type: "real_aeye_relay_requested",
    timestamp: request.created_at,
    relay_id: relayId,
    status: request.status,
    command_packet_id: request.command_packet_id,
    destination_label: request.destination_label,
    request_path: paths.request_path
  });

  return {
    ok: true,
    ...request,
    ...paths
  };
}

export async function completeRealAeyeRelay(input: CompleteRelayInput) {
  const relayId = text(input.relay_id);
  if (!relayId) throw new Error("RELAY_ID_REQUIRED");

  const paths = realAeyeRelayPaths(relayId);
  const request = await readJson<RealAeyeRelayRequest>(paths.request_path);
  if (!request || request.schema !== "tinkerden_real_aeye_relay_request_v0") {
    throw new Error("RELAY_REQUEST_NOT_FOUND");
  }

  const threadId = text(input.thread_id, "") || null;
  const promptSent = text(input.prompt_sent);
  const answerText = text(input.answer_text);
  const originReturn = answerText
    ? await writeOriginDashReturn({
        request,
        relay_id: relayId,
        response_path: paths.response_path,
        answer_text: answerText
      })
    : null;
  const mentionsRelay = answerText.includes(relayId);
  const mentionsPacket = request.command_packet_id ? answerText.includes(request.command_packet_id) : false;
  const proofChain = {
    new_chat_created: Boolean(threadId),
    new_query_sent: Boolean(promptSent),
    packet_left: Boolean(promptSent.includes(relayId) || (request.command_packet_id && promptSent.includes(request.command_packet_id))),
    packet_received_by_aeye_thread: mentionsRelay || mentionsPacket || /received/i.test(answerText),
    answer_returned: Boolean(answerText),
    answer_received_by_origin: Boolean(originReturn?.readback_match)
  };

  const missingProof = [
    proofChain.new_chat_created ? null : "No Codex/Aeye thread id was recorded.",
    proofChain.new_query_sent ? null : "No prompt/query text was recorded.",
    proofChain.packet_left ? null : "Prompt did not include relay_id or source packet_id.",
    proofChain.packet_received_by_aeye_thread ? null : "Answer did not acknowledge relay_id, packet_id, or receipt.",
    proofChain.answer_returned ? null : "No answer text was returned.",
    proofChain.answer_received_by_origin ? null : "Origin dash return artifact was not read back with a matching answer hash."
  ].filter((failure): failure is string => Boolean(failure));

  const inferredStatus: RealAeyeRelayStatus = missingProof.length === 0 ? "ARTIFACT" : "BLOCKER";
  const status = input.status === "ARTIFACT" || input.status === "BLOCKER" ? input.status : inferredStatus;
  const receipt: RealAeyeRelayReceipt = {
    schema: "tinkerden_real_aeye_relay_receipt_v0",
    relay_id: relayId,
    receipt_id: `real_aeye_relay_receipt_${stamp()}_${randomBytes(3).toString("hex")}`,
    created_at: new Date().toISOString(),
    status,
    thread_id: threadId,
    source_surface: request.source_surface,
    destination_label: request.destination_label,
    command_packet_id: request.command_packet_id,
    command_receipt_id: request.command_receipt_id,
    prompt_sent: promptSent,
    answer_text: answerText,
    proof_chain: proofChain,
    missing_proof: missingProof,
    request_path: paths.request_path,
    response_path: paths.response_path,
    receipt_path: paths.receipt_path,
    origin_return: originReturn,
    limitation:
      "This receipt proves a Codex thread bridge serviced the queued request. It is not yet proof that the local Node runtime can autonomously create Codex threads without the bridge."
  };

  await writeJson(paths.response_path, {
    schema: "tinkerden_real_aeye_relay_response_v0",
    relay_id: relayId,
    thread_id: threadId,
    status,
    answer_text: answerText,
    created_at: receipt.created_at
  });
  await writeJson(paths.receipt_path, receipt);
  await appendJsonl(EVENTS_PATH, {
    event_type: "real_aeye_relay_completed",
    timestamp: receipt.created_at,
    relay_id: relayId,
    status,
    thread_id: threadId,
    receipt_id: receipt.receipt_id,
    receipt_path: paths.receipt_path
  });
  if (originReturn) {
    await appendJsonl(EVENTS_PATH, {
      event_type: "real_aeye_relay_origin_returned",
      timestamp: originReturn.readback_at,
      relay_id: relayId,
      source_surface: request.source_surface,
      origin_return_path: originReturn.origin_return_path,
      answer_sha256: originReturn.answer_sha256,
      readback_match: originReturn.readback_match
    });
  }

  return {
    ok: true,
    ...paths,
    request,
    receipt
  };
}

export async function readRealAeyeRelayStatus(relayId: string) {
  const paths = realAeyeRelayPaths(relayId);
  const request = await readJson<RealAeyeRelayRequest>(paths.request_path);
  if (!request) return null;
  const receipt = await readJson<RealAeyeRelayReceipt>(paths.receipt_path);

  return {
    ok: true,
    relay_id: relayId,
    status: receipt?.status ?? request.status,
    request,
    receipt,
    ...paths
  };
}

export async function listRealAeyeRelays(limit = 25) {
  const files = await listJsonFiles(REQUESTS_DIR);
  const relays = await Promise.all(
    files.map(async (requestPath) => {
      const request = await readJson<RealAeyeRelayRequest>(requestPath);
      if (!request || request.schema !== "tinkerden_real_aeye_relay_request_v0") return null;
      return readRealAeyeRelayStatus(request.relay_id);
    })
  );

  return relays
    .filter((relay): relay is NonNullable<Awaited<ReturnType<typeof readRealAeyeRelayStatus>>> => relay !== null)
    .sort((left, right) => right.request.created_at.localeCompare(left.request.created_at))
    .slice(0, limit);
}
