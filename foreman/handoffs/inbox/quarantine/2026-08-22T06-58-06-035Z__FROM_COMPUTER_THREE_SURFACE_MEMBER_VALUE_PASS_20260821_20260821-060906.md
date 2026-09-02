# FROM COMPUTER — THREE_SURFACE_MEMBER_VALUE_PASS_20260821

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_THREE_SURFACE_POSTCODE_ATTACK_20260821.md
- PACKET_SHA256: 9405148c6fb94f532c7cac7965e68c7f1e9054820dc40ea2fa0efd93ddb1a65d
- SUBMISSION_ID: THREE_SURFACE_MEMBER_VALUE_PASS_20260821:COMPUTER:9405148c6fb9
- Posted at: 2026-08-21T06:08:13.230Z
- Harvested at: 2026-08-21T06:09:06.122Z
- Extracted via: div.prose
- Reply sha256: a47cef64d89e0b7740fe5dfb23413fb01a81de60b51b15afaa41afc413e4876f
- Reply chars: 7832
- CUSTODY: RECEIVED_WITHOUT_CUSTODY_CHALLENGE — RECEIVED block present, but neither the challenge nonce nor a matching packet hash was echoed.

---

FROM_COMPUTER_VPGM_THREE_SURFACE_MEMBER_VALUE_POSTCODE_ATTACK_20260821.md

RECEIVED
CUSTODY_TOKEN: (none supplied)
COUSIN: COMPUTER / THUFIR (CBCC seat)
PACKET: TO_COMPUTER_THUFIR_THREE_SURFACE_POSTCODE_ATTACK_20260821.md
LANE_CHECK: OUT_OF_LANE on direct file inspection — the twelve working-tree paths are not readable from Computer's sandbox. IN_LANE for the review-of-review this task actually needs: attack the pre-code synthesis and the "verification already run" claims against the doctrine, produce file-and-line-specific findings framed as tripwires the candidate must survive, and refuse to rubber-stamp on a green test suite alone.
BLOCKER: PARTIAL. Computer cannot open the diff. The attack below is written as file-scoped tripwires and specific failure signatures Heimerdinker or a human reviewer can grep for in each named file. Any finding I mark "grep-and-verify" is a required Heimerdinker step, not a Computer claim of guilt.

Refusing to rubber-stamp on the strength of "typecheck PASS, tests PASS, walk had no console errors" is the point of this seat.

Verdict

PATCH.

The verification set that was already run is a competence check, not a truth check. Every item on that list is compatible with the most dangerous failure mode named in the pre-code pass — polished decoupling — because that failure has no console error, passes typecheck, and can pass a smoke test whose fixtures the same author wrote. PATCH is granted on the specific findings below; PASS is available on a re-attack after the patch set lands and after Heimerdinker verifies the grep-level tripwires per file.

Attack answers, one by one
Q1 — Does the Snapshot language falsely imply account persistence or verified facts?

Likely yes, in two shapes. Grep-and-verify required.

Two failure signatures to look for in app/bellows/intake/page.tsx, components/squibb/concierge-intake-form.tsx, and components/squibb/source-document-panel.tsx:

Any string that reads "saved," "we remember," "your Werkles profile," "your Snapshot is stored," "verified," "confirmed," "validated," or "on file" without a matching disclosure of where and for how long. Werkles's current truth is that server-readable session continuity for Intake is incomplete and provider claim/event/grant persistence is not applied. Any language that implies durable account custody is a QF11-class overclaim carried into product copy.

Any string that presents an Intake answer back to the member as if the system has confirmed it against an external source — for example "Confirmed: you build in Georgia" or "We've verified your bottleneck is labor sourcing." Intake is member-authored. It reflects, it does not verify.

Required patch language (candidate strings):

Replace "your Snapshot is saved" with "your Snapshot is saved in this browser session; you can export it as text at any time." Add the export control if it is not already present.

Replace "verified" / "confirmed" reflections with "you said" or "based on what you told us."

Add one disclosure line at the top or bottom of the Snapshot surface: "This Snapshot is what you told Werkles today. It is not verified against any outside source and it is not shared until you take an action to share it."

Tripwire for Heimerdinker: grep -nE '(saved|remember|profile|verified|confirmed|validated|on file|stored)' app/bellows/intake/page.tsx components/squibb/concierge-intake-form.tsx components/squibb/source-document-panel.tsx and review each hit against the two rules above.

Q2 — Does Recommendations explain causality before demanding more user work?

Grep-and-verify. Two structural risks and a copy risk.

In components/squibb/recommendation-surface.tsx, the pre-code synthesis required every recommendation to cite a specific Snapshot line and name its evidence band. The failure signatures to look for:

A recommendation card that renders any call-to-action ("Log outcome," "Answer one more question," "Add detail," "Confirm") before the "because you said …" quote and the evidence band. If the CTA precedes the causality, the surface is demanding work before explaining why. Fix: reorder so the Snapshot quote and band appear above the CTA, in the same visual card, without a click to reveal.

