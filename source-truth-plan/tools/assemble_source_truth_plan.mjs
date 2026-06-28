import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import readline from "node:readline";

const root = "C:/Users/BenLeak/Documents/Codex/2026-06-20/to-swanson-doss-mission-branch-truth";
const repoRoot = path.join(root, "work/source-truth-atlas-speaker-v0");
const planRoot = path.join(repoRoot, "source-truth-plan");
const now = new Date().toISOString();

const repoUrl = "https://github.com/benleakwerkles/Werkles1.git";
const branchName = "source-truth/atlas-speaker-v0-20260627";

const missingPrioritySources = [
  "C:/Users/Ben Leak/Desktop/Nerdkle The Book",
  "C:/Users/BenLeak/Desktop/Nerdkle The Book",
  "C:/Users/BenLeak/OneDrive/Desktop/Nerdkle The Book",
  "C:/Users/Ben Leak/OneDrive/Desktop/Nerdkle The Book",
];

const directSources = [
  ["book", "outputs/BOOK_INTEGRATION_MAP_V0.md"],
  ["book", "outputs/SWANSON_DOSS_BOOK_INTEGRATION_MAP_RECEIPT.json"],
  ["book", "outputs/MANUSCRIPT_SPINE_AUDIT.md"],
  ["book", "outputs/MANUSCRIPT_CONTINUITY_AUDIT.md"],
  ["book", "outputs/MANUSCRIPT_CONTINUITY_AUDIT_RECEIPT.md"],
  ["book", "outputs/MANUSCRIPT_STRUCTURE_AUDIT.md"],
  ["book", "outputs/MANUSCRIPT_V1_RELEASE_AUDIT.md"],
  ["book", "outputs/MANUSCRIPT_GAP_AUDIT.md"],
  ["book", "outputs/CHAPTER_LINEAGE_LEDGER.md"],
  ["book", "outputs/CHAPTER_OWNERSHIP_MAP.md"],
  ["book", "outputs/inheritance_chain_audit_receipt.md"],
  ["book", "outputs/THESIS_DEFINITION_AUDIT.md"],
  ["book", "work/MANUSCRIPT_SOURCE_BUNDLE_TO_ENDER_20260623/source_files/speaker/sublime-design/the_sublime_design_v0.md"],
  ["book", "work/MANUSCRIPT_SOURCE_BUNDLE_TO_ENDER_20260623/source_files/speaker/genome/tinkularity_genome_v0.md"],

  ["nerdkle_nmclr", "outputs/NEUROCIRCULYMPHATIC_V0_SPEC.md"],
  ["nerdkle_nmclr", "outputs/NEUROCIRCULYMPHATIC_V0_BOUNDARY.md"],
  ["nerdkle_nmclr", "outputs/NMCLR_RESPIRATORY_RECEIPT_STANDARD.md"],
  ["nerdkle_nmclr", "outputs/NMCLR_MUSCLE_RECEIPT_STANDARD.md"],
  ["nerdkle_nmclr", "outputs/NMCLR_METABOLISM_RECEIPT.md"],
  ["nerdkle_nmclr", "outputs/NMCLR_METABOLISM_V0.md"],
  ["nerdkle_nmclr", "outputs/NMCLR_METABOLISM_PROOF_CHAIN.md"],
  ["nerdkle_nmclr", "outputs/ASSIMILATION_V0_RECEIPT.md"],
  ["nerdkle_nmclr", "outputs/assimilation_rule.json"],
  ["nerdkle_nmclr", "outputs/INTENT_TO_ANATOMY_COMPILER_V0_RECEIPT.md"],
  ["nerdkle_nmclr", "outputs/INTENT_TO_ANATOMY_COMPILER_V0.json"],
  ["nerdkle_nmclr", "outputs/CREATOR_OPERATOR_MODEL_V0.md"],
  ["nerdkle_nmclr", "outputs/CREATOR_OPERATOR_ORGANISM_RECEIPT.md"],
  ["nerdkle_nmclr", "outputs/SUCCESSFUL_INHERITANCE_EVENT_V0.md"],
  ["nerdkle_nmclr", "outputs/SUCCESSFUL_INHERITANCE_EVENT_V0_SPEC.md"],
  ["nerdkle_nmclr", "outputs/SUCCESSFUL_INHERITANCE_QUERY_V0.md"],
  ["nerdkle_nmclr", "outputs/INHERITANCE_EVENT_CANDIDATE_DETECTOR_RECEIPT.md"],
  ["nerdkle_nmclr", "outputs/candidate_inheritance_events.json"],
  ["nerdkle_nmclr", "outputs/NERDKLE_HANDOFF_TO_FUCKO_RECEIPT_20260626-162718.md"],
  ["nerdkle_nmclr", "outputs/nerdkle_pulse_v0/PULSE_TEST_001.md"],
  ["nerdkle_nmclr", "outputs/nerdkle_pulse_v0/artifacts/PULSE_TEST_001_ACK_ARTIFACT.md"],
  ["nerdkle_nmclr", "outputs/nerdkle_pulse_v0/receipts/NERDKLE_PULSE_RECEIPT.json"],
  ["nerdkle_nmclr", "outputs/dink_doss_nerdkle_receipt_dry_run/NERDKLE_DRY_RECEIPT_001.md"],
  ["nerdkle_nmclr", "outputs/dink_doss_nerdkle_receipt_dry_run/NERDKLE_DRY_BIRD_001.md"],
  ["nerdkle_nmclr", "outputs/nmclr_filesystem_snapshot/NMCLR_SPEC_BUILD_FS_SNAPSHOT_V0.json"],
  ["nerdkle_nmclr", "outputs/nmclr_preservation/SWANSON_DOSS_NMCLR_PRESERVATION_RECEIPT.json"],
  ["nerdkle_nmclr", "outputs/branch_collision/BEAN_SPANZEE_BRANCH_COLLISION_ATTACK_RECEIPT.md"],

  ["tinkerden_medulla", "outputs/find_the_lost_tinkerden.md"],
  ["tinkerden_medulla", "outputs/tinkerden_working_preview.html"],
  ["tinkerden_medulla", "outputs/tinkerden_working_preview_receipt.md"],
  ["tinkerden_medulla", "outputs/tinkerden_branch_review_cockpit.html"],
  ["tinkerden_medulla", "outputs/tinkerden_branch_review_cockpit_receipt.md"],
  ["tinkerden_medulla", "outputs/TINKERDEN_SPOF_FREEZE_NOTICE.md"],
  ["tinkerden_medulla", "outputs/TINKERDEN_FREEZE_STATUS_RECEIPT.md"],
  ["tinkerden_medulla", "outputs/UPDATED_TINKERDEN_FREEZE_STATUS_RECEIPT.md"],
  ["tinkerden_medulla", "outputs/tinkerden_spof_preservation_receipt.md"],
  ["tinkerden_medulla", "outputs/PROPOSAL_FERAL_TINKERDEN_HANDEYE_001_RECEIPT.json"],
  ["tinkerden_medulla", "outputs/BIRD_0063_SWANSON_RATCHET_FEEDBACK_RECEIPT.json"],

  ["speaker_atlas", "outputs/atlas_truth_receipt.md"],
  ["speaker_atlas", "outputs/BIRD_0130_SWANSON_ATLAS_CORE_DEPLOY_RECEIPT.json"],
  ["speaker_atlas", "outputs/RECEIPT_TRUST_MODEL_AUDIT.md"],
  ["speaker_atlas", "outputs/FALSE_DELIVERY_AUDIT.md"],
  ["speaker_atlas", "outputs/aeye_feed/AEYE_FEED_PACKET_0001_RECEIPT.md"],
  ["speaker_atlas", "outputs/g_sprints/G_SPRINT_20260627_SOURCE_TRUTH_ATLAS_SPEAKER_RECEIPT.json"],

  ["implementation", "outputs/receipt_crawler/BIRD_0019_SWANSON_RECEIPT_CRAWLER_RECEIPT.json"],
  ["implementation", "outputs/swateyes/BIRD_0022_SWANSON_SWATEYES_CLASSIFIER_RECEIPT.md"],
  ["implementation", "outputs/fleyes/BIRD_0025_SWANSON_FLEYE_MULE_SENSOR_RECEIPT.json"],
  ["implementation", "outputs/ender/BIRD_0029_SWANSON_ENDER_CRON_RECEIPT.json"],
];

