# Worktree Stabilization Inventory

**Date:** 2026-06-01  
**EXECUTION_CONTEXT:** LOCAL_SALLY_WINDOWS (inferred — `$env:EXECUTION_CONTEXT` unset; host `DESKTOP-SJSJMNK`, user `benle`, path `C:\Users\benle\Desktop\github\Werkles`)  
**Safety branch:** `rescue/sally-dirty-worktree-2026-06-01` (local only, not pushed)  
**Base branch at capture:** `main` (dirty working tree preserved on safety branch)  
**Effective gate (cockpit):** `[AWAITING HUMAN GATE: APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW]` · **UI_COMMIT: HOLD**

This report inventories the dirty worktree so lanes can be extracted later **without losing work**. No commits, pushes, or reverts were performed during stabilization.

---

## Summary counts

| Metric | Value |
|--------|------:|
| Tracked modified | 40 |
| Untracked (total) | 7,125 |
| Untracked excl. `foreman/.edge-aeye-crew-profile/` | ~190 |
| Edge browser profile alone | 6,936 |
| `npm run typecheck` | **PASS** (2026-06-01) |
| `npm run build` | **PASS** (2026-06-01, Next.js 15.5.18) |

---

## A. APP_INFRA_PREVIEW_PATCH

**Purpose:** Partial implementation of APP_INFRA-01 review **PATCH** recommendation — preview gate (`APP_INFRA_PREVIEW = true`), disabled auth/checkout/crucible actions, API 403 guards, review packet. **Human gate not closed; UI_COMMIT HOLD still active.**

| File | Tracked | Purpose | Disposition | Blocks tsc/build | Own commit later? |
|------|---------|---------|-------------|------------------|-------------------|
| `lib/app-infra-preview.ts` | untracked | Preview flag + helper | **review** (gate-blocked) | No | Yes — after Ben PATCH/APPROVE |
| `components/foundry/infra-preview-banner.tsx` | untracked | Shared preview banner UI | **review** | No | Yes — with A |
| `app/login/page.tsx` | modified | Disable sign-in in preview | **review** | No | Yes — with A |
| `app/dashboard/billing/page.tsx` | modified | Mock billing shell | **review** | No | Yes — with A |
| `app/membership/page.tsx` | modified | Disable checkout; plan highlight | **review** | No | Yes — with A |
| `components/crucible/crucible-panel.tsx` | modified | Disable sandbox actions | **review** | No | Yes — with A |
| `components/crucible/verification-card.tsx` | modified | Preview-disabled CTA | **review** | No | Yes — with A |
| `app/api/billing/portal/route.ts` | modified | 403 when preview | **review** | No | Yes — with A |
| `app/api/membership/checkout/route.ts` | modified | 403 when preview | **review** | No | Yes — with A |
| `app/api/verification/funds/route.ts` | modified | 403 when preview | **review** | No | Yes — with A |
| `app/api/verification/identity/route.ts` | modified | 403 when preview | **review** | No | Yes — with A |
| `foreman/reviews/APP_INFRA_01_FUNCTIONAL_SURFACE_REVIEW.md` | untracked | Maker review packet (recommends PATCH) | **keep** | No | Yes — docs-only lane |
| `lib/copy.ts` *(partial)* | modified | `infraPreview.*` + `dashboard.billing.previewShell` strings | **review** — split on commit | No | Yes — split from B/D |
| `app/globals.css` *(partial)* | modified | `.infra-preview-banner` styles | **review** — split on commit | No | Yes — split from B |

**Not touched:** `app/dashboard/crucible/page.tsx` (preview wired via panel component).

**Bucket file count:** 14 dedicated + 2 shared partial = **16 file touches**

---

## B. ENDER_VISUAL_TESTS

**Purpose:** Ender visual direction / tests 1–3 on home page — profile cards, lane cards, formation sequence. Separate from APP_INFRA; **UI_COMMIT HOLD** applies to app UI.

