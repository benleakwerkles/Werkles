# FROM COMPUTER — THREE_SURFACE_MEMBER_VALUE_PASS_20260821

Harvested by the Foreman from the provider transcript over CDP. The cousin wrote
the answer; the transport was mechanical. Custody status below is not a claim
about what the cousin verified.

- Seat: Computer / Perplexity
- Provider route: https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65
- Native thread ID: not exposed by provider
- Packet: TO_COMPUTER_VPGM_THREE_SURFACE_MEMBER_VALUE_PASS_20260821.md
- PACKET_SHA256: c47a06c52099c4d03f0ae82411175ceed22007201a238cc84f4704e7b8d18c1d
- SUBMISSION_ID: THREE_SURFACE_MEMBER_VALUE_PASS_20260821:COMPUTER:c47a06c52099
- Posted at: 2026-08-21T05:57:26.461Z
- Harvested at: 2026-08-21T06:00:18.516Z
- Extracted via: div.prose
- Reply sha256: 2c88524537abde7fd332cece81d0ae72cd9805ddd31b44aa2d6a7061324d9451
- Reply chars: 16357
- CUSTODY: RECEIVED_WITHOUT_CUSTODY_CHALLENGE — RECEIVED block present, but neither the challenge nonce nor a matching packet hash was echoed.

---

FROM_COMPUTER_VPGM_THREE_SURFACE_MEMBER_VALUE_PASS_20260821.md

RECEIVED
CUSTODY_TOKEN: (none supplied in this packet)
COUSIN: COMPUTER / THUFIR (CBCC seat)
PACKET: TO_COMPUTER_THUFIR_THREE_SURFACE_MEMBER_VALUE_PASS_20260821.md
LANE_CHECK: IN_LANE — research and product-pattern review of the Home+Intake, Recommendations, and Match Deck surfaces; no implementation, no provider actions, no personal data, no schema, push, deploy, secrets, or spend.
BLOCKER: NONE.

Note on scope: this is a product-judgment pass with source citations only where an external fact must be established. Werkles doctrine (Human Opportunity Discovery, concierge-first validation, snapshot + Next Move, qualitative evidence bands, no-wealth-ranking, controller/processor discipline) is treated as authoritative and not re-argued.

1. Verdict on the three-surface framing

PATCH.

The three surfaces are the right slice — they are the smallest set that carries a member from "I don't know what I'm building" to "I have a next move and a plausible collaborator." But three fixes are required before the framing can carry weight:

The surfaces must share one artifact, not three. Home+Intake produces a Snapshot; Recommendations turns the Snapshot into Next Moves and instruction; Match Deck attaches plausible collaborators to specific Next Moves. If the three surfaces produce three unrelated outputs, the member will experience "polished but worthless" (see §5).

Intake must be a translator, not a form. The current failure evidence — repeated intake answers, vague advice, raw-field conversation prompts — is the signature of a form pretending to be a conversation. Intake's job is Layer 0 / Need Translation from the Werkles doctrine block: it must turn a stated need into the real bottleneck, not collect fields for a database.

Navigation must be stable across sign-in. The framing is silent on the reported failure that navigation changed unpredictably after sign-in. If the three surfaces are the answer to "what does Werkles do for me," they must be reachable by the same names, in the same places, before and after auth, on the same device.

With those three patches applied, the framing is GO. Without them, it stays PATCH regardless of surface-level polish.

2. The two strongest cross-surface product patterns

Two patterns carry more weight than any surface-local fix. Both are grounded in established interaction and system-design literature; citations are only where an external fact is being invoked.

Pattern P1 — One durable artifact ("the Snapshot") that the member owns and every surface updates

Werkles doctrine already names this: "Immediate value as snapshot plus action" and "logged outcomes make the snapshot and next move visibly sharper over time." The pattern is that Intake creates the Snapshot, Recommendations edits and extends the Snapshot with Next Moves, and Match Deck attaches candidates to specific Snapshot items. The member sees one growing document about themselves, not three views into a black box.

Why this is the strongest pattern:

It fixes repeated intake by making the answer visible in the Snapshot. If the answer is already there, the system stops asking; if the member wants to change it, they edit the Snapshot directly.

It fixes vague advice by binding every recommendation to a specific Snapshot claim ("Because you said you want to install a $60k concrete slab job by October, here is one Next Move that tests whether you can source labor within your margin"). A recommendation that cannot cite a Snapshot line is a broken recommendation.

