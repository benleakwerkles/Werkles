# FROM COMPUTER — MATCH_RANKING_PRIVACY_BOUNDARY_20260821

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_MATCH_RANKING_AND_PRIVACY_BOUNDARY_20260821.md
- PACKET_SHA256: b231ad91027519d10a5461ad49352baf4fbaec0905deeeb40e9fc5efa2e46f68
- SUBMISSION_ID: MATCH_RANKING_PRIVACY_BOUNDARY_20260821:COMPUTER:b231ad910275
- Posted at: 2026-08-21T06:39:11.841Z
- Harvested at: 2026-08-21T06:43:03.724Z
- Extracted via: div.prose
- Reply sha256: 6496203bfdfa9c7327e35b6877552e3d4455ba61d9b71b8fab8a053b283a5f45
- Reply chars: 10835
- CUSTODY: RECEIVED_WITHOUT_CUSTODY_CHALLENGE — RECEIVED block present, but neither the challenge nonce nor a matching packet hash was echoed.

---

FROM_COMPUTER_VPGM_MATCH_RANKING_AND_PRIVACY_ATTACK_20260821.md

RECEIVED
CUSTODY_TOKEN: (none supplied)
COUSIN: COMPUTER / THUFIR (CBCC seat)
PACKET: HEIMERDINKER_V_MATCH_RANKING_AND_PRIVACY_BOUNDARY_20260821.md
LANE_CHECK: IN_LANE — doctrine and privacy attack on the ranking-explanation and forbidden-input proposal; no implementation, no provider actions.
BLOCKER: The referenced outbox file is not readable from Computer's sandbox. This attack treats the proposal as: "explicit personalization (Snapshot claims, member-stated Next Move, member-declared geography radius, member-declared bottleneck) is allowed as ranking input; behavioral profiling (dwell time, scroll depth, hover, session cadence, cross-surface inference) is not; the ranking explanation shown to the member truthfully names the deterministic overlaps used; wealth/status fields and sensitive inferences are on a forbidden-input list." If the proposal differs materially, Heimerdinker must resubmit with the exact input list, geography-bounding rule, and explanation copy.

Verdict

PASS_WITH_CONDITIONS.

The distinction — explicit member-authored personalization allowed, behavioral profiling forbidden — is the correct doctrinal cut and matches both Werkles doctrine (member-authored Snapshot as ranking target; no wealth ranking; qualitative bands over scores) and current-law posture on profiling (state comprehensive privacy laws treat inferred behavioral profiling with heightened scrutiny; see Colorado CPA §6-1-1306(1)(a)(III) and Connecticut CTDPA §6(a)(5)). The design is defensible only if the ranking explanation is literally true to the deterministic engine, geography is bounded by member declaration rather than inference, and the forbidden-input list is enforced at the type layer, not merely by convention. Three tripwires follow.

Doctrine attack — the four ways this design betrays the member

B1 — Explanation drift. The most common failure of "explain the ranking" surfaces is that the explanation and the engine diverge over time. The engine adds a signal, the explanation copy does not update, and the member sees a truthful-sounding sentence that is factually false about what put the card in front of them. In a deterministic engine, the explanation must be generated from the same field set the ranker actually read, not written by hand and hoped to stay in sync. Any decoupled explanation is a QF19-class overclaim in product copy.

B2 — Geography-by-inference. "Bounded geography" is honest only when the bound is the member's own declaration. If the surface infers location from IP, browser locale, timezone, or a prior session, geography has crossed from explicit personalization into behavioral profiling — regardless of what the ranking-input list says. IP and timezone are inputs whether the code names them or not.

B3 — Forbidden-input list without a type guard. A forbidden-input list enforced only in the ranker's implementation is one refactor away from being violated. If a field like revenue or balance exists on the candidate object and any ranking function has type-level access to it, doctrine relies on the discipline of every future author. That is not a boundary; that is a hope. The forbidden fields must not be present on the candidate object the ranker receives — enforced by the type, not by comment.

