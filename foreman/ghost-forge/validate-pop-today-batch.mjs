import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const batchPath = path.join(scriptDir, "GHOST_FORGE_POP_TODAY_BATCH_20260629.json");
const statusPath = path.join(repoRoot, "foreman", "artifacts", "ghost_forge_pop_today_batch_status.json");

const requiredAssetIds = [
  "T1_001_WET_ASPHALT_SODIUM_LIT",
  "T1_006_GOOP_RESIDUE_OVERLAY",
  "T2_007_WET_PUDDLE_DECALS",
  "T2_008_GOOP_SPLATTER_DECALS",
  "T5_025_GOOP_FIREWORK_BURST"
];

const forbiddenExecutablePromptTerms = [
  "shadowrun",
  "black desert",
  "gta",
  "dragon ball",
  "marta",
  "coca-cola",
  "nike",
  "adidas",
  "mcdonald",
  "starbucks"
];

function fail(errors, warnings = []) {
  return {
    status: "FAIL_GHOST_FORGE_POP_TODAY_BATCH",
    generated_at: new Date().toISOString(),
    batch_path: path.relative(repoRoot, batchPath).replaceAll("\\", "/"),
    external_run_executed: false,
    errors,
    warnings
  };
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

const errors = [];
const warnings = [];
const raw = await readFile(batchPath, "utf8");
const batch = JSON.parse(raw);

assert(batch.packet_id === "GHOST_FORGE_POP_TODAY_20260629", "packet_id mismatch", errors);
assert(batch.status === "READY_BLOCKED_BY_HUMAN_GATE", "status must remain READY_BLOCKED_BY_HUMAN_GATE until a real run happens", errors);
assert(batch.external_execution?.enabled === false, "external_execution.enabled must be false", errors);
assert(batch.external_execution?.reason, "external_execution.reason is required", errors);
assert(batch.house_style?.executable_prompt_prefix?.includes("Oddly Godly"), "house style prefix must carry Oddly Godly direction", errors);
assert(batch.house_style?.global_negative_prompt?.includes("No real brand logos"), "global negative prompt must include brand/logo rule", errors);

const assets = batch.batch?.assets || [];
assert(assets.length === requiredAssetIds.length, `expected ${requiredAssetIds.length} assets`, errors);

const ids = new Set(assets.map((asset) => asset.asset_id));
for (const id of requiredAssetIds) {
  assert(ids.has(id), `missing required asset ${id}`, errors);
}

for (const asset of assets) {
  assert(asset.asset_id, "asset missing asset_id", errors);
  assert(asset.shopping_list_ref, `${asset.asset_id} missing shopping_list_ref`, errors);
  assert(asset.asset_kind, `${asset.asset_id} missing asset_kind`, errors);
  assert(asset.target_resolution, `${asset.asset_id} missing target_resolution`, errors);
  assert(asset.prompt?.includes("Oddly Godly"), `${asset.asset_id} prompt missing shared style direction`, errors);
  assert(asset.negative_prompt?.includes("No real brand logos"), `${asset.asset_id} negative prompt missing brand/logo rule`, errors);
  assert(Array.isArray(asset.acceptance_checks) && asset.acceptance_checks.length >= 4, `${asset.asset_id} needs at least 4 acceptance checks`, errors);

  const stems = Object.values(asset.delivery_names || {});
  assert(stems.length > 0, `${asset.asset_id} missing delivery_names`, errors);
  for (const stem of stems) {
    assert(/^(T_OG_|D_OG_|FX_OG_)[A-Za-z0-9_]+$/.test(stem), `${asset.asset_id} invalid delivery stem ${stem}`, errors);
  }

  const executableText = normalize(`${asset.prompt} ${asset.negative_prompt}`);
  for (const term of forbiddenExecutablePromptTerms) {
    assert(!executableText.includes(term), `${asset.asset_id} executable prompt contains blocked term: ${term}`, errors);
  }
}

let status;
if (errors.length > 0) {
  status = fail(errors, warnings);
} else {
  status = {
    status: "PASS_GHOST_FORGE_POP_TODAY_BATCH_READY_BLOCKED",
    generated_at: new Date().toISOString(),
    packet_id: batch.packet_id,
    batch_path: path.relative(repoRoot, batchPath).replaceAll("\\", "/"),
    prompt_sheet_path: "foreman/ghost-forge/GHOST_FORGE_POP_TODAY_PROMPTS_20260629.md",
    source_file: batch.source_file,
    asset_count: assets.length,
    asset_ids: assets.map((asset) => asset.asset_id),
    external_run_executed: false,
    human_gate_required: batch.external_execution.required_gate_to_run,
    proof: [
      "Parsed JSON batch",
      "Confirmed five POP-today assets",
      "Confirmed delivery names follow OG asset prefixes",
      "Confirmed executable prompts avoid explicit protected-franchise lineage terms",
      "Confirmed external execution remains disabled"
    ],
    warnings
  };
}

await mkdir(path.dirname(statusPath), { recursive: true });
await writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, "utf8");
console.log(JSON.stringify(status, null, 2));

if (errors.length > 0) {
  process.exitCode = 1;
}