const absoluteSources = [
  ["speaker_atlas", "C:/speaker/README.md"],
  ["speaker_atlas", "C:/speaker/atlas/SOURCE_TRUTH_GITHUB_DECISION_PACKET.md"],
  ["speaker_atlas", "C:/speaker/atlas/CANONICAL_SOURCE_TRUTH_NEXT_PACKET.md"],
  ["speaker_atlas", "C:/speaker/atlas/source_truth_snapshot.json"],
  ["speaker_atlas", "C:/speaker/bin/atlas-source-truth.js"],
  ["speaker_atlas", "C:/speaker/bin/speakerctl.js"],
  ["speaker_atlas", "C:/speaker/bin/git-snapshot.sh"],
  ["speaker_atlas", "C:/speaker/bin/validate-fences.js"],
  ["speaker_atlas", "C:/speaker/bootloader/templates/CURRENT_REPO_STATE.md"],
  ["speaker_atlas", "C:/speaker/bootpacks/out/Skybro.Betsy.BOOTPACK.md"],
  ["speaker_atlas", "C:/speaker/schemas/receipt.schema.json"],
  ["speaker_atlas", "C:/speaker/db/master_plan_progress.json"],
  ["speaker_atlas", "C:/speaker/receipts/staged/SWANSON_REMOTE_ALIGNMENT.json"],

  ["implementation", "C:/tinkarden/ecosystem.config.js"],
  ["implementation", "C:/tinkarden/server/index.js"],
  ["implementation", "C:/tinkarden/server/feral_contract_routes.js"],
  ["implementation", "C:/tinkarden/nervous_system/brainstem.js"],
  ["implementation", "C:/tinkarden/nervous_system/crawler.js"],
  ["implementation", "C:/tinkarden/nervous_system/daemon_watchdog.js"],
  ["implementation", "C:/tinkarden/nervous_system/ender_apoptosis.js"],
  ["implementation", "C:/tinkarden/nervous_system/fleyes.js"],
  ["implementation", "C:/tinkarden/nervous_system/swateyes.js"],
  ["implementation", "C:/tinkarden/nervous_system/frictional_heat.json"],
  ["implementation", "C:/tinkarden/world_state.json"],
];