A recommendation whose "why" is a category ("Founders like you often…") rather than a Snapshot quote. Category-level causality is the vague-advice failure mode from §5 of the pre-code pass. Fix: refuse to render a recommendation that cannot bind to a Snapshot quote; render an explicit empty state ("We don't have enough of your words yet to recommend a Next Move. Add one line to your Snapshot about 
𝑡
𝑜
𝑝
𝑖
𝑐
topic.") instead.

Any recommendation that asks the member to "complete your profile" or "unlock more" as a precondition for causality. That inverts the pattern: causality first, more work optional.

Tripwire for Heimerdinker: for every card component rendered by recommendation-surface.tsx, confirm the DOM order is {Snapshot quote} → {Evidence band} → {Next Move body} → {Optional CTA}, and that no card can mount without a bound Snapshot quote.

Q3 — Does Match Deck still echo the member, invent a reason, rank wealth, or pad weak people?

High-risk surface. Four specific tripwires. Grep-and-verify required across lib/ghost-fleet/interaction.ts, app/dashboard/intros/page.tsx, app/api/ghost-fleet/intros/current/route.ts, app/api/ghost-fleet/intros/preference/route.ts, and components/ghost-fleet/ghost-member-interaction-lab.tsx.

Tripwires:

Echo test. For any candidate card, if the "overlap" copy is a paraphrase of the member's own Snapshot line back at them ("You want to install concrete in Georgia — this member wants to install concrete in Georgia"), the card is same-lane wallpaper regardless of what the diversity smoke test says. The verification note says "ghost shortlist diversity — PASS" but a diversity metric on tags or lanes does not detect paraphrase-echo in the copy layer. Heimerdinker must review a sample of rendered overlap strings against the member's Snapshot for paraphrase distance, not tag distance.

Invented-reason test. For every card, the "reason" text must be traceable to a structured overlap field on the candidate object, not generated at render time from a template with the member's own words. If interaction.ts composes reason strings by inserting Snapshot phrases into a sentence template, the reasons are invented in the copy sense even if the fields are real. Fix: reasons must reference candidate-side facts ("this member has run three residential concrete jobs in the last year, tagged 
𝑙
𝑎
𝑏
𝑜
𝑟
𝑠
𝑜
𝑢
𝑟
𝑐
𝑖
𝑛
𝑔
laborsourcing") not member-side facts.

Wealth-rank test. Werkles doctrine forbids ranking by wealth, balance, net worth, band, or excess above a threshold. Any field on the candidate object named balance, revenue, netWorth, wealth, tier, band, income, arr, arrBand, or any comparator that treats a larger number as a better match, is a doctrine violation. The Backer-lane Plaid check is boolean-plus-date, not a rank input. Heimerdinker must grep the ghost-fleet source and the API route files for those field names and confirm none is read by the ranking function. Grep pattern: grep -nE '(balance|revenue|netWorth|wealth|tier|band|income|arr|arrBand)' lib/ghost-fleet/interaction.ts app/api/ghost-fleet/intros/*.ts components/ghost-fleet/ghost-member-interaction-lab.tsx. Any hit that is not a comment must justify itself against doctrine or be removed.

Padding-weak-people test. "Location-aware ranking PASS" and "hostile recommendation summary PASS" are compatible with a card set that pads a thin shortlist by dropping the evidence-band floor to fill slots. Fix: when the honest evidence-band pool is smaller than the target card count, the surface must render fewer cards with a labeled empty state ("Only two

---

## Relay metadata

```json
{
  "schemaVersion": null,
  "harvested_by": "FOREMAN_CDP_HARVEST_V1",
  "source": "COMPUTER",
  "cousin": "COMPUTER",
  "VERDICT": null,
  "CONFIDENCE": null,
  "UNKNOWNS": null,
  "source_packet_id": "TO_COMPUTER_VPGM_THREE_SURFACE_POSTCODE_ATTACK_20260821",
  "source_packet_file": "TO_COMPUTER_VPGM_THREE_SURFACE_POSTCODE_ATTACK_20260821.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": null,
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, unsupported doctrine, credentials, provider calls, schema, push, deploy, questionnaire submission, or spend.",
  "nextActionHash": null,
  "currentStateHash": null,
  "packet_sha256": "9405148c6fb94f532c7cac7965e68c7f1e9054820dc40ea2fa0efd93ddb1a65d",
  "submission_id": "THREE_SURFACE_MEMBER_VALUE_PASS_20260821:COMPUTER:9405148c6fb9",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "RECEIVED_WITHOUT_CUSTODY_CHALLENGE",
  "custody_token_echoed": null,
  "receiver_computed_hash": null,
  "generated_at": "2026-08-21T06:09:06.122Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
