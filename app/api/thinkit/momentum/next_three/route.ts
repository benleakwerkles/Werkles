import crypto from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type JsonRecord = Record<string, unknown>;

const DATA_DIR = path.join(process.cwd(), "data", "thinkit");
const STATE_PATH = path.join(DATA_DIR, "next_three_projects.json");
const DECISIONS_PATH = path.join(DATA_DIR, "next_three_decisions.jsonl");
const MOMENTUM_STATE_PATH = path.join(DATA_DIR, "momentum_state.json");
const SPEAKER_ROOT = process.env.SPEAKER_ROOT || "C:\\speaker";

const speakerSurfacePaths = [
  ["speaker_root", SPEAKER_ROOT],
  ["speaker_db", path.join(SPEAKER_ROOT, "speaker.sqlite")],
  ["current_repo_state", path.join(SPEAKER_ROOT, "bootloader", "templates", "CURRENT_REPO_STATE.md")],
  ["skybro_bootpack", path.join(SPEAKER_ROOT, "bootpacks", "out", "Skybro.Betsy.BOOTPACK.md")],
  ["petra_bootpack", path.join(SPEAKER_ROOT, "bootpacks", "out", "Petra.Betsy.NERDKLE_BRAINBOOT.BOOTPACK.md")],
  ["brainboot_outbox", path.join(SPEAKER_ROOT, "brainboot", "outbox")],
  ["brainboot_receipts", path.join(SPEAKER_ROOT, "brainboot", "receipts")],
  ["aeye_relay_root", path.join(SPEAKER_ROOT, "aeye_relay")],
  ["speaker_ingest_log", path.join(SPEAKER_ROOT, "logs", "ingest.jsonl")]
] as const;

