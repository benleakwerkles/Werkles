# FrankIntention Build Coordination

Status: ACTIVE COORDINATION DRAFT

## Single Build Root

Build the FrankIntention / Nerdkle organism in this one workspace:

`C:\Users\benle\Documents\Werkles`

Do not fork the body into `C:\Dev\Werkles`. That folder is source material and recovered lore only.

## Why This Root

- `AGENTS.md` directs Codex to stay in `C:\Users\benle\Documents\Werkles` unless Ben explicitly asks for a new workspace.
- The current local organism evidence already lives here:
  - `data/organism/`
  - `speaker/`
  - `tinkerden/`
  - `tinkarden/`
- The in-app browser is already pointed at the local dashboard flow for this workspace.
- `foreman/speaker/` has now been ported here from `C:\Dev\Werkles` so Speaker lore is local to the active body.

## Source Material

Primary sources to build from:

- `foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md`
- `foreman/speaker/SPEAKER_CHARTER.md`
- `foreman/speaker/SPEAKER_DOCTRINE.md`
- `foreman/speaker/CAUSAL_LEDGER.md`
- `foreman/speaker/AEYE_ROLE_REGISTRY.md`
- `foreman/nerdkle/NERDKLE_KERNEL_V0.md`
- `foreman/nerdkle/thread_registry.json`
- `data/organism/*.jsonl`
- `speaker/receipts/raw/inbox/*.json`
- `tinkerden/dispatch/packets/*.json`
- `tinkarden/contracts/README.md`

GitHub source-truth branches:

- `book/architecture-stream-split-v0-20260627`
- `nerdkle/nervous-system-organs-v0-20260627`
- `nerdkle/nmclr-proof-body-preserve-v0-20260627`
- `nerdkle/receipt-crawler-v0-20260627`

These are review-branch sources, not automatic canon. Use `foreman/nerdkle/source_intake/`, `foreman/artifacts/nerdkle_github_source_material_status.json`, `foreman/artifacts/nerdkle_materialized_source_status.json`, and `foreman/artifacts/nerdkle_source_work_queue.json` to verify branch/object existence, materialize local read snapshots, and rank safe next work while preserving the proof boundary.

## Build Rule

Every `G` should advance this same body:

1. Read source/cockpit files.
2. Add or tighten one kernel organ.
3. Produce file-backed proof.
4. Update receipt/handoff.
5. Stop before human gates.

No dashboard success claim is valid without a generated proof artifact.

## Organ Map

| Organ | Folder | Rule |
| --- | --- | --- |
| Speaker / causal memory | `foreman/speaker/` | Preserves why; no execution; Ben ratifies |
| Kernel contract | `foreman/nerdkle/` | Defines body rules and verifiers |
| Event bus | `data/organism/` | Append-only proof/events |
| Receipts | `speaker/receipts/raw/inbox/` | Strict JSON receipt intake |
| Dispatch packets | `tinkerden/dispatch/packets/` | Outbound local packet objects |
| Aeye local tracks | `tinkarden/aeyes/` | Local inbox/chat/answer evidence |
| Execution contract | `tinkarden/contracts/` | Dry-run, shadow-merge, immutable receipts |

## Work Split

### Codex / Dink@Sally

- Own `foreman/nerdkle/` kernel files.
- Own `foreman/speaker/` preservation and source-manifest notes.
- Own evidence-only local verifiers.
- Own handoff receipts under `foreman/handoffs/`.

### Maker@Doss

- Should use `C:\Users\benle\Documents\Werkles` as the canonical project root or mirror this root exactly on Doss.
- Should not introduce a second FrankIntention project folder.
- Should build UI only after kernel proof exists.
- Should consume:
  - `foreman/artifacts/nerdkle_kernel_v0_status.json`
  - `foreman/nerdkle/thread_registry.json`
  - `foreman/speaker/CAUSAL_LEDGER.md`
- Should write its result receipt back to `foreman/handoffs/`.

## Current Coordination State

Codex searched for a visible Maker@Doss Codex thread and did not find one.

Until a live Maker@Doss thread is available, this file is the coordination point. Maker@Doss should read this file first and either:

- ACK the root choice, or
- return a BLOCKER naming the exact conflicting Doss path.

## First Shared Goal

Build `NERDKLE_KERNEL_V0` until this sequence returns no missing local proof except external thread identity and explicit GitHub review-branch promotion boundaries:

```powershell
node foreman\nerdkle\ingest-github-source-material.mjs
node foreman\nerdkle\materialize-github-source-material.mjs
node foreman\nerdkle\run-nmclr-sandbox-execution-proof.mjs
node foreman\nerdkle\build-source-work-queue.mjs
node foreman\nerdkle\ingest-thread-identity-claims.mjs
node foreman\nerdkle\verify-nerdkle-kernel.mjs
```