It fixes thin/same-lane/faraway matches by giving the matcher a structured, member-authored target rather than raw intake text. Candidates get scored against Snapshot claims, not against a keyword bag.

It gives the member a reason to return that is not a notification: the Snapshot got sharper. This is the doctrine's "recurring reason to return."

Research pattern this matches: user-owned progressive profiles and "living documents" outperform hidden-model personalization for trust and correction, per the widely cited Nielsen Norman Group guidance on progressive disclosure and on user control in personalization systems (NN/g on personalization). Human-in-the-loop editing of a durable artifact is also the pattern behind well-received AI product experiences that avoid "black-box drift."

Pattern P2 — Evidence bands, not scores, on every surface where a system judgment is shown

Werkles doctrine already fixes the vocabulary: Strong evidence, Medium evidence, Slim evidence, Counts against. The cross-surface pattern is that every system judgment — an Intake reflection, a Recommendation, a Match card — displays in the same four bands with the same visual weight and the same "why" copy structure, everywhere it appears.

Why this is the second-strongest pattern:

It fixes vague advice by forcing the system to say what evidence supports a claim and how strong that evidence is. "Slim evidence, because you gave us one sentence about margins" is a more useful advice surface than a five-star rating.

It fixes match legitimacy without inviting wealth-ranking or lane-shaming. A match card that reads "Medium evidence, three overlapping bottleneck patterns, one unresolved risk" is defensible; a match card that reads "94% compatibility" is not.

It creates a single mental model the member can carry across surfaces. Members who learn what "Medium evidence" means on the Snapshot page know what it means on a Match card. This is a documented benefit of consistency in interface language (NN/g on consistency and standards).

It protects the doctrine's non-advice boundary. Evidence bands are qualitative signals, not guarantees, and are explicitly not scores, approvals, or commitments.

Anti-pattern that P2 rules out: any numeric fit score, compatibility percentage, star rating, or leaderboard on any of the three surfaces. If the design pressure is to "make it feel more decisive," the correct response is sharper Next Move copy, not a bigger number.

3. Acceptance criteria per surface

Written so that a reviewer can walk the three surfaces with a stopwatch and a member and decide pass/fail. Each surface has must-haves (blocking) and must-nots (fail on presence).

3.1 Home + Intake

Must-haves:

The member reaches an interactive Intake within one action from Home, without a marketing scroll.

Intake produces a Snapshot in a single session, capped at a stated time budget (target: 8–12 minutes, disclosed at start).

Intake never asks a question it has already answered. Every follow-up references an earlier Snapshot line by short quote.

Intake's questions read as translations of intent, not as form fields. No raw-field prompts ("Industry?" "Budget?") that read as database columns.

The end state is a plain-English Snapshot the member can read aloud, edit inline, and export as a text file the member owns.

The Snapshot ends with one same-day, observable Next Move — objective, action, target, timebox, binary outcome definition, check-in hook — per Werkles doctrine.

Navigation to Snapshot, Recommendations, and Match Deck is present, named identically, and reachable in the same nav position before and after sign-in.

Must-nots:

No re-asking of a question the member already answered, in this session or in a stored Snapshot.

No vague reflection ("Sounds like you're building something exciting").

No numeric score, band, or tier assigned to the member during Intake.

No jargon-first framing ("Complete your Founder Profile") when a plain frame ("Say what you're trying to build") is available.

3.2 Recommendations

Must-haves:

Every recommendation cites a specific Snapshot line and states which evidence band it stands on.

Every recommendation is a Next Move in the canonical form, not a category of advice.

Recommendations arrive in a bounded set (target: 3 Next Moves visible at once; more available on request). No infinite feed.

Recommendations include at least one "Counts against" call-out when Snapshot evidence pushes against the member's stated intent, phrased as observation, not judgment.

The Recommendations surface offers an artifact the member can act on immediately — a checklist, a call script, a one-page summary, a template — attached to at least one Next Move.

Recommendations update the Snapshot when the member logs an outcome. The member sees the delta in the Snapshot.

Must-nots:

No recommendation whose "why" cannot be traced to a Snapshot line.

No motivational content in place of Next Moves.

No numeric fit or readiness score.

No infinite scroll of tips.

3.3 Match Deck + stable navigation

Must-haves:

Every card is attached to a specific Snapshot Next Move or Snapshot claim, quoted on the card.

Cards display in evidence bands, not scores. Each card names the two or three overlaps that put it in its band, and one unresolved risk.

