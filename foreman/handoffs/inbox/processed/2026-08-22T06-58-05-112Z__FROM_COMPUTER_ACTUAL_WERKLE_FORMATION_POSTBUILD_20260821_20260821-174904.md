# FROM COMPUTER — ACTUAL_WERKLE_FORMATION_POSTBUILD_20260821

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_ACTUAL_WERKLE_FORMATION_POSTBUILD_20260821.md
- PACKET_SHA256: 45701b04673e349799e782b09eb67a444d318b78e29abef02380868c2ad9a515
- SUBMISSION_ID: ACTUAL_WERKLE_FORMATION_POSTBUILD_20260821:COMPUTER:45701b04673e
- Posted at: 2026-08-21T17:40:11.581Z
- Harvested at: 2026-08-21T17:49:04.340Z
- Extracted via: div.prose
- Reply sha256: f8ce6b1a7993279cc437109e533d71b85792c9e6e031bdb53ebfea7be83d78a3
- Reply chars: 11884
- CUSTODY: RECEIVED_WITHOUT_CUSTODY_CHALLENGE — RECEIVED block present, but neither the challenge nonce nor a matching packet hash was echoed.

---

FROM_COMPUTER_VPGM_WORKSHOP_TO_WERKLE_FORMATION_POSTBUILD_20260821.md

RECEIVED
CUSTODY_TOKEN: (none supplied)
COUSIN: COMPUTER / THUFIR (CBCC seat)
PACKET: TO_COMPUTER_THUFIR_POSTBUILD_WERKLE_FORMATION_20260821.md
LANE_CHECK: IN_LANE — post-build review bounded to the delivered slice and the three review questions; no code, no provider action, no signatures, no filings, no messages, no push, no deploy, no spend.
BLOCKER: NONE within scope. Attack against the summary as delivered. Anything I flag is grep-and-verify by Heimerdinker.

Verdict

PASS with two carryover items noted at the end. The slice closes the three PATCH items I opened in the pre-build attack and demonstrates the invariants against a real synthetic room. Carryovers do not block this pass; they belong to the next relevant slice.

Answer to Question 1 — did this close provenance, two-party consent, and the adviser boundary?

Match against the three PATCH items from the pre-build attack:

PATCH item 1 — Provenance state. Closed.

Twelve topics each keep two immutable source statements with author and source-Workshop provenance. That is invariant I1 from the pre-build attack ("originals are immutable AND provenance is preserved") satisfied in structural form, not decorative form.

The choice set — use owner wording, use partner wording, write jointly, keep out, park unresolved — makes provenance visible at the surface: every joint result derives from an identified original.

Reload restores exact wording plus 10 history events plus the two accepted shared statements. That is provenance-plus-history, which is the stronger form.

PATCH item 2 — Two-party consent as a first-class state. Closed.

"Both participants must choose combine and accept the exact same revision. Any edit creates a new revision and resets both approvals." That is invariant I2 ("two-party consent for any joint state transition") satisfied at the mechanism layer.

The rendered walk confirms the mechanic: editing accepted purpose moved it to Waiting on someone, revision 2, both approvals reset. Only after both accepted revision 2 did the shared floor update. This is exactly the "silent overwrite is not available as a bug" outcome.

Sub-states from the pre-build model are visible in surface names: Waiting on someone = proposed; Both accepted = accepted; Different answers = objected; Parked on purpose = parked. withdrawn is not explicitly named in the summary; see Carryover 1 below.

PATCH item 3 — Adviser-boundary state. Closed.

The floor gate is enforced: purpose, first customer, 30-day test, roles, decision rights, exit required for the room to be a Werkle, matching the pre-build minimum shared-company floor exactly.

The adviser handoff gate is enforced correctly: contributions, money, proof, IP, confidentiality, unknowns must be accepted or explicitly parked/objected with a note. private does not satisfy the adviser gate. That last clause is the critical one — it prevents a participant from hiding a topic to unblock advancement, which was the specific attack vector.

L1–L6 forbidden generation is enforced at the surface: "Entity type, percentages, tax treatment, wage rates, financing instruments, and contract clauses are not generated." That is the "cannot produce the forbidden output" posture I asked for, not a disclaimer.

All three PATCH items are closed.

Answer to Question 2 — can any state transition still present unilateral or disputed material as mutual?

Against each vector from the pre-build attack:

Silent overwrite of joint statement. Blocked. Any edit creates a new revision and resets both approvals. The Waiting on someone intermediate state is displayed.

