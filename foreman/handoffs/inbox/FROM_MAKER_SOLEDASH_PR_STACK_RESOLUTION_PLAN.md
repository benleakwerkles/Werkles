# FROM MAKER - SOLEDASH PR STACK RESOLUTION PLAN

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: read-only PR stack analysis. No code changes, merges, deletes, closes, retargets, or branch rewrites were performed by this report.

## Scope

Reviewed the current open SoleDash / GD / concierge PR set visible through GitHub:

- PR #5
- PR #6
- PR #9
- PR #10
- PR #11
- PR #12
- PR #13
- PR #14
- PR #16
- PR #17
- PR #18
- PR #19
- PR #20
- PR #21
- PR #22
- PR #23

PR #15 exists but is not part of the SoleDash/GD stack. It is the current Cursor branch for Dink non-gate handoffs and Maker recommendation spec work.

## Evidence Used

Read-only commands:

```text
gh pr list --state open --limit 100 --json number,title,headRefName,baseRefName,isDraft,mergeable,updatedAt,labels,url,author
gh pr view <n> --json number,title,headRefName,baseRefName,mergeable,isDraft,updatedAt,url
gh pr diff <n> --name-only
git fetch origin main pull/<n>/head:refs/remotes/origin/pr/<n>
git merge-base --is-ancestor ...
git merge-tree --write-tree --name-only --messages ...
git diff --name-only origin/main...origin/pr/<n>
```

No working-tree merge was run.

---

# 1. Base Console PR

## Base console: PR #5

```text
PR #5 - gimpdash: Human Gates Console (Foreman Control Panel @ :4317)
Branch: cursor/gimpdash-human-gates-console-eeea
Base: main
GitHub mergeable: CONFLICTING
```

Files in PR #5:

```text
foreman/NEXT_ACTION.md
foreman/OPERATOR_DASHBOARD.md
foreman/control-panel/README.md
scripts/foreman/foreman-control-server.mjs
```

Why this is the base console:

- PR #9 explicitly targets PR #5's branch.
- PR #11 targets PR #9's branch.
- PR #12 targets PR #11's branch.
- Git ancestry confirms:
  - PR #5 is ancestor of PR #9.
  - PR #9 is ancestor of PR #11.
  - PR #11 is ancestor of PR #12.
  - PR #5 is ancestor of PR #12.

Conclusion: PR #5 is the bottom of the live GD/SoleDash code stack.

---

# 2. PRs That Depend On The Base Console

## Direct and transitive code stack

```text
PR #5 -> PR #9 -> PR #11 -> PR #12
```

## PR #9

```text
PR #9 - gd: Status Layer V1 - visible lifecycle states in GimpDash
Branch: cursor/gd-status-layer-v1-eeea
Base: cursor/gimpdash-human-gates-console-eeea
GitHub mergeable against its base: MERGEABLE
Depends on: PR #5
```

Files:

```text
foreman/control-panel/README.md
foreman/handoffs/outbox/FROM_MAKER_GD_STATUS_LAYER_V1.md
scripts/foreman/foreman-control-server.mjs
```

## PR #11

```text
PR #11 - soledash: read-only Inbox/Outbox/Receipts V1 + naming pass
Branch: cursor/soledash-inbox-outbox-build-v1-eeea
Base: cursor/gd-status-layer-v1-eeea
GitHub mergeable against its base: MERGEABLE
Depends on: PR #9 and PR #5
```

Files:

```text
foreman/control-panel/README.md
foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_INBOX_OUTBOX_BUILD_V1.md
scripts/foreman/foreman-control-server.mjs
```

## PR #12

```text
PR #12 - soledash: continue V1 - status sidecar + summary strip + /summary
Branch: cursor/soledash-build-continue-eeea
Base: cursor/soledash-inbox-outbox-build-v1-eeea
GitHub mergeable against its base: MERGEABLE
Depends on: PR #11, PR #9, and PR #5
```

Files:

```text
foreman/control-panel/README.md
foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_BUILD_CONTINUE_V1.md
scripts/foreman/foreman-control-server.mjs
```

## Top-of-stack aggregate

PR #12's head contains the full code stack over `main`:

```text
foreman/NEXT_ACTION.md
foreman/OPERATOR_DASHBOARD.md
foreman/control-panel/README.md
foreman/handoffs/outbox/FROM_MAKER_GD_STATUS_LAYER_V1.md
foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_BUILD_CONTINUE_V1.md
foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_INBOX_OUTBOX_BUILD_V1.md
scripts/foreman/foreman-control-server.mjs
```

Important: even the top stack head conflicts with current `main` on:

```text
foreman/NEXT_ACTION.md
foreman/OPERATOR_DASHBOARD.md
```

That means "merge PR #12 straight to main" is not currently clean.

---

# 3. Doc-Only PRs