const chatKeywords = [
  "Nerdkle",
  "Neuromusc",
  "NMCLR",
  "Neurocirculymphatic",
  "The Book",
  "Great Plan",
  "Great Work",
  "TinkerDen",
  "Medulla",
  "Feral",
  "Speaker",
  "Atlas",
  "Inheritance",
  "Ratchet",
  "Source Truth",
  "source of truth",
  "Ben is not the bus",
  "Bird",
];

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
const readFile = (file) => fs.readFileSync(file);
const sha256Buffer = (buffer) => crypto.createHash("sha256").update(buffer).digest("hex");
const sha256File = (file) => sha256Buffer(readFile(file));
const unixPath = (p) => p.replaceAll("\\", "/");
const relRepo = (p) => unixPath(path.relative(repoRoot, p));

function sourcePath(input) {
  return path.isAbsolute(input) ? input : path.join(root, input);
}

function safeName(source, category) {
  const parsed = path.parse(source);
  const parent = path.basename(path.dirname(source)).replace(/[^A-Za-z0-9_.-]+/g, "_");
  const base = parsed.name.replace(/[^A-Za-z0-9_.-]+/g, "_");
  const ext = parsed.ext || ".txt";
  const hash = crypto.createHash("sha1").update(source).digest("hex").slice(0, 8);
  return `${category}__${parent}__${base}__${hash}${ext}`;
}

