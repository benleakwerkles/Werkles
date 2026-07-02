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
origin	https://github.com/benleakwerkles/Werkles.git (fetch)
origin	https://github.com/benleakwerkles/Werkles.git (push)
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
