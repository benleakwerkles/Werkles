---
BOOTPACK_RENDER_ID: 2d0a4195-ad0a-49b1-bab0-9bb1aab623f5
AEYE: Petra
MACHINE: Betsy
STREAM: NERDKLE_BRAINBOOT
RENDERED_AT: 2026-06-28T03:18:20.502Z
SOURCE: Speaker deterministic bootloader
SPEAKER_IS_ACTIVE_LLM: false
SPEAKER_IS_AEYE: false
SPEAKER_IS_PROCESS_AT_RUNTIME: false
SQLITE_INDEX: /speaker/db/speaker.sqlite
TOKEN_BUDGET: 9000
---
# Petra@Betsy Bootpack

PROFILE_ID: Petra.Betsy
BOOTPACK_RENDER_ID: 2d0a4195-ad0a-49b1-bab0-9bb1aab623f5
AEYE: Petra
MACHINE: Betsy
STREAM: NERDKLE_BRAINBOOT
PROFILE_PATH: C:\speaker\bootloader\profiles\Petra.Betsy.json
SPEAKER_DB: C:\speaker\speaker.sqlite
RENDERED_AT: 2026-06-28T03:18:20.502Z
SPEAKER_IS_ACTIVE_LLM: false
SPEAKER_IS_AEYE: false
SPEAKER_IS_PROCESS_AT_RUNTIME: false


## Session Nerdkle Brainboot

Purpose: give each new Aeye session the same source-truth base without making Ben paste a reboot packet by hand.

TARGET_AEYE: Petra
TARGET_MACHINE: Betsy
SOURCE_TRUTH_PLAN_URL: https://github.com/benleakwerkles/Werkles1/tree/source-truth/atlas-speaker-v0-20260627/source-truth-plan
LOCAL_SOURCE_TRUTH_PLAN_ROOT: C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\work\source-truth-atlas-speaker-v0\source-truth-plan
READBACK_STATUS: SOURCE_TRUTH_READBACK_OK

Operating rules:
- Treat this Brainboot section as the session base point.
- Do not trust chat memory over repo-backed source-truth files.
- If memory conflicts with source-truth-plan files, the files win.
- If a required source is missing, report the gap instead of inventing continuity.
- Do not call this canonical main until the review branch is accepted and merged.
- Use SOURCE_MATERIAL_MANIFEST.json for evidence lookup instead of asking Ben to remember paths.

Read order:
1. README.md
2. SOURCE_OF_TRUTH_PLAN.md
3. BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md
4. NEXT_PACKETS.md
5. SOURCE_MATERIAL_MANIFEST.json when exact evidence is needed

Source-truth file readback:
- README.md: FOUND sha256=400E0688D148DC8553E0F9F8A6578B9BE6F9B8F756A5A4C1CA3F1C811B991731
- BOOTPACK_SOURCE_TRUTH.md: FOUND sha256=79070A81923FA87383DC2F36C47C1BC7BE4E1A71CE02767FBDC34276E8FBB81E
- SOURCE_OF_TRUTH_PLAN.md: FOUND sha256=8B809127A6EDCBD4779B798718B4C1937B317E945DC046A9F793204FCC4070A6
- BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md: FOUND sha256=20F084FC1CB5007F996FC209B9CE78D4E5031900A37AC9BFD61E0596F6F2FF44
- NEXT_PACKETS.md: FOUND sha256=C04023A52CA29E549FCF1F502C76B458805C9D3E3C0165F3D47B91D3B3A19987
- MISSING_SOURCE_GAPS.md: FOUND sha256=9B98AFE4CA05F1325D7CDF90F9E78A10928E90F7FF028DE7AB844333EBE35D42
- ASSEMBLY_RECEIPT.json: FOUND sha256=BA2C5B86F827EB49405D61795D2D4BCD39B1733A680A1B4DEE9836C569466F9D

Key excerpts:

### README.md