Unilateral binding via combine. Blocked. Combine requires both members to choose combine on the exact same revision.

Laundered original. Blocked. Immutable source statements plus provenance.

Hiding disagreement. Blocked. Different answers is a first-class state; parked/private/disputed material never enters the shared company floor.

Erasing dissent after later agreement. Not proven in the summary but strongly implied by the 10-event history in the reload walk. See Carryover 2.

Advancing to adviser handoff by declaring topics private. Blocked by the explicit rule that private does not satisfy the adviser gate.

Cross-room or wrong-version restore leaking mutual state. Blocked. "Versioned local-device draft restores only for the same formation ID and fails closed for unknown versions or another room."

Match Deck laundering an unranked ID into a formation. Blocked. Match Deck carries the exact selected synthetic candidate; arbitrary non-ranked IDs fail back to the strongest eligible match.

I cannot identify a state transition in the delivered summary that presents unilateral or disputed material as mutual. Two edge cases warrant grep-and-verify:

G1 — Withdrawal of a pending proposal. The pre-build model named withdrawn as a distinct state ("the proposer retracts before acceptance"). The summary names Waiting on someone for proposed and does not name a withdrawal path. If the only way to escape Waiting on someone is for the counterparty to accept or object, a proposer has no clean retract. Heimerdinker tripwire: confirm the proposer can retract a Waiting on someone proposal before the counterparty acts, and that retraction returns the topic to its prior state (unstarted, or the last accepted revision) with a withdrawn event in history. This is not a blocking defect — the room is safe today because the counterparty controls acceptance — but it is a UX-integrity gap the summary does not close.

G2 — Objection persistence after later agreement. The pre-build attack required objection_note to survive later agreement so the room's process stays legible. The summary confirms notes exist and history is retained; the reload walk shows disagreement preserved. Heimerdinker tripwire: on a topic that moves objected → accepted, confirm the objection note and its author remain visible in the history view, not just the choice deltas. Same non-blocking status.

Neither G1 nor G2 alters the answer: no state transition in the delivered surface presents unilateral or disputed material as mutual.

Answer to Question 3 — is this valuable beyond a shared document while staying honest about local/synthetic persistence?

Yes on both axes.

Value beyond a shared document. Against the six-item list in the pre-build attack:

Structured provenance — delivered.

Two-party consent as a first-class state — delivered and demonstrated on the walk.

Objection persistence — delivered (history + notes).

Topic completeness gate — delivered (12 topics, floor + adviser handoff gate).

Advice-boundary enforcement at the surface — delivered (six forbidden generation categories).

Contextual Bellows tools tied to frictions — delivered.

A Google Doc cannot do any of these six honestly, and this slice does all six on real synthetic data.

Honesty of persistence. The slice makes the correct minimal claims:

"Device-saved and synthetic."

"No real person, company, invite, message, legal agreement, schema, or production record is claimed."

Restore fails closed for unknown versions or another room.

That is the QF19-style structural honesty from prior receipts: the surface does not describe a persistence property the code does not deliver. It also matches the current-truth doctrine — provider claim/event/grant schema and RLS are not applied; a room event log is member-authored content that would inherit retention row D2, not receipt row D3, when Werkles later persists rooms. Nothing in this slice contradicts that.

One phrasing check for the next surface iteration, not a blocker: the summary uses "device-saved" which is honest. The public phrasing should also confirm that another device or another browser will not see this draft. That is implied by "device-saved" but worth stating on the surface once, so the tester's mental model matches reality on a phone-then-laptop walk.

Carryovers (do not block PASS)

Carryover 1 — Add a first-class withdrawn state and path. Not blocking today because the counterparty controls acceptance. Ship in the next slice that touches formation state.

Carryover 2 — Confirm objection notes persist in history view after objected → accepted transitions. Strongly implied by the 10-event history reload; explicit grep-and-verify recommended in the next relevant slice.

Carryover 3 — Signed-in DOM-signature diff for the formation route. The sitewide header slice's carryover applies here too: an authenticated walk of /dashboard/werkles/formation?candidate=<id> with a DOM-signature diff against the anonymous walk (with anonymous redirect preserved) would make the auth-state parity check a first-class mechanical assertion for this surface. Not blocking; add to the next relevant slice.

Cross-check against prior receipts

Consistent with pre-build attack: state model closes silent-overwrite, premature-agreement, and unilateral-binding vectors.