| File | Tracked | Purpose | Disposition | Blocks tsc/build | Own commit later? |
|------|---------|---------|-------------|------------------|-------------------|
| `app/page.tsx` | modified | Swaps people strip → `EnderVisualTestsSection` | **review** | No (imports exist) | Yes — after visual gate |
| `app/visual-system.css` | untracked | Visual-system styles | **review** | No | Yes — with B |
| `components/visual-system/ender-visual-tests-section.tsx` | untracked | Home section orchestrator | **review** | No | Yes — with B |
| `components/visual-system/formation-sequence.tsx` | untracked | Formation animation test | **review** | No | Yes — with B |
| `components/visual-system/lane-card.tsx` | untracked | Lane card component | **review** | No | Yes — with B |
| `components/visual-system/profile-card.tsx` | untracked | Profile card component | **review** | No | Yes — with B |
| `lib/visual-system/lanes.ts` | untracked | Lane data | **review** | No | Yes — with B |
| `lib/visual-system/profile-cards.ts` | untracked | Profile card showcase data | **review** | No | Yes — with B |
| `lib/visual-system/types.ts` | untracked | Shared types | **review** | No | Yes — with B |
| `app/globals.css` *(partial)* | modified | `@import visual-system.css`; anchor ids `#profile-cards`, `#lanes`, `#formation` | **review** — split on commit | No | Yes — split from A |
| `FROM_ENDER_VISUAL_DIRECTION_LOCK_v1.md` | untracked | Direction lock note | **keep** | No | Yes — docs |
| `foreman/reviews/ENDER_VISUAL_TESTS_1_3_REVIEW.md` | untracked | Ender test review packet | **keep** | No | Yes — docs |
| `foreman/IMAGERY_DIRECTION.md` | untracked | Imagery doctrine | **keep** | No | Yes — docs |
| `foreman/ghost-forge/IMAGERY_PROMPT_TEMPLATE.md` | untracked | Ghost Forge prompt template | **keep** | No | Yes — docs (no spend) |
| `foreman/platform-instructions/CLAUDE_ENDER_PROJECT_INSTRUCTIONS.md` | modified | Ender instruction shim | **keep** | No | Yes — docs |
| `foreman/handoffs/outbox/TO_ENDER_IMAGERY_DIRECTION_WIRE_v0.1.md` | untracked | Ender wire packet | **keep** | No | Optional |
| `foreman/handoffs/outbox/TO_ENDER_ENDER_IMAGERY_DIRECTION_v2_20260601-0428.md` | untracked | Ender imagery packet | **keep** | No | Optional |
| `foreman/handoffs/outbox/TO_ENDER_RELAY_ROLE_AWARENESS_SYNC_v0.1_*.md` (×3) | untracked | Relay sync packets | **keep** | No | Fold into C or archive |
| `components/foundry/icon-fallback.tsx` | modified | Minor icon tweak | **review** | No | Maybe — with B or site pass |
| `components/foundry/site-header.tsx` | modified | Minor header tweak | **review** | No | Maybe |
| `components/foundry/site-icon.tsx` | modified | Minor icon tweak | **review** | No | Maybe |
| `lib/site-icons.ts` | modified | Icon map addition | **review** | No | Maybe |
| `lib/workshop-facets.ts` | modified | Facet addition | **review** | No | Maybe |

**Bucket file count:** **22 file touches** (incl. shared + minor foundry tweaks)

---

## C. FOREMAN_GIMPDASH_RELAY

**Purpose:** Operator UX reset — Foreman control panel, crew dispatch console, relay courier, finance scaffold, handoff packets, cockpit sync. Cockpit marks **Operator UX Reset (accepted)**; separable from gated app UI.