function copySource(category, rawPath, manifest, missing) {
  const source = sourcePath(rawPath);
  if (!fs.existsSync(source)) {
    missing.push({ category, source_path: unixPath(source), reason: "PATH_NOT_FOUND" });
    return;
  }
  const stat = fs.statSync(source);
  if (!stat.isFile()) {
    missing.push({ category, source_path: unixPath(source), reason: "NOT_A_FILE" });
    return;
  }
  const bytes = readFile(source);
  const hash = sha256Buffer(bytes);
  const destDir = path.join(planRoot, "references", category);
  ensureDir(destDir);
  const dest = path.join(destDir, safeName(source, category));
  fs.copyFileSync(source, dest);
  manifest.push({
    category,
    source_path: unixPath(source),
    repo_path: relRepo(dest),
    byte_count: stat.size,
    sha256: hash,
    modified_time: stat.mtime.toISOString(),
    copied: true,
  });
}

async function crawlChatlogs() {
  const sessionsRoot = "C:/Users/BenLeak/.codex/sessions";
  const outDir = path.join(planRoot, "references/chatlog_hits");
  ensureDir(outDir);
  const outFile = path.join(outDir, "CHATLOG_KEYWORD_INDEX.jsonl");
  const readmeFile = path.join(outDir, "README.md");
  const hits = [];
  const maxHits = 700;
  const maxPerFile = 8;
  const maxFiles = 900;

  function collectFiles(dir, bucket) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        collectFiles(full, bucket);
      } else if (entry.isFile() && /\.(jsonl|json|md|txt)$/i.test(entry.name)) {
        const stat = fs.statSync(full);
        bucket.push({ full, mtimeMs: stat.mtimeMs, size: stat.size });
      }
    }
  }

  const files = [];
  collectFiles(sessionsRoot, files);
  files.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const recent = files.slice(0, maxFiles);

  for (const file of recent) {
    if (hits.length >= maxHits) break;
    let fileHits = 0;
    const stream = fs.createReadStream(file.full, { encoding: "utf8" });
    const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
    let lineNumber = 0;
    for await (const line of rl) {
      lineNumber += 1;
      if (fileHits >= maxPerFile || hits.length >= maxHits) break;
      const matched = chatKeywords.filter((kw) => line.toLowerCase().includes(kw.toLowerCase()));
      if (!matched.length) continue;
      const compact = line.replace(/\s+/g, " ").trim();
      hits.push({
        source_path: unixPath(file.full),
        line_number: lineNumber,
        keywords: matched,
        line_sha256: sha256Buffer(Buffer.from(line)),
        snippet: compact.slice(0, 420),
      });
      fileHits += 1;
    }
  }

  fs.writeFileSync(outFile, hits.map((h) => JSON.stringify(h)).join("\n") + (hits.length ? "\n" : ""));
  fs.writeFileSync(
    readmeFile,
    `# Chatlog Keyword Index\n\nGenerated: ${now}\n\nThis is a bounded index of likely Book / Nerdkle / Great Plan chatlog references. It stores path, line number, keyword, line hash, and short snippets only. It intentionally does not copy raw chatlogs into the repo.\n\nHits: ${hits.length}\n`
  );
  return {
    repo_path: relRepo(outFile),
    hit_count: hits.length,
    scanned_file_count: recent.length,
    source_root: sessionsRoot,
  };
}

