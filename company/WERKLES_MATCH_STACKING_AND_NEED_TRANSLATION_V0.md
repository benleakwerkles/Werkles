# WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0

## Status

DRAFT — preserve before Betsy build.

## Purpose

Capture the real Werkles matching architecture before it is lost across Aeye threads.

This is not a normal “matching algorithm” note.

This artifact exists because Werkles keeps trying to become something deeper than profile matching. The recurring discovery is that people usually do not know the true shape of the problem they are trying to solve. They state a need. The system must help translate that need into a more useful structure.

Werkles should not merely answer:

“Who matches this person?”

Werkles should answer:

“What structure helps this person move forward?”

Sometimes the structure is a person.

Sometimes it is a crew.

Sometimes it is an operator.

Sometimes it is capital.

Sometimes it is proof.

Sometimes it is the discovery that the stated need is wrong.

## Foundational Cause

The architecture emerged from repeated founder observations:

1. People do not always know what they need.
2. Existing networks often fail before strangers search online.
3. “Find me a person” is often a proxy for a deeper unresolved problem.
4. Trust is not a vibe. Trust is proof, history, behavior, verification, money, and mutual consequence.
5. Static profiles are inadequate because people are not static identities.
6. Werkles is built around becoming, not identity display.

The causal insight is:

A profile tells the system who someone says they are.

A need tells the system what they think is missing.

A reality check tells the system what might actually be missing.

A translated need tells the system where useful action can begin.

## Core Thesis

Werkles is not Tinder for founders.

Werkles is not LinkedIn with friendlier branding.

Werkles is not “AI matching.”

Werkles is a formation system that helps Builders, Operators, Backers, Connectors, and Workers discover the next useful structure for action.

> **Lane note (2026-06-08):** Current product schema and UI use **Spark** where this doc says **Worker** in places. Treat Worker as the trade/labor lane concept; map to Spark/Builder split in implementation audits.

## Layer 0 — Need Translation

Layer 0 sits before the recovered five-layer match stack.

The recovered architecture begins at Eligibility, but Werkles begins earlier.

Layer 0 asks:

“What is the user actually trying to resolve?”

### Input

A user states:

* I need money.
* I need a cofounder.
* I need customers.
* I need an operator.
* I need someone technical.
* I need a partner.
* I need credibility.
* I need distribution.
* I need to get out from under an employer.
* I need to know whether this idea is stupid.

### Reality Check

The system compares the stated need against available context:

* self-reported mission
* proof carried
* verified assets
* verified business stage
* current constraints
* current traction
* current relationships
* recent actions
* possible blind spots

### Output

A translated need:

* You said you need capital, but the nearer bottleneck may be customer validation.
* You said you need a cofounder, but the nearer bottleneck may be a paid operator or scoped contractor.
* You said you need an investor, but the nearer bottleneck may be proof that strangers will pay.
* You said you need people, but the nearer bottleneck may be a Space where a crew can form.
* You said you need more money, but the nearer bottleneck may be reducing capital required.

Layer 0 does not override the user.

Layer 0 widens the map.

## Profile Baseline

Werkles still needs profiles.

But profiles are not the product.

Profile equals verified context.

Need equals live intent.

Offer equals smallest useful action.

Match equals ranked next step.

### Werkler Profile V0

Required fields:

1. Lane — Builder, Operator, Backer, Connector, Worker.
2. Current Mission — What is the person trying to make happen now?
3. Stated Need — What does the person think they need next?
4. Offer — What can the person give someone else now?
5. Proof — What can the person verify?
6. Trust Gate — What must another party prove before engagement?
7. Momentum — What has the person done recently?
8. Preferred First Step — Call, review, introduction, paid task, red-team, small collaboration, Space invitation.
9. Availability / Capacity — How much real room exists for action?
10. Risk Tolerance — Low, medium, high, or contextual.

## Proof Fields by Lane

### Builder Proof

* artifact built
* prototype
* customer interview
* revenue evidence
* domain experience
* shipped work
* references
* contribution history

### Operator Proof

* managed people
* operated budget
* owned P&L
* executed project
* handled customers
* managed vendor / jobsite / process
* references
* repeat reliability