| Area | Files (representative) | Tracked | Disposition | Blocks tsc/build | Own commit later? |
|------|------------------------|---------|-------------|------------------|-------------------|
| Control panel docs | `foreman/control-panel/README.md`, `RETEST_CHECKLIST.md`, `TOKENS_SYNC.md` | untracked | **keep** | No | Yes |
| Runtime secrets (local) | `foreman/control-panel/.local_token`, `foreman-control.pid` | untracked | **quarantine** — already in `.gitignore` diff | No | **Never commit** |
| Crew dispatch | `foreman/crew-dispatch/**` (~15 files) | untracked | **keep** | No | Yes |
| Dispatch console | `foreman/crew-dispatch-console/**` (~20 files) | untracked | **keep** | No | Yes |
| Finance scaffold | `foreman/finance/**` | untracked | **keep** | No | Yes |
| Foreman scripts (new) | `scripts/foreman/foreman-control-server.mjs`, `relay-courier*.mjs/ps1`, `crew-dispatch-*.ps1`, `finance-command.*`, `install-relay-courier.*`, `open-aeye-crew.mjs` | untracked | **keep** | No | Yes |
| Foreman scripts (mod) | `scripts/foreman/_foreman-core.mjs` | modified | **keep** | No | Yes |
| Launchers | `foreman-control.cmd`, `DISPATCH_GO.cmd`, `crew-dispatch.bat`, `open-aeye-crew.cmd` | untracked | **keep** | No | Yes |
| Cockpit state | `foreman/ACTIVE_AGENT.md`, `CURRENT_STATE.md`, `NEXT_ACTION.md`, `OPERATOR_DASHBOARD.md`, `SITE_MAP.md` | modified/untracked | **keep** | No | Yes — cockpit sync commit |
| Gates / checklists | `foreman/gates/APPROVAL_LOG.md` (mod), `OAUTH_STRIPE_OPERATOR_CHECKLIST.md` (new) | mixed | **keep** | No | Yes |
| Handoffs | `foreman/handoffs/inbox/**`, `outbox/**` (relay packets, paste blocks, archive, sent) | untracked | **keep** | No | Yes — or archive subfolder |
| Templates | `foreman/templates/**` | untracked | **keep** | No | Yes |
| Forensics review | `foreman/reviews/LOCAL_BLD_OPERATOR_GIMP_DASH_FORENSICS.md` | untracked | **keep** | No | Yes — docs |
| Operator screenshots | `foreman/*-check*.png`, `foreman/alt-tab-check.png` | untracked | **quarantine** | No | No — local evidence only |
| Dev logs | `foreman/next-dev-3000.log`, `foreman/next-dev-3000.err.log` | untracked | **quarantine** | No | No |
| `.gitignore` | modified | Ignore control-panel token/pid | **keep** | No | Yes — with C |
| Misc cockpit | `foreman/MASCOT_RULES.md`, `SITE_STYLE_APPROVED_v0.6.md`, `handoffs/outbox/OPEN_HANDOFF_HERE.md`, `PETRA_PASTE_BLOCK.txt` | modified | **keep** | No | Yes |

**Bucket file count:** **~159 file touches** (excl. edge profile)

---

## D. BELLOWS / EDUCATION / CONTENT FORGE

**Purpose:** Bellows public route shell, curriculum planning docs, Education Forge rename/stub — **separately gated** from APP_INFRA and Ghost Forge.

| File | Tracked | Purpose | Disposition | Blocks tsc/build | Own commit later? |
|------|---------|---------|-------------|------------------|-------------------|
| `app/bellows/page.tsx` | untracked | Public Bellows route shell | **review** | No (build includes `/bellows`) | Yes — after Bellows gate |
| `foreman/bellows/*.md` (×8) | untracked | Curriculum/product planning | **keep** | No | Yes — docs |
| `foreman/source_material/BELLOWS_MASTER_SOURCE_FROM_BEN.md` | untracked | Source material | **keep** | No | Yes — docs |
| `foreman/education-forge-output/` (1 file) | untracked | Forge output stub | **quarantine** | No | Review first |
| `education-forge/education-bellows-worker.stub.ts` | deleted | Renamed worker | **keep** change | No | Yes — with rename |
| `education-forge/education-forge-worker.stub.ts` | untracked | Renamed stub | **keep** | No | Yes |
| `education-forge/.env.example` | modified | Example env update | **keep** | No | Yes |
| `education-forge/README.md` | modified | Doc update | **keep** | No | Yes |
| `education-forge/lesson-template.md` | modified | Template update | **keep** | No | Yes |
| `education-forge/source-policy.md` | modified | Policy update | **keep** | No | Yes |
| `lib/copy.ts` *(partial)* | modified | `copy.bellows.*` strings | **review** — split on commit | No | Yes — split from A |

**Bucket file count:** **17 file touches**

