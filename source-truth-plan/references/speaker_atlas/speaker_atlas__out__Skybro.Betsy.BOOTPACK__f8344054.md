---
BOOTPACK_RENDER_ID: 7dcd7bc3-2293-4cc0-a1c4-3dd0098c5d55
AEYE: Skybro
MACHINE: Betsy
STREAM: DEFAULT
RENDERED_AT: 2026-06-27T22:00:37.540Z
SOURCE: Speaker deterministic bootloader
SPEAKER_IS_ACTIVE_LLM: false
SPEAKER_IS_AEYE: false
SPEAKER_IS_PROCESS_AT_RUNTIME: false
SQLITE_INDEX: /speaker/db/speaker.sqlite
TOKEN_BUDGET: 6000
---
# Skybro@Betsy Bootpack

PROFILE_ID: Skybro.Betsy
BOOTPACK_RENDER_ID: 7dcd7bc3-2293-4cc0-a1c4-3dd0098c5d55
AEYE: Skybro
MACHINE: Betsy
STREAM: DEFAULT
PROFILE_PATH: C:\speaker\bootloader\profiles\Skybro.Betsy.json
SPEAKER_DB: C:\speaker\speaker.sqlite
RENDERED_AT: 2026-06-27T22:00:37.540Z
SPEAKER_IS_ACTIVE_LLM: false
SPEAKER_IS_AEYE: false
SPEAKER_IS_PROCESS_AT_RUNTIME: false


## Current Repo State

# CURRENT REPO STATE

SNAPSHOT_ID: GIT_SNAPSHOT_2026-06-27T22:00:37Z
GENERATED_AT: 2026-06-27T22:00:37Z
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
?? NMCLR/
?? app/api/tinkerden/
?? app/soledash/
?? app/tinkerden/
?? book/
?? data/
?? foreman/MULE_ELIMINATION_MAP_v1.md
?? foreman/NUGGETS_OF_WISDOM_TOP_25.md
?? foreman/change-capsules/
?? foreman/handoffs/inbox/AEYE_FEED_PACKET_0001_BIRDS_CARRY_MOMENTUM.md
?? foreman/handoffs/outbox/FROM_MAKER_AEYE_FEED_PACKET_0001_RECEIPT.md
?? foreman/handoffs/outbox/FROM_MAKER_EXECUTION_ASSEMBLER_V0_RECEIPT.md
?? foreman/handoffs/outbox/TO_SPEAKER_VALIDATE_AEYE_FEED_PACKET_0001_BIRDS_DOCTRINE.md
?? foreman/machines/DOSS_SLEEP_MWB_DISCONNECT_V1.md
?? foreman/maker/
?? foreman/nuggets_of_wisdom_top_25.json
?? foreman/overseer/
?? foreman/soledash/ACTIVE_TASK.json
?? foreman/soledash/AUTOMATICA_APPROVALS.json
?? foreman/soledash/CRAWLER_PEARLS.json
?? foreman/soledash/FLEET_STATE.json
?? foreman/soledash/MACHINE_HEALTH.json
?? foreman/soledash/PROJECT_LOCKS.json
?? foreman/soledash/SWATTER_EVENT_STREAM.json
?? foreman/soledash/WORK_QUEUE.json
?? foreman/soledash/actions/
?? foreman/soledash/mobile/
?? foreman/soledash/receipts/
?? foreman/speaker/HYPOTHESIS_LIBRARY_v1.md
?? foreman/speaker/RECOMMENDATION_CONSTITUTION_V1.md
?? foreman/speaker/SPEAKER_DIAGNOSTIC_FLOW_v1.md
?? foreman/speaker/SPEAKER_USER_1_PROTOCOL.md
?? foreman/speaker/USER_QUALIFICATION_PROTOCOL_v1.md
?? foreman/speaker/USER_QUALIFICATION_RUBRIC_v1.md
?? foreman/wisdom/
?? logs/
?? return-to-work.cmd
?? scripts/foreman/crawler.js
?? scripts/foreman/doss-disable-modern-standby.ps1
?? scripts/foreman/packet-relay-ready-proof.mjs
?? scripts/foreman/return-to-work.ps1
?? scripts/foreman/start-receipt-crawler.ps1
?? scripts/foreman/start-soledash-mobile-readonly.ps1
?? scripts/wisdom-watcher.py
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

- token_budget: 6000
- budget_mode: approximate_4_chars_per_token
- receipts_included: 4
- receipts_truncated_oldest: 0
