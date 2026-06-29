"use client";

import { useEffect, useMemo, useState } from "react";

type JsonRecord = Record<string, unknown>;

type RelaySnapshot = {
  contract: JsonRecord | null;
  coverage: JsonRecord | null;
  originReturn: JsonRecord | null;
  threadBridge: JsonRecord | null;
  actionableReturns: JsonRecord | null;
  bookChapters: JsonRecord | null;
  bookCourier: JsonRecord | null;
};

type ActionResult = {
  label: string;
  endpoint: string;
  timestamp: string;
  ok: boolean;
  statusCode: number;
  result: JsonRecord | null;
  error?: string;
};

const emptySnapshot: RelaySnapshot = {
  contract: null,
  coverage: null,
  originReturn: null,
  threadBridge: null,
  actionableReturns: null,
  bookChapters: null,
  bookCourier: null
};

function valueAt(source: unknown, path: string[]) {
  let current = source;
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return null;
    current = (current as JsonRecord)[key];
  }
  return current;
}

function asText(value: unknown, fallback = "UNKNOWN") {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function humanTargetName(target: string) {
  if (!target || target === "UNKNOWN_TARGET") return "Unknown receiver";
  return target.replace(".", "@");
}

function findReceiver(threadBridge: JsonRecord | null, target: string) {
  const targetThreads = asArray(valueAt(threadBridge, ["known_target_threads"]));
  const fromList = targetThreads.find((item) => asText(asRecord(item)?.target, "") === target);
  if (fromList) return asRecord(fromList);

  const knownTarget = valueAt(threadBridge, ["known_targets", target]);
  return asRecord(knownTarget);
}

function receiverTitle(threadBridge: JsonRecord | null, target: string) {
  const receiver = findReceiver(threadBridge, target);
  return asText(receiver?.title, humanTargetName(target));
}

function receiverSurface(receiver: JsonRecord | null) {
  const mode = asText(receiver?.relay_mode, "");
  const status = asText(receiver?.route_status, "");
  if (mode === "CODEX_THREAD_BRIDGE") return "Codex receiver thread";
  if (mode === "FILE_INBOX_LAN") return "LAN receiver inbox";
  if (mode === "DO_NOT_ROUTE" || status === "HELD_BY_TOPOLOGY") return "Held by routing rules";
  if (mode === "LOCAL_ONLY") return "Local control thread";
  return "Receiver surface";
}

function receiverInstruction(receiver: JsonRecord | null, target: string) {
  const title = asText(receiver?.title, humanTargetName(target));
  const mode = asText(receiver?.relay_mode, "");
  const inboxUrl = asText(receiver?.file_inbox_url, "");
  if (mode === "CODEX_THREAD_BRIDGE") {
    return `Continue directly in the Codex thread named "${title}". ThinkIt is showing the receipt that thread wrote back.`;
  }
  if (inboxUrl && inboxUrl !== "UNKNOWN") {
    return `Open the receiver inbox for ${humanTargetName(target)}. ThinkIt is waiting for that inbox to write back.`;
  }
  return "This return is file-backed. ThinkIt can show the proof, but no friendly receiver surface is linked yet.";
}

function humanLabel(value: unknown, fallback = "Review") {
  return asText(value, fallback).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function humanizeTargetText(value: unknown, target: string, fallback: string) {
  return asText(value, fallback).replaceAll(target, humanTargetName(target));
}

function returnedWorkHeadline(record: JsonRecord, target: string) {
  const channel = asText(record.channel, "");
  const advancement = asText(record.advancement_type, "");
  const packet = asText(record.packet_id, "");
  const receiver = humanTargetName(target);

  if (advancement === "SESSION_BOOTSTRAP" || channel === "brainboot") {
    return `${receiver} finished Brainboot and is ready for the next move.`;
  }
  if (packet.startsWith("BOOK_CHAPTER_EDIT")) {
    return `${receiver} returned a book edit.`;
  }
  if (asText(record.answer_status, "") === "COMPLETED") {
    return `${receiver} returned a completed answer.`;
  }
  return `${receiver} returned work for review.`;
}

type AeyeRosterEntry = {
  target: string;
  role: string;
  statusHint?: "alias" | "local" | "retired" | "unwired";
  note?: string;
};

type AeyeRosterRow = AeyeRosterEntry & {
  aeye: string;
  machine: string;
  coverageRecord: JsonRecord | null;
  status: string;
  statusLabel: string;
  statusTone: string;
  latestPacket: string;
  latestReceipt: string;
  proofGap: string;
  nextMove: string;
};

const expectedAeyeRoster: AeyeRosterEntry[] = [
  { target: "Skybro.Betsy", role: "Architecture, book editing, source-truth synthesis" },
  { target: "Petra.Betsy", role: "Operator judgment, routing, decision packets" },
  { target: "Dink.Betsy", role: "Hand work, build/merge execution" },
  { target: "Maker.Betsy", role: "Builder/courier work and local artifact handling" },
  { target: "Fucko.Betsy", role: "Speaker intake, manuscript pressure, packet language" },
  {
    target: "Swanson.Doss",
    role: "Relay, repo truth, infrastructure, proof readback",
    statusHint: "local",
    note: "Current local control surface. This is not a remote receiver chat."
  },
  {
    target: "Dink.Doss",
    role: "Old label for Dink-style execution on Doss",
    statusHint: "alias",
    note: "Operational route is Swanson@Doss. Do not fake-route to a literal Dink@Doss inbox."
  },
  { target: "Bean.Spanzee", role: "Red-team audit and contradiction finding" },
  { target: "Computer.Spanzee", role: "Spanzee machine-side execution and receiver proof" },
  { target: "Thufir.Sally", role: "Validation, adversarial review, proof discipline" },
  {
    target: "Ender.Sally",
    role: "Filtration / controlled forgetting",
    statusHint: "retired",
    note: "Retired until Sally RAM upgrade arrives. Hold new work."
  },
  {
    target: "FuckoJr.Sally",
    role: "Accountability / receipt follow-through candidate",
    statusHint: "unwired",
    note: "Known topology name. No ThinkIt receiver thread is bound yet."
  },
  {
    target: "Skybro.Sally",
    role: "Sally-side strategy/editing candidate",
    statusHint: "unwired",
    note: "Known topology name. Needs a receiver surface before routing work."
  },
  {
    target: "Bean.Sally",
    role: "Bean route if Sally has capacity",
    statusHint: "unwired",
    note: "Known topology name. Held until Sally capacity/routing is explicit."
  }
];

function splitTarget(target: string) {
  const [aeye = "Unknown", machine = "Unassigned"] = target.split(".");
  return { aeye, machine };
}

function statusLabel(status: string) {
  switch (status) {
    case "ROUND_TRIP_PROVEN":
      return "Answered";
    case "HELD_BY_TOPOLOGY":
      return "Retired / held";
    case "LOCAL_CONTROL_THREAD":
      return "Local control";
    case "FILE_INBOX_WAITING":
      return "Waiting on inbox";
    case "WAITING_FOR_RECEIVER":
      return "Sent / waiting";
    case "RETURNED_BLOCKER":
      return "Returned blocker";
    case "ALIAS_TO_SWANSON":
      return "Alias";
    default:
      return "Not wired yet";
  }
}

function statusTone(status: string) {
  if (status === "ROUND_TRIP_PROVEN") return "proven";
  if (status === "HELD_BY_TOPOLOGY") return "held";
  if (status === "LOCAL_CONTROL_THREAD") return "local";
  if (status === "ALIAS_TO_SWANSON") return "alias";
  if (status === "RETURNED_BLOCKER") return "blocked";
  if (status.includes("WAITING")) return "waiting";
  return "unwired";
}

function nextMoveForStatus(status: string, entry: AeyeRosterEntry) {
  if (entry.statusHint === "retired") return "Do not route new work until the RAM/topology lift receipt exists.";
  if (entry.statusHint === "alias") return "Use Swanson@Doss for this route.";
  if (status === "ROUND_TRIP_PROVEN") return "Callable from ThinkIt. Send the next packet when the work needs this Aeye.";
  if (status === "LOCAL_CONTROL_THREAD") return "This is the local Swanson control lane, not a remote receiver.";
  if (status === "RETURNED_BLOCKER") return "Open the blocker receipt before sending another packet.";
  if (status.includes("WAITING")) return "Wait for the receiver receipt, or run the chaser if it is stale.";
  return "Bind a receiver thread or LAN inbox before claiming relay coverage.";
}

function buildAeyeRoster(coverage: JsonRecord | null) {
  const coverageRows = asArray(valueAt(coverage, ["targets"]));
  const coverageByTarget = new Map<string, JsonRecord>();
  for (const item of coverageRows) {
    const record = asRecord(item);
    const target = asText(record?.target, "");
    if (record && target) coverageByTarget.set(target, record);
  }

  const seen = new Set<string>();
  const rows: AeyeRosterRow[] = [];
  const addRow = (entry: AeyeRosterEntry) => {
    const coverageRecord = coverageByTarget.get(entry.target) ?? null;
    const coverageStatus = asText(coverageRecord?.coverage, "");
    const status =
      coverageStatus ||
      (entry.statusHint === "retired"
        ? "HELD_BY_TOPOLOGY"
        : entry.statusHint === "local"
          ? "LOCAL_CONTROL_THREAD"
          : entry.statusHint === "alias"
            ? "ALIAS_TO_SWANSON"
            : "NOT_WIRED");
    const { aeye, machine } = splitTarget(entry.target);
    seen.add(entry.target);
    rows.push({
      ...entry,
      aeye,
      machine,
      coverageRecord,
      status,
      statusLabel: statusLabel(status),
      statusTone: statusTone(status),
      latestPacket: asText(coverageRecord?.latest_packet_id, "No packet sent yet"),
      latestReceipt: asText(coverageRecord?.latest_receiver_receipt_id, "No receiver receipt yet"),
      proofGap: entry.note ?? asText(coverageRecord?.proof_gap, "No proof gap has been written back yet."),
      nextMove: nextMoveForStatus(status, entry)
    });
  };

  expectedAeyeRoster.forEach(addRow);

  for (const [target, coverageRecord] of coverageByTarget.entries()) {
    if (seen.has(target)) continue;
    addRow({
      target,
      role: "Relay target discovered from live coverage readback",
      note: asText(coverageRecord.proof_gap, "Discovered from live relay coverage.")
    });
  }

  const machineOrder = ["Betsy", "Doss", "Sally", "Spanzee", "Unassigned"];
  return rows.sort((left, right) => {
    const machineDelta = machineOrder.indexOf(left.machine) - machineOrder.indexOf(right.machine);
    if (machineDelta !== 0) return machineDelta;
    return left.aeye.localeCompare(right.aeye);
  });
}

function summarizePackets(value: unknown) {
  const packets = asArray(value);
  return packets
    .map((packet) => {
      const record = packet && typeof packet === "object" ? (packet as JsonRecord) : {};
      return asText(record.packet_id ?? record.relay_id ?? record.id, "UNKNOWN_PACKET");
    })
    .slice(0, 3)
    .join(", ");
}

async function readJson(endpoint: string): Promise<JsonRecord> {
  const response = await fetch(endpoint, { cache: "no-store" });
  const result = (await response.json()) as JsonRecord;
  if (!response.ok) {
    throw new Error(asText(result.error, `HTTP_${response.status}`));
  }
  return result;
}

async function postJson(endpoint: string, payload: JsonRecord): Promise<{ statusCode: number; result: JsonRecord }> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const result = (await response.json()) as JsonRecord;
  return { statusCode: response.status, result };
}

export default function SwansonRelayControl() {
  const [snapshot, setSnapshot] = useState<RelaySnapshot>(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [actionPending, setActionPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<ActionResult | null>(null);
  const [target, setTarget] = useState("Skybro.Betsy");
  const [proofBody, setProofBody] = useState(
    "Return ACK / BLOCKER / ARTIFACT proving this packet reached the Aeye thread, was understood, and came back to the ThinkIt origin dash."
  );
  const [roundTripOpen, setRoundTripOpen] = useState(true);
  const [selectedChapterId, setSelectedChapterId] = useState("");
  const [bookEditingMode, setBookEditingMode] = useState("developmental_edit");
  const [bookOperatorNote, setBookOperatorNote] = useState(
    "Edit this chapter from source truth. Return access gaps, continuity issues, a recommended edit, and any cousin-editor packets you need ThinkIt to route next."
  );

  async function refresh(reason = "Relay state refreshed") {
    setLoading(true);
    setError(null);
    try {
      const [contract, coverage, originReturn, threadBridge, actionableReturns, bookChapters, bookCourier] = await Promise.all([
        readJson("/api/thinkit/swanson/thinkit/relay_merge_contract"),
        readJson("/api/thinkit/swanson/relay/coverage"),
        readJson("/api/thinkit/swanson/relay/origin_return"),
        readJson("/api/thinkit/swanson/relay/thread_bridge/status?limit=12"),
        readJson("/api/thinkit/swanson/relay/actionable_returns"),
        readJson("/api/thinkit/swanson/book/chapters"),
        readJson("/api/thinkit/swanson/book/courier_status?limit=12")
      ]);
      setSnapshot({ contract, coverage, originReturn, threadBridge, actionableReturns, bookChapters, bookCourier });
      setLastAction((current) =>
        current ?? {
          label: reason,
          endpoint: "GET relay readback bundle",
          timestamp: new Date().toISOString(),
          ok: true,
          statusCode: 200,
          result: { status: reason }
        }
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Relay readback failed");
    } finally {
      setLoading(false);
    }
  }

  async function runAction(label: string, endpoint: string, payload: JsonRecord = {}) {
    setActionPending(label);
    setError(null);
    try {
      const { statusCode, result } = await postJson(endpoint, payload);
      const ok = statusCode >= 200 && statusCode < 300;
      setLastAction({
        label,
        endpoint,
        timestamp: new Date().toISOString(),
        ok,
        statusCode,
        result,
        error: ok ? undefined : asText(result.error, "REQUEST_FAILED")
      });
      await refresh(`${label} returned`);
    } catch (actionError) {
      setLastAction({
        label,
        endpoint,
        timestamp: new Date().toISOString(),
        ok: false,
        statusCode: 0,
        result: null,
        error: actionError instanceof Error ? actionError.message : "Action failed"
      });
      setError(actionError instanceof Error ? actionError.message : "Action failed");
    } finally {
      setActionPending(null);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const coverageSummary = valueAt(snapshot.coverage, ["summary"]) as JsonRecord | null;
  const contractReadiness = valueAt(snapshot.contract, ["readiness"]) as JsonRecord | null;
  const latestReturn = valueAt(snapshot.originReturn, ["origin_return", "latest_return"]) as JsonRecord | null;
  const directLatestReturn = valueAt(snapshot.originReturn, ["latest_return"]) as JsonRecord | null;
  const latest = latestReturn ?? directLatestReturn ?? snapshot.originReturn;
  const actuator = valueAt(snapshot.coverage, ["actuator"]) as JsonRecord | null;
  const queued = asArray(valueAt(snapshot.threadBridge, ["queued"]));
  const blocked = asArray(valueAt(snapshot.threadBridge, ["blocked"]));
  const actionable =
    valueAt(snapshot.actionableReturns, ["actionable_returns", "actionable"]) ??
    valueAt(snapshot.actionableReturns, ["actionable_returns", "items"]) ??
    valueAt(snapshot.actionableReturns, ["items"]);
  const actionables = asArray(actionable);
  const bookChapters = asArray(valueAt(snapshot.bookChapters, ["chapters"]));
  const bookPackets = asArray(valueAt(snapshot.bookCourier, ["latest_book_packets"]));
  const nextUnsentChapter = asRecord(valueAt(snapshot.bookCourier, ["next_unsent_chapter"]));
  const nextUncompletedChapter = asRecord(valueAt(snapshot.bookCourier, ["next_uncompleted_chapter"]));
  const defaultChapterId = asText(nextUnsentChapter?.chapter_id ?? asRecord(bookChapters[0])?.chapter_id, "");
  const rosterRows = useMemo(() => buildAeyeRoster(snapshot.coverage), [snapshot.coverage]);
  const rosterByMachine = useMemo(() => {
    return rosterRows.reduce<Record<string, AeyeRosterRow[]>>((groups, row) => {
      groups[row.machine] = groups[row.machine] ?? [];
      groups[row.machine].push(row);
      return groups;
    }, {});
  }, [rosterRows]);
  const rosterAnswered = rosterRows.filter((row) => row.status === "ROUND_TRIP_PROVEN").length;
  const rosterHeld = rosterRows.filter((row) => row.status === "HELD_BY_TOPOLOGY").length;
  const rosterLocal = rosterRows.filter((row) => row.status === "LOCAL_CONTROL_THREAD" || row.status === "ALIAS_TO_SWANSON").length;
  const rosterUnwired = rosterRows.filter((row) => row.status === "NOT_WIRED").length;

  const contractStatus = asText(snapshot.contract?.status, "NO_CONTRACT");
  const relayReady = contractStatus.includes("THINKIT_RELAY_MERGE_READY");
  const readinessLabel = contractStatus.includes("WITH_BLOCKERS")
    ? "CONDITIONAL GO"
    : relayReady
      ? "MERGE READY"
      : "READBACK BLOCKED";
  const roundTrip = asNumber(coverageSummary?.round_trip_proven ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "round_trip_proven"]));
  const targetCount = asNumber(coverageSummary?.target_count ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "target_count"]));
  const held = asNumber(coverageSummary?.held ?? valueAt(snapshot.contract, ["current_readback", "coverage_summary", "held"]));
  const bridgeStatus = asText(actuator?.status ?? valueAt(snapshot.threadBridge, ["actuator", "status"]), "UNKNOWN");
  const latestPacket = asText(latest?.packet_id ?? latest?.relay_id, "NO_RETURN_YET");
  const latestTarget = asText(latest?.target ?? latest?.destination_label, "UNKNOWN_TARGET");
  const latestStatus = asText(latest?.packet_status ?? latest?.answer_status ?? latest?.origin_readback_status ?? latest?.status, "UNKNOWN_STATUS");
  const latestAnswer = asText(latest?.answer_evidence ?? latest?.answer_text, "No returned answer has been read back yet.");
  const latestReceiver = findReceiver(snapshot.threadBridge, latestTarget);
  const latestReceiverTitle = receiverTitle(snapshot.threadBridge, latestTarget);
  const latestReceiptId = asText(latest?.receiver_receipt_id, "NO_RECEIPT_YET");
  const latestReceiptPath = asText(latest?.receiver_receipt_path, "No receipt file read back yet.");
  const latestSourcePacketPath = asText(latest?.source_packet_path, "No source packet path read back yet.");
  const bookChapterCount = asNumber(valueAt(snapshot.bookCourier, ["chapter_count"]) ?? valueAt(snapshot.bookChapters, ["chapter_count"]));
  const completedChapterCount = asNumber(valueAt(snapshot.bookCourier, ["completed_chapter_count"]));
  const activeBookPacketCount = asNumber(valueAt(snapshot.bookCourier, ["active_packet_count"]));
  const bookPacketCount = asNumber(valueAt(snapshot.bookCourier, ["book_packet_count"]));
  const bookSourceUrl = asText(valueAt(snapshot.bookCourier, ["source_repo_url"]) ?? valueAt(snapshot.bookChapters, ["source_repo_url"]), "No source URL read back yet.");
  const nextUnsentTitle = asText(nextUnsentChapter?.title, "No next unsent chapter read back yet.");
  const nextUncompletedTitle = asText(nextUncompletedChapter?.title, "No next unfinished chapter read back yet.");

  useEffect(() => {
    if (!selectedChapterId && defaultChapterId) setSelectedChapterId(defaultChapterId);
  }, [defaultChapterId, selectedChapterId]);

  const actionSummary = useMemo(() => {
    if (!lastAction?.result) return "No action result yet.";
    return JSON.stringify(lastAction.result, null, 2).slice(0, 2200);
  }, [lastAction]);

  return (
    <section className="thinkit-relay" aria-label="Swanson relay control">
      <header className="thinkit-relay__header">
        <div>
          <p className="td-bridge__eyebrow">Swanson Relay Build / live transport</p>
          <h2>Relay first. Receipts visible. Return proof or it did not happen.</h2>
          <p>
            This is the runtime bridge between ThinkIt and the working Swanson relay core on <code>127.0.0.1:3339</code>.
            Buttons below call the relay endpoints and immediately show the packet/queue/return evidence they get back.
          </p>
        </div>
        <strong data-state={relayReady ? "ready" : "blocked"}>{readinessLabel}</strong>
      </header>

      <div className="thinkit-relay__metrics" aria-label="Relay proof metrics">
        <button
          type="button"
          className="thinkit-relay__metric-card"
          aria-expanded={roundTripOpen}
          aria-controls="thinkit-round-trip-proof-map"
          onClick={() => setRoundTripOpen((current) => !current)}
        >
          <span>Round-trip proof</span>
          <strong>{roundTrip}/{targetCount || "?"}</strong>
          <small>{held} held target(s) / click for full Aeye map</small>
        </button>
        <article>
          <span>Thread bridge</span>
          <strong>{bridgeStatus}</strong>
          <small>{queued.length} queued / {blocked.length} blocked</small>
        </article>
        <article>
          <span>Latest return</span>
          <strong>{latestStatus}</strong>
          <small>{humanTargetName(latestTarget)}</small>
        </article>
        <article>
          <span>Action cards</span>
          <strong>{actionables.length}</strong>
          <small>returned decisions available</small>
        </article>
      </div>

      {roundTripOpen ? (
        <section id="thinkit-round-trip-proof-map" className="thinkit-relay__coverage" aria-label="Round-trip proof by Aeye and machine">
          <header>
            <div>
              <h3>Round-trip proof map</h3>
              <p>
                The <strong>{targetCount || 0}</strong> relay targets are only the currently wired coverage list. This roster maps the wider known helper mesh
                and marks what actually answered, what is local-only, what is retired, and what still needs a receiver surface.
              </p>
            </div>
            <dl className="thinkit-relay__coverage-summary">
              <div>
                <dt>Mapped Aeyes</dt>
                <dd>{rosterRows.length}</dd>
              </div>
              <div>
                <dt>Answered</dt>
                <dd>{rosterAnswered}</dd>
              </div>
              <div>
                <dt>Held / retired</dt>
                <dd>{rosterHeld}</dd>
              </div>
              <div>
                <dt>Not wired</dt>
                <dd>{rosterUnwired}</dd>
              </div>
            </dl>
          </header>

          <div className="thinkit-relay__coverage-machines">
            {Object.entries(rosterByMachine).map(([machine, rows]) => (
              <article key={machine} className="thinkit-relay__machine-proof">
                <header>
                  <h4>{machine}</h4>
                  <span>
                    {rows.filter((row) => row.status === "ROUND_TRIP_PROVEN").length}/{rows.length} answered
                  </span>
                </header>
                <div className="thinkit-relay__roster-list">
                  {rows.map((row) => {
                    const receiver = findReceiver(snapshot.threadBridge, row.target);
                    const receiverName = receiverTitle(snapshot.threadBridge, row.target);
                    const readableSurface =
                      row.status === "NOT_WIRED"
                        ? "No receiver bound yet"
                        : row.status === "ALIAS_TO_SWANSON"
                          ? "Alias to Swanson@Doss"
                          : row.status === "HELD_BY_TOPOLOGY"
                            ? "Held by routing rules"
                            : row.status === "LOCAL_CONTROL_THREAD"
                              ? "Local control thread"
                              : receiverSurface(receiver);
                    return (
                      <article key={row.target} className="thinkit-relay__roster-card" data-status={row.statusTone}>
                        <header>
                          <div>
                            <strong>{humanTargetName(row.target)}</strong>
                            <small>{row.role}</small>
                          </div>
                          <span>{row.statusLabel}</span>
                        </header>
                        <dl>
                          <div>
                            <dt>Receiver surface</dt>
                            <dd>{readableSurface === "Codex receiver thread" ? receiverName : readableSurface}</dd>
                          </div>
                          <div>
                            <dt>Last response</dt>
                            <dd>{row.latestReceipt}</dd>
                          </div>
                          <div>
                            <dt>Last packet</dt>
                            <dd>{row.latestPacket}</dd>
                          </div>
                          <div>
                            <dt>Next move</dt>
                            <dd>{row.nextMove}</dd>
                          </div>
                        </dl>
                        <p>{row.proofGap}</p>
                      </article>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>

          <p className="thinkit-relay__coverage-note">
            Local-only and alias rows are counted separately from missing receivers. They are real topology facts, but not proof that a separate Aeye chat answered.
            Current local/alias count: {rosterLocal}.
          </p>
        </section>
      ) : null}

      <section className="thinkit-relay__book" aria-label="Book chapter courier">
        <header>
          <div>
            <p className="td-bridge__eyebrow">Book courier / Skybro writing lane</p>
            <h3>One chapter at a time, no paste-mule loop.</h3>
            <p>
              ThinkIt reads the repo chapter list, creates a chapter packet with source path, GitHub URL, hash, and edit instructions,
              then the thread bridge carries it to the selected Aeye. A chapter is not done until a receiver receipt comes back here.
            </p>
          </div>
          <strong>{completedChapterCount}/{bookChapterCount || "?"} completed</strong>
        </header>

        <dl className="thinkit-relay__book-summary">
          <div>
            <dt>Source folder</dt>
            <dd>{bookSourceUrl}</dd>
          </div>
          <div>
            <dt>Next unsent</dt>
            <dd>{nextUnsentTitle}</dd>
          </div>
          <div>
            <dt>Next unfinished</dt>
            <dd>{nextUncompletedTitle}</dd>
          </div>
          <div>
            <dt>Active packets</dt>
            <dd>{activeBookPacketCount} active / {bookPacketCount} total</dd>
          </div>
        </dl>

        <div className="thinkit-relay__book-form">
          <label>
            <span>Chapter to send</span>
            <select value={selectedChapterId} onChange={(event) => setSelectedChapterId(event.target.value)}>
              {bookChapters.slice(0, 120).map((item) => {
                const chapter = asRecord(item) ?? {};
                const chapterId = asText(chapter.chapter_id, "");
                const chapterNumber = chapter.chapter_number === null ? "Source" : `Ch ${asText(chapter.chapter_number, "?")}`;
                return (
                  <option key={chapterId} value={chapterId}>
                    {chapterNumber} - {asText(chapter.title, "Untitled chapter")} ({asText(chapter.extension, "file")})
                  </option>
                );
              })}
            </select>
          </label>
          <label>
            <span>Edit mode</span>
            <input value={bookEditingMode} onChange={(event) => setBookEditingMode(event.target.value)} />
          </label>
          <label className="thinkit-relay__book-note">
            <span>Skybro instructions</span>
            <textarea rows={3} value={bookOperatorNote} onChange={(event) => setBookOperatorNote(event.target.value)} />
          </label>
        </div>

        <div className="thinkit-relay__book-buttons">
          <button type="button" disabled={loading || actionPending !== null} onClick={() => void refresh("Book courier refreshed")}>
            Refresh Book State
          </button>
          <button
            type="button"
            disabled={actionPending !== null || !selectedChapterId}
            onClick={() =>
              void runAction("Send Selected Chapter", "/api/thinkit/swanson/book/dispatch_chapter", {
                target,
                chapter_id: selectedChapterId,
                editing_mode: bookEditingMode,
                operator_note: bookOperatorNote
              })
            }
          >
            {actionPending === "Send Selected Chapter" ? "Sending" : "Send Selected Chapter"}
          </button>
          <button
            type="button"
            disabled={actionPending !== null}
            onClick={() =>
              void runAction("Send Next Book Chapter", "/api/thinkit/swanson/book/dispatch_next_chapter", {
                target,
                editing_mode: bookEditingMode,
                strategy: "first_unsent",
                operator_note: bookOperatorNote
              })
            }
          >
            {actionPending === "Send Next Book Chapter" ? "Sending" : "Send Next Unsent"}
          </button>
        </div>

        <div className="thinkit-relay__book-loop">
          <article>
            <strong>Route owner</strong>
            <p>ThinkIt / Swanson relay. It creates packets, sends through the bridge, chases stale work, and reads receipts back into this dash.</p>
          </article>
          <article>
            <strong>Writing owner</strong>
            <p>Skybro@Betsy by default. Skybro reads the source-truth chapter, writes the report/edit, and returns COMPLETED or BLOCKER.</p>
          </article>
          <article>
            <strong>Cousin editors</strong>
            <p>Skybro should return requested editor packets when it needs Thufir, Bean, Petra, Dink, Maker, or another Aeye. ThinkIt routes those next.</p>
          </article>
        </div>

        <div className="thinkit-relay__book-packets">
          <header>
            <h4>Latest chapter reports</h4>
            <span>{bookPackets.length} shown</span>
          </header>
          {bookPackets.slice(0, 5).map((item) => {
            const packet = asRecord(item) ?? {};
            const packetId = asText(packet.packet_id, "UNKNOWN_BOOK_PACKET");
            return (
              <article key={packetId}>
                <header>
                  <div>
                    <strong>{asText(packet.chapter_title ?? packet.title, "Book chapter")}</strong>
                    <small>{humanTargetName(asText(packet.target, "Skybro.Betsy"))}</small>
                  </div>
                  <span>{humanLabel(packet.status, "Unknown")}</span>
                </header>
                <dl>
                  <div>
                    <dt>Returned receipt</dt>
                    <dd>{asText(packet.last_receiver_receipt_id, "No receiver receipt yet")}</dd>
                  </div>
                  <div>
                    <dt>Receiver state</dt>
                    <dd>{asText(packet.last_receiver_status, "No receiver state yet")}</dd>
                  </div>
                  <div>
                    <dt>Packet</dt>
                    <dd>{packetId}</dd>
                  </div>
                  <div>
                    <dt>Updated</dt>
                    <dd>{asText(packet.updated_at, "No update timestamp")}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
          {bookPackets.length === 0 ? <p>No chapter packets have returned yet.</p> : null}
        </div>
      </section>

      <div className="thinkit-relay__controls" aria-label="Relay buttons">
        <button type="button" disabled={loading || actionPending !== null} onClick={() => void refresh("Manual refresh")}>
          {loading ? "Refreshing" : "Refresh Proof"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Dispatch Startup", "/api/thinkit/swanson/relay/dispatch_startup", { targets: ["Skybro.Betsy", "Petra.Betsy"] })}
        >
          {actionPending === "Dispatch Startup" ? "Sending" : "Dispatch Startup"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Brainboot Aeyes", "/api/thinkit/swanson/action/brainboot_dispatch", { targets: ["Skybro.Betsy", "Petra.Betsy"] })}
        >
          {actionPending === "Brainboot Aeyes" ? "Sending" : "Brainboot Aeyes"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() =>
            void runAction("Send Proof Packet", "/api/thinkit/swanson/relay/dispatch", {
              packet_type: "THINKIT_OPERABILITY_PROOF",
              target,
              title: "ThinkIt relay operability proof",
              body: proofBody
            })
          }
        >
          {actionPending === "Send Proof Packet" ? "Sending" : "Send Proof Packet"}
        </button>
        <button
          type="button"
          disabled={actionPending !== null}
          onClick={() => void runAction("Run Chaser Once", "/api/thinkit/swanson/relay/run_chaser", {})}
        >
          {actionPending === "Run Chaser Once" ? "Chasing" : "Run Chaser Once"}
        </button>
      </div>

      <div className="thinkit-relay__operator">
        <label>
          <span>Target for proof/book packet</span>
          <input value={target} onChange={(event) => setTarget(event.target.value)} />
        </label>
        <label>
          <span>Proof packet body</span>
          <textarea rows={3} value={proofBody} onChange={(event) => setProofBody(event.target.value)} />
        </label>
      </div>

      <section className="thinkit-relay__return" aria-label="Latest origin return">
        <header>
          <h3>Latest returned answer on the origin dash</h3>
          <code>{latestPacket}</code>
        </header>
        <div className="thinkit-relay__provenance" aria-label="Where the latest answer came from">
          <article>
            <span>Answered by</span>
            <strong>{latestReceiverTitle}</strong>
            <small>{receiverSurface(latestReceiver)}</small>
          </article>
          <article>
            <span>Where to continue</span>
            <strong>{humanTargetName(latestTarget)}</strong>
            <small>{receiverInstruction(latestReceiver, latestTarget)}</small>
          </article>
          <article>
            <span>Proof ThinkIt read</span>
            <strong>{latestReceiptId}</strong>
            <small>{latestReceiptPath}</small>
          </article>
          <article>
            <span>Original packet</span>
            <strong>{latestPacket}</strong>
            <small>{latestSourcePacketPath}</small>
          </article>
        </div>
        <p>{latestAnswer}</p>
      </section>

      <section className="thinkit-relay__actions" aria-label="Returned work waiting on operator decision">
        <header>
          <h3>Returned work waiting on you</h3>
          <span>{actionables.length} usable return(s)</span>
        </header>
        <div className="thinkit-relay__action-list">
          {actionables.slice(0, 4).map((item, index) => {
            const record = asRecord(item) ?? {};
            const itemTarget = asText(record.target, "UNKNOWN_TARGET");
            const itemPacket = asText(record.packet_id, `RETURN_${index + 1}`);
            const itemReceiver = findReceiver(snapshot.threadBridge, itemTarget);
            return (
              <article key={itemPacket}>
                <header>
                  <div>
                    <strong>{returnedWorkHeadline(record, itemTarget)}</strong>
                    <small>{receiverTitle(snapshot.threadBridge, itemTarget)} / {receiverSurface(itemReceiver)}</small>
                  </div>
                  <span>{humanLabel(record.recommendation, "Review")}</span>
                </header>
                <dl>
                  <div>
                    <dt>What advanced</dt>
                    <dd>{humanizeTargetText(record.advanced, itemTarget, "The receiver returned a terminal proof receipt.")}</dd>
                  </div>
                  <div>
                    <dt>What this helps decide</dt>
                    <dd>{humanizeTargetText(record.helps_decide, itemTarget, "Review whether this return needs a next packet, assimilation, or no action.")}</dd>
                  </div>
                  <div>
                    <dt>Your useful choices</dt>
                    <dd>{asArray(record.operator_choices).map((choice) => humanLabel(choice)).join(" / ") || "Review / Hold"}</dd>
                  </div>
                  <div>
                    <dt>Receipt</dt>
                    <dd>{asText(record.receiver_receipt_id, "NO_RECEIPT_ID")}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
          {actionables.length === 0 ? <p>No returned work is waiting on an operator decision right now.</p> : null}
        </div>
      </section>

      <section className="thinkit-relay__result" aria-label="Last relay action result">
        <header>
          <h3>{lastAction ? lastAction.label : "No button run yet"}</h3>
          <code>{lastAction ? `${lastAction.statusCode} / ${lastAction.endpoint}` : "Click a button to create readback"}</code>
        </header>
        {error ? <p className="thinkit-relay__error">BLOCKER: {error}</p> : null}
        {lastAction ? (
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{lastAction.ok ? "REQUEST_RETURNED" : "REQUEST_BLOCKED"}</dd>
            </div>
            <div>
              <dt>Timestamp</dt>
              <dd>{lastAction.timestamp}</dd>
            </div>
            <div>
              <dt>Packets</dt>
              <dd>{summarizePackets(lastAction.result?.relay_packets ?? lastAction.result?.brainboot_packets ?? lastAction.result?.packets)}</dd>
            </div>
            <div>
              <dt>Proof boundary</dt>
              <dd>Created/queued/sent is not success until receiver and origin-return receipts come back.</dd>
            </div>
          </dl>
        ) : null}
        <pre>{actionSummary}</pre>
      </section>
    </section>
  );
}