B4 — Sensitive inference through proxies. A forbidden-input list that names wealth, balance, netWorth and stops there does not prevent proxy inference. ZIP code correlates with race and income; job title correlates with education and income; industry correlates with wage bands. If the ranker uses any of those and displays the resulting card as if it were a neutral overlap, Werkles has built a wealth/status ranker with plausible deniability. The forbidden-input list must include both the direct fields and the known proxies, and the ranker must not use categorical fields whose only ranking value is a proxy for a forbidden signal.

Three acceptance tripwires

Tripwire T1 — Explanation-equals-engine test.
The ranking explanation shown to the member must be generated by a pure function of the exact fields the ranker used to place that card. Instrument the ranker to emit, for each card, the ordered list of (field_name, member_side_value, candidate_side_value, weight) tuples it actually used. The explanation string must be assembled from that emission and nothing else. A reviewer takes any card, opens the emission, and confirms the explanation copy references every emitted field and no field not in the emission.

Reviewer procedure: dump the emission for ten cards across three Snapshots. For each, diff the explanation copy against the emission. Any explanation that references a field not in the emission fails T1. Any emission field not surfaced in the explanation is a silent input and also fails T1.

Tripwire T2 — Geography-declaration-only test.
The surface must not read IP, timezone, browser locale, geolocation API, or any prior-session location signal as a ranking input. Grep the ranker and its input-assembly path for any of req.ip, x-forwarded-for, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.language, navigator.geolocation, headers.get('accept-language'), or their equivalents. If any is present in the code path that feeds the ranker, T2 fails. The only geography input allowed is a value the member explicitly typed or selected in the Snapshot, with a stated radius the member set.

Reviewer procedure: with a test browser configured to a location the member never declared (e.g., set timezone to Tokyo, IP to London, browser locale to French), confirm the Match Deck is identical to the same Snapshot from a US-Eastern browser. If any card ordering, inclusion, or explanation differs, T2 fails.

Tripwire T3 — Forbidden-input structural test with proxy coverage.
The candidate object the ranker receives must not contain any field on the direct-forbidden list or the proxy-forbidden list, enforced by the type system. Direct-forbidden (from doctrine): balance, revenue, netWorth, wealth, tier, band, income, arr, mrr, ebitda, arrBand, wealthBand, investmentCapacity. Proxy-forbidden (unless explicitly justified as member-declared and non-inferential): zipCode beyond the granularity the member set, estimatedIncome, neighborhoodMedianIncome, homeValue, creditBand, industryWageBand, any field whose only ranking value derives from a demographic proxy.

Reviewer procedure: grep -nE '(balance|revenue|netWorth|wealth|tier|band|income|arr|mrr|ebitda|arrBand|wealthBand|investmentCapacity|estimatedIncome|neighborhoodMedianIncome|homeValue|creditBand|industryWageBand)' across the ghost-fleet source, the API route files, and the candidate type definitions. Any hit that is not (a) a comment or (b) a fixture generator marked as ranker-inaccessible fails T3. Additionally, the candidate type consumed by the ranker must be a distinct type from any richer object elsewhere in the codebase — proven by the type not being assignable from the richer type — so a future refactor cannot silently widen it.

Additional conditions on the PASS

The explanation copy must name evidence bands on the same card that displays the overlaps, per the pre-code §3.3 and pre-code §2 P2 pattern. An "explanation" without a band is a decorated overlap, not an honest signal.

The explanation must include a counts-against line for every card, matching pre-code and Match Deck depth doctrine attack conditions. If the ranker cannot produce one, the card should not render.

The forbidden-input list is a public artifact in the internal runbook, not just in the ranker. Any addition to the list is a policy change; any removal is a doctrine change and requires Ben's written approval.

The candidate object schema is versioned. A version bump is required when the ranker's input contract changes. This gives the explanation-equals-engine test something to pin to.

Behavioral profiling remains forbidden at the collection layer, not only at the ranker. If Werkles's analytics or product-telemetry stack collects dwell time, scroll depth, hover, or session cadence at all, that data must not exist in any store the ranker or its upstream pipelines can read. The rule cannot be "we collect it but don't use it"; that is one code review away from becoming "we use it."

Fastest failure mode this design will produce if T1–T3 are not enforced

