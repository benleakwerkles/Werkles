# SKYBRO_BOOK_WORK_PACKET

MISSION: Book source lock and Skybro technology map handoff

STATUS: DRAFT / NO REWRITE

## Boundary

This packet is for book work only. It does not touch ThinkIt, Feral Membrane Main Dash, or Swanson's Relay Build.

The Betsy Desktop book source is already preserved under:

`source-truth-plan/references/betsy_desktop_nerdkle_the_book/`

That folder is raw source/reference material. It does not replace the source-truth plan and it does not make any included draft final canon by itself.

## Verified Source State

- Desktop source: `C:\Users\Ben Leak\Desktop\Nerdkle The Book`
- Repo reference: `source-truth-plan/references/betsy_desktop_nerdkle_the_book/`
- Desktop material files: `118`
- Repo material files: `118`
- Repo metadata files: `2`
- Missing in repo: `0`
- Changed against Desktop: `0`
- Extra material files in repo: `0`

## Important Delta

The older `BOOK_INTEGRATION_MAP_V0` said V5 and several exact chapter drafts were missing. That is now stale after the Betsy Desktop import.

Recovered high-value files include:

- `THE_TINKULARITY_CANONICAL_MANUSCRIPT_V5_RED_TEAM_DRAFT.md`
- `THE_TINKULARITY_CANONICAL_MANUSCRIPT_V4_RED_TEAM_DRAFT.md`
- `Skybro Neurosystem.docx`
- `CHAPTER_13_THE_NERVOUS_SYSTEM_DRAFT.md`
- `CHAPTER_14_CONSCIOUSNESS_NOTES.md`
- `MEDULLA_V0_TINKERDEN_BUILD_SPEC.md`
- `DOCTRINE_ORGAN_OBLIGATION_LAYER.md`
- `CHAPTER_DRAFT_OBLIGATION_OF_THE_ORGANS.md`

## Working Spine Recommendation

Use V5 as the current recovered editorial spine for source locking:

`source-truth-plan/references/betsy_desktop_nerdkle_the_book/THE_TINKULARITY_CANONICAL_MANUSCRIPT_V5_RED_TEAM_DRAFT.md`

Use V4 as the expansion/recovery source for appendices and organism inserts:

`source-truth-plan/references/betsy_desktop_nerdkle_the_book/THE_TINKULARITY_CANONICAL_MANUSCRIPT_V4_RED_TEAM_DRAFT.md`

Do not rewrite prose yet. First decide whether V5 or V4 is the working editorial branch.

## Skybro's Useful Job

Skybro should not "make the organism real" in prose. Skybro should map mechanism honestly:

1. Nervous system: filesystem watchers, event emitters, pub/sub, webhooks, queues, SSE, websockets.
2. Circulation: JSONL ledgers, file queues, SQLite event tables, Redis streams, NATS, MQTT.
3. Memory / inheritance: Git, audit logs, changelogs, SQLite/Postgres, document stores, knowledge graphs.
4. Lymphatic sampling: crawlers, scheduled scans, log analyzers, static analysis, stale-source detectors.
5. Immune system: policy engines, deterministic denylists, CI checks, security scanners, anomaly detection.
6. Medulla / autonomic loop: boring V0 pulse checks and receipt health before any platform ambition.

Primary Skybro input:

`source-truth-plan/references/betsy_desktop_nerdkle_the_book/TO_SKYBRO_THUFIR_TECH_MAPPING_PACKET.md`

## Files Created By This Pass

- `source-truth-plan/CHAPTER_SOURCE_LOCK.json`
- `source-truth-plan/SKYBRO_BOOK_WORK_PACKET.md`

## Next Gate

Ben chooses one:

- `LOCK_V5`: treat V5 as the editorial spine and begin chapter-by-chapter cleanup.
- `LOCK_V4`: treat V4 as the richer organism/manuscript spine and reconcile V5 into it.
- `SKYBRO_TECH_MAP_FIRST`: pause prose and have Skybro map the organism systems to boring V0 technologies before any chapter cleanup.

Recommended next move: `SKYBRO_TECH_MAP_FIRST`, because it reduces false mechanism claims before the prose hardens.