```text
# Source Truth Plan: The Book / Nerdkle / Great Plan

Generated: 2026-06-28T03:17:59.703Z

This folder is the current GitHub-backed review surface for the material Ben keeps having to reconstruct: The Book, Nerdkle/NMCLR, Speaker/Atlas, TinkerDen/Medulla, Feral cockpit membrane, and the proof/receipt discipline that ties them together.

## Current Truth

- GitHub repo: https://github.com/benleakwerkles/Werkles1.git
- Branch: `source-truth/atlas-speaker-v0-20260627`
- Status: review branch, not canonical main
- Canonical gate: merge/review into `origin/main` after Ben/Petra approval

## What Is Included

- `SOURCE_OF_TRUTH_PLAN.md` - the build-from-this spine.
- `BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md` - stream split and best-current source map.
- `SOURCE_MATERIAL_MANIFEST.json` - exact copied files with hashes.
- `MISSING_SOURCE_GAPS.md` - gaps, including the Betsy desktop folder that is not visible from Doss.
- `NEXT_PACKETS.md` - the next concrete packets to finish source recovery.
- `references/` - copied source docs, receipts, scripts, specs, and bounded chatlog index.

## Hard Boundary

This is source-truth assembly, not a claim that the whole organism is running. Manuscript doctrine cannot prove automation. Build specs cannot be treated as working software. Feral proof cannot canonize NMCLR. NMCLR proof cannot canonize Feral.
```

### BOOTPACK_SOURCE_TRUTH.md

```text
# BOOTPACK_SOURCE_TRUTH

Generated: 2026-06-28T03:17:59.703Z

## Session Nerdkle Brainboot

This is the source-truth reboot layer that Speaker should render into every new Aeye session bootpack.

Ben should not paste this manually every session. Speaker / ThinkIt / TinkerDen should render it from files.

## Required Read Order

1. `README.md`
2. `SOURCE_OF_TRUTH_PLAN.md`
3. `BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md`
4. `NEXT_PACKETS.md`
5. `SOURCE_MATERIAL_MANIFEST.json` when exact evidence is needed

## Session Rule

- Treat this source-truth folder as the shared reality base.
- Do not trust chat memory over repo-backed files.
- If memory conflicts with these files, the files win.
- If a required source is missing, name the gap instead of inventing it.
- Do not call this canonical main until the review branch is accepted and merged.

## Implementation Surface

- Speaker bootpack section: `source_truth_brainboot`
- Local command: `node C:\speaker\bin\speakerctl.js render-bootpack Skybro.Betsy`
- Local command: `node C:\speaker\bin\speakerctl.js render-bootpack Petra.Betsy`
- TinkerDen / ThinkIt action: `POST /v1/action/render_brainboot`

## Human Labor Removed

Ben no longer has to manually reconstruct or paste the source-truth reboot packet into each new Aeye session. Aeyes get the same file-backed base point at bootpack render time.
```

### SOURCE_OF_TRUTH_PLAN.md

```text
# SOURCE_OF_TRUTH_PLAN

Generated: 2026-06-28T03:17:59.703Z

## Best Current Source To Build From

The best current source-truth surface is this GitHub-backed review branch:

- Repo: https://github.com/benleakwerkles/Werkles1.git
- Branch: `source-truth/atlas-speaker-v0-20260627`
- Folder: `source-truth-plan/`

This is not a brand-new standalone GitHub repository because the local machine does not have GitHub CLI configured and `C:\speaker` still lacks an approved origin. The safe action is to publish the plan inside the already-proven GitHub review branch, where push has already been verified.

## Canonical Build Spine

1. Book / Architecture Manuscript: use `BOOK_INTEGRATION_MAP_V0.md` as the strongest located assembly map.
2. Nerdkle / NMCLR Proof Body: use `NEUROCIRCULYMPHATIC_V0_SPEC.md`, NMCLR proof standards, and first-slice receipts as proof discipline, not as proof of full organism life.
3. Speaker / Atlas Shared Reality: use Speaker for deterministic memory rendering and Atlas for source-truth readback. Speaker is not an Aeye and Atlas does not promote truth by itself.
4. TinkerDen / Medulla Command Surface: use lost-TinkerDen and cockpit artifacts as design/prototype evidence, with dirty-Betsy packet engine still treated as preservation-critical unless separately proven on GitHub.
5. Feral / TinkerDen Membrane: use contract endpoints and cockpit membrane only as bounded command-surface work. Do not let Feral canonize NMCLR.

## Practical Rule

No Aeye should treat chat, a local branch, a preview page, or a sender-side file as Source Truth. Source Truth means: repo-backed file, hashable artifact, explicit receipt, and reviewable branch/commit.
```

### BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP.md

```text
# BOOK_NERDKLE_GREAT_PLAN_CANONICAL_MAP

Generated: 2026-06-28T03:17:59.703Z

## Strongest Located Artifacts

- Book integration map: `references/book/` copy of `BOOK_INTEGRATION_MAP_V0.md`.
- Manuscript spine audits: `references/book/` copies of spine, continuity, structure, V1 readiness, ownership, and lineage audits.
- Great Plan / architecture sources: `the_sublime_design_v0.md` and `tinkularity_genome_v0.md` when available.
- Nerdkle/NMCLR boundary: `references/nerdkle_nmclr/` copies of NMCLR, metabolism, assimilation, inheritance, and anatomy specs.
- Speaker/Atlas source truth: `references/speaker_atlas/` copies of Speaker README, Atlas packets, source truth snapshot, and bootpack artifacts.
- TinkerDen/Medulla surface: `references/tinkerden_medulla/` copies of lost-TinkerDen, cockpit, preview, and freeze/spof receipts.

## Stream Split

### Book / Architecture Manuscript

Purpose: explain the why, the human problem, and the doctrine. It may cite build receipts, but it cannot prove automation.

### Nerdkle / NMCLR Proof Body

Purpose: local proof discipline for packet -> work -> artifact, intake -> process -> exhale, and receipt -> lesson -> next behavior. It is not automatically canonical until branch identity, filesystem snapshot, lineage, and branch-specific execution proof exist.

### Speaker / Atlas Shared Reality

Purpose: stop Aeyes from operating from divergent memory. Speaker renders deterministic memory; Atlas snapshots source truth. Neither replaces GitHub main or operator review.

### TinkerDen / Medulla Command Surface

Purpose: give Ben a cozy command surface for intent, top moves, human gates, packets, receipts, and branch review. It must not become PM software or pretend static cockpit pages execute work.

### Feral / TinkerDen Cockpit Membrane

Purpose: expose bounded action contracts and decision feedback. Feral proof cannot canonize NMCLR. NMCLR proof cannot canonize Feral.

## Build From Here

Start with `BOOK_INTEGRATION_MAP_V0.md`, then attach missing Betsy desktop source material, then turn each chapter/organ surface into a small packet with proof requirements.
```

### NEXT_PACKETS.md

```text
# NEXT_PACKETS

Generated: 2026-06-28T03:17:59.703Z

## PACKET 1: IMPORT_BETSY_NERDKLE_THE_BOOK

Owner: Swanson@Doss with Betsy file access.

Mission: Copy or mount `C:\Users\Ben Leak\Desktop\Nerdkle The Book` into this source-truth branch, hash every file, and update `SOURCE_MATERIAL_MANIFEST.json`.

Pass: Betsy source files appear under `source-truth-plan/references/betsy_nerdkle_the_book/` with hashes.

## PACKET 2: SOURCE_TRUTH_REVIEW_TO_MAIN

Owner: Petra/Ben approval, Swanson executes.

Mission: Review this branch and merge accepted source-truth-plan material to `origin/main`.

Pass: GitHub main contains `source-truth-plan/` or its accepted successor.

## PACKET 3: CHAPTER_SOURCE_LOCK

Owner: Fucko@Betsy for prose, Swanson for source ledger.

Mission: For each planned chapter, choose one primary source and one architecture support source. No rewriting yet.

Pass: `CHAPTER_SOURCE_LOCK.json` records primary source, support source, proof state, and missing gaps for every chapter.

## PACKET 4: ATLAS_SPEAKER_REMOTE_DECISION

Owner: Ben/Petra.

Mission: Decide whether `C:\speaker` gets its own GitHub remote or remains material copied into the Werkles source-truth branch.

Pass: Exact remote URL is written as a receipt, or decision says no separate Speaker repo yet.
```

### MISSING_SOURCE_GAPS.md