The Deck is bounded (target: 5–10 cards at a time). Beyond that, the member requests more with an explicit action.

Cards are diverse across at least three dimensions relevant to the Snapshot (target: bottleneck type, lane distance, geography), with an explicit reason each card is not same-lane / faraway when the Snapshot warrants proximity.

Match Deck respects the no-wealth-ranking doctrine. No card shows balance, wealth band, revenue tier, or net worth, and the ranking function does not use them.

Introduction actions are commitments in the canonical Next Move form (specific message, timebox, binary outcome).

Navigation names and positions match the pre-sign-in state. If a new item appears after sign-in, it appears in a labeled area (e.g., "Your work") and does not renumber or rename the primary surfaces.

Must-nots:

No same-lane wallpaper (five cards that are near-duplicates of the member).

No faraway matches presented as strong evidence when the Snapshot requires geographic or context proximity.

No compatibility percentage, star rating, or leaderboard.

No navigation that reorders, renames, or hides the three primary surfaces after sign-in.

No card that lacks a "counts against" or "unresolved risk" line — every match has at least one honest weakness.

4. Claims requiring research or provider evidence versus product judgment

Split so Ben and Lady Jessica can decide what to trust and what to source.

Product judgment (adopt on doctrine + established interaction-design practice; no external research required):

P1 durable-artifact pattern.

P2 evidence-band pattern replacing scores.

Bounded recommendation and match set sizes.

Snapshot-line citation requirement.

Canonical Next Move form.

Ban on numeric fit scores, star ratings, and leaderboards.

Consistency of navigation names and positions across auth states.

Research or provider evidence required before external claim (do not publish or say to a member without a source):

Any specific time-budget number for Intake completion (target: 8–12 minutes) presented as an industry norm — this is a target, not an empirical claim, unless usability testing establishes it.

Any claim that Werkles's approach reduces intake fatigue or drop-off "by X%" — requires Werkles's own usability data.

Any claim about how members interpret evidence bands versus scores — requires a small usability study on the specific band vocabulary Werkles uses.

Any claim that a specific matching mechanism (embedding similarity, structured overlap, human review) outperforms another for Werkles's population — requires Werkles-specific pilot data.

Any claim that Werkles complies with WCAG 2.2 AA for the three surfaces — requires an actual audit (WCAG 2.2).

Any claim about consumer expectations of transparency in AI-driven recommendations — cite the source if used (FTC guidance on AI transparency and NIST AI Risk Management Framework).

Any comparative claim about competitor products (matching platforms, coaching apps, founder tools) — requires primary sourcing on each named competitor.

Any external claim about the effect of concierge-style validation on retention — Werkles's own concierge data is the only defensible source.

None of the above requires external research to adopt internally. The distinction only matters when Werkles turns product judgment into a public or investor-facing claim.

5. The most dangerous way this becomes polished but still worthless

The single most dangerous failure mode is a beautifully rendered Snapshot that is not connected to Recommendations or Match Deck, presented as if it were.

Concrete shape of the failure:

Intake produces a clean, well-typeset Snapshot the member enjoys reading.

Recommendations exist and are well-written, but do not cite Snapshot lines. They generalize from Intake into category advice ("Founders in your stage often benefit from a mentor").

Match Deck exists and looks credible, but ranks by any convenient signal available — recency, activity, keyword overlap, hidden score — because the Snapshot is not structured enough to score against.

Navigation is stable. Copy is confident. Evidence bands appear on cards. Everything passes surface review.

The member cannot answer the question: "Why did Werkles show me this Next Move / this person?" And the operator cannot answer it either, because the three surfaces were never actually connected.

Why this is the most dangerous outcome:

It passes every checklist that reads surfaces one at a time.

It fails the only check that matters — end-to-end traceability from Snapshot claim to Next Move to Match card.

It reproduces the doctrine's warning that "a 150/150 matching test establishes API coherence, not that the surfaces tell one honest, understandable story."

It is the failure mode most likely to escape Ben's review, because it looks like the concierge posture rather than the software-first posture Werkles rejected.

The specific tripwire that catches this failure early:

Every recommendation and every match card must show, on the card itself, the exact Snapshot quote it references. If any surface can be reviewed with the quotes hidden and still feel decisive, the surface is decoupled from the Snapshot and the product is on the polished-but-worthless path.

Adopt that tripwire as a reviewer-level acceptance criterion, above the per-surface criteria in §3. If a surface passes §3.1–§3.3 but fails the tripwire, the surface is not shippable.