### Backer Proof

* verified liquidity band
* investment history
* check-size preference
* time horizon
* risk tolerance
* domain preference
* ability to add non-cash value

Important: The platform should verify thresholds, not expose private raw balances.

### Connector Proof

* introduction history
* known domains
* successful prior connections
* trust references
* network specificity
* response reliability

### Worker Proof

* skill evidence
* job history
* trade/license where relevant
* reliability
* local availability
* peer reference
* crew compatibility

## Recovered Five-Layer Match Stack

Layer 0 is the Werkles translation layer.

After that, the recovered match stack applies.

### Layer 1 — Eligibility Filter

Question: “Can this person legally and structurally fill this seat?”

This is boolean. Do not soft-score hard requirements.

Examples: role match, geography, license, capital floor, identity verification, activity status, no block / no disqualifying conflict.

Purpose: Prevent the system from ranking impossible candidates.

### Layer 2 — Quality / Anti-Gaming Gate

Question: “Should this candidate be throttled because behavior suggests bad faith, spam, or manipulation?”

This is data-gated. V0 may rely on coarse penalties.

Purpose: Protect trust without pretending early data is mature enough for complex enforcement.

### Layer 3 — Compatibility Scorer

Question: “Of eligible candidates, who is most likely to form useful working alignment?”

V0 uses weighted scoring. Compatibility is the alignment layer — not eligibility, not quality.

### Layer 4 — Two-Sided Preference Resolver

Question: “When both sides have expressed interest, can the system produce mutual assignments?”

Requires both sides to express preferences. Prevents one-sided matching from masquerading as mutuality.

### Layer 5 — Cohort / Crew Builder

Question: “Can Werkles identify groups who are useful together, not merely individuals who score well alone?”

Layer 5 must understand skill complementarity, redundancy, risk tolerance spread, ownership preference spread, metro proximity, missing role coverage, crew-level viability.

Purpose: Let Werkles form groups that route around broken employers and create new ventures.

## Why Layer 5 Matters

Layer 5 is the first post-v0 stacked layer to build only after a paying-stranger signal.

* Delivers a feature v0.1 cannot structurally deliver.
* Supports the walkout / crew-formation thesis.
* More differentiating than better scoring.
* Creates a wedge competitors cannot easily copy with ordinary profile matching.

## Match Output Doctrine

Do not output: “You matched with Sarah.”

Output: “Sarah may be useful because her offer fits your stated need, her proof clears your trust gate, and the lowest-risk first step is a 20-minute deck review.”

Or: “This is not primarily an investor problem. The strongest next paths are customer pre-sale, operator pairing, and red-team review.”

## Ranking Doctrine

Ranking should preserve the stated need as anchor, but boost structures that make the path safer, cheaper, or more real.

Do not paternalistically erase the user’s stated need. Do not blindly obey it either. Translate it.

## Baseline Matching Formula

Score equals:

Need / Offer fit × Lane complement × Proof strength × Trust gate compatibility × Mission overlap × Recent momentum × Reversible first step × Customer validation signal × Capital efficiency − Risk − Friction − unclear ask − proof gap

## What Ships First

V0 can ship:

* profiles
* stated needs
* offers
* proof fields
* trust gates
* basic eligibility
* basic compatibility
* manual / explainable suggestions

V0 should explicitly not ship:

* learned ranker
* complex anti-gaming model
* stable matching
* automatic cohort builder
* hidden financial inference
* claims of guaranteed matches

## Next Safe Build

Build a doctrine/schema audit, not the full engine.

See: `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`

## Speaker Warning

Future builders will be tempted to compress this into: “Werkles has a matching algorithm.”

That is false.

Werkles has a need-translation and formation architecture that includes matching as one internal mechanism.

Do not build around static identity. Build around becoming.

## Related artifacts

* `company/WERKLES_MATCHING_RULES.md` — explainable match law (Article VII)
* `foreman/handoffs/outbox/COPY_LANE_ROUTING_v1.md` — copy ownership lanes
* `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md` — codebase gap audit (2026-06-08)