const replacementBacklog: Record<string, JsonRecord[]> = {
  werkles: [
    {
      move_id: "werkles_004_relay_health_card",
      title: "Put relay health in one honest top card.",
      target: "Swanson.Doss",
      packet_type: "WERKLES_RELAY_HEALTH_CARD",
      why: "Ben should not have to interpret scattered queue, sent, received, completed, and missing-proof numbers to know whether ThinkIt is alive.",
      command:
        "Make one top-card readout that says: queued, sent, received, completed, waiting targets, and the next exact blocker. It must not call local packet creation success.",
      doozer_question: "What is the smallest UI/API readback that proves whether the relay is moving?",
      review_question: "Does this card expose the real failure point, or does it still hide behind optimistic status words?",
      proof_required: "One card screenshot/readback plus exact endpoint fields used for queued, sent, received, completed, and waiting.",
      risk: "LOW",
      human_gate: "Ben gates only claims of success/canonical status."
    },
    {
      move_id: "werkles_005_sally_lan_truth",
      title: "Make Sally preview access a first-class truth row.",
      target: "Dink.Betsy",
      packet_type: "WERKLES_SALLY_LAN_TRUTH",
      why: "The Doss preview can work while Sally cannot open it. That cannot stay invisible in the command center.",
      command: "Add a LAN access row that names Doss URL, Sally-openable URL, last verification, and failure reason if Sally cannot open ThinkIt.",
      doozer_question: "What is the smallest check that keeps Doss-only previews from masquerading as shared workstation surfaces?",
      review_question: "Is this a real second-machine check or just a local URL rewrite?",
      proof_required: "Doss URL, LAN URL, second-machine pass/fail field, timestamp, and blocker if failed.",
      risk: "MEDIUM",
      human_gate: "Ben gates network/share changes."
    },
    {
      move_id: "werkles_006_click_receipt",
      title: "Make every action button write an action receipt.",
      target: "Maker.Betsy",
      packet_type: "WERKLES_CLICK_RECEIPT",
      why: "If a button fails silently, Ben cannot tell whether the system ignored him or work moved somewhere invisible.",
      command: "For each active ThinkIt button, write a tiny durable click receipt with button name, endpoint, target, packet id if any, and next proof needed.",
      doozer_question: "Which receipt fields make a button impossible to fake?",
      review_question: "Does the click receipt distinguish local action from receiver-side proof?",
      proof_required: "One generated click receipt for a successful route and one for a blocked route.",
      risk: "LOW",
      human_gate: "No human gate unless button action mutates durable project state."
    }
  ],
  kind_sir: [
    {
      move_id: "kind_sir_004_one_page_offer",
      title: "Turn Kind Sir into one plain one-page offer.",
      target: "Skybro.Betsy",
      packet_type: "KIND_SIR_ONE_PAGE_OFFER",
      why: "Kind Sir needs a usable offer before it needs more abstract company architecture.",
      command: "Draft one page: who Kind Sir helps, the pain it removes, the first service boundary, the proof of value, and what not to promise yet.",
      doozer_question: "What can be packaged today so Kind Sir becomes testable?",
      review_question: "Is this concrete enough for a real yes/no from a human buyer?",
      proof_required: "One-page offer path or returned text, one audience, one proof-of-use test, and one no-go claim.",
      risk: "LOW",
      human_gate: "Ben approves any public-facing wording."
    },
    {
      move_id: "kind_sir_005_first_client_packet",
      title: "Build the first Kind Sir client-intake packet.",
      target: "Maker.Betsy",
      packet_type: "KIND_SIR_CLIENT_PACKET",
      why: "If Ben has to explain the service from scratch every time, Kind Sir becomes another mule lane.",
      command: "Create a first client-intake packet template: context needed, proof needed, human gates, deliverable, and stop condition.",
      doozer_question: "What fields let the machine start useful work without pretending it knows the client?",
      review_question: "Where does this packet over-automate judgment or invite vague work?",
      proof_required: "Template path, required fields, example filled packet, and stop condition.",
      risk: "MEDIUM",
      human_gate: "Ben gates client-facing sends and pricing."
    },
    {
      move_id: "kind_sir_006_proof_of_value",
      title: "Define one proof-of-value test for Kind Sir.",
      target: "Petra.Betsy",
      packet_type: "KIND_SIR_VALUE_TEST",
      why: "A good offer needs a measurable before/after, not only a better story.",
      command: "Return one test that proves Kind Sir reduced repeated human labor: input, output, time saved, receipt, and failure condition.",
      doozer_question: "What artifact would make the value visible in under one hour?",
      review_question: "Would this test show actual reduced mule labor or just more documentation?",
      proof_required: "Test definition, required artifact, pass/fail rule, and Ben dependency.",
      risk: "LOW",
      human_gate: "Ben chooses whether to run the test."
    }
  ],
  nerdkle: [
    {
      move_id: "nerdkle_004_harvey_name_lock",
      title: "Lock naming: Elwood is Operator, Harvey is the organism.",
      target: "Petra.Betsy",
      packet_type: "NERDKLE_HARVEY_ELWOOD_NAME_LOCK",
      why: "If the command seat and the organism blur together, every packet starts lying about who is deciding versus who is executing.",
      command: "Return the naming lock: Elwood = human Operator seat, Harvey = Nerdkle organism, ThinkIt = command dash, Speaker = memory, Relay = transport.",
      doozer_question: "What files and dashboard labels need the naming boundary?",
      review_question: "Where would this naming still confuse a restarted Aeye?",
      proof_required: "Naming boundary text, affected surfaces, and one Brainboot line updated.",
      risk: "LOW",
      human_gate: "Ben gates canonical naming."
    },
    {
      move_id: "nerdkle_005_incoming_response_workbench",
      title: "Make incoming Aeye returns something Ben can answer.",
      target: "Dink.Betsy",
      packet_type: "NERDKLE_INCOMING_RESPONSE_WORKBENCH",
      why: "Sending works only halfway if the returned report lands as a passive card instead of a decision surface.",
      command: "Build the next incoming-work panel: reply, assimilate as lesson, create successor packet, hold, or kill with reason.",
      doozer_question: "What is the smallest interaction that turns an Aeye answer into the next move?",
      review_question: "Does this preserve receipt boundaries, or does it pretend assimilation happened?",
      proof_required: "One returned Aeye report, one operator response action, and one successor receipt path.",
      risk: "MEDIUM",
      human_gate: "Ben gates assimilation and permanent behavior rules."
    },
    {
      move_id: "nerdkle_006_source_truth_brainboot",
      title: "Make Brainboot read source truth plus current state.",
      target: "Skybro.Betsy",
      packet_type: "NERDKLE_SOURCE_TRUTH_BRAINBOOT",
      why: "The book folder exists on GitHub now, but Aeyes still need a consistent startup pointer plus current build state.",
      command: "Return the exact Brainboot source list: GitHub book folder, Speaker current state, ThinkIt status mirror, relay proof, and next three current projects.",
      doozer_question: "What files should a session read first before it speaks?",
      review_question: "What is stale, local-only, or not suitable as source truth?",
      proof_required: "Source list with URLs/paths, current hash if available, and missing proof flags.",
      risk: "HIGH",
      human_gate: "Ben gates canonical source-truth promotion."
    }
  ],
  oddly_godly: [
    {
      move_id: "oddly_godly_004_spanzee_inbound_proof",
      title: "Show actual Spanzee receiver proof before more Oddly Godly work.",
      target: "Bean.Spanzee",
      packet_type: "ODDLY_GODLY_SPANZEE_INBOUND_PROOF",
      why: "The last Oddly Godly send did not visibly land. The next move is not more ideas; it is proving where Spanzee did or did not receive work.",
      command: "Return the exact Spanzee receipt state for Oddly Godly: sent packet id, receiver thread/inbox, received receipt, completed/blocker receipt, and missing proof.",
      doozer_question: "What route actually exists for Oddly Godly on Spanzee?",
      review_question: "What would make this a false-motion candidate?",
      proof_required: "Packet id, receiver surface, receipt path/id, and missing-proof list.",
      risk: "MEDIUM",
      human_gate: "Ben gates any new Spanzee remote setup."
    },
    {
      move_id: "oddly_godly_005_auto_g_dry_run",
      title: "Run Oddly Godly AUTO G as a dry-run plan only.",
      target: "Computer.Spanzee",
      packet_type: "ODDLY_GODLY_AUTO_G_DRY_RUN",
      why: "AUTO G should not touch real remote work until route, command surface, proof return, and stop rules are known.",
      command: "Produce a dry-run AUTO G plan: one proposed command, no execution, expected artifact, stop condition, and what proof would permit a live run.",
      doozer_question: "What could run automatically without mutating remote state?",
      review_question: "What is the exact no-go condition that stops AUTO G?",
      proof_required: "Dry-run plan, no-execution statement, stop rule, and live-run gate.",
      risk: "MEDIUM",
      human_gate: "Any live AUTO G activation remains Operator-approved."
    },
    {
      move_id: "oddly_godly_006_first_live_packet",
      title: "Prepare one bounded Oddly Godly live packet for review.",
      target: "Ender.Spanzee",
      packet_type: "ODDLY_GODLY_FIRST_LIVE_PACKET",
      why: "Once proof exists, the lane needs one bounded packet with a tiny blast radius instead of a sprawling initiative.",
      command: "Draft one live packet with context, owner, next action, evidence required, destination, and failure condition. Do not execute it.",
      doozer_question: "What is the smallest useful Oddly Godly action?",
      review_question: "Is the packet bounded enough to run, or should it stay held?",
      proof_required: "Packet draft, route proof reference, and explicit GO/NO-GO for sending.",
      risk: "HIGH",
      human_gate: "Ben approves live send."
    }
  ]
};

