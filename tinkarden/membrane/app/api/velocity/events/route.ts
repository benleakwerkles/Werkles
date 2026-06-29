import fs from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const REPO_ROOT = path.resolve(process.cwd(), "..", "..");
const SPEAKER_ROOT = path.join(REPO_ROOT, "speaker");
const INGEST_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "ingest.jsonl");
const HARVEST_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "autonomic-harvest.jsonl");
const INTERFACE_NOTIFY_LOG_PATH = path.join(SPEAKER_ROOT, "logs", "interface-notify.jsonl");

type JsonRecord = Record<string, unknown>;

function readLastJsonl(filePath: string, limit = 30): JsonRecord[] {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return raw
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as JsonRecord);
  } catch {
    return [];
  }
}

function nodeFromEvent(event: JsonRecord) {
  const trigger = String(event.trigger || event.event_type || "");
  const status = String(event.status || "IDLE");
  const command = String(event.command || "");
  const sourcePath = String(event.file_path || event.source_path || "");
  const isActive = status === "TRIGGER" || status === "PASS" || Boolean(command);

  if (trigger.includes("rebuild_index") || command.includes("rebuild-index")) {
    return { id: "thufir", label: "THUFIR@BETSY", state: "VALIDATING_INDEX", token_saturation: 68, active: isActive };
  }
  if (trigger.includes("frontmatter") || sourcePath.includes("doctrine/active")) {
    return { id: "ender", label: "ENDER@BETSY", state: "COMPRESSED_THOUGHT_STREAM", token_saturation: 74, active: isActive };
  }
  if (trigger.includes("ingest") || sourcePath.includes("receipts/raw/inbox")) {
    return { id: "sally", label: "SALLY_REPAIR", state: status === "PASS" ? "IDLE" : "RECEIPT_INTAKE", token_saturation: status === "PASS" ? 18 : 54, active: status !== "PASS" };
  }
  return null;
}

function capsuleFromEvent(event: JsonRecord) {
  const trigger = String(event.trigger || event.event_type || "");
  const filePath = String(event.file_path || event.source_path || event.raw_inbox_path || "");
  const capsuleId = String(event.capsule_id || event.receipt_id || filePath || `capsule_${Date.now()}`);
  const origin = String(event.thinker_node || event.authority || (filePath.includes("doctrine") ? "Ender@Betsy" : "Dink@Betsy"));

  if (!trigger.includes("new_") && !trigger.includes("harvested") && !trigger.includes("ingest")) return null;

  return {
    id: capsuleId,
    origin,
    target_mutations: [filePath || "speaker substrate"],
    awaiting: "PASTE_GPG_SIG",
    source_path: filePath || "speaker/logs/ingest.jsonl",
    status: "AWAITING_MOMENTUM_TAP",
    timestamp: String(event.timestamp || new Date().toISOString())
  };
}

