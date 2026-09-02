# Werkles VPGM Broad Rotation M7 Receipt

Date: 2026-08-23  
Foreman: Heimerdinker@Betsy  
State: `REVIEWED_BROWSER_LOCAL_PRACTICE_SUCCESS__GATE_05_CLOSED`

## Edge Relay provenance

Heimerdinker did **not** open or reactivate the Edge Relay during this turn.

Read-only process evidence shows the dedicated crew profile was launched on
2026-08-22 at 12:18:58 AM as PID 34608 with
`--user-data-dir=C:\Users\Ben Leak\github\Werkles\foreman\.edge-aeye-crew-profile`
and the five CBCC web seats plus localhost. The relay courier log records a
successful Petra load at `2026-08-22T04:19:06.250Z` using the PowerShell engine.
The launching parent process had already exited, so its complete command line
could not be recovered; the available evidence attributes the open Edge bay to
the prior crew relay/courier invocation, not spontaneous reactivation and not
this M7 turn.

## V

Vision packet written before implementation:
`foreman/handoffs/outbox/HEIMERDINKER_V_WERKLES_BROAD_ROTATION_M7_20260823.md`.

## P

Pulled and used custody-validated Bean and Skybro Formation / Operating Brief
receipts. Computer's latest visible return lacked receiver-computed custody and
was treated only as a source locator, not as controlling review.

## G

- Formation now shows each unfinished Operating Brief topic under **Still to
  settle** without copying private notes or inventing partner wording.
- A saved Operating Brief is restored only when it still matches the restored
  Formation draft and exact accepted member-authored wording.
- Changing accepted wording removes the stale Operating Brief and the derived
  First Shared Action instead of silently resurrecting revoked consent.
- Personal Bellows shows a shared action only when its validated Operating
  Brief source is still present and current.
- The Formation gap panel received an explicit hierarchy and a 16px status-text
  floor.

## M1

The broad route walk exposed a second stale-derived-state defect in Crucible.
Crucible previously accepted any structurally valid First Shared Action from
device storage. It now requires the current stored Operating Brief and validates
the action against that Brief's exact current step before displaying it.

The end-to-end M7 walk now covers:

`Formation -> Operating Brief -> Crucible -> Personal Bellows -> Formation`

It verifies a valid shared action appears in Crucible, an exact device return
works, and changed accepted wording invalidates both the older Brief and action.

## M2 / crew rotation

Fresh M7 packets were generated for Petra, Skybro, Ender, Bean, and Computer in
`foreman/crew-dispatch/missions/WERKLES_BROAD_ROTATION_M7_20260823.json`.

The background relay proof reached Computer's CDP endpoint but timed out during
connection; no packet is claimed sent through that path. Petra's exact packet
was sent through the established existing ChatGPT task without foreground
input. Petra returned the exact custody token and a terminal
`GO — bounded local-practice success only` verdict. The receipt is preserved at
`foreman/handoffs/inbox/FROM_PETRA_WERKLES_BROAD_ROTATION_M7_v0.1.md`.

Petra explicitly kept Gate 05 closed and forbade claims of real two-member
custody, legal agreement, production matching, provider activation, durable
account persistence, cross-device sync, or deploy readiness. Her next bounded
slice is a compact Practice Boundary Readout / Evidence Strip; it was not built
after the terminal stop ruling.

## Verification

- `npx tsc --noEmit` - PASS
- Operating Brief contract - PASS
- Shared-action continuity contract - PASS
- Personal Bellows source contract - PASS
- Bean hostile Formation browser walk - PASS
- Formation desktop/mobile legibility walk - PASS
- M7 Formation / Crucible / Bellows round trip - PASS, clean console
- Formation, Crucible, and Personal Bellows live routes - HTTP 200

Terminal browser result:

`PASS M7 Formation -> Operating Brief -> Personal Bellows: partial gaps visible, 16px status floor, exact device return, and stale brief/action invalidation.`

The test also visits Crucible and proves the validated shared action is present
before the stale-source mutation.

## Exact candidate evidence

```text
lib/werkle/operating-brief.ts|6887|651a03de753cd6d80af4076057421517e9e864e8159bb6b791a34748be9175b6
components/werkle/formation-workbench.tsx|38013|a5a690ab83df11d428e5577bee0ae5d4528acf1fd407df49fe0f8b4f617f04bd
components/bellows/bellows-device-draft-shelf.tsx|8253|d4c8dcdd50dd99585d966b729b0c5dedc883bded8ee485c56fb5f4811776d415
components/crucible/match-check-context.tsx|6748|5a76b3e0a7575bd8b5090aa74987daf1fcce3f4732d4268cc99f2bfc36842ecf
app/dashboard/werkles/formation/werkle-formation.css|45022|beaa73a3c63a3fa3bc66d98717215cbf0a95fd9a19a021a014cae39bd545923a
scripts/foreman/werkle-operating-brief-contract-smoke.ts|11312|bbf292394f52908fa005f7ef48793372591d8305bfb6652b7e63cbe3656aed01
scripts/foreman/werkle-shared-action-continuity-smoke.ts|3013|917eca18d1c5eba0a073f54f5c863bbd15f309a62f6457fd3f4787c5459b6afc
scripts/foreman/bellows-device-draft-shelf-smoke.mjs|1157|bdf131f4300ba7e0f5081d74e1e0d071977528d1c67de54d0f192d3c8e84c4be
scripts/foreman/werkle-formation-bean-hostile-browser-smoke.mjs|5288|2cba8147367a2328c07edbb0c3c4ad7375cae853c213711225418b13ab906eb7
scripts/foreman/werkle-formation-legibility-browser-smoke.mjs|7225|fb60e1f2cfc7b59954ec028356a81ef5aaef65ef8de3a2b0fed55111865f1149
scripts/foreman/broad-rotation-m7-operating-brief-browser-smoke.mjs|5460|a6fd0b704c9000532aa46cda783ee09d09e1923514cb4553b8a487c79fa69a96
```

## Hard edges preserved

No Codex subagent or new environment. No foreground mouse or keyboard input.
No provider call, credential, paid call, SQL/schema/RLS, production mutation,
push, deploy, or public launch. No account-durability claim. No outgoing packet
counted as participation.
