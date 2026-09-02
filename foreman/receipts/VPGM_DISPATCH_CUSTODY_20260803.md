# VPGM dispatch under canon — CBCC_RECOMMENDATION_VIEW_REDTEAM

Date: 2026-08-03
Foreman: Lady Jessica (LOCAL_SALLY_WINDOWS)
Canon: `foreman/VPGM_OPERATING_CANON.md` sha256 `d22f7059cabd5e8adf1575adee9d1b3a489f68c34a71271ac07137b84c2b9496`
Verify: `node scripts/foreman/vpgm-canon-hash.mjs`

## The defect this closed

Three dispatches were reported successful today and produced zero cousin
responses. The courier inserted bytes into a composer, verified them by reading
them back, screenshotted, and reported `LOADED_AWAITING_HUMAN_SEND`. It had no
send capability at all — only `launch`, `status`, and `deliver`.

Canon P.3: "Text in a box is not dispatch." Canon P.1: do not ask the Operator to
carry bytes while a safe mechanical route remains. Both were being violated on
every run, and the receipts read as success.

Proof of the failure mode: Petra's composer held a verified 18,499 characters at
16:04 and 0 characters at 16:20. The page cleared itself and the packet was gone.
The same thing destroyed the Ender and Bean briefs earlier when the browser was
closed to unblock a build.

## What was built

`scripts/foreman/crew-dispatch-send.mjs` — the whole dispatch leg:

1. **Route proof (P.1).** Provider, account identity from rendered UI, target URL,
   native thread ID when exposed, composer callability, Send control presence and
   enabled state, SUBMISSION_ID, packet sha256. A visible tab and an open composer
   are explicitly not accepted as route proof.
2. **Compose (P.3).** Exact bytes via CDP `insertText`. No clipboard, no OS focus,
   no synthesized keystrokes. Stale composer content is cleared first so the
   provider receives the packet and nothing else. Head and tail are read back
   before anything is sent.
3. **Send (P.2, P.4).** The provider's own control, invoked exactly once through
   CDP. Enter is never synthesized. A missing control returns
   `SEND_CONTROL_UNAVAILABLE`; a disabled one returns `SEND_HANDS_UNAVAILABLE`.
4. **Post proof (P.5).** The packet's own head and tail must be readable in the
   destination transcript. An emptied composer, a click, or a spinner is not
   accepted. Records echo length, native thread ID, provider message attribute,
   timestamps, and a screenshot.
5. **Custody separated (P.6, P.7).** Best available result is
   `POSTED_NOT_CUSTODY`. Custody needs the receiver to return RECEIVED with its
   own computed packet hash.
6. **Idempotency (P.8).** `foreman/crew-dispatch/DISPATCH_LEDGER.jsonl`.
   SUBMISSION_ID is derived from the exact packet bytes, so a re-run cannot
   double-post and an edited packet is honestly a new submission.

`scripts/foreman/vpgm-canon-hash.mjs` — canon is hash-locked so a future session
can verify it instead of reconstructing it from memory, and returns
`OPERATING_CANON_NOT_VERIFIED` when it cannot.

## Authority checked before dispatch

- `HUMAN_GATES.md` — a cousin message is not a listed gate. Login, OAuth, and
  secrets are. Section "Human Gates Are Not Errands" forbids making Ben interpret
  provider UI when the Foreman can drive it.
- Canon SWATEYES — one continuation on the exact existing internal Aeye route is
  internal routing, not external communication, when task, project, receiver,
  action, destination, window, scope, and budget are proved. They are.
- `LANES.md` "Werkles.com Foreman — Lady Jessica", APPROVED. Allowed action:
  "cross-crew coordination via cockpit handoffs." Sending is in lane.
- Budget: zero-paid. No metered API, no billing action, existing subscriptions.
  `BUDGET.md` has no explicit CBCC dispatch lane; spend is $0.00 so nothing is
  blocked, but the missing lane should be written. Flagged, not self-authored,
  because budget edits are Tier 1.

## Lane law that was actually broken

`LANES.md`, walkthrough loop rule, expanded by the Operator 2026-07-31 to
red-team **both** ends: "Ben's live review feedback does NOT get built straight
onto the floor, and neither do the foreman's corrections… 4. Red-team the
corrections before landing." The corrections were landed first and red-teamed
after. That is a written rule, not an inference.

## Dispatch results

| Seat | Bytes | Send control | Transcript echo | Native thread ID | Result |
| --- | --- | --- | --- | --- | --- |
| PETRA / ChatGPT | 18,385 | `button[data-testid="send-button"]` | head+tail, 18,351 chars | not exposed on `/` | POSTED_NOT_CUSTODY |
| SKYBRO / Gemini | 18,785 | `button[aria-label*="Send"]` | head+tail, 18,873 chars | not exposed | POSTED_NOT_CUSTODY |
| ENDER / Claude | 18,149 | `button[aria-label*="Send"]` | head+tail, 18,087 chars | `5d2b54b4-a33d-482e-a78b-ce3b5d0f1b45` | POSTED_NOT_CUSTODY |
| COMPUTER / Perplexity | — | — | — | — | BLOCKED_RECEIVER_SIGNED_OUT |
| BEAN / DeepSeek | — | — | — | — | BLOCKED_RECEIVER_SIGNED_OUT |

Account evidence, read from rendered UI only, never from cookies or storage:
Gemini `Google Account: Ben Leak (ben.leak@kindsir.com)`; ChatGPT `Open profile
menu`; Claude signed in as Ben / ValleyVanguard. Perplexity showed a usable
composer with no account identity — an anonymous session, where a reply would be
unattributable and unrecoverable, so it is treated as signed out rather than
dispatched into.

Screenshots: `foreman/receipts/courier-proof/{PETRA,SKYBRO,ENDER}_posted.png`,
`{COMPUTER,BEAN}_route_blocked.png`.

## Grouped Operator gate

Two seats need sign-in in the courier Chrome window. Packets are preserved and
still owed. No substitution was made and no seat was marked declined or complete.

- DeepSeek (Bean, hostile audit)
- Perplexity (Computer, cited research)

`SEND_ACTION_EXECUTED: NO` for both. After sign-in:
`node scripts/foreman/crew-dispatch-send.mjs dispatch --cousins BEAN,COMPUTER`

## Next cycle, not this one

Replies land as receipts. `crew-response-intake.mjs` already alarms on unread
files and blocks new dispatch. There is no harvester that pulls a cousin's answer
out of a provider transcript into `foreman/handoffs/inbox/`, so that transfer is
currently manual. That is the next honest gap, and it is named rather than
papered over.