function velocityPayload(event: JsonRecord) {
  if (String(event.event_type || "") === "final_assembly_next_best_idea_built") {
    const artifactPath = String(event.artifact_path || event.source_path || "tinkarden/membrane/next_best_ideas");
    return {
      type: "transaction_capsule",
      interface_state: {
        status: String(event.status || "NEXT_BEST_IDEA_BUILT"),
        badge: `[ G_BUILD: ${String(event.idea_id || "NEXT_BEST_IDEA")} ]`,
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      },
      capsule: {
        id: String(event.build_id || event.idea_id || `next_best_idea_${Date.now()}`),
        origin: "G Command@Betsy",
        target_mutations: [artifactPath, String(event.build_log_path || "tinkarden/membrane/final_assembly_next_best_ideas.jsonl")],
        awaiting: "OPERATOR_REVIEW",
        source_path: artifactPath,
        status: String(event.status || "NEXT_BEST_IDEA_BUILT"),
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      }
    };
  }

  if (String(event.event_type || "") === "final_assembly_decision") {
    const decisionPath = String(event.decision_path || event.source_path || "tinkarden/membrane/final_assembly_decisions");
    return {
      type: "transaction_capsule",
      interface_state: {
        status: "FINAL_ASSEMBLY_DECISION_RECORDED",
        badge: `[ FINAL_ASSEMBLY: ${String(event.decision || "DECISION")} ]`,
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      },
      capsule: {
        id: String(event.decision_id || event.module_id || `final_assembly_decision_${Date.now()}`),
        origin: "Operator@Betsy",
        target_mutations: [decisionPath, String(event.proof_path || "proof_path_missing")],
        awaiting: "SWANSON_FINAL_MERGE_REVIEW",
        source_path: decisionPath,
        status: String(event.decision_effect || "Final assembly decision recorded."),
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      }
    };
  }

  if (String(event.event_type || "") === "swanson_functional_relay") {
    const packetPath = String(event.packet_path || event.source_path || "tinkerden/dispatch/packets");
    return {
      type: "transaction_capsule",
      interface_state: {
        status: String(event.relay_status || "PACKET_RELAY_COMPLETE"),
        badge: "[ SWANSON_RELAY: PACKET_RELAY_COMPLETE ]",
        timestamp: String(event.timestamp || event.created_at || new Date().toISOString())
      },
      capsule: {
        id: String(event.relay_id || event.packet_id || `swanson_relay_${Date.now()}`),
        origin: "Swanson Functional Relay@Betsy",
        target_mutations: [packetPath, String(event.receipt_path || "data/tinkerden/receipts")],
        awaiting: "OPERATOR_PASTE_SEND",
        source_path: packetPath,
        status: String(event.relay_status || "PACKET_RELAY_COMPLETE"),
        timestamp: String(event.timestamp || event.created_at || new Date().toISOString())
      }
    };
  }

  if (String(event.event_type || "") === "optional_packet_created") {
    const packetPath = String(event.packet_path || event.source_path || "tinkarden/membrane/optional_packets.jsonl");
    return {
      type: "transaction_capsule",
      interface_state: {
        status: String(event.relay_status || "SUCCESS_RELAYED"),
        badge: "[ OPTIONAL_PACKET: SUCCESS_RELAYED ]",
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      },
      capsule: {
        id: String(event.packet_id || event.card_id || `optional_packet_${Date.now()}`),
        origin: Array.isArray(event.food_sources) && event.food_sources.length > 0
          ? event.food_sources.map(String).join("/")
          : "Petra/Skybro",
        target_mutations: Array.isArray(event.target_mutations) && event.target_mutations.length > 0
          ? event.target_mutations.map(String)
          : [String(event.target_aeye || "OPERATOR_SELECTS_TARGET")],
        awaiting: String(event.awaiting || "MOMENTUM_TAP"),
        source_path: packetPath,
        status: String(event.status || "OPTIONAL_PACKET_CREATED"),
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      }
    };
  }

  if (String(event.event_type || "") === "momentum_tap") {
    return {
      type: "momentum_tap",
      interface_state: {
        status: "MOMENTUM_TAP_RECORDED",
        badge: "[ MOMENTUM_TAP: RECORDED ]",
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      },
      capsule: {
        id: String(event.capsule_id || event.tap_id || `tap_${Date.now()}`),
        origin: String(event.origin || "Operator@Betsy"),
        target_mutations: Array.isArray(event.target_mutations) && event.target_mutations.length > 0
          ? event.target_mutations.map(String)
          : ["SWANSON_FUNCTIONAL_RELAY_MERGE"],
        awaiting: String(event.awaiting || "SWANSON_FUNCTIONAL_RELAY_MERGE"),
        source_path: String(event.receipt_path || event.source_path || "tinkarden/membrane/momentum_taps.jsonl"),
        status: String(event.status || "MOMENTUM_TAPPED"),
        timestamp: String(event.created_at || event.timestamp || new Date().toISOString())
      }
    };
  }

  if (String(event.event_type || "") === "clipboard_ingest") {
    return {
      type: "clipboard_ingest",
      interface_state: {
        status: String(event.status || "CLIPBOARD_INGEST_SUCCESSFUL"),
        badge: String(event.badge || "[ CLIPBOARD_INGEST: SUCCESSFUL ]"),
        timestamp: String(event.timestamp || new Date().toISOString())
      },
      capsule: {
        id: String(event.capsule_id || event.receipt_id || `clip_${Date.now()}`),
        origin: "Clipboard@Betsy",
        target_mutations: Array.isArray(event.written_files) && event.written_files.length > 0
          ? event.written_files.map(String)
          : ["speaker/receipts/raw/inbox"],
        awaiting: "OPERATOR_REVIEW",
        source_path: "speaker/logs/interface-notify.jsonl",
        status: "CLIPBOARD_INGEST_SUCCESSFUL",
        timestamp: String(event.timestamp || new Date().toISOString())
      }
    };
  }

  return {
    type: String(event.event || event.event_type || "substrate_event"),
    node: nodeFromEvent(event),
    capsule: capsuleFromEvent(event)
  };
}

function send(controller: ReadableStreamDefaultController<Uint8Array>, name: string, data: unknown) {
  const encoder = new TextEncoder();
  controller.enqueue(encoder.encode(`event: ${name}\n`));
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
}

export async function GET() {
  let interval: ReturnType<typeof setInterval> | null = null;
  const watchers: fs.FSWatcher[] = [];
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const seen = new Set<string>();

      function pump() {
        for (const event of [...readLastJsonl(INGEST_LOG_PATH), ...readLastJsonl(HARVEST_LOG_PATH), ...readLastJsonl(INTERFACE_NOTIFY_LOG_PATH)]) {
          const key = JSON.stringify(event);
          if (seen.has(key)) continue;
          seen.add(key);
          const payload = velocityPayload(event);
          send(
            controller,
            payload.type === "clipboard_ingest"
              ? "clipboard_ingest"
              : payload.type === "momentum_tap"
                ? "momentum_tap"
                : payload.type === "transaction_capsule"
                  ? "transaction_capsule"
                  : "velocity",
            payload
          );
        }
      }

      send(controller, "velocity", {
        type: "velocity_ready",
        node: { id: "sally", label: "SALLY_REPAIR", state: "IDLE", token_saturation: 12, active: false },
        capsule: null
      });

      pump();
      for (const logPath of [INGEST_LOG_PATH, HARVEST_LOG_PATH, INTERFACE_NOTIFY_LOG_PATH]) {
        try {
          fs.mkdirSync(path.dirname(logPath), { recursive: true });
          if (!fs.existsSync(logPath)) fs.writeFileSync(logPath, "", "utf8");
          watchers.push(fs.watch(logPath, { persistent: false }, pump));
        } catch {
          // The interval fallback keeps the SSE route alive if fs.watch is unavailable.
        }
      }
      interval = setInterval(pump, 1000);
    },
    cancel() {
      if (interval) clearInterval(interval);
      for (const watcher of watchers) watcher.close();
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}