```text
# MISSING_SOURCE_GAPS

Generated: 2026-06-28T03:17:59.703Z

## Priority Missing Source

The user supplied this likely Betsy source folder:

```text
C:\Users\Ben Leak\Desktop\Nerdkle The Book
```

Doss cannot currently see it under these checked paths:

- C:/Users/Ben Leak/Desktop/Nerdkle The Book: MISSING_ON_DOSS
- C:/Users/BenLeak/Desktop/Nerdkle The Book: MISSING_ON_DOSS
- C:/Users/BenLeak/OneDrive/Desktop/Nerdkle The Book: MISSING_ON_DOSS
- C:/Users/Ben Leak/OneDrive/Desktop/Nerdkle The Book: MISSING_ON_DOSS

## Exact Files Still Marked Missing By The Book Map

- Foreword
- Chapter One
- Great Work Book I
- V5 baseline
- CHAPTER_13_THE_NERVOUS_SYSTEM_DRAFT.md
- CHAPTER_14_CONSCIOUSNESS_NOTES.md
- MEDULLA_V0_TINKERDEN_BUILD_SPEC.md
- Change Capsule TinkerDen/Medulla
- DOCTRINE_ORGAN_OBLIGATION_LAYER.md
- Chapter Draft Obligation of the Organs
- Chapter Twenty / Reality Gets a Vote

## Missing During This Assembly Pass

- No configured source paths were missing beyond priority Betsy material.
```

### ASSEMBLY_RECEIPT.json

```text
{
  "receipt_id": "SWANSON_DOSS_BOOK_NERDKLE_SOURCE_TRUTH_PLAN_ASSEMBLY",
  "generated_at": "2026-06-28T03:17:59.703Z",
  "status": "ARTIFACT",
  "repository": "https://github.com/benleakwerkles/Werkles1.git",
  "branch": "source-truth/atlas-speaker-v0-20260627",
  "plan_root": "source-truth-plan",
  "files_copied": 89,
  "categories": {
    "book": 14,
    "nerdkle_nmclr": 27,
    "tinkerden_medulla": 11,
    "speaker_atlas": 22,
    "implementation": 15
  },
  "chatlog_index": {
    "repo_path": "source-truth-plan/references/chatlog_hits/CHATLOG_KEYWORD_INDEX.jsonl",
    "hit_count": 48,
    "scanned_file_count": 6,
    "source_root": "C:/Users/BenLeak/.codex/sessions"
  },
  "missing_priority_sources": [
    {
      "source_path": "C:/Users/Ben Leak/Desktop/Nerdkle The Book",
      "status": "MISSING_ON_DOSS"
    },
    {
      "source_path": "C:/Users/BenLeak/Desktop/Nerdkle The Book",
      "status": "MISSING_ON_DOSS"
    },
    {
      "source_path": "C:/Users/BenLeak/OneDrive/Desktop/Nerdkle The Book",
      "status": "MISSING_ON_DOSS"
    },
    {
      "source_path": "C:/Users/Ben Leak/OneDrive/Desktop/Nerdkle The Book",
      "status": "MISSING_ON_DOSS"
    }
  ],
  "miss
```

## Current Repo State

# CURRENT REPO STATE

SNAPSHOT_ID: GIT_SNAPSHOT_2026-06-28T03:18:20Z
GENERATED_AT: 2026-06-28T03:18:20Z
PRODUCER: Swanson@Doss
SOURCE: local git clone
TARGET_REPO: /c/Users/BenLeak/Desktop/github/Werkles
CURRENT_BRANCH: snapshot/sally-good-werkles-2026-06-12
HEAD: 4adebb2dfaf2fc2dae3284f24969eebe8b7adf6f
UPSTREAM: origin/snapshot/sally-good-werkles-2026-06-12
SECRET_POLICY: remote URLs are sanitized for embedded credentials; no PATs or SSH private keys are written.


## git remote -v

```text
+ git -C /c/Users/BenLeak/Desktop/github/Werkles remote -v
origin	https://github.com/benleakwerkles/Werkles1.git (fetch)
origin	https://github.com/benleakwerkles/Werkles1.git (push)
```

## git branch -a