Verdict summary
Item	Result
Framing	PATCH — three surfaces are the right slice; must share one artifact, translate not collect, and preserve navigation across sign-in
Strongest patterns	P1 durable Snapshot; P2 evidence bands over scores
Acceptance criteria	§3.1 Home+Intake; §3.2 Recommendations; §3.3 Match Deck + navigation, with must-nots listed
Research vs. judgment	§4 — most of the pattern set is judgment; external claims require Werkles or primary-source data
Most dangerous failure	Decoupled surfaces with the Snapshot as ornamental — caught by the "quote on every card" tripwire
Next action	Hand this pass to Heimerdinker@Betsy for build planning; hand the tripwire to the reviewer of any surface-level design candidate

What I would do next, and stop:

Wait for a surface-level candidate that names, per surface, how it implements P1 and P2 and how it enforces the tripwire.

On receipt, attack the candidate line-by-line against §3.1–§3.3 and §5.

Not implement, not touch provider settings, not inspect credentials, not push, deploy, or spend.

Relay metadata
json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "cousin": "COMPUTER",
  "custody_token": "none-supplied",
  "VERDICT": "PATCH — three-surface framing is correct after three patches: shared Snapshot artifact, Intake as translator not form, and stable navigation across sign-in. Adopt P1 durable Snapshot and P2 evidence bands; enforce quote-on-every-card tripwire.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "Werkles usability data on intake time budgets and drop-off; band-vocabulary comprehension testing; competitor primary sourcing; WCAG 2.2 audit status; NIST AI RMF alignment posture; whether Match Deck ranking function is documented today",
  "source_packet_id": "TO_COMPUTER_THUFIR_THREE_SURFACE_MEMBER_VALUE_PASS_20260821",
  "source_packet_file": "TO_COMPUTER_THUFIR_THREE_SURFACE_MEMBER_VALUE_PASS_20260821.md",
  "nextActionHash": "pending-surface-candidate",
  "currentStateHash": "three-surface-pass-complete"
}

---

## Relay metadata

```json
{
  "schemaVersion": "aeye-crew-relay/v0.1",
  "harvested_by": "FOREMAN_CDP_HARVEST_V1",
  "source": "COMPUTER",
  "cousin": "COMPUTER",
  "VERDICT": "PATCH — three-surface framing is correct after three patches: shared Snapshot artifact, Intake as translator not form, and stable navigation across sign-in. Adopt P1 durable Snapshot and P2 evidence bands; enforce quote-on-every-card tripwire.",
  "CONFIDENCE": "HIGH",
  "UNKNOWNS": "Werkles usability data on intake time budgets and drop-off; band-vocabulary comprehension testing; competitor primary sourcing; WCAG 2.2 audit status; NIST AI RMF alignment posture; whether Match Deck ranking function is documented today",
  "source_packet_id": "TO_COMPUTER_VPGM_THREE_SURFACE_MEMBER_VALUE_PASS_20260821",
  "source_packet_file": "TO_COMPUTER_VPGM_THREE_SURFACE_MEMBER_VALUE_PASS_20260821.md",
  "platform": "Perplexity",
  "role": "Doctrine / research cousin",
  "lane": "Synthesis, current-world checks, cited research — not unsourced deploy decisions.",
  "requested_action": null,
  "target_files": "none — review only; this seat was not asked to change files",
  "DO_NOT": "No implementation, unsupported doctrine, credentials, provider calls, schema, push, deploy, questionnaire submission, or spend.",
  "nextActionHash": "pending-surface-candidate",
  "currentStateHash": "three-surface-pass-complete",
  "packet_sha256": "c47a06c52099c4d03f0ae82411175ceed22007201a238cc84f4704e7b8d18c1d",
  "submission_id": "THREE_SURFACE_MEMBER_VALUE_PASS_20260821:COMPUTER:c47a06c52099",
  "provider_route": "https://www.perplexity.ai/computer/tasks/effe9059-e325-4e5d-a0c7-8d1e7f361d65",
  "native_thread_id": null,
  "custody": "RECEIVED_WITHOUT_CUSTODY_CHALLENGE",
  "custody_token_echoed": "none-supplied",
  "receiver_computed_hash": null,
  "generated_at": "2026-08-21T06:00:18.516Z"
}
```

> `receiver_computed_hash` is null on purpose. The Foreman transported this text;
> the cousin did not compute and return the packet hash. Canon P.7 custody is
> therefore NOT proved by this file.