---

## E. PACKAGE_TOOLING

**Purpose:** Local operator npm scripts + Playwright devDependency for foreman/relay automation — no app behavior change.

| File | Tracked | Purpose | Disposition | Blocks tsc/build | Own commit later? |
|------|---------|---------|-------------|------------------|-------------------|
| `package.json` | modified | Adds `relay:*`, `foreman` scripts; `playwright` devDep | **keep** | No (install already satisfied) | Yes — isolated tooling commit |
| `package-lock.json` | modified | Lockfile for playwright | **keep** | No | Yes — with package.json |

**Bucket file count:** **2**

---

## F. UNKNOWN_OR_RISKY

**Purpose:** Artifacts that pollute status, may contain secrets, or lack clear lane ownership.

| File / path | Tracked | Purpose | Disposition | Blocks tsc/build | Own commit later? |
|-------------|---------|---------|-------------|------------------|-------------------|
| `foreman/.edge-aeye-crew-profile/` | untracked | **Full Edge browser profile** (6,936 files) | **quarantine** — add to `.gitignore`; never commit | No | **Never** |
| `foreman/ghost-forge/gate-03-04-run.log` | untracked | Ghost Forge run log | **quarantine** | No | No |
| `foreman/ghost-forge/gate-05-style-variants-run.log` | untracked | Ghost Forge run log | **quarantine** | No | No |
| `foreman/ghost-forge/register-retry.log` | untracked | Ghost Forge run log | **quarantine** | No | No |
| `foreman/ghost-forge/ASSET_INVENTORY_STATUS.md` | modified | Gate 05 inventory note | **review** | No | Maybe — ghost-forge lane |
| `foreman/ghost-forge/DRAFT_SITE_ASSET_BATCH_v0.2.md` | modified | Batch direction doc | **review** | No | Maybe |
| `foreman/ghost-forge/GATE_05_STYLE_VARIANTS.md` | modified | Gate 05 status | **review** | No | Maybe |
| `public/assets/draft/ghost-forge/_import/` (3 PNGs) | untracked | Cursor workspace image imports | **quarantine** | No | No — relocate or delete |
| `sandbox/cursor-smoke-test/` (4 md files) | untracked | Local smoke tests | **quarantine** | No | No |
| `.cursor/rules/foreman-cockpit.mdc` | untracked | Cursor rule (local IDE) | **quarantine** | No | Optional — usually not repo |
| `docs/architecture.md` | modified | Architecture note (+8 lines) | **review** | No | Yes — after read |
| `foreman/handoffs/merge-conflicts.md` | untracked | Merge conflict notes | **review** | No | No — resolve then delete |

**Bucket file count:** **~6,955** (6,936 edge profile + ~19 other)

---

## Cross-bucket shared files (split before commit)

| File | Buckets | Action |
|------|---------|--------|
| `lib/copy.ts` | A + D | Split hunks: `infraPreview` → A; `bellows` → D |
| `app/globals.css` | A + B | Split hunks: `.infra-preview-banner` → A; visual-system import/anchors → B |
| `app/page.tsx` | B only for layout swap | Do **not** mix with A commit |

---

## Recommended extraction order (when construction resumes)

1. **Quarantine F first** — ignore/delete edge profile, logs, `_import` scratch, sandbox (de-noise ~6,950 paths; zero feature loss).
2. **Extract E (PACKAGE_TOOLING)** — smallest, isolated, no human gate.
3. **Extract C (FOREMAN_GIMPDASH_RELAY)** — cockpit-accepted operator infra; largest clean lane.
4. **Hold A + B + D** until Ben closes APP_INFRA human gate and visual/Bellows gates respectively.

**Next single lane to extract first:** **F quarantine (hygiene)**, then **C — FOREMAN_GIMPDASH_RELAY** as the first commit-worthy lane.

---

## Safety branch note

Branch `rescue/sally-dirty-worktree-2026-06-01` captures the current dirty tree pointer locally. Because **no commit** was made, the branch tip equals `main` at `HEAD`; all work remains in the working tree only. Push only after intentional commits and operator approval.

---

*Generated by Maker stabilization pass — read-only inventory, no construction.*