A ranker that quietly consults timezone and a "credit band" proxy while displaying an explanation composed of member-declared overlaps. The member sees an honest-looking card. The engine is doing something the explanation does not disclose. The type system does not prevent it. The forbidden-input list is a comment. This is the wealth-ranking failure with plausible deniability, delivered inside a truthful-sounding sentence.

Cross-check against prior receipts

Consistent with pre-code §3.3 no-wealth-ranking rule.

Consistent with pre-code §5 tripwire (quote on every card) and Match Deck depth doctrine attack T1 (honest-pool audit), which together require the surface to be legible without the ornamentation.

Consistent with counsel-questions Q5 (profiling notice), Q21 (DPA triggers), and QF7 (profiling classification is a counsel gate). The forbidden-input list and T2 geography rule collapse most of Q5's exposure by ensuring the ranker does not rise to statutory-profiling behavior in the first place.

Next step and stop

Heimerdinker instruments T1, T2, and T3 and publishes the results across the three Snapshot states used in the depth attack.

Computer re-attacks on receipt, and specifically checks the T1 emission for silent inputs.

No implementation, no schema, no provider, no push, no deploy, no spend.

Relay metadata
json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "COMPUTER",
  "custody_token": "none-supplied",
  "VERDICT": "PASS_WITH_CONDITIONS — explicit-vs-behavioral distinction is the correct cut; PASS conditional on T1 explanation-equals-engine, T2 geography-declaration-only, and T3 forbidden-input structural + proxy coverage, plus band+counts-against on every card, versioned candidate schema, and behavioral profiling forbidden at collection layer not only ranker.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "actual outbox file contents; exact forbidden-input list wording; whether candidate type is currently distinct from richer objects; whether telemetry collects dwell/scroll/hover data anywhere in Werkles today; whether geography input path currently touches IP/timezone/locale",
  "source_packet_id": "HEIMERDINKER_V_MATCH_RANKING_AND_PRIVACY_BOUNDARY_20260821",
  "source_packet_file": "HEIMERDINKER_V_MATCH_RANKING_AND_PRIVACY_BOUNDARY_20260821.md",
  "nextActionHash": "pending-heimerdinker-t1-t2-t3-instrumentation",
  "currentStateHash": "match-ranking-and-privacy-attack-complete"
}

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "harvested_by": "FOREMAN_CDP_HARVEST_V1",
  "source": "COMPUTER",
  "cousin": "COMPUTER",
  "VERDICT": "PASS_WITH_CONDITIONS — explicit-vs-behavioral distinction is the correct cut; PASS conditional on T1 explanation-equals-engine, T2 geography-declaration-only, and T3 forbidden-input structural + proxy coverage, plus band+counts-against on every card, versioned candidate schema, and behavioral profiling forbidden at collection layer not only ranker.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "actual outbox file contents; exact forbidden-input list wording; whether candidate type is currently distinct from richer objects; whether telemetry collects dwell/scroll/hover data anywhere in Werkles today; whether geography input path currently touches IP/timezone/locale",
  "source_packet_id": "TO_COMPUTER_VPGM_MATCH_RANKING_AND_PRIVACY_BOUNDARY_20260821",
  "source_packet_file": "TO_COMPUTER_VPGM_MATCH_RANKING_AND_PRIVACY_BOUNDARY_20260821.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": null,
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, unsupported doctrine, credentials, provider calls, schema, push, deploy, questionnaire submission, or spend.",
  "nextActionHash": "pending-heimerdinker-t1-t2-t3-instrumentation",
  "currentStateHash": "match-ranking-and-privacy-attack-complete",
  "packet_sha256": "b231ad91027519d10a5461ad49352baf4fbaec0905deeeb40e9fc5efa2e46f68",
  "submission_id": "MATCH_RANKING_PRIVACY_BOUNDARY_20260821:COMPUTER:b231ad910275",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "RECEIVED_WITHOUT_CUSTODY_CHALLENGE",
  "custody_token_echoed": "none-supplied",
  "receiver_computed_hash": null,
  "generated_at": "2026-08-21T06:43:03.724Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