function writeGeneratedFiles(manifest, missing, chatlogIndex) {
  const missingBetsy = missingPrioritySources.map((p) => ({
    source_path: unixPath(p),
    status: fs.existsSync(p) ? "FOUND" : "MISSING_ON_DOSS",
  }));

  const sourceCounts = manifest.reduce((acc, entry) => {
    acc[entry.category] = (acc[entry.category] || 0) + 1;
    return acc;
  }, {});

  const plan = {
    generated_at: now,
    repository: repoUrl,
    branch: branchName,
    status: "GITHUB_REVIEW_BRANCH_NOT_CANONICAL",
    purpose: "Single file-backed Source Truth Plan for The Book, Nerdkle/NMCLR, Speaker/Atlas, and TinkerDen/Medulla build references.",
    source_counts: sourceCounts,
    chatlog_index: chatlogIndex,
    missing_priority_sources: missingBetsy,
    missing_or_unresolved_sources: missing,
    proof_boundary: [
      "This folder is a source-truth plan and evidence bundle, not proof that full automation is built.",
      "origin/main remains canonical until reviewed and merged.",
      "Betsy desktop source is not included until the folder is transferred or mounted on Doss.",
      "Chatlog index is discovery evidence only; durable source material must still be copied into repo-backed files.",
    ],
  };

  fs.writeFileSync(path.join(planRoot, "SOURCE_MATERIAL_MANIFEST.json"), JSON.stringify({ ...plan, files: manifest }, null, 2) + "\n");

  fs.writeFileSync(
    path.join(planRoot, "README.md"),
    `# Source Truth Plan: The Book / Nerdkle / Great Plan\n\nGenerated: ${now}\n\nThis folder is the current GitHub-backed review surface for the material Ben keeps having to reconstruct: The Book, Nerdkle/NMCLR, Speaker/Atlas, TinkerDen/Medulla, Feral cockpit membrane, and the proof/receipt discipline that ties them together.\n\n## Current Truth\n\n- GitHub repo: ${repoUrl}\n- Branch: \`${branchName}\`\n- Status: review branch, not canonical main\n- Canonical gate: merge/review into \`origin/main\` after Ben/Petra approval\n\n## What Is Included\n\n- \`SOURCE_OF_TRUTH_PLAN.md\` - the build-from-this spine.\n- \`BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md\` - stream split and best-current source map.\n- \`SOURCE_MATERIAL_MANIFEST.json\` - exact copied files with hashes.\n- \`MISSING_SOURCE_GAPS.md\` - gaps, including the Betsy desktop folder that is not visible from Doss.\n- \`NEXT_PACKETS.md\` - the next concrete packets to finish source recovery.\n- \`references/\` - copied source docs, receipts, scripts, specs, and bounded chatlog index.\n\n## Hard Boundary\n\nThis is source-truth assembly, not a claim that the whole organism is running. Manuscript doctrine cannot prove automation. Build specs cannot be treated as working software. Feral proof cannot canonize NMCLR. NMCLR proof cannot canonize Feral.\n`
  );

  fs.writeFileSync(
    path.join(planRoot, "SOURCE_OF_TRUTH_PLAN.md"),
    `# SOURCE_OF_TRUTH_PLAN\n\nGenerated: ${now}\n\n## Best Current Source To Build From\n\nThe best current source-truth surface is this GitHub-backed review branch:\n\n- Repo: ${repoUrl}\n- Branch: \`${branchName}\`\n- Folder: \`source-truth-plan/\`\n\nThis is not a brand-new standalone GitHub repository because the local machine does not have GitHub CLI configured and \`C:\\speaker\` still lacks an approved origin. The safe action is to publish the plan inside the already-proven GitHub review branch, where push has already been verified.\n\n## Canonical Build Spine\n\n1. Book / Architecture Manuscript: use \`BOOK_INTEGRATION_MAP_V0.md\` as the strongest located assembly map.\n2. Nerdkle / NMCLR Proof Body: use \`NEUROCIRCULYMPHATIC_V0_SPEC.md\`, NMCLR proof standards, and first-slice receipts as proof discipline, not as proof of full organism life.\n3. Speaker / Atlas Shared Reality: use Speaker for deterministic memory rendering and Atlas for source-truth readback. Speaker is not an Aeye and Atlas does not promote truth by itself.\n4. TinkerDen / Medulla Command Surface: use lost-TinkerDen and cockpit artifacts as design/prototype evidence, with dirty-Betsy packet engine still treated as preservation-critical unless separately proven on GitHub.\n5. Feral / TinkerDen Membrane: use contract endpoints and cockpit membrane only as bounded command-surface work. Do not let Feral canonize NMCLR.\n\n## Practical Rule\n\nNo Aeye should treat chat, a local branch, a preview page, or a sender-side file as Source Truth. Source Truth means: repo-backed file, hashable artifact, explicit receipt, and reviewable branch/commit.\n`
  );

  fs.writeFileSync(
    path.join(planRoot, "BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md"),
    `# BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP\n\nGenerated: ${now}\n\n## Strongest Located Artifacts\n\n- Book integration map: \`references/book/\` copy of \`BOOK_INTEGRATION_MAP_V0.md\`.\n- Manuscript spine audits: \`references/book/\` copies of spine, continuity, structure, V1 readiness, ownership, and lineage audits.\n- Great Plan / architecture sources: \`the_sublime_design_v0.md\` and \`tinkularity_genome_v0.md\` when available.\n- Nerdkle/NMCLR boundary: \`references/nerdkle_nmclr/\` copies of NMCLR, metabolism, assimilation, inheritance, and anatomy specs.\n- Speaker/Atlas source truth: \`references/speaker_atlas/\` copies of Speaker README, Atlas packets, source truth snapshot, and bootpack artifacts.\n- TinkerDen/Medulla surface: \`references/tinkerden_medulla/\` copies of lost-TinkerDen, cockpit, preview, and freeze/spof receipts.\n\n## Stream Split\n\n### Book / Architecture Manuscript\n\nPurpose: explain the why, the human problem, and the doctrine. It may cite build receipts, but it cannot prove automation.\n\n### Nerdkle / NMCLR Proof Body\n\nPurpose: local proof discipline for packet -> work -> artifact, intake -> process -> exhale, and receipt -> lesson -> next behavior. It is not automatically canonical until branch identity, filesystem snapshot, lineage, and branch-specific execution proof exist.\n\n### Speaker / Atlas Shared Reality\n\nPurpose: stop Aeyes from operating from divergent memory. Speaker renders deterministic memory; Atlas snapshots source truth. Neither replaces GitHub main or operator review.\n\n### TinkerDen / Medulla Command Surface\n\nPurpose: give Ben a cozy command surface for intent, top moves, human gates, packets, receipts, and branch review. It must not become PM software or pretend static cockpit pages execute work.\n\n### Feral / TinkerDen Cockpit Membrane\n\nPurpose: expose bounded action contracts and decision feedback. Feral proof cannot canonize NMCLR. NMCLR proof cannot canonize Feral.\n\n## Build From Here\n\nStart with \`BOOK_INTEGRATION_MAP_V0.md\`, then attach missing Betsy desktop source material, then turn each chapter/organ surface into a small packet with proof requirements.\n`
  );

  fs.writeFileSync(
    path.join(planRoot, "MISSING_SOURCE_GAPS.md"),
    `# MISSING_SOURCE_GAPS\n\nGenerated: ${now}\n\n## Priority Missing Source\n\nThe user supplied this likely Betsy source folder:\n\n\`\`\`text\nC:\\Users\\Ben Leak\\Desktop\\Nerdkle The Book\n\`\`\`\n\nDoss cannot currently see it under these checked paths:\n\n${missingBetsy.map((m) => `- ${m.source_path}: ${m.status}`).join("\n")}\n\n## Exact Files Still Marked Missing By The Book Map\n\n- Foreword\n- Chapter One\n- Great Work Book I\n- V5 baseline\n- CHAPTER_13_THE_NERVOUS_SYSTEM_DRAFT.md\n- CHAPTER_14_CONSCIOUSNESS_NOTES.md\n- MEDULLA_V0_TINKERDEN_BUILD_SPEC.md\n- Change Capsule TinkerDen/Medulla\n- DOCTRINE_ORGAN_OBLIGATION_LAYER.md\n- Chapter Draft Obligation of the Organs\n- Chapter Twenty / Reality Gets a Vote\n\n## Missing During This Assembly Pass\n\n${missing.length ? missing.map((m) => `- ${m.category}: ${m.source_path} (${m.reason})`).join("\n") : "- No configured source paths were missing beyond priority Betsy material."}\n`
  );

  fs.writeFileSync(
    path.join(planRoot, "NEXT_PACKETS.md"),
    `# NEXT_PACKETS\n\nGenerated: ${now}\n\n## PACKET 1: IMPORT_BETSY_NERDKLE_THE_BOOK\n\nOwner: Swanson@Doss with Betsy file access.\n\nMission: Copy or mount \`C:\\Users\\Ben Leak\\Desktop\\Nerdkle The Book\` into this source-truth branch, hash every file, and update \`SOURCE_MATERIAL_MANIFEST.json\`.\n\nPass: Betsy source files appear under \`source-truth-plan/references/betsy_nerdkle_the_book/\` with hashes.\n\n## PACKET 2: SOURCE_TRUTH_REVIEW_TO_MAIN\n\nOwner: Petra/Ben approval, Swanson executes.\n\nMission: Review this branch and merge accepted source-truth-plan material to \`origin/main\`.\n\nPass: GitHub main contains \`source-truth-plan/\` or its accepted successor.\n\n## PACKET 3: CHAPTER_SOURCE_LOCK\n\nOwner: Fucko@Betsy for prose, Swanson for source ledger.\n\nMission: For each planned chapter, choose one primary source and one architecture support source. No rewriting yet.\n\nPass: \`CHAPTER_SOURCE_LOCK.json\` records primary source, support source, proof state, and missing gaps for every chapter.\n\n## PACKET 4: ATLAS_SPEAKER_REMOTE_DECISION\n\nOwner: Ben/Petra.\n\nMission: Decide whether \`C:\\speaker\` gets its own GitHub remote or remains material copied into the Werkles source-truth branch.\n\nPass: Exact remote URL is written as a receipt, or decision says no separate Speaker repo yet.\n`
  );

  fs.writeFileSync(
    path.join(planRoot, "ASSEMBLY_RECEIPT.json"),
    JSON.stringify(
      {
        receipt_id: "SWANSON_DOSS_BOOK_NERDKLE_SOURCE_TRUTH_PLAN_ASSEMBLY",
        generated_at: now,
        status: "ARTIFACT",
        repository: repoUrl,
        branch: branchName,
        plan_root: "source-truth-plan",
        files_copied: manifest.length,
        categories: sourceCounts,
        chatlog_index: chatlogIndex,
        missing_priority_sources: missingBetsy,
        missing_count: missing.length,
      },
      null,
      2
    ) + "\n"
  );
}

async function main() {
  if (!fs.existsSync(repoRoot)) {
    throw new Error(`Repo root missing: ${repoRoot}`);
  }
  ensureDir(planRoot);
  ensureDir(path.join(planRoot, "references"));

  const manifest = [];
  const missing = [];

  for (const [category, raw] of directSources) copySource(category, raw, manifest, missing);
  for (const [category, raw] of absoluteSources) copySource(category, raw, manifest, missing);

  const chatlogIndex = await crawlChatlogs();
  writeGeneratedFiles(manifest, missing, chatlogIndex);

  console.log(
    JSON.stringify(
      {
        status: "ARTIFACT",
        plan_root: planRoot,
        files_copied: manifest.length,
        missing_count: missing.length,
        chatlog_hits: chatlogIndex.hit_count,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