These PRs each add exactly one Markdown handoff/spec file and are mergeable to `main` according to GitHub's current metadata.

## SoleDash/GD specific doc-only PRs

```text
PR #10 - soledash: Inbox/Outbox/Receipts V1 - concept + UI plan (design only)
File: foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_INBOX_OUTBOX_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #13 - soledash: onboarding surface V1 - zero-context cousin panel (design only)
File: foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_ONBOARDING_SURFACE_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #22 - research: SoleDash Culture-Safety Surface V1 (design only)
File: foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_CULTURE_SAFETY_SURFACE_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #23 - research: SoleDash Screen Inventory V1 (one-page map)
File: foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_SCREEN_INVENTORY_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

## Adjacent concierge / WoZ research doc-only PRs

These are not strictly the GD code stack, but they shape the same SoleDash/concierge operating surface:

```text
PR #14 - research: User #1 Journey Map V1 (homepage -> first recommendation)
File: foreman/handoffs/outbox/FROM_MAKER_USER1_JOURNEY_MAP_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #16 - research: Wizard-of-Oz Concierge Test V1 (smallest 30-day discovery test)
File: foreman/handoffs/outbox/FROM_MAKER_WIZARD_OF_OZ_TEST_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #17 - research: WoZ Operator Console V1 - minimum human-operated console (20 users)
File: foreman/handoffs/outbox/FROM_MAKER_WOZ_OPERATOR_CONSOLE_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #18 - research: Werkles Concierge Console V1 - minimum software support (20 users)
File: foreman/handoffs/outbox/FROM_MAKER_CONCIERGE_CONSOLE_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #19 - research: Werkles Testable Claims V1 - top 10 assumptions + cheapest tests
File: foreman/handoffs/outbox/FROM_MAKER_WERKLES_TESTABLE_CLAIMS_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #20 - research: 20-User Concierge Sheet Spec V1 (Google Sheet / Airtable)
File: foreman/handoffs/outbox/FROM_MAKER_20_USER_CONCIERGE_SHEET_SPEC_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

```text
PR #21 - research: Recommendation Card V1 - user-facing concierge card (6-section)
File: foreman/handoffs/outbox/FROM_MAKER_RECOMMENDATION_CARD_V1.md
Base: main
GitHub mergeable: MERGEABLE
```

---

# 4. PRs That Conflict With PR #6

## PR #6 baseline

```text
PR #6 - foreman: operator UX reset with relay courier and crew dispatch
Branch: rescue/sally-dirty-worktree-2026-06-01
Base: main
GitHub mergeable: CONFLICTING
```

PR #6 is broad. It touches cockpit files, control-panel files, crew-dispatch files, finance files, package files, scripts, and gate logs.

Important PR #6 overlap/conflict surfaces:

```text
foreman/ACTIVE_AGENT.md
foreman/CURRENT_STATE.md
foreman/NEXT_ACTION.md
foreman/OPERATOR_DASHBOARD.md
foreman/control-panel/README.md
foreman/gates/APPROVAL_LOG.md
foreman/gates/OAUTH_STRIPE_OPERATOR_CHECKLIST.md
foreman/crew-dispatch/context-health.json
scripts/foreman/foreman-control-server.mjs
```

## Direct stack conflicts with PR #6

These conflict with PR #6 on the same console/cockpit/code surfaces:

```text
PR #5
PR #9
PR #11
PR #12
```

`git merge-tree` reported conflicts including:

```text
foreman/ACTIVE_AGENT.md
foreman/CURRENT_STATE.md
foreman/NEXT_ACTION.md
foreman/OPERATOR_DASHBOARD.md
foreman/control-panel/README.md
foreman/gates/APPROVAL_LOG.md
scripts/foreman/foreman-control-server.mjs
```

For #5/#9/#11/#12, the risk is not just stale cockpit state. They also share actual console files with PR #6:

```text
foreman/control-panel/README.md
scripts/foreman/foreman-control-server.mjs
```

## Doc-only PRs that still conflict when combined with PR #6

`git merge-tree` also reported conflicts when PR #6 is combined with these otherwise doc-only main-based PRs:

```text
PR #10
PR #13
PR #14
PR #16
PR #17
PR #18
PR #19
PR #20
PR #21
PR #22
PR #23
```

Important nuance:

- These doc-only PRs do not directly edit the same one-file handoff outputs as PR #6.
- The conflict appears because PR #6 is stale against current `main` and collides with cockpit/gate files now present in the modern branch baseline.
- So the doc-only PRs are low technical risk by themselves, but PR #6 cannot safely coexist with the current main-derived stack without a deliberate rescue/supersede pass.

## Practical conflict summary

```text
Hard direct PR #6 conflicts: #5, #9, #11, #12
Baseline/staleness conflicts with PR #6: #10, #13, #14, #16, #17, #18, #19, #20, #21, #22, #23
```

