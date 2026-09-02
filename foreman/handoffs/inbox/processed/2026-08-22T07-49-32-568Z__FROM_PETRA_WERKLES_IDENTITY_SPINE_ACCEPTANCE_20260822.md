# From Petra — Identity Spine Acceptance

Date harvested: 2026-08-22  
Existing provider task: `6a3019f8-3b50-83ea-8bcb-c8dde82fb498`  
Personal work: `YES`  
Subagents or downward delegation: `NONE`  
Terminal state: `IDENTITY_SPINE_ACCEPTANCE_READY`

## Acceptance rubric

- **Account identity:** GO only if one account survives refresh, new tab, browser
  restart, logout/login, and token refresh. Login loops, duplicate identity,
  tab-local identity presented as account identity, or silent switching BLOCK.
- **Intake:** GO only if every accepted answer rehydrates exactly across all
  authenticated recovery paths. Lost answers, demo values, or browser-only work
  represented as saved BLOCK.
- **Workshop:** GO only if the canonical Workshop returns identically with
  deterministic provenance. Missing, stale, duplicate, or forked state BLOCK.
- **Profile:** GO only if edits persist and agree everywhere. Conflicting state or
  unsaved edits presented as committed BLOCK.
- **Recommendations:** GO only if they resume from persisted canonical member data.
  Ranking tuning may PATCH; generic/demo output after authentication BLOCKS.
- **Browser recovery:** GO only if refresh/reopen resumes the correct member
  truthfully. False or lossy recovery BLOCKS.

## Minimum evidence

Refresh, new-tab, browser-restart, logout/login, and fresh authenticated
session/device recovery must all be observed. Intake, Workshop, Profile, and
recommendation continuity must be proved from canonical member data. Draft and
account-saved states must be visibly distinct, authenticated demo/bakery fallback
must be absent, and every transition needs observable evidence.

## Remove or merge

- Remove duplicate persistence paths for the same artifact.
- Merge account state behind one canonical persistence authority.
- Remove ambiguity between browser drafts and account-saved records.
- Remove authenticated demo-state fallbacks.
- Merge recovery behind the canonical identity spine instead of parallel session
  logic.

## Post-build seal

Packet: `WERKLES_IDENTITY_SPINE_SEAL_V1`

Seal only when canonical identity, Intake, Workshop, Profile, recommendation
continuity, all recovery paths, explicit draft/account truth, no demo fallback,
one canonical persistence authority, and observable evidence are all present.

Do not claim `durable`, `persistent`, or `account-saved` before the entire seal
has evidence.