function nowIso() {
  return new Date().toISOString();
}

function asRecord(value: unknown): JsonRecord | null {
  return value && typeof value === "object" ? (value as JsonRecord) : null;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function sha256File(filePath: string) {
  const buffer = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function boundedFileCount(rootPath: string, maxFiles = 800): Promise<{ file_count: number; truncated: boolean }> {
  let fileCount = 0;
  let truncated = false;

  async function walk(currentPath: string) {
    if (truncated) return;
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    for (const entry of entries) {
      if (truncated) return;
      const nextPath = path.join(currentPath, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath);
      } else if (entry.isFile()) {
        fileCount += 1;
        if (fileCount >= maxFiles) truncated = true;
      }
    }
  }

  await walk(rootPath);
  return { file_count: fileCount, truncated };
}

async function inspectSurface(label: string, targetPath: string) {
  try {
    const stats = await fs.stat(targetPath);
    const base = {
      label,
      path: targetPath,
      exists: true,
      kind: stats.isDirectory() ? "directory" : "file",
      modified_at: stats.mtime.toISOString(),
      byte_count: stats.isFile() ? stats.size : null
    };

    if (stats.isFile()) {
      return {
        ...base,
        sha256: await sha256File(targetPath)
      };
    }

    const count = await boundedFileCount(targetPath);
    return {
      ...base,
      ...count
    };
  } catch (error) {
    return {
      label,
      path: targetPath,
      exists: false,
      kind: "missing",
      error: error instanceof Error ? error.message : "Path read failed"
    };
  }
}

async function readJsonFile(filePath: string) {
  const text = await fs.readFile(filePath, "utf8");
  return JSON.parse(text) as JsonRecord;
}

async function writeJsonFile(filePath: string, value: JsonRecord) {
  await ensureDataDir();
  await fs.writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readState() {
  await ensureDataDir();
  return readJsonFile(STATE_PATH);
}

async function readRecentDecisions(limit = 20) {
  try {
    const text = await fs.readFile(DECISIONS_PATH, "utf8");
    return text
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(-limit)
      .map((line) => JSON.parse(line) as JsonRecord)
      .reverse();
  } catch {
    return [];
  }
}

async function readSpeakerState() {
  const surfaces = await Promise.all(speakerSurfacePaths.map(([label, targetPath]) => inspectSurface(label, targetPath)));
  const missing = surfaces.filter((surface) => !surface.exists).map((surface) => surface.label);
  return {
    status: missing.length === 0 ? "SPEAKER_READBACK_READY" : "SPEAKER_READBACK_PARTIAL",
    root: SPEAKER_ROOT,
    memory_answer:
      "Speaker is the file-backed memory/current-state substrate at C:\\speaker. Brainboot packets and receipts live under C:\\speaker\\brainboot, bootpacks under C:\\speaker\\bootpacks\\out, relay proof under C:\\speaker\\aeye_relay, and repo-state bootloader text under C:\\speaker\\bootloader\\templates.",
    brainboot_rule:
      "Aeyes restart from rendered bootpack text plus receiver-side Brainboot receipts. Dispatch is not proof; RECEIVED and COMPLETED/BLOCKER receipts are proof.",
    missing,
    surfaces,
    receiver_surfaces: [
      {
        target: "Skybro.Betsy",
        receive_url: "http://10.1.10.8:3339/aeye/Skybro.Betsy",
        brainboot_status_url: "http://10.1.10.8:3339/v1/brainboot/status"
      },
      {
        target: "Petra.Betsy",
        receive_url: "http://10.1.10.8:3339/aeye/Petra.Betsy",
        brainboot_status_url: "http://10.1.10.8:3339/v1/brainboot/status"
      }
    ]
  };
}

function findLane(state: JsonRecord, laneId: string) {
  return asArray(state.lanes).map(asRecord).find((lane) => asText(lane?.lane_id) === laneId) ?? null;
}

function findMove(lane: JsonRecord | null, moveId: string) {
  return asArray(lane?.moves).map(asRecord).find((move) => asText(move?.move_id) === moveId) ?? null;
}

function normalizeChoice(choice: string) {
  return choice.trim().toUpperCase();
}

function moveIdsForLane(lane: JsonRecord | null) {
  return new Set(asArray(lane?.moves).map(asRecord).map((move) => asText(move?.move_id, "")).filter(Boolean));
}

function chooseReplacementMove(state: JsonRecord, laneId: string, killedMoveId: string) {
  const lane = findLane(state, laneId);
  const existingIds = moveIdsForLane(lane);
  const candidates = replacementBacklog[laneId] ?? replacementBacklog.nerdkle;
  const candidate = candidates.find((move) => {
    const candidateId = asText(move.move_id, "");
    return candidateId && candidateId !== killedMoveId && !existingIds.has(candidateId);
  });

  if (candidate) {
    return {
      ...candidate,
      generated_at: nowIso(),
      replacement_for: killedMoveId,
      replacement_reason: "Operator killed the prior idea. ThinkIt replaced it with a project-tied candidate from the deterministic backlog."
    };
  }

  const laneProject = asText(lane?.project, laneId);
  const suffix = crypto.randomBytes(3).toString("hex");
  return {
    move_id: `${laneId}_replacement_${Date.now()}_${suffix}`,
    title: `Ask reviewers for the next grounded ${laneProject} move.`,
    target: "Petra.Betsy",
    packet_type: `${laneId.toUpperCase()}_NEXT_GROUNDED_MOVE`,
    why: "The deterministic backlog for this lane was exhausted. The next honest step is to ask reviewers for a replacement tied to current proof gaps.",
    command:
      "Return one replacement move tied to an existing path, receiver, proof gap, current chapter, or active project lane. If no grounded move exists, return BLOCKER.",
    doozer_question: "What existing artifact or proof gap should the next move advance?",
    review_question: "Is this replacement grounded in current project reality, or should the lane pause?",
    proof_required: "One grounded replacement idea with source path/proof gap, or BLOCKER.",
    risk: "MEDIUM",
    human_gate: "Ben gates promotion from proposed idea to execution.",
    generated_at: nowIso(),
    replacement_for: killedMoveId,
    replacement_reason: "Operator killed the prior idea and this lane had no unused deterministic replacement left."
  };
}

function replaceMoveInState(state: JsonRecord, laneId: string, killedMoveId: string, replacementMove: JsonRecord) {
  const updatedLanes = asArray(state.lanes).map((laneValue) => {
    const lane = asRecord(laneValue);
    if (!lane || asText(lane.lane_id, "") !== laneId) return laneValue;
    return {
      ...lane,
      moves: asArray(lane.moves).map((moveValue) => {
        const move = asRecord(moveValue);
        return asText(move?.move_id, "") === killedMoveId ? replacementMove : moveValue;
      })
    };
  });

  return {
    ...state,
    updated_at: nowIso(),
    principle:
      "Next Three must be generated from current repo, relay, book, Speaker, or project-lane state. If an idea cannot name an existing path, receiver, proof gap, current chapter, or active lane, it is not valid.",
    lanes: updatedLanes
  };
}

async function appendDecision(decision: JsonRecord) {
  await ensureDataDir();
  await fs.appendFile(DECISIONS_PATH, `${JSON.stringify(decision)}\n`, "utf8");
}

async function buildResponse(status = "NEXT_THREE_READY") {
  const state = await readState();
  const [speaker, recentDecisions] = await Promise.all([readSpeakerState(), readRecentDecisions()]);
  return {
    ok: true,
    status,
    generated_at: nowIso(),
    state_path: STATE_PATH,
    decisions_path: DECISIONS_PATH,
    momentum_state_path: MOMENTUM_STATE_PATH,
    workflow: state.workflow,
    lanes: state.lanes,
    principle: state.principle,
    recent_decisions: recentDecisions,
    speaker
  };
}

export async function GET() {
  try {
    return NextResponse.json(await buildResponse());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "NEXT_THREE_READBACK_BLOCKED",
        state_path: STATE_PATH,
        error: error instanceof Error ? error.message : "Next Three readback failed"
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as JsonRecord;
    const action = asText(body.action, "REFRESH_NEXT_THREE");
    const state = await readState();

    if (action === "REFRESH_NEXT_THREE") {
      const snapshot = {
        schema: "thinkit_momentum_state_v1",
        updated_at: nowIso(),
        note: asText(body.note, "Operator refreshed Next Three Projects."),
        source_state_path: STATE_PATH,
        decisions_path: DECISIONS_PATH,
        speaker_root: SPEAKER_ROOT,
        workflow: state.workflow,
        lane_count: asArray(state.lanes).length
      };
      await writeJsonFile(MOMENTUM_STATE_PATH, snapshot);
      return NextResponse.json({
        ...(await buildResponse("NEXT_THREE_REFRESHED")),
        snapshot
      });
    }

    if (action === "DECISION") {
      const laneId = asText(body.lane_id);
      const moveId = asText(body.move_id);
      const choice = normalizeChoice(asText(body.choice, "REVIEW"));
      const lane = findLane(state, laneId);
      const move = findMove(lane, moveId);

      if (!lane || !move) {
        return NextResponse.json(
          {
            ok: false,
            status: "NEXT_THREE_DECISION_BLOCKED",
            error: "UNKNOWN_LANE_OR_MOVE",
            lane_id: laneId,
            move_id: moveId
          },
          { status: 404 }
        );
      }

      const replacementMove = choice === "KILL" ? chooseReplacementMove(state, laneId, moveId) : null;
      const decisionId = `NEXT_THREE_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;
      const decision = {
        decision_id: decisionId,
        created_at: nowIso(),
        lane_id: laneId,
        project: asText(lane.project, laneId),
        move_id: moveId,
        move_title: asText(move.title, moveId),
        choice,
        operator_note: asText(body.note, ""),
        target: asText(move.target, "Petra.Betsy"),
        packet_type: asText(move.packet_type, "MOMENTUM_NEXT_MOVE"),
        proof_required: asText(move.proof_required, "Receiver-side receipt or blocker required."),
        source_state_path: STATE_PATH,
        replacement_move_id: replacementMove ? asText(replacementMove.move_id, "") : null,
        replacement_reason: replacementMove ? asText(replacementMove.replacement_reason, "") : null
      };

      if (replacementMove) {
        await writeJsonFile(STATE_PATH, replaceMoveInState(state, laneId, moveId, replacementMove));
      }

      await appendDecision(decision);

      return NextResponse.json({
        ...(await buildResponse(replacementMove ? "NEXT_THREE_DECISION_RECORDED_REPLACED" : "NEXT_THREE_DECISION_RECORDED")),
        decision,
        replacement_move: replacementMove
      });
    }

    return NextResponse.json(
      {
        ok: false,
        status: "NEXT_THREE_ACTION_BLOCKED",
        error: "UNKNOWN_ACTION",
        action
      },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "NEXT_THREE_WRITE_BLOCKED",
        error: error instanceof Error ? error.message : "Next Three write failed"
      },
      { status: 500 }
    );
  }
}
