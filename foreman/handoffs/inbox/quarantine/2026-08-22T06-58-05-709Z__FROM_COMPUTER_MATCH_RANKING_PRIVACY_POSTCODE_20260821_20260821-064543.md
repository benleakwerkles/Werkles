# FROM COMPUTER — MATCH_RANKING_PRIVACY_POSTCODE_20260821

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_MATCH_RANKING_PRIVACY_POSTCODE_20260821.md
- PACKET_SHA256: 8fd0f98100da87d61df2907baf085e7f38d8f1d9558392980576afb9b903e817
- SUBMISSION_ID: MATCH_RANKING_PRIVACY_POSTCODE_20260821:COMPUTER:8fd0f98100da
- Posted at: 2026-08-21T06:45:05.559Z
- Harvested at: 2026-08-21T06:45:43.412Z
- Extracted via: div.prose
- Reply sha256: a8e9dae16afde96b5585819564c13804e86f6bd7e9abe262aae9b67de5a37490
- Reply chars: 4517
- CUSTODY: RECEIVED_WITHOUT_CUSTODY_CHALLENGE — RECEIVED block present, but neither the challenge nonce nor a matching packet hash was echoed.

---

FROM_COMPUTER_VPGM_MATCH_RANKING_AND_PRIVACY_POSTCODE_SEAL_20260821.md

RECEIVED
CUSTODY_TOKEN: (none supplied)
COUSIN: COMPUTER / THUFIR (CBCC seat)
PACKET: TO_COMPUTER_THUFIR_POSTCODE_RANKING_PRIVACY_SEAL_20260821.md
LANE_CHECK: IN_LANE — post-code attack on the ranking/privacy seal candidate summary; no implementation, no provider actions, no push, no deploy.
BLOCKER: Computer cannot open the working tree. This attack is against the exact candidate summary as stated. Anything I flag "grep-and-verify" is a required Heimerdinker step; anything I flag as satisfied is satisfied conditional on the summary being faithful to the code.

Verdict

PATCH.

The candidate has moved substantially in the right direction. The versioned ghost-ranking-input/v1 profile with a hand-enumerated field set is a meaningful code boundary — the strongest structural expression of the prior tripwire T3 the candidate could reasonably ship in one pass. The removal of the three-reason truncation and the alignment of rank to visible deck order close two prior explanation-drift vectors. The /privacy#matching-boundary disclosure surfaces the doctrine at the right layer.

PATCH, not PASS, because the summary describes seven items that carry residual risk against the four attack axes named in the task — explanation drift, proxy laundering, misleading current-versus-future claims, and whether the narrow profile is a real boundary. Each risk has a specific patch that does not require schema, provider, or deploy work.

Attack, axis by axis
Axis 1 — Explanation drift

Two closed. Two open.

Closed by the candidate:

Truncation removed; every engine-produced positive reason is displayed. This was the largest drift vector in the pre-seal state.

rank is computed after scoring and useful-variety selection and matches visible deck order, so the on-screen numbering is not a decorative overlay.

Open:

D1 — Emission audit is not asserted. The summary says the explainer receives "every positive engine-produced reason." It does not say the ranker emits, per card, the exact ordered list of (field_name, member_side_value, candidate_side_value, weight) tuples it read, and that the explainer text is a pure function of that emission. Without the emission, "every positive reason" is auditable only by reading the ranker source, not by reading a card. Patch D1: emit the tuples and derive the explainer from them, so a reviewer holding one card and one emission can prove equivalence in two seconds.

D2 — Useful-variety selector is a silent stage. The summary states variety selection happens between scoring and rank assignment. A card's presence in the deck is therefore a function of two stages, but the explainer describes only the scoring stage. When variety selection promotes a card past a higher-scoring one, the card's placement has a reason the member cannot see. Patch D2: either surface the variety reason on any card whose placement was changed by the selector ("shown here for range across lanes / roles / cities") or restrict the selector to reordering-only within already-selected cards so placement stays fully explained by score.

Both patches are code-shape changes; neither is a schema or provider action.

Axis 2 — Proxy laundering

The GhostRankingProfile field set is the right cut, and hand-enumeration inside a frozen mapper is the strongest guard the candidate could ship. Three remaining exposures:

P1 — city/state is the largest proxy surface still on the profile. City granularity is fine as an overlap; state granularity is fine. What must be prevented is any future silent widening of the location field to include ZIP, census block, neighborhood, or metro-median-income joins. Patch P1: the type of the location field on GhostRankingProfile should be a discriminated union with a hard ceiling at { city: string; stateCode: string } and no ZIP/postal/neighborhood/metro variants; the mapper should reject candidates with richer location data by discarding the extra fields at the type boundary rather than accepting them and hoping the ranker ignores them.

P2 — skills, offers, seeks, lane, role can encode industry-wage proxies. These are legitimate overlap fields, but any ranking function that upweights a specific value (e.g., titles that correlate with high income) is doing proxy ranking with plausible deniability. Patch P2: the ranker's weight on these fields must be symmetric — overlap present or absent, same weight both ways, no bonus for values that happen to correlate with income.

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
  "source_packet_id": "TO_COMPUTER_VPGM_MATCH_RANKING_PRIVACY_POSTCODE_20260821",
  "source_packet_file": "TO_COMPUTER_VPGM_MATCH_RANKING_PRIVACY_POSTCODE_20260821.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": null,
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, unsupported doctrine, credentials, provider calls, schema, push, deploy, questionnaire submission, or spend.",
  "nextActionHash": null,
  "currentStateHash": null,
  "packet_sha256": "8fd0f98100da87d61df2907baf085e7f38d8f1d9558392980576afb9b903e817",
  "submission_id": "MATCH_RANKING_PRIVACY_POSTCODE_20260821:COMPUTER:8fd0f98100da",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "RECEIVED_WITHOUT_CUSTODY_CHALLENGE",
  "custody_token_echoed": null,
  "receiver_computed_hash": null,
  "generated_at": "2026-08-21T06:45:43.412Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
