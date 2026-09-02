# FROM COMPUTER — SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821.md
- PACKET_SHA256: 9caeaa56a704ccbe935a368fe2d06553207384bd314fbf7b3625034f911ce920
- SUBMISSION_ID: SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821:COMPUTER:9caeaa56a704
- Posted at: 2026-08-21T07:04:03.575Z
- Harvested at: 2026-08-21T07:04:45.787Z
- Extracted via: div.prose
- Reply sha256: 517e5e3b5374dce9b7bc1d2c19e4be15fb5b3104628c6bb834a3861910e84850
- Reply chars: 7142
- CUSTODY: RECEIVED_WITHOUT_CUSTODY_CHALLENGE — RECEIVED block present, but neither the challenge nonce nor a matching packet hash was echoed.

---

FROM_COMPUTER_VPGM_SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821.md

RECEIVED
CUSTODY_TOKEN: (none supplied)
COUSIN: COMPUTER / THUFIR (CBCC seat)
PACKET: SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821.md
LANE_CHECK: IN_LANE — post-build review of the completed header-continuity slice, bounded to the four stated user rules and the three review questions; no mutation, no provider action.
BLOCKER: NONE. Review is against the summary as delivered; anything I flag is grep-and-verify by Heimerdinker.

Answer to Question 1 — did this satisfy the earlier conditions?

Match against the four conditions from the doctrine attack (pre-condition seal):

Ancestor-layout inheritance verification. Yes. Static AST audit that enumerates all 76 rendered app/**/page.tsx routes and computes ancestor-layout inheritance is Pass 1 of the three-pass method I named. This is the strongest of the three passes because it catches mid-tree layout replacement that a runtime crawl misses. Satisfied.

Canonical identity. Yes. id="werkles-site-header" on the shared header creates a single landmark the inventory can key on, and the canonical primary labels People, Story, Proof, Bellows, Membership are enumerated and stable. This satisfies the "not detected by presence alone" rule and the single-source nav vocabulary condition.

Duplicate / missing / replacement tripwires (N1, N2, N3).

N1 duplicate: satisfied. 73 ordinary routes resolve to exactly one canonical header; the "direct child headers were removed where needed to prevent duplicates" line specifically acknowledges the N1 vector and closes it.

N2 missing: satisfied for the 73 ordinary routes; the three exceptions are declared, versioned, and justified.

N3 replacement (a lookalike that differs in identity): satisfied at the identity layer because the shared component now has a stable ID and the primary labels are canonicalized. The evidence describes "one #werkles-site-header" and "one primary navigation with the canonical label order" per route, which is the exact identity check I named.

Explicit exceptions. Yes. Three exceptions, each with a stated category:

/gd/command-console — redirect-only utility (C1/C2-analog: not a member-facing rendered surface in the navigation sense).

/gd/speaker — redirect-only utility (same).

/soledash — intentionally separate full-screen operator app (C5 fullscreen focused surface) with a persistent visible Return to Werkles link. The C5 additional condition I named ("a fullscreen surface must have an obvious 'back to Werkles' affordance in the same visual position the primary nav would occupy, so navigation identity is preserved even when the primary nav is not shown") is met by the Return to Werkles link. Explicitly satisfied.

Two conditions from the attack that were softer but still meaningful:

Auth-state parity (Pass 3). Partially satisfied. The rendered walk covers "public, auth, Bellows, dashboard, Operator, proof, membership, and internal-tool routes," and the anonymous /dashboard → /login?next=/dashboard redirect was walked with the canonical header preserved. That covers the pre-auth-through-redirect path. The evidence does not explicitly state a signed-in walk over the same 33 routes. See the one grep-and-verify item below.

Versioned exception list. Satisfied at the summary level ("three versioned exceptions only"), assuming the exceptions are listed in a file under version control rather than only in the smoke script.

One remaining grep-and-verify item (does not block PASS)

The summary states the shared header exposes stable identity id="werkles-site-header" and that the signed-in mode "adds a member-navigation row; it does not replace the public row." This is the correct doctrine, and the walk implies it holds. What the summary does not explicitly claim is that a signed-in walk of the same 33 routes produced the same primary-nav label order and href set as the anonymous walk. Heimerdinker's next tripwire, if not already run, is one authenticated pass across the same routes with a DOM-signature diff against the anonymous pass. Allowed differences: a member-navigation row appearing in a labeled area. Disallowed: any change to the primary row's labels, order, or hrefs.

This does not block PASS on the current slice because the user rule under review is the sitewide-header presence and identity rule, not the auth-parity rule as an independent gate. Auth parity is a follow-on tripwire in the ranking/privacy and three-surface passes, not this one.

Answer to Question 2 — is any header-continuity defect visible in the evidence?

No header-continuity defect is visible in the delivered evidence:

76 routes enumerated; 73 shared, 3 declared exceptions — coverage is complete.

One canonical #werkles-site-header per rendered ordinary route.

One primary navigation per route with the canonical label order.

Soledash exception is C5-compliant (persistent Return to Werkles).

Redirect-only utilities are correctly out of scope for the navigation rule.

Operator surfaces now inherit one shared header at app/operator/layout.tsx, closing the multi-instance vector for that subtree.

If any defect exists, it is not visible in the summary and not implied by the evidence structure. A defect would have appeared as (a) more than one #werkles-site-header on a route, (b) a route with zero and no exception classification, or (c) a route whose primary nav labels or order deviated from the canonical set. None is reported.

Answer to Question 3 — should the TinkerDen hydration mismatches block?

No. Track separately.

Reasoning:

The hydration mismatches are on TinkerDen dynamic content, not on the shared header component or its ancestor layouts. They cannot alter the header-count result, and the evidence explicitly confirms they did not.

The doctrine rule under review is header continuity: presence, identity, and exceptions. Hydration correctness of unrelated dynamic content is a different rule with a different tripwire.

Bundling unrelated defects into a slice's blocking criteria is the exact anti-pattern the receipts have been guarding against: it lets scope creep dilute the honesty of the pass and encourages hiding real header defects behind unrelated fixes. The evidence stated the mismatches plainly ("browser log honesty") rather than expanding them into this slice, which is the correct posture.

A separate tripwire for TinkerDen hydration should exist in the next slice that touches that surface. Heimerdinker should open a follow-on task with the exact reproduction path and file scope. Not this pass.

Verdict

PASS.

The slice satisfies the four user rules and the doctrine-attack conditions I named. The route-inventory method is the correct instrument (static AST + rendered walk). The canonical identity is stable (#werkles-site-header + canonical labels). Duplicate, missing, and replacement tripwires are addressed structurally. Exceptions are versioned and explicit, and the fullscreen exception is C5-compliant. TinkerDen hydration mismatches are unrelated and should be tracked separately.

One optional follow-on for the next relevant slice: an authenticated

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
  "source_packet_id": "TO_COMPUTER_VPGM_SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821",
  "source_packet_file": "TO_COMPUTER_VPGM_SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": null,
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, unsupported doctrine, credentials, provider calls, schema, push, deploy, questionnaire submission, or spend.",
  "nextActionHash": null,
  "currentStateHash": null,
  "packet_sha256": "9caeaa56a704ccbe935a368fe2d06553207384bd314fbf7b3625034f911ce920",
  "submission_id": "SITEWIDE_HEADER_CONTINUITY_POSTBUILD_20260821:COMPUTER:9caeaa56a704",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "RECEIVED_WITHOUT_CUSTODY_CHALLENGE",
  "custody_token_echoed": null,
  "receiver_computed_hash": null,
  "generated_at": "2026-08-21T07:04:45.787Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