```text
+ git -C /c/Users/BenLeak/Desktop/github/Werkles branch -a
+ book/architecture-stream-split-v0-20260627
  main
+ nerdkle/nmclr-proof-body-preserve-v0-20260627
  preserve/werkles-pre-rebase-BIRD_0125-20260627T221543Z
* snapshot/sally-good-werkles-2026-06-12
+ source-truth/atlas-speaker-v0-20260627
  remotes/origin/HEAD -> origin/main
  remotes/origin/app-infra-01-approved-clean
  remotes/origin/audit/branch-salvage-map-2026-06-21-180250
  remotes/origin/book/architecture-stream-split-v0-20260627
  remotes/origin/cursor/atlas-machine-role-eeea
  remotes/origin/cursor/concierge-console-v1-eeea
  remotes/origin/cursor/concierge-sheet-spec-v1-eeea
  remotes/origin/cursor/dink-non-human-gate-agent-c25f
  remotes/origin/cursor/doss-baseline-v1-eeea
  remotes/origin/cursor/doss-local-dev-launcher-eeea
  remotes/origin/cursor/execution-context-doctrine-eeea
  remotes/origin/cursor/gd-status-layer-v1-eeea
  remotes/origin/cursor/gimpdash-human-gates-console-eeea
  remotes/origin/cursor/goop-cycle-pvp-9b25
  remotes/origin/cursor/post-merge-cockpit-cleanup-eeea
  remotes/origin/cursor/recommendation-card-v1-eeea
  remotes/origin/cursor/refresh-cockpit-dashboard-eeea
  remotes/origin/cursor/soledash-build-continue-eeea
  remotes/origin/cursor/soledash-culture-safety-surface-v1-eeea
  remotes/origin/cursor/soledash-field-mode-v1-eeea
  remotes/origin/cursor/soledash-inbox-outbox-build-v1-eeea
  remotes/origin/cursor/soledash-inbox-outbox-v1-eeea
  remotes/origin/cursor/soledash-onboarding-surface-v1-eeea
  remotes/origin/cursor/soledash-screen-inventory-v1-eeea
  remotes/origin/cursor/user1-journey-map-v1-eeea
  remotes/origin/cursor/werkles-testable-claims-v1-eeea
  remotes/origin/cursor/wizard-of-oz-test-v1-eeea
  remotes/origin/cursor/wonka-den-mood-reference-9b25
  remotes/origin/cursor/woz-operator-console-v1-eeea
  remotes/origin/ghost-forge-one-prompt-test
  remotes/origin/main
  remotes/origin/nerdkle/nmclr-proof-body-preserve-v0-20260627
  remotes/origin/preview/wonka-den-safe-preview-20260618
  remotes/origin/rescue/sally-dirty-worktree-2026-06-01
  remotes/origin/salvage/betsy/snapshot/sally-good-werkles-2026-06-12
  remotes/origin/snapshot/sally-good-werkles-2026-06-12
  remotes/origin/source-truth/atlas-speaker-v0-20260627
  remotes/origin/supabase-auth-stripe-test-wiring
```

## git log -n 5 --oneline

```text
+ git -C /c/Users/BenLeak/Desktop/github/Werkles log -n 5 --oneline
4adebb2 Wire Automatica relay cards
5d0addf Add master plan proposal engine
43d5db4 Add Aeye workstation standard v1.1
09702a0 Add Google Drive workstation standard
9e29f6f Canonicalize Doss machine protocol
```

## git status --short

```text
+ git -C /c/Users/BenLeak/Desktop/github/Werkles status --short
 M foreman/AI_COUSINS_PROTOCOL.md
 M foreman/MACHINE_TOPOLOGY.md
 M foreman/crew-dispatch-console/dispatch-config.json
 M foreman/crew-dispatch/crew-network-roles.json
 M foreman/crew-dispatch/crew-packet-generator.mjs
 M foreman/crew-dispatch/crew-role-cards.json
 M foreman/crew-dispatch/dispatch-policy.json
 M foreman/gd-intent-router/cousin-assignment.json
 M foreman/gd-intent-router/gd-intent-router-lib.mjs
 D foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245/receipts/FROM_COMPUTER_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245.md
 D foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245/receipts/FROM_ENDER_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245.md
 D foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245/receipts/FROM_PETRA_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245.md
 D foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245/receipts/FROM_SKYBRO_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245.md
 D foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245/synthesis/FROM_GD_SYNTHESIS_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_20260606-175245.md
 M foreman/soledash/automatica/run_automatica_route.py
 M foreman/speaker/SPEAKER_CHARTER.md
 M package.json
 M scripts/foreman/autonomous-round-trip-lib.mjs
 M scripts/foreman/foreman-control-server.mjs
?? logs/
```

