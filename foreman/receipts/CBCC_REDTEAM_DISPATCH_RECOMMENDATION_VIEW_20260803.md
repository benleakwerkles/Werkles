# CBCC red team dispatch — Recommendation View correction pass

Date: 2026-08-03
Foreman: Lady Jessica (LOCAL_SALLY_WINDOWS)
Mission: `foreman/crew-dispatch/missions/CBCC_RECOMMENDATION_VIEW_REDTEAM_20260803.json`
Master packet: `foreman/handoffs/outbox/RELAY_VPGM_CBCC_RECOMMENDATION_VIEW_REDTEAM_v0.1_20260803-1554.md`

## Why this exists

The Operator's ruling, verbatim in substance: the Foreman found CBCC artifacts, built against
them alone, self-tested, and reported done — twice in one session, after being told not to work
unilaterally. Five seats catching each other's mistakes beats one seat grading its own homework.

This dispatch puts the correction pass in front of the crew instead of in front of Ben.

## What is under review

The Recommendation View rebuild of `/dashboard/intros`, plus everything that shipped alongside it
in the same unreviewed pass: widened signal patterns, the two-word evidence rule, the new
stop-word list, verdict-locked doors, the permanently disabled knock, the receipt-pipeline
classification change, and two environment changes.

Packets are self-contained. Cousins cannot read the repo, so every verdict string, band
threshold, ladder rung, and measured number is quoted verbatim in the paste block.

## Evidence gathered before dispatch, so no seat has to guess

Contrast measured from the live DOM rather than estimated:

| Element | Contrast | Font size | AA |
| --- | --- | --- | --- |
| Verdict heading | 17.51:1 | 23px bold | pass |
| Verdict body paragraph | 11.6:1 | **12.2px bold** | pass |
| Receipt paragraph | 11.6:1 | **12.2px bold** | pass |
| Strength band label | 11.6:1 | **11.2px** | pass |
| Disabled-knock explanation | 17.51:1 | 13.1px | pass |
| Reason text | 11.6:1 | 14.7px | pass |
| Alternative text | 11.6:1 | 14.4px | pass |

Contrast is not the defect. Size is: body copy is rendering at 12.2px **bold**, which reads as an
inherited style clash rather than a decision. The Foreman found this only by measuring after the
fact and has **not** changed it. Ender rules on it; that is his lane, and his prior legibility
brief was one of the two receipts that sat unread.

## Found while preparing the packet — two repo trees

Not acted on. Reported for a ruling.

There are two Werkles directories on Sally:

- `C:\Users\Ben Leak\github\Werkles` — live. Server, builds, and every change described above.
- `C:\Users\Ben Leak\Desktop\github\Werkles` — a 2026-07-03 snapshot whose `.git/HEAD` was
  renamed to `HEAD-retired-local-20260703-043815`, which is why git refuses to recognise it as a
  repository at all.

Two facts make this more than housekeeping:

1. The retired tree's `app/globals.css` was modified **2026-07-31** (234,071 bytes against
   268,634 in the live tree). Something wrote into a dead tree three weeks after it was retired.
2. The Operator's editor has the **retired** tree configured as its workspace root. The file tree
   Ben looks at is not the tree that builds and serves.

That is a live candidate explanation for pages not loading, wrong images landing in slots, and
copy not matching what was written. Routed to Skybro (mechanism, safe resolution order, guard)
and Petra (gate ruling, and what the Foreman owes Ben about which files he has been reading).
Nothing moved, renamed, or deleted.

## Assignments

| Seat | Platform | Charge |
| --- | --- | --- |
| ENDER | Claude | Does the build honor Maker's spec or only its checklist. Verdict copy as scold vs guidance. `Saw:`/`Matters:` labels. The 12.2px bold measurement. Band words. Section order vs spec. |
| BEAN | DeepSeek | False positives from the widened patterns, with a written intake that produces a wrong verdict. Ladder bias (capital checked before partner). False negatives from the two-word rule. `trust` and `real` as stop words in a trust product. Unreachable HIGH confidence. Whether the env loosening widened a gate. Whether `--ack-inbox` is a real guard or theater. |
| PETRA | ChatGPT | Rule on the process failure. GO/NO-GO. Five gate items including closing Ben's browser and discarding two unsent briefs. Whether self-written consume notes can close another seat's spec. The two-tree gate. One standing rule to cut rework. |
| SKYBRO | Gemini | The two-tree problem first. The in-repo browser profile that broke every build via EBUSY. The orphaned server process. Env flag sprawl and enforcement vs intent. Unhashed GD receipts. Preview persistence options with gates. |
| COMPUTER | Perplexity | Cited: score vs band precedent, transparency arguments for and against hiding a score you still act on, advice-boundary exposure for "build proof before asking for a Backer", unreachable confidence scales, typography minimums. |

## Delivery state

Courier: `scripts/foreman/chrome-cdp-courier.mjs` (Chrome + DevTools protocol, no focus theft,
no clipboard, read-back verified, screenshot proof).

| Seat | Chars sent | Chars verified in composer | State |
| --- | --- | --- | --- |
| PETRA | 18,357 | 18,499 | LOADED_AWAITING_HUMAN_SEND |
| SKYBRO | 18,755 | 18,894 | LOADED_AWAITING_HUMAN_SEND |
| ENDER | 18,121 | 18,263 | LOADED_AWAITING_HUMAN_SEND |
| COMPUTER | 17,524 | 17,524 | LOADED_AWAITING_HUMAN_SEND |
| BEAN | — | — | **BLOCKED: DeepSeek is at a sign-in screen** |

Screenshots: `foreman/receipts/courier-proof/<SEAT>_composer_loaded.png`.

Verified-count exceeding sent-count is the composer's own trailing structure, not drift. The
courier requires the head and tail of the paste to be present before it reports success.

## Human gates

1. **Send.** Four composers hold their packet. The Foreman does not press Send.
2. **DeepSeek login.** Bean's seat needs credentials. The Foreman does not enter them.
3. **Two-tree resolution.** Nothing will be moved or deleted without the Operator.

## Standing correction

No further building on this slice until receipts land. Replies go to
`foreman/handoffs/inbox/`; `crew-response-intake.mjs alarm` exits non-zero while any wait, and
dispatch is blocked while any are unread.