---

# 5. Safest Merge / Close / Supersede Order

No merges or closes were performed. This is the recommended order only.

## Recommendation A - safest overall: supersede the code stack with one clean main-based console PR

This is safer than trying to merge #5 -> #9 -> #11 -> #12 as-is.

### Step A1 - Park PR #6 first

Recommended disposition:

```text
Supersede / close PR #6 after any still-needed rescue artifacts are copied into fresh, scoped PRs.
```

Reason:

- PR #6 is broad and stale.
- It conflicts with current `main`.
- It conflicts directly with the GD/SoleDash console stack.
- It mixes operator UX reset, relay courier, crew dispatch, finance, package/script work, cockpit files, and gate logs.

Do not merge PR #6 into the SoleDash/GD stack.

### Step A2 - Create one fresh console implementation PR from current main

Recommended new PR content source:

```text
Use PR #12 as the functional top-of-stack reference.
```

Bring forward only the intended current console pieces:

```text
foreman/control-panel/README.md
foreman/handoffs/outbox/FROM_MAKER_GD_STATUS_LAYER_V1.md
foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_BUILD_CONTINUE_V1.md
foreman/handoffs/outbox/FROM_MAKER_SOLEDASH_INBOX_OUTBOX_BUILD_V1.md
scripts/foreman/foreman-control-server.mjs
```

Handle cockpit files carefully:

```text
foreman/NEXT_ACTION.md
foreman/OPERATOR_DASHBOARD.md
```

These are the current main conflict points. Do not blindly take old stack versions over current cockpit state.

### Step A3 - After the fresh console PR is accepted, supersede old stacked code PRs

Recommended close/supersede order after the replacement exists:

```text
1. Supersede PR #5
2. Supersede PR #9
3. Supersede PR #11
4. Supersede PR #12
```

Reason:

- #12 already contains the cumulative intent.
- Keeping #5/#9/#11/#12 open after a clean replacement will keep GitHub noisy and make Ben adjudicate stale conflicts.

## Recommendation B - if keeping the existing stack: bottom-up only

If Ben wants to preserve the current stacked PRs instead of creating a fresh consolidated PR:

```text
1. Resolve PR #5 against current main first.
2. Merge PR #5 only after its cockpit conflicts are intentionally resolved.
3. Retarget PR #9 onto main or merge it into PR #5's updated head.
4. Resolve/merge PR #9.
5. Retarget/resolve/merge PR #11.
6. Retarget/resolve/merge PR #12.
```

Do not start with PR #12 unless it is being used as a new consolidated replacement branch, because the lower PRs are ancestors and the branch bases encode the stack.

## Doc-only merge order

The doc-only PRs are technically low-risk because each adds one unique Markdown file and GitHub currently reports each as mergeable to `main`.

Recommended editorial order:

```text
1. PR #23 - SoleDash Screen Inventory V1
2. PR #16 - Wizard-of-Oz Concierge Test V1
3. PR #17 - WoZ Operator Console V1
4. PR #18 - Concierge Console V1
5. PR #20 - 20-User Concierge Sheet Spec V1
6. PR #21 - Recommendation Card V1
7. PR #10 - SoleDash Inbox/Outbox/Receipts concept
8. PR #13 - SoleDash Onboarding Surface V1
9. PR #22 - SoleDash Culture-Safety Surface V1
10. PR #19 - Testable Claims V1
```

Why this order:

- Start with inventory and test frame.
- Then land console and sheet specs.
- Then land recommendation and SoleDash surface details.
- Put claims/risk assumptions last so they can be read against the complete surface map.

Alternative:

```text
Merge all doc-only PRs before any code-stack work.
```

That is technically safe if Ben wants the research record landed first. It does not solve PR #6 or the console-stack conflicts.

## Close / supersede notes for doc-only PRs

Do not close doc-only PRs merely because they are doc-only. They are clean one-file research artifacts.

Only supersede a doc-only PR if a newer packet explicitly replaces its content. Current inspection did not prove that replacement relationship, except that #10's concept is partially implemented by #11/#12 if the code stack lands.

---

# 6. Final Recommendation

Safest path:

```text
1. Treat PR #6 as parked/superseded unless Ben explicitly wants a rescue extraction.
2. Land doc-only research PRs first or keep them queued; they are independent and mergeable.
3. Do not merge #5/#9/#11/#12 as-is.
4. Build one fresh main-based console PR from PR #12's intended final state.
5. Preserve current cockpit files instead of taking stale stack versions.
6. After the replacement console PR exists and is reviewed, close/supersede #5, #9, #11, and #12.
```

This gives Ben one current console PR instead of four stacked stale PRs plus one broad conflicting rescue branch.

## Human gates preserved

Merging, closing, superseding PRs, deleting branches, and resolving PR #6 disposition remain Ben/operator actions. This file is a recommendation packet only.