## Bootloader Note

This file is static context for Skybro. It is not GitHub login, not a token, and not proof of canonical promotion.

## Active Topology Locks

- ENDER_SALLY_RETIRED: Ender@Sally -> Retired until Sally receives RAM upgrade; receives no work.
  - source: Ben correction / topology change capsule
  - created_at: 2026-06-27T00:00:00.000Z
- SPEAKER_FILE_BACKED_ONLY: Speaker -> Memory enters Aeyes through deterministic rendered text backed by files and SQLite.
  - source: BIRD_0056_DINK_SPEAKER_BOOTPACK
  - created_at: 2026-06-27T20:40:00.000Z

## Boundary Rules

- SPEAKER_NOT_ACTIVE_LLM: Speaker bootpack rendering is deterministic; SPEAKER_IS_ACTIVE_LLM must be false.
  - severity: HARD
  - source: BIRD_0056_DINK_SPEAKER_BOOTPACK
- NO_SENT_AS_RECEIPT: SENT is not a receipt. Packets require ACK, BLOCKER, or ARTIFACT proof.
  - severity: HARD
  - source: AEYE_FEED_PACKET_0001
- NO_GUESSING_BOOTPACK_CONTENT: Bootpack renderer follows the profile priority_order only.
  - severity: HARD
  - source: BIRD_0056_DINK_SPEAKER_BOOTPACK

## Recent Artifact Receipts

- BIRD_0095_STREAM_LOG_PROBE_RECEIPT: BIRD_0095_SWANSON_UI_LIVE_STREAM -> ARTIFACT
  - artifact_path: C:\speaker\receipts\canonical\BIRD_0095_STREAM_LOG_PROBE_RECEIPT_541B5B7006DDE551.json
  - sha256: 541B5B7006DDE5510267B029285F4A0E137BE36EACA3C9D3DD422E04EA1C2E88
  - created_at: 2026-06-27T21:41:30Z
- RATCHET_DECISION_KILL_20260627205209_6B0D3D64: FERAL_MEMBRANE_LOCAL_RECOMMENDATION_001 -> ARTIFACT
  - artifact_path: C:\speaker\receipts\canonical\RATCHET_DECISION_KILL_20260627205209_6B0D3D64_D812E69E6D2F2672.json
  - sha256: D812E69E6D2F26728532756A29871865D484BC734CDFB01A637739A172EFD88B
  - created_at: 2026-06-27T20:52:09.236Z
- BIRD_0053_DINK_SPEAKER_INGESTION_RECEIPT: BIRD_0053_DINK_SPEAKER_INGESTION -> ARTIFACT
  - artifact_path: C:\Users\BenLeak\Documents\Codex\2026-06-20\to-swanson-doss-mission-branch-truth\outputs\BIRD_0053_DINK_SPEAKER_INGESTION_RECEIPT.json
  - sha256: 306ADA634762CFFFC9BE73DC65F5706709FD51976EFB899621DAAA4F4CCA2DC7
  - created_at: 2026-06-27T20:38:48.618Z
- MOCK_VALID_ARTIFACT_RECEIPT: BIRD_0053_DINK_SPEAKER_INGESTION -> ARTIFACT
  - artifact_path: C:\speaker\receipts\canonical\MOCK_VALID_ARTIFACT_RECEIPT_9319A35E8C3EE743.json
  - sha256: 9319A35E8C3EE743FBDB30D45FDB340B454512C3EC44CC4E20BF002B06672110
  - created_at: 2026-06-27T20:38:24.605Z

## Render Report

- token_budget: 9000
- budget_mode: approximate_4_chars_per_token
- receipts_included: 4
- receipts_truncated_oldest: 0
