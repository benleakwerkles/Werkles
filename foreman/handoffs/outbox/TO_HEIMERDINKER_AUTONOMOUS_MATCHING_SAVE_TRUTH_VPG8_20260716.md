# TO HEIMERDINKER - AUTONOMOUS MATCHING SAVE TRUTH VPG8

Packet: `TO_HEIMERDINKER_AUTONOMOUS_MATCHING_SAVE_TRUTH_VPG8_20260716`
Primary seat: `Dink@Betsy` / Heimerdinker
Execution and scoped push owner: Heimerdinker
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch / starting HEAD: `maker/site-g-20260703` / `92a30814a244fd99a3df0fd334103f984431a76c` (go-live receipt advanced branch to `d183d8b` during P)
Public state: Autonomous Matching ON by durable operator approval; LLM OFF

## Goal

Keep the approved public Autonomous Matching mode while failing the recommendation page closed around unowned data. Until authenticated owner binding exists, the page must use an example with an empty ledger and saving must be visibly unavailable before a member clicks.

## Two G ideas

1. Keep public mode ON but make `/bellows/recommendations` example-only with an empty ledger and zero calls to global/latest intake, run, or packet readers until an authenticated owner-binding slice exists.
2. Disable all recommendation-save actions while the route is closed and put the reason beside the controls in calm member language. Keep the server `403` as defense in depth.

## Allowed product scope

- `components/squibb/recommendation-surface.tsx`
- `lib/squibb/public-recommendation-session-server.ts`
- one focused VPG8 test
- packets and receipts

## Acceptance

- public mode may remain ON while the page returns an explicit Autonomous Matching example
- personal/global intake, run, and ledger readers receive zero calls
- returned ledger is empty and a seeded private sentinel is absent
- save buttons visibly disabled before interaction
- adjacent copy says saving is unavailable during the current beta and nothing is sent
- no client POST is possible through the disabled controls
- direct POST still returns `403` with no writes
- no packet paths or personal ledger material are serialized into the page result
- no unrelated dirty file is absorbed

## P patch

Bean identified that the go-live commit turned the VPG6 OFF-only privacy proof into an unauthenticated global/latest read. This packet is amended in place as the minimal reopen condition. It does not build auth, roll back the approved public name/mode, or claim to solve ownership/export/deletion.

`READY FOR P`