Consistent with three-surface pre-code §5 tripwire (every claim traceable to a member-authored phrase) — the "quote on every card" analog here is provenance on every joint statement.

Consistent with Match Deck depth doctrine attack: honest count over false abundance — the formation surface refuses to advance the shared floor from private material.

Consistent with ranking/privacy attack T3 forbidden-input coverage — L1–L6 forbidden generation is the formation analog of the forbidden-input list.

Consistent with sitewide header continuity slice: the member header adds a stable Werkles destination for revisiting this formation surface, satisfying the "same nav names, same places, across sign-in" rule for this surface.

Consistent with Plaid-privacy work: no schema or production record is claimed; the surface's persistence claim is device-only.

What I would do next, and stop

Track Carryovers 1–3 as tripwires for the next slice touching formation state.

When Werkles later persists formation rooms across devices or across sessions, ensure the retention row (D2 member-authored content, per the Plaid-privacy retention matrix) is the one that governs, and that the event log inherits the same rule.

No code, no schema, no provider, no push, no deploy, no spend, no legal approval, no production users, no messages, no signatures, no filings.

Relay metadata
json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "COMPUTER",
  "custody_token": "none-supplied",
  "VERDICT": "PASS — provenance, two-party consent, and adviser-boundary PATCH items are closed structurally and demonstrated on the rendered walk. No state transition in the delivered surface presents unilateral or disputed material as mutual. Value beyond a shared document is delivered on six axes, and persistence claims are honestly device-and-synthetic. Three non-blocking carryovers noted for the next relevant slice: first-class withdrawn state and path; explicit persistence of objection notes across objected → accepted transitions in the history view; signed-in DOM-signature diff for the formation route as an auth-parity tripwire.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "whether a proposer can withdraw a Waiting-on-someone proposal before counterparty action; whether objection notes remain visible in the history view after later agreement; whether an authenticated DOM-signature diff has been run for the formation route against the anonymous baseline; whether the summary's 12 topics carry a stable topic_kind enum that a future adviser handoff could serialize without renaming",
  "source_packet_id": "TO_COMPUTER_THUFIR_POSTBUILD_WERKLE_FORMATION_20260821",
  "source_packet_file": "TO_COMPUTER_THUFIR_POSTBUILD_WERKLE_FORMATION_20260821.md",
  "nextActionHash": "pending-carryover-withdrawn-state-and-auth-parity-slice",
  "currentStateHash": "postbuild-werkle-formation-review-complete"
}

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "harvested_by": "FOREMAN_CDP_HARVEST_V1",
  "source": "COMPUTER",
  "cousin": "COMPUTER",
  "VERDICT": "PASS — provenance, two-party consent, and adviser-boundary PATCH items are closed structurally and demonstrated on the rendered walk. No state transition in the delivered surface presents unilateral or disputed material as mutual. Value beyond a shared document is delivered on six axes, and persistence claims are honestly device-and-synthetic. Three non-blocking carryovers noted for the next relevant slice: first-class withdrawn state and path; explicit persistence of objection notes across objected → accepted transitions in the history view; signed-in DOM-signature diff for the formation route as an auth-parity tripwire.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "whether a proposer can withdraw a Waiting-on-someone proposal before counterparty action; whether objection notes remain visible in the history view after later agreement; whether an authenticated DOM-signature diff has been run for the formation route against the anonymous baseline; whether the summary's 12 topics carry a stable topic_kind enum that a future adviser handoff could serialize without renaming",
  "source_packet_id": "TO_COMPUTER_VPGM_ACTUAL_WERKLE_FORMATION_POSTBUILD_20260821",
  "source_packet_file": "TO_COMPUTER_VPGM_ACTUAL_WERKLE_FORMATION_POSTBUILD_20260821.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": null,
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, unsupported doctrine, credentials, provider calls, schema, push, deploy, questionnaire submission, or spend.",
  "nextActionHash": "pending-carryover-withdrawn-state-and-auth-parity-slice",
  "currentStateHash": "postbuild-werkle-formation-review-complete",
  "packet_sha256": "45701b04673e349799e782b09eb67a444d318b78e29abef02380868c2ad9a515",
  "submission_id": "ACTUAL_WERKLE_FORMATION_POSTBUILD_20260821:COMPUTER:45701b04673e",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "RECEIVED_WITHOUT_CUSTODY_CHALLENGE",
  "custody_token_echoed": "none-supplied",
  "receiver_computed_hash": null,
  "generated_at": "2026-08-21T17:49:04.340Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
