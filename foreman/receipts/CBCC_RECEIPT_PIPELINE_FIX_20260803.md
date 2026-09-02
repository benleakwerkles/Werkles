# Receipt — CBCC receipt pipeline fixed, inbox cleared to zero

Execution context: `LOCAL_SALLY_WINDOWS`
Date: 2026-08-03
Foreman: Lady Jessica (VPGM)
Operator directive: fix the pipeline first, so unread receipts stop rotting silently.

## Root cause

`processInbox` validates every file and halts on the first failure, moving nothing. Correct
for atomicity. Catastrophic for visibility: nine replies froze the queue for 31 days and
nothing ever said so out loud. Two failure modes compounded it:

1. **GD-router receipts were judged against the wrong schema.** Seven replies carried the GD
   envelope (`router`, `run_id`, `mission_class`, `receipt_token`) and no cockpit hashes,
   because that router never issued any. Checked against the relay schema, each produced
   thirteen bogus "missing required field" errors and a `MISSING_SOURCE` status. They were
   valid cousin work the whole time.
2. **Hand-delivered receipts were indistinguishable from corruption.** Two files had no
   relay metadata block at all — the Operator pasted them in by hand. Both were reported as
   `MALFORMED`, which reads as "garbage, ignore", and one of them was the full design spec
   for the Recommendation View.

## Changes

`foreman/crew-dispatch/crew-relay-lib.mjs`

- `validateGdReceipt()` — GD-router replies validate on their own envelope: the five router
  fields plus a known cousin. No staleness check is possible without a cockpit hash, so every
  GD receipt now carries an explicit advisory warning saying exactly that. Overreach warnings
  and Ben-review flags still apply (the Skybro deploy flag still fires).
- `LEGACY_MANUAL` status — a reply with no `## Relay metadata` heading is classified as
  hand-delivered with one clear instruction, not a wall of errors. A file that *has* the
  heading but cannot be parsed stays `MALFORMED`.
- `inboxStatus()` — per-file status, cousin, and age in days; counts of blocked, readable,
  and hand-delivered.
- `formatInboxAlarm()` — loud banner when anything is waiting.
- `consumeReply()` — records a hand-delivered receipt as read and acted on, with a required
  note, and writes a `CONSUMED_MANUAL` summary. The only honest way to clear a receipt that
  can never satisfy the relay schema.
- `quarantineReply()` — parks an unusable reply in `inbox/quarantine/` with the reason in a
  `.reject.json`, so one bad file cannot freeze everything behind it.
- The halted-process message now names the exact command to run for each case.

`foreman/crew-dispatch/crew-response-intake.mjs` — new `alarm`, `status`, `consume`, and
`quarantine` commands. `alarm` exits 1 when anything is waiting, so it can gate other scripts.

`foreman/crew-dispatch/crew-vpgm-command.mjs` — **`issue` refuses to dispatch while any reply
is unread.** Override is `--ack-inbox`. This is the change that prevents the specific failure
that happened: asking a cousin a question he already answered.

`foreman/crew-dispatch/CREW_RELAY_AUTOMATION.md` — documents the commands, the guard, and the
status taxonomy.

## Proof

```text
node foreman/crew-dispatch/crew-response-intake.mjs run-fixtures     PASS 11/11
```

Three fixtures added, so this behavior is locked rather than trusted:

- `hand-delivered receipt reported as LEGACY_MANUAL` — status correct and exactly one error
- `GD router receipt accepted without relay fields` — validates and carries the advisory warning
- `unread reply raises a loud alarm` — counts correct and the banner fires

The pre-existing `malformed file rejected` fixture still passes as `MALFORMED`. It caught a
real bug in the first version of this change: the fixture's metadata block is unterminated, and
classifying on the extractor's error message misread it as hand-delivered. Classification now
keys on whether the heading exists at all.

Guard verified in both directions: with nine replies waiting, `issue` printed the alarm and
exited 1 without generating packets. With the inbox clear, `issue` proceeds to mission load.

## Inbox state

Cleared from nine waiting to zero.

| Reply | Disposition |
| --- | --- |
| `FROM_MAKER_RECOMMENDATION_VIEW_V1.md` | `consume` — implemented, note records what shipped and what did not |
| `FROM_ENDER_IMAGERY_AND_UX_FOR_MAKER_1.md` | `consume` — legibility verified; imagery and casting direction explicitly still open |
| 7 GD receipts (Petra, Ender, Skybro, Computer) | `process` — moved to `inbox/processed/` with summaries |

All seven GD receipts were read before processing. Two mission classes:

- **HOMEPAGE_VISUAL_NARRATIVE** (Ender, Skybro, Computer) — four-beat structure Spark, Space,
  Forge, Foundry. Converging warnings: do not collapse the beats into one hero, do not let
  Foundry become stock victory imagery, and do not span six verticals at once or the homepage
  reads as a creative-agency portfolio. Computer also flags hero legibility inside five seconds.
- **BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK** (Petra, Ender, Skybro, Computer) — four
  independent reads converge on one thing: **architecture before revenue.** All four
  recommend shipping one small paid artifact before more platform work, and all four name
  building cockpit depth while revenue is unproven as the thing to stop. All four record KS
  Construction status as UNKNOWN. Skybro's reply carries an active `FLAG FOR BEN REVIEW` for
  recommending deploy, which is a human gate.

That convergence is an Operator-level finding, not a code change, and it is left as-is for
Ben. Nothing in it was acted on.

## Still open

- Ender and Bean VPGM briefs were never sent; Ender's should be re-cut to cite his prior
  guidance before re-delivery. The dispatch guard now permits it since the inbox is clear.
- Response *capture* is still manual. The pipeline can now report and clear what arrives, but
  a cousin reply still only exists once someone saves it into the inbox.
- `alarm` is not wired into any scheduled check, so it only fires when something runs it.

No secrets entered. No deploy. No production data touched. `NEXT_ACTION.md` and
`CURRENT_STATE.md` untouched — their hashes remain baked into the outstanding packets.
