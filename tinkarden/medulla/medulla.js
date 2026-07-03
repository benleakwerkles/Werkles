#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(TINKARDEN_ROOT, "..");
const SHARED_FRONTIER_PATH = path.join(TINKARDEN_ROOT, "nervous_system", "shared_frontier.json");
const MEMBRANE_DIR = path.join(TINKARDEN_ROOT, "membrane");
const RECOMMENDATION_CARDS_PATH = path.join(MEMBRANE_DIR, "recommendation_cards.json");
const VALID_RISK_CLASSES = new Set(["GNAT", "MOSQUITO", "WOUND", "FRACTURE"]);

function slash(value) {
  return value.split(path.sep).join("/");
}

function rel(value) {
  return slash(path.relative(REPO_ROOT, value));
}

function ensureDirs() {
  fs.mkdirSync(path.dirname(SHARED_FRONTIER_PATH), { recursive: true });
  fs.mkdirSync(MEMBRANE_DIR, { recursive: true });
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function git(args, fallback = "") {
  try {
    return execFileSync("git", args, {
      cwd: REPO_ROOT,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();
  } catch {
    return fallback;
  }
}

function readRepoState() {
  const currentBranch = git(["branch", "--show-current"], "UNKNOWN_BRANCH");
  const branches = git(["branch", "--format=%(refname:short)"], "")
    .split(/\r?\n/)
    .map((branch) => branch.trim())
    .filter(Boolean);
  const statusLines = git(["status", "--porcelain=v1"], "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    current_branch: currentBranch || "UNKNOWN_BRANCH",
    branches,
    branch_count: branches.length,
    dirty_count: statusLines.length,
    has_dirty_worktree: statusLines.length > 0,
    untracked_count: statusLines.filter((line) => line.startsWith("??")).length,
    modified_count: statusLines.filter((line) => !line.startsWith("??")).length
  };
}

function normalizeFrontier(frontier) {
  return {
    last_node_active: typeof frontier.last_node_active === "string" ? frontier.last_node_active : "UNKNOWN_NODE",
    current_focus: typeof frontier.current_focus === "string" ? frontier.current_focus : "",
    locked_lanes: Array.isArray(frontier.locked_lanes) ? frontier.locked_lanes.filter((lane) => typeof lane === "string") : [],
    packets_in_flight: Array.isArray(frontier.packets_in_flight) ? frontier.packets_in_flight.filter((packet) => typeof packet === "string") : [],
    timestamp: typeof frontier.timestamp === "string" ? frontier.timestamp : "",
    handoff_note_to_sally: typeof frontier.handoff_note_to_sally === "string" ? frontier.handoff_note_to_sally : ""
  };
}

function compactList(values, fallback) {
  return values.length ? values.join(", ") : fallback;
}

function generateTop3Moves(frontier, repoState) {
  const focus = frontier.current_focus || "No current_focus found in shared frontier";
  const lanes = compactList(frontier.locked_lanes, "no locked lanes declared");
  const packets = compactList(frontier.packets_in_flight, "no packets listed");
  const branch = repoState.current_branch;
  const dirtySummary = `${repoState.dirty_count} dirty entries (${repoState.modified_count} modified, ${repoState.untracked_count} untracked)`;

  const cards = [
    {
      id: "top3_001_feral_membrane_bridge",
      title: "Wire Medulla Top 3 output into the Feral Membrane card lane.",
      why: `Doctrine: TinkerDen is a command center, not a task manager. Shared frontier focus is "${focus}", with locked lanes ${lanes}.`,
      target_aeye: "Dink@Betsy",
      risk_class: "MOSQUITO"
    },
    {
      id: "top3_002_preserve_dirty_branch_reality",
      title: "Preserve the current branch reality before expanding the membrane surface.",
      why: `Friction: repo state on ${branch} has ${dirtySummary}; branch reality doctrine requires preserving useful mutations before merge, cleanup, or wider construction.`,
      target_aeye: "Dink@Betsy",
      risk_class: repoState.dirty_count > 50 ? "WOUND" : "MOSQUITO"
    },
    {
      id: "top3_003_convert_birds_to_receipts",
      title: "Convert active Birds into receipt, blocker, or next-packet outcomes.",
      why: `Doctrine: Birds carry momentum and Ben is not the bus. Shared frontier packets in flight: ${packets}. Handoff note to Sally: ${frontier.handoff_note_to_sally || "no Sally handoff note present"}.`,
      target_aeye: frontier.handoff_note_to_sally ? "Skybro@Sally" : "Maker@Betsy",
      risk_class: "GNAT"
    }
  ];

  return cards;
}

function validateCards(cards) {
  if (!Array.isArray(cards) || cards.length !== 3) {
    throw new Error("recommendation_cards.json must be a top-level array containing exactly 3 objects");
  }

  for (const card of cards) {
    for (const field of ["id", "title", "why", "target_aeye", "risk_class"]) {
      if (typeof card[field] !== "string" || !card[field].trim()) {
        throw new Error(`Top 3 card is missing required string field: ${field}`);
      }
    }

    if (!VALID_RISK_CLASSES.has(card.risk_class)) {
      throw new Error(`Invalid risk_class: ${card.risk_class}`);
    }

    if (!/(Doctrine|Friction):/.test(card.why)) {
      throw new Error(`Card ${card.id} has no doctrine or friction why`);
    }
  }
}

function writeRecommendationCards(reason) {
  ensureDirs();
  const frontier = normalizeFrontier(readJson(SHARED_FRONTIER_PATH, {}));
  const repoState = readRepoState();
  const cards = generateTop3Moves(frontier, repoState);
  validateCards(cards);
  fs.writeFileSync(RECOMMENDATION_CARDS_PATH, `${JSON.stringify(cards, null, 2)}\n`, "utf8");

  return {
    status: "ARTIFACT",
    reason,
    script_path: rel(__filename),
    shared_frontier_path: rel(SHARED_FRONTIER_PATH),
    recommendation_cards_path: rel(RECOMMENDATION_CARDS_PATH),
    cards_count: cards.length,
    current_branch: repoState.current_branch,
    dirty_count: repoState.dirty_count,
    generated_cards: cards
  };
}

function debounce(fn, delayMs) {
  let timer = null;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, delayMs);
  };
}

async function watchFrontier() {
  ensureDirs();
  const result = writeRecommendationCards("startup");
  console.log(JSON.stringify(result, null, 2));

  const regenerate = debounce(() => {
    try {
      const update = writeRecommendationCards("shared_frontier_updated");
      console.log(JSON.stringify(update, null, 2));
    } catch (error) {
      console.error(error instanceof Error ? error.message : String(error));
    }
  }, 150);

  try {
    const { watch } = await import("chokidar");
    const watcher = watch(SHARED_FRONTIER_PATH, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 }
    });
    watcher.on("add", regenerate);
    watcher.on("change", regenerate);
    console.log(`[medulla_top3] watching ${rel(SHARED_FRONTIER_PATH)} with chokidar`);
  } catch {
    fs.watch(SHARED_FRONTIER_PATH, regenerate);
    console.log(`[medulla_top3] watching ${rel(SHARED_FRONTIER_PATH)} with fs.watch fallback`);
  }
}

async function main() {
  const command = process.argv[2] || "watch";

  if (command === "once") {
    console.log(JSON.stringify(writeRecommendationCards("manual_once"), null, 2));
    return;
  }

  if (command === "watch") {
    await watchFrontier();
    return;
  }

  throw new Error("Usage: node tinkarden/medulla/medulla.js [once|watch]");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
