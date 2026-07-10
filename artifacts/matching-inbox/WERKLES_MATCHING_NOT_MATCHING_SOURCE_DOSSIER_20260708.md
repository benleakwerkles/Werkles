# Werkles Matching / Not-Matching Source Dossier

Compiled: 2026-07-08T21:26:16.568Z  
Compiler: Codex local hands on Betsy  
Target consumer: Ben, Petra, Skybro, Maker, Dink, Heimerdinger, or any future Aeye that has to understand why Werkles matching is not just matching.  
Primary output path: `C:\Users\Ben Leak\github\Werkles\artifacts\matching-inbox\WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md`

## Evidence Boundary

This is intentionally long. It is not a two-sentence summary and it is not a clean marketing memo. It is a source dossier built to preserve cause, disagreement, wrong turns, partial turns, and the reasons behind the current architecture.

I used the active repo at `C:\Users\Ben Leak\github\Werkles` as the main authority. I also imported a small amount of older Desktop / MouseWithoutBorders archaeology because it contains explicit Layer 0, Need Translation, SpeakerSole, and first-20-user concierge process language that appears to predate or sit beside the current repo files.

I searched local Codex session material for rawer thread chunks. The matching hits were mostly tool-output echoes of repo files, not clean human/Aeye conversation transcripts. I did not pretend those were clean conversation evidence. The conversation-like material imported below is therefore the handoff/receipt layer where Aeyes wrote to Ben and each other: Maker handoffs, Dink handoffs, Speaker entries, receipts, and doctrine files.

## Quick Source Map

- Canonical doctrine: `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`
- Codebase gap audit: `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`
- Speaker warning memory: `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md`
- Aeye decision handoffs: `foreman/handoffs/outbox/FROM_MAKER_*`, root `FROM_MAKER_*` files, Desktop `FROM_DINK_*` files
- Current shadow engine: `lib/matching/*`, `foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_PIVOT_20260708.md`
- Current production-ish legacy scoring: `supabase/migrations/00001_initial_schema.sql`, `AI_HANDOFF.md`
- Crawleye/Swanson route: `foreman/soledash/CRAWLER_PEARLS.json`, `tinkarden/nervous_system/crawler.js`

## My Reasoned Read Of The Decision Trail

The original danger was not that Werkles lacked a matching algorithm. The danger was that every Aeye and every product surface wanted to collapse the idea into a familiar thing: profile matching, founder Tinder, LinkedIn with warmer copy, an AI fit score, or a ranked list of people. That is the exact failure Speaker was built to interrupt. The best source phrase for this is not a slogan but a constitutional diagnosis: a summary is not enough; the system needs causal memory.

The earliest durable product decision I found is that Werkles must ask a prior question before it asks who matches whom. The prior question is: what structure helps this person move forward? That is why Layer 0 exists. A user can say they need money, a partner, customers, an operator, someone technical, credibility, distribution, or a way out. The system is not supposed to obey that wording blindly. It is also not supposed to overrule the user like a smug oracle. The narrow path is: preserve the stated need as the anchor, widen the map, show evidence, name uncertainty, and let the user keep sovereignty.

The first architecture therefore has two parts that should never be confused. Layer 0 is Need Translation: a pre-matching diagnostic layer that turns a stated need into possible real bottlenecks. The recovered five-layer match stack comes after that: eligibility, quality/anti-gaming, compatibility, two-sided preference, and cohort/crew formation. When an Aeye jumps straight to compatibility scoring, it is skipping the layer that protects Werkles from solving the wrong problem very efficiently.

The schema audit is the major early reality check. It says the codebase had partial Layer 1 and partial Layer 3, but no real Layer 0 in schema or RPC output. That is the bug and the gift. The bug is that the product could show a person-centric match while the doctrine says the first output may be a structure, proof request, smaller first step, or warning. The gift is that it kept the team from pretending the full engine existed. The safe June path was doctrine plus explainable cards plus manual Layer 0 translation, not a ranker, not a stable matcher, not a cohort builder, not hidden financial inference.

The UX notes show the same fight at the product surface. The homepage and workbench had copy that leaned toward lanes, profiles, and introductions. Maker explicitly called out conflicts: `#how` said profile first; the hero signup preview said pick lane then profile; lanes and match decks pulled the visitor back into identity and fit. The better Layer 0 surface was the reveal rail: thought -> nearer bottleneck. Squibb's correct job was one scout moment, not a chat bubble and not a foreman who decides.

The Wizard-of-Oz and 20-user process are important because they preserve the decision not to build too early. That process says: collapse onboarding, Layer 0, and need translation into a short intake; have a human reviewer produce one bottleneck, one explained recommendation, and one next action; measure whether the user says it feels right and takes the action. That is a low-cost place to lose. It is exactly the "lose early, not late" principle: do not gather infra, automations, ranking machinery, and legal exposure before reality says the translation chain earns trust.

The July 8 autonomous matching pivot changes the center of gravity, and the dossier must not hide that. Earlier files said human reviewer is the engine for V1. The July 8 receipt says operator direction changed: remove the human operator from the intake -> recommendation path, use a hybrid Aeye/deterministic engine, run shadow first, and do not publicly flip until proof. That is not automatically a contradiction. It becomes safe only if the shadow engine is treated as a test harness and not as proof that the original product problem is solved. If an Aeye treats shadow output as public truth before the gates, it repeats the exact mistake the June doctrine warned about.

The current shadow engine is useful but crude. It extracts keyword signals for capital, partner, job, training, and relocation; it produces a primary bottleneck string; it scores recommendation paths like translate_need, verify_proof, find_credit_union, find_partner, get_training, and stage_intro_candidate. This is a good skeleton for observability because it creates receipts, facts, proof gaps, falsifiers, and Squibb phrasing. It is not yet a deep matching/not-matching algorithm. It has no candidate pool, no verified Crucible weighting, no real semantic translation, no not-match/disqualifier layer, and no robust way to know when the correct answer is silence.

The mistake to preserve, because it teaches, is the temptation to call this "the matcher." The current code is a shadow-mode path scorer. It can help learn. It can show its work. It can gather false positives. It can make future Aeyes argue from files instead of vibes. But the real Werkles algorithm is still the causal chain: stated need -> leverage inventory -> possible bottlenecks -> evidence/falsifiers -> one reversible next step -> gates -> only then people, money, tools, space, or proof.

On Hume / Lincoln / Percy and Swanson's Crawleyes: the Crawleye route appears to be source/receipt crawling and provenance plumbing, not the main need-translation doctrine. That matters because source retrieval can inform matching, but it is not the matching architecture. If those Crawleyes become part of this later, their job should be evidence pickup and recall, not deciding the user's path.

## Red-Team Questions Future Aeyes Should Not Skip

1. Did we preserve user sovereignty, or did we merely make paternalism sound warmer?
2. Did the system show evidence strength, proof gaps, and falsifiers, or did it output a confident story?
3. Is `translate_need` a preflight step that should always run, or is it being falsely scored as one option among options?
4. What would prove the top path wrong? If the answer is not explicit, the recommendation is not mature.
5. Is the output recommending a person because Werkles has a person, or because a person is the smallest reversible next step?
6. Does the current path solve the original problem, or did the original problem change? That is the SpeakerSole question.
7. Does the shadow engine have a not-match/disqualifier layer yet? Current matching inbox says this is expected but not built.
8. Are we calling self-reported facts verified? If yes, stop.
9. Did we accidentally turn Speaker from causal memory/plain facts into an executive decision-maker? If yes, stop.
10. Did we bury the earlier manual/Wizard learning loop just because an autonomous path exists? If yes, recover it.

## Imported Source Blocks

### Speaker / GD constitutional integration: why causal memory exists

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\speaker\GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md`

<!-- SOURCE_BLOCK_BEGIN foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md -->

````````md
# GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0

## Status

DRAFT — preserve before Betsy build.

## Purpose

Capture the reason Speaker must exist as a separate constitutional office inside the Werkles / GD / Aeye system.

This artifact is not about adding a feature tab.

It is about preventing the system from losing causality.

The recurring failure pattern is:

Ben has a high-value conversation with an Aeye.

The Aeye produces insight.

The insight lives in a thread.

The thread drifts.

The next Aeye lacks the context.

Ben becomes the courier.

The same idea is rediscovered later, partially compressed, partially distorted, and sometimes implemented without the original cause.

Speaker exists to stop that.

## Core Discovery

GD can route.

GD can classify.

GD can generate packets.

GD can become a governor.

But GD does not, by itself, preserve wisdom.

A routing system asks: “What should happen next?”

Speaker asks: “Why do we believe this?”

Those are different constitutional offices.

## Foundational Cause

Speaker emerged because the system repeatedly preserved events but lost meaning.

Examples:

* “Ben dropped out of college” loses the causal truth that he was still learning how to be paralyzed.
* “Werkles is matchmaking” loses the causal truth that Werkles is about helping people become what they cannot become alone.
* “Ender wrote copy” loses the causal truth that Ender owns experience, not final voice.
* “GD generates packets” loses the operational truth that Relay Courier still cannot reliably deliver to the correct thread.
* “Dink was broken” loses the practical truth that tool failure blocked a builder lane and exposed infrastructure fragility.

A summary is not enough. The system needs causal memory.

## Constitutional Separation

Speaker must live inside the system, but not under GD.

GD may consult Speaker. GD may display Speaker. GD may draft Speaker entries.

GD may not own Speaker. GD may not suppress Speaker. GD may not mark Speaker truth canonical without Ben.

Speaker is an independent constitutional office.

## Constitutional Roles

See `foreman/speaker/AEYE_ROLE_REGISTRY.md` for the full Speaker-monitored registry.

## Speaker Entry Statuses

| Status | Meaning |
|--------|---------|
| `DRAFT` | Captured but not canonical |
| `RATIFIED` | Approved by Ben as institutional memory |
| `SUPERSEDED` | No longer controlling, but never deleted |

## Required Speaker Entry Fields

1. Event — What happened?
2. Context — What was happening around it?
3. Decision — What was decided?
4. Why It Happened — What caused the decision?
5. Risk Exposed — What danger became visible?
6. Lesson Learned — What should future agents remember?
7. Doctrine Changed — What rule or operating principle changed?
8. Who / What Must Remember — Which Aeyes, systems, or builders need this?
9. Future Warning — What failure pattern should trigger recall?
10. Source Artifacts / Threads — Where did the evidence come from?

Template: `foreman/speaker/SPEAKER_PACKET_TEMPLATE.md`

## Speaker Is Not a Summarizer

Speaker does not compress away human detail, reduce causal stories to slogans, or turn pain into generic corporate blurbs. Speaker preserves the soul of the lesson because the soul is often the cause.

## Speaker and GD

GD should consult Speaker during routing. Without Speaker, GD routes based on current prompt only. That is not enough.

Example: Ben asks to “build matchmaking.” Speaker surfaces Layer 0 Need Translation, Layer 5 deferral, and `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`.

## Speaker and Thread Registry

Thread Registry solves where packets go. Speaker solves why packets matter.

## Speaker and Automatica

Automatica is not blind automation. It is GD routes + Thread Registry locates + Courier prepares + Speaker supplies causal memory + Ben gates meaningful decisions.

## Current Failure Pattern

* GD cannot reliably relay packets to Aeyes
* Critical context lives outside the repo
* Cousins work from different context slices
* Ben manually carries art direction, copy, rulings, doctrine
* Repo path drift (`C:\Dev\Werkles` vs legacy paths)
* Capture must precede build

## First Speaker Entries

Indexed in `foreman/speaker/CAUSAL_LEDGER.md` under `foreman/speaker/entries/`.

## First Build (shipped V0)

* `foreman/speaker/SPEAKER_CHARTER.md`
* `foreman/speaker/SPEAKER_DOCTRINE.md`
* `foreman/speaker/CAUSAL_LEDGER.md`
* `foreman/speaker/AEYE_ROLE_REGISTRY.md`
* `foreman/speaker/SPEAKER_PACKET_TEMPLATE.md`
* GD panel: `/gd/speaker` → Foreman `#gd-speaker` (DRAFT only, no ratify, no auto-send)

## Hard Stops

No production deploy · No SQL · No secrets · No auto-send · No provider spend · No rewriting history as final truth · No deleting Speaker history · No making Speaker subordinate to GD routing · No implementation agent may change approved meaning without Ben

## Speaker Warning

Future builders will try to compress Speaker into “memory.” That is wrong. Speaker is causal memory. The purpose is not to remember more. The purpose is to remember why.

## Related

* `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`
* `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`
* `foreman/speaker/SPEAKER_CHARTER.md`
````````

<!-- SOURCE_BLOCK_END foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md -->

### Canonical match-stacking and need-translation doctrine

Source path: `C:\Users\Ben Leak\github\Werkles\company\WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`

<!-- SOURCE_BLOCK_BEGIN company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md -->

````````md
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
````````

<!-- SOURCE_BLOCK_END company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md -->

### Codebase reality check: Match Stack Schema Audit V0

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\reviews\MATCH_STACK_SCHEMA_AUDIT_V0.md`

<!-- SOURCE_BLOCK_BEGIN foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md -->

````````md
# Match Stack Schema Audit V0

**Date:** 2026-06-08  
**Doctrine:** `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`  
**Scope:** Read-only audit — no schema changes, no production data, no engine build.

---

## Executive summary

Today’s codebase has **partial Layer 1 (eligibility)** and **partial Layer 3 (compatibility scoring)** wired around **Blueprints** and **profiles**. **Layer 0 (need translation)** exists in **copy/narrative only** — not in schema or match RPC output. **Layers 2, 4, and 5** are **not represented** in production schema or app logic. Profile fields cover ~40% of Werkler Profile V0; proof is verification-status oriented, not lane-specific proof catalogs.

**Safe next build:** doctrine + explainable suggestion cards + Layer 0 **manual** translation UI (no ranker). **Not safe yet:** cohort builder, stable matching, anti-gaming model, hidden financial inference.

---

## 1. Profile fields today

### Supabase `profiles` (migrations `00001`, `00002`)

| Werkler V0 field | Represented? | Current column / surface |
|------------------|--------------|---------------------------|
| Lane | **Yes** | `lane` (`user_lane` enum: Builder, Operator, Backer, Connector, Spark) |
| Current Mission | **Partial** | `blueprint_narrative`, `primary_goal` — no dedicated mission field |
| Stated Need | **Partial** | `skills_sought[]` — skills not full need statements |
| Offer | **Partial** | `skills_offered[]` — no explicit “smallest useful action” |
| Proof | **Partial** | `id_status`, `funds_status`, `deep_audit_status` + badges view |
| Trust Gate | **No** | Not user-configurable per engagement |
| Momentum | **No** | No recent-actions feed |
| Preferred First Step | **No** | — |
| Availability / Capacity | **No** | — |
| Risk Tolerance | **No** | — |

**Also present (supporting):** `location_*`, `work_preference`, `industry_tags`, `timeline_to_launch`, `profile_depth`, `membership_tier`, `turf_zip`, `visibility_mode`, financial ranges via `user_financials`.

### App / mock surfaces

| Surface | Fields |
|---------|--------|
| `app/dashboard/profile/page.tsx` | display name, lane, location, skills offered/sought, industry tags, timeline, primary goal, turf, blueprint narrative, profile depth |
| `app/onboarding/page.tsx` | lane, arena, turf, first-weld path |
| `index.html` + `app.js` prototype | role, industry, city, radius, capital sliders, skills, goals, verified checkboxes |

**Gap:** No first-class **stated need** string, **offer** string, or **trust gate** preferences in schema or UI.

---

## 2. Proof fields today

### Production / preview

| Lane proof (doctrine) | Today |
|----------------------|--------|
| Identity | `id_status`, crucible identity check, badge category |
| Funds / capital band | `funds_status`, `user_financials` ranges, funds verification RPC |
| Work history | Crucible employment check (provider-pending in preview) |
| Licenses | Crucible license check (partial) |
| References | Crucible reference check (partial) |
| Lane-specific artifacts (builder prototype, operator P&L, etc.) | **Not modeled** — only generic proof categories |

### `verified_badges_view` / `proof_category`

Categories exist in SQL enum; public match RPC checks `Capital` badge and financial range overlap.

**Gap:** No per-lane proof checklist tied to match explanations. Proof doctrine in UI (`copy.proof.checks`) is **copy-only**.

---

## 3. Matching fields & logic today

### Production path

- **API:** `app/api/matches/route.ts` → RPC `match_candidates_for_blueprint`
- **SQL:** `supabase/migrations/00001_initial_schema.sql` — weighted score from:
  - lane pair bonuses (Layer 3 partial)
  - distance / work preference (Layer 1 partial)
  - skill overlap (`skills_sought` ∩ `skills_offered`)
  - industry tag overlap
  - timeline / primary_goal alignment
  - capital range overlap + verified capital badge
  - block list exclusion (Layer 1)
- **Output:** `score`, `factors` jsonb — explainable factors exist but **not** need-translation narrative

### Mock path

- **`app.js` / `public/app.js`:** `scoreProfile()` — complementary roles, capital paths, skill overlap, proof count; outputs **reason strings** (recently updated to potential/runway language)

### Blueprint-centric model

Matching is organized around **Blueprint rooms** (multi-member), aligned with `company/WERKLES_MATCHING_RULES.md` Article VII multi-member pattern.

**Gap:** Match output still person-centric (“candidate may cover your capital gap”) not structure-centric (“the nearer bottleneck may be customer validation”).

---

## 4. Recovered layers — representation matrix

| Layer | Name | Represented? | Where / notes |
|-------|------|--------------|---------------|
| **0** | Need translation | **Narrative only** | Home Reveal copy, `copy.home.reveal.pairs`, Squibb hints — **no engine** |
| **1** | Eligibility | **Partial** | blocks, account_status, distance cap, lane enum, membership gates |
| **2** | Anti-gaming | **No** | No throttle signals in schema |
| **3** | Compatibility scorer | **Partial** | Blueprint RPC + mock `scoreProfile` |
| **4** | Two-sided preference | **Partial** | Intro request flow exists; no stable matching algorithm |
| **5** | Cohort / crew builder | **No** | Blueprint multi-seat concept only; no crew-level scoring |

---

## 5. What Layer 0 would require (no schema risk)

| Requirement | Type | Risk |
|-------------|------|------|
| Stated need capture (free text + presets) | UI + optional JSON column | LOW if mock/local only |
| Translation templates (thought → reveal pairs) | Copy + rules engine (manual) | LOW |
| Squibb / Aeye surfacing options | UI copy + checklist | LOW |
| Reality check inputs | Read existing profile + proof status | LOW — read-only |
| Persisted translated need | New column or workshop artifact | MEDIUM — needs migration gate |
| LLM need translation | Provider call | **GATED** — provider + counsel |

**V0 without migration:** Layer 0 as **onboarding question + home reveal cards + match card footnotes** using existing fields.

---

## 6. What Layer 5 would require later

| Requirement | Dependency |
|-------------|------------|
| Crew entity or Blueprint seat model with roles | Schema + RLS |
| Complementarity graph (redundancy, missing roles) | Engine + live data |
| Group viability score | Paying-stranger signal per doctrine |
| Walkout / formation UX | Ender art direction + imagery (pending) |

**Explicitly deferred** until paying-stranger signal and Petra GO.

---

## 7. What v0 can ship without production data

- Doctrine docs (this audit + `WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`) ✅
- Explainable match reasons on cards (extend `factors` display) — UI only
- Stated need + offer fields in **local preview** / onboarding copy
- Layer 0 **static** translation pairs on home and workbench
- Manual “next path” suggestions (capital efficiency, customer validation) as copy templates
- Imagery arc for “missing piece” vs “three partners” — **blocked on Ender art direction + Gate 05 Render GO**

---

## 8. What v0 must not ship yet

- Learned ranker
- Complex anti-gaming
- Stable matching / mutual assignment solver
- Automatic cohort builder
- Hidden financial inference
- Guaranteed match claims
- Schema migrations for trust gates / momentum without human gate

---

## 9. Terminology drift watch

| Doctrine | Codebase today |
|----------|----------------|
| Worker lane | **Spark** (+ Builder for hands-on) |
| “Fit” / compatibility frame | Migrating to **potential** / **runway** in copy |
| “Matching algorithm” | **Formation architecture** — do not market as algo |

---

## 10. Recommended next slices (ordered)

1. **Ben + Ender:** art direction for imagery arc — *what you didn't know you needed* (not three-partner join-up poster). Gate 05 Render GO required for new shots.
2. **Maker:** Layer 0 UI mock — stated need + translated need cards on workbench (no SQL).
3. **Maker:** Match deck shows `factors` + doctrine-style “next path” footnote (read RPC jsonb).
4. **Petra:** GO/NO-GO on any profile schema extension for stated need / offer / trust gate.
5. **Post-signal:** Layer 5 Blueprint seat modeling.

---

## Checks performed

Read-only scan of: `supabase/migrations/`, `app/api/matches/`, `app/dashboard/profile/`, `app.js`, `lib/copy.ts`, `company/WERKLES_MATCHING_RULES.md`.

No migrations applied. No engine code written.
````````

<!-- SOURCE_BLOCK_END foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md -->

### Speaker entry: Not-Matching Matching

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\speaker\entries\DRAFT_20260608-not-matching-matching.md`

<!-- SOURCE_BLOCK_BEGIN foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md -->

````````md
---
id: DRAFT_20260608-not-matching-matching
status: DRAFT
title: Not-Matching Matching — Need Translation Before People
created_at: 2026-06-08
source_notes:
  - company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md
  - foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md
  - foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md
tags:
  - matching
  - formation
  - layer-0
warning_triggers:
  - matching algorithm
  - tinder for founders
  - build matchmaking engine
  - fit score
related_entries: []
---

## Event

Werkles was repeatedly described as "matchmaking" while the deeper architecture is need translation and formation.

## Context

Ben asked GD to "build matchmaking." Speaker must surface Layer 0 before Layer 3 engine work.

## Decision

Preserve `WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0` — audit schema, do not build full engine pre-signal.

## Why it happened

"Find me a person" is often a proxy for capital, proof, operator, space, or wrong stated need.

## Risk exposed

Building compatibility scorer without Layer 0 reinforces wrong product definition. Marketing as "AI matching" invites competitor comparison.

## Lesson learned

Werkles answers what structure helps this person move forward — sometimes a person, sometimes capital, sometimes proof that the stated need is wrong. Layer 5 crew builder waits for paying-stranger signal.

## Doctrine changed

`company/WERKLES_MATCHING_RULES.md` links formation architecture. Match output must explain next path, not "you matched with Sarah."

## Who must remember

GD router, Ender (imagery arc), Maker, Dink/Codex, Petra.

## Future warning

Interrupt when scope says "matching algorithm," learned ranker, or cohort builder before Layer 0 UI and stranger-pays signal.

## Source artifacts

- `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`
- `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`
````````

<!-- SOURCE_BLOCK_END foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md -->

### Speaker causal ledger warning index

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\speaker\CAUSAL_LEDGER.md`

<!-- SOURCE_BLOCK_BEGIN foreman/speaker/CAUSAL_LEDGER.md -->

````````md
# Causal Ledger

Status: **Speaker index** — entries are never deleted  
Office: `foreman/speaker/SPEAKER_CHARTER.md`  
Integration: `foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md`

---

## Active entries

| ID | Status | Title | Created | Tags |
|----|--------|-------|---------|------|
| `DRAFT_20260608-tool-mortality` | DRAFT | Tool Mortality | 2026-06-08 | tools, infrastructure |
| `DRAFT_20260608-aeye-role-lore` | DRAFT | Aeye Role Lore | 2026-06-08 | roles, cousins |
| `DRAFT_20260608-not-matching-matching` | DRAFT | Not-Matching Matching | 2026-06-08 | matching, layer-0 |
| `DRAFT_20260608-aeye-life-overseer` | DRAFT | Aeye Life Overseer | 2026-06-08 | governance |
| `DRAFT_20260608-thread-registry` | DRAFT | Thread Registry | 2026-06-08 | relay, courier |
| `DRAFT_20260608-gd-command-console` | DRAFT | GD Command Console | 2026-06-08 | gd, operator-ux |
| `DRAFT_20260608-ai-compression-soul-loss` | DRAFT | AI Compression / Soul Loss | 2026-06-08 | compression, causality |
| `DRAFT_20260607-human-adaptation-thesis` | DRAFT | Human Adaptation Thesis | 2026-06-07 | operator, becoming |
| `DRAFT_20260619-tinkerden-return-system-v0` | DRAFT | TinkerDen Return System V0 | 2026-06-19 | tinkerden, receipt, return-loop, speaker |

Paths: `foreman/speaker/entries/<id>.md`

---

## Superseded (retained)

_None yet._

---

## Warning index (by trigger)

| Trigger | Entries |
|---------|---------|
| gd routing changes | Human Adaptation, GD Command Console, AI Compression |
| relay courier / wrong thread | Human Adaptation, Thread Registry, GD Command Console |
| treating Ben as paste mule | Human Adaptation, GD Command Console |
| matching algorithm / build matchmaking | Not-Matching Matching |
| role blur | Aeye Role Lore |
| tool failure | Tool Mortality |
| thread summary / slogan replaces cause | AI Compression |
| auto-send / auto-ratify | Aeye Life Overseer, Thread Registry |
| packet without receipt / aeye handoff disappears | TinkerDen Return System V0 |

---

## How to add

1. Use GD panel `#gd-speaker` or copy `SPEAKER_PACKET_TEMPLATE.md`
2. Save as `entries/DRAFT_<yyyymmdd>-<slug>.md`
3. Add row to this ledger
4. Ben ratifies → update status to `RATIFIED` (never delete prior text)
````````

<!-- SOURCE_BLOCK_END foreman/speaker/CAUSAL_LEDGER.md -->

### Werkles Matching Rules cross-link and Article VII

Source path: `C:\Users\Ben Leak\github\Werkles\company\WERKLES_MATCHING_RULES.md`

<!-- SOURCE_BLOCK_BEGIN company/WERKLES_MATCHING_RULES.md -->

````````md
# Werkles Matching Rules

Status: v0.2 review draft

**Architecture (formation + need translation):** `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`  
**Codebase gap audit:** `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`

Werkles is a need-translation and formation system. Matching is one internal mechanism — not the product definition.

## Article VII - Matching Law

Werkles matching must be explainable.

No user should see a match and be told only "the algorithm says so." Every match card should expose practical reasons:

- lane complementarity
- skill fit
- industry or arena overlap
- location/turf fit
- timeline fit
- goal fit
- proof signals where available
- conflicts or missing pieces where useful

## Multi-Member Blueprint Pattern

Blueprints are multi-member rooms. The matching system should support more than one-to-one business dating.

A Blueprint may need:

- a Spark
- a Builder
- a Worker
- an Operator
- a Backer
- a Connector
- vendors or advisers outside the user graph

The Blueprint, not a single user, is the organizing object.

## Lock The Joints

"Lock the Joints" is the current phrase for accepting fit or moving a collaboration forward. Because the phrase also appears in other flows, naming collision is open in `WERKLES_OPEN_QUESTIONS.md`.

Avoid "co-sign" as the canonical term because it is lending-adjacent vocabulary.

## Momentum Rules

Momentum is valuable. Silent approval is dangerous.

Open rule:

- 48 hours may trigger escalation
- 96 hours may trigger expiry
- auto-add by silence is not approved law

Exact 48-hour and 96-hour mechanics remain open.
````````

<!-- SOURCE_BLOCK_END company/WERKLES_MATCHING_RULES.md -->

### Maker handoff: Match Stacking & Need Translation V0

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\handoffs\outbox\FROM_MAKER_MATCH_STACKING_V0_2026-06-08.md`

<!-- SOURCE_BLOCK_BEGIN foreman/handoffs/outbox/FROM_MAKER_MATCH_STACKING_V0_2026-06-08.md -->

````````md
# From Maker — Match Stacking & Need Translation V0

## Source
Operator drop: `WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0` (2026-06-08)

## Status
**Doctrine preserved + schema audit complete.** No engine built. No schema migrated.

## Files added/updated
- `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` — canonical doctrine (DRAFT)
- `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md` — codebase gap audit per “Next Safe Build”
- `company/WERKLES_MATCHING_RULES.md` — cross-links to architecture + audit
- `app/globals.css` — light-paper text contrast fixes (`.muted`, reveal rail, placeholders, cockpit nav)

## Audit headline
- **Layer 0** (need translation): copy/narrative only — not in schema or match RPC
- **Layer 1 + 3**: partial (blocks, eligibility, blueprint weighted score)
- **Layers 2, 4, 5**: not represented
- **Profile V0**: ~40% of doctrine fields in `profiles` table

## CSS fix (Operator-reported)
Light cream tokens (`--werkles-text-primary/secondary`) were leaking onto warm paper panels. Patched:
- `.muted` class (was undefined)
- Placeholder text on light fields
- Reveal rail / Squibb / crucible state cards
- Cockpit dashboard nav on paper backgrounds

## Explicitly not in this drop
- Ghost Forge Render run (Gate 05 PAUSE — needs Ender art direction for *missing-piece* arc vs three-partner imagery)
- Layer 0 engine or SQL migrations
- Second operator drop (pending)

## Human gates
- Petra GO before profile schema extensions (stated need, offer, trust gate, momentum)
- Ender art direction before new narrative imagery batch
- Gate 05 GO before Render spend

## Suggested next
1. Ben review audit: `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`
2. Ender packet: imagery arc for “what you didn’t know you needed”
3. Operator paste second drop when ready
````````

<!-- SOURCE_BLOCK_END foreman/handoffs/outbox/FROM_MAKER_MATCH_STACKING_V0_2026-06-08.md -->

### Maker parallel review: homepage/Layer 0 conflicts and Squibb placement

Source path: `C:\Users\Ben Leak\github\Werkles\FROM_MAKER_PARALLEL_REVIEW_NOTES_2026-06-09.md`

<!-- SOURCE_BLOCK_BEGIN FROM_MAKER_PARALLEL_REVIEW_NOTES_2026-06-09.md -->

````````md
# FROM_MAKER — Parallel Safe Slice Review Notes
## 2026-06-09

**Mode:** Read-only inspection. No code edits. Dink owns Speaker / GD / Layer 0 plumbing.  
**Branch context:** `rescue/sally-dirty-worktree-2026-06-01` (dirty worktree; not re-verified today).  
**Build:** `npm run typecheck` pass; `.next` artifact present. Dev server observed at `http://localhost:3000`.

---

## 1. App status (quick health)

| Surface | Status | Notes |
|---------|--------|-------|
| `/` (homepage) | **200** | Large HTML payload (~109KB). Renders full stacked homepage. |
| `/proof` | **200** | Loads. |
| `/bellows` | **200** | Loads. |
| `/membership` | **Slow / timeout** | 15s fetch timed out in dev — likely cold compile, not confirmed broken. Re-check in browser. |
| `/spark` | **Slow / timeout** | Same as above. |
| `/gd/speaker` | **Redirect fail (expected)** | Next route redirects to `http://127.0.0.1:4317/#gd-speaker`; Foreman control server not running → connection refused. Operator-only; not a public homepage concern. |

**Screenshots not captured** (parallel slice = notes only). Recommended captures for Ben/Dink review:

1. **Hero fold** — headline, artifact card, signup preview line (legibility on paper).
2. **Reveal rail** (`WorkshopTrustRail`) — three thought/reveal pairs + Squibb text line.
3. **Ender UX block** — `ImageryArcJourney` + `DiscoveryMechanism` + `TrustSignalStrip` (scroll fatigue check).
4. **Four-act rail** — `NarrativeJourneySection` immediately below (journey model collision).
5. **How it works** — three steps with dossier/fit/knock icons.
6. **Lanes documentary grid** — six lane cards mid-page.
7. **Mobile 390px** — hero grid + reveal 3-col collapse + long-scroll density.

---

## 2. What should Squibb feel/look like on the homepage?

### Today (as built)

Squibb on the homepage is **almost entirely text**, not character:

| Location | Form | Copy |
|----------|------|------|
| `WorkshopTrustRail` | Plain `<p>` caption | `copy.squibb.default` — "Something here might be closer than you thought…" |
| `ImageryArcJourney` | Same text line in intro | Duplicate |
| `DiscoveryMechanism` | Same text line at footer | Duplicate (third time) |
| `BellowsHomePreview` | **Draft render images** (if `RENDER_BATCH_4_SQUIBB_ENABLED`) | Only visual Squibb on page; caption says "draft exploration, not canonical cutout" |
| Hero | **No Squibb** | `WorkshopGreeter` W-mark not wired on homepage |

Per `foreman/MASCOT_RULES.md`: canonical brass-owl cutout **not landed**; Ghost Forge Squibb is exploration only. Current homepage Squibb reads as **footnote voice**, not Scout.

### What it should feel/look like (mock notes for Dink — no implementation)

**Role on homepage:** Scout at the **Discovery** beat only — points at one overlooked option, asks **one** noticing question, dismissible. Not host of the whole page, not Crucible foreman, not Bellows lecturer.

**Visual treatment (when cutout lands):**

```
┌─────────────────────────────────────────────┐
│  [Reveal pair card: "I thought I needed…"]  │
│                              ┌──────┐       │
│                              │ bust │  ← 64–96px, workshop-lit, not sticker
│                              └──────┘       │
│  "Under that — is it really hours, or      │
│   capital with a cleaner path?"    [×]      │
└─────────────────────────────────────────────┘
```

- **Placement:** Anchor to **one** reveal moment — best candidate: second thought/reveal pair or Money/Equipment category card, not hero, not footer of every section.
- **Motion:** Single fade-in on scroll into reveal band; `prefers-reduced-motion` → static.
- **Dismiss:** Persistent for session; never re-open as modal.
- **Tone:** Short interrogative line; never answers; never multi-turn chat chrome.
- **Anti-patterns to avoid:** Clippy bubble, chat input, pulsing badge, mascot larger than human story in frame.

**Copy dedup:** One Squibb moment per scroll depth — reveal rail OR discovery step 2, not three identical `copy.squibb.default` strings.

**GD / operator panels (not homepage):** Squibb voice stays product; Speaker constitutional feed stays Foreman `#gd-speaker`. Do not merge onto public marketing scroll.

---

## 3. Where would Layer 0 discovery appear?

### Doctrine target (`company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`)

Layer 0 = **stated need → translated bottleneck** before eligibility/matching. Output widens the map; does not override user.

### Already on homepage (partial, static)

| UI surface | Layer 0 fit | Maturity |
|------------|-------------|----------|
| **`WorkshopTrustRail`** (`copy.home.reveal.pairs`) | **Best current Layer 0 UI** — thought → nearer bottleneck copy | Static templates; not personalized |
| **`DiscoveryMechanism`** | Process scaffold (5 steps) | Non-interactive; describes feel |
| **`ImageryArcJourney` reveal grid** | Category framing (People/Money/Space/Equipment) | Art-direction scaffold |
| **`TrustSignalStrip`** | Post-translation runway (Formation beat) | Preview marks only |
| **Hero artifact** | Example reachable means (equipment/lender) | Good direction; single static card |

### Where Layer 0 **should** appear (recommended locus — mock only)

1. **Primary:** Replace or subsume duplicate discovery blocks with **one** "Stated need → Translated bottleneck" band directly under hero (before or instead of second meta-heavy arc section).
2. **Secondary:** Onboarding first door / signup — free-text "What did you come looking for?" + one Squibb follow-up (Dink/Speaker plumbing).
3. **Tertiary:** Workbench match card footnote — "You said X; nearer bottleneck may be Y" (per `MATCH_STACK_SCHEMA_AUDIT_V0` §7).
4. **Not Layer 0:** Lanes grid, how-it-works profile steps, match deck scoring — those are L1+.

### What is **not** Layer 0 today

- No input capture.
- No persistence.
- No linkage from stated need to profile fields.
- `hero.signupPreview` still routes to **lane → profile** funnel, skipping translation.

---

## 4. Homepage sections that conflict with bottleneck-discovery thesis

**Thesis:** User names a gap → Werkles surfaces the **nearer bottleneck** and **reachable means** (often money/space/equipment), not profile-fit matching.

### High conflict (copy + structure)

| Section | Conflict | Why |
|---------|----------|-----|
| **`#how` — How it works** | **High** | Headline: "Profile. Visible potential. Introduce when it lines up." Steps: build profile → read potential (complementary lanes) → request intro. Pure L1/L3 framing; bypasses Layer 0. |
| **`hero.signupPreview`** | **High** | "Sign up → pick your lane → build your profile" under hero that says "name the real gap." Funnel contradicts discovery-first arc. |
| **`LanesDocumentarySection`** | **Medium–High** | "Six lanes. Real people. Visible potential." Centers **who you are** before **what's blocking you**. Fine as cast roster later; too early in scroll for bottleneck thesis. |
| **`NarrativeJourneySection`** | **Medium** | Four-act Spark→Foundry competes with five-beat Ender arc + discovery mechanism. Two journey models back-to-back = cognitive fork. |
| **`home.dashboardTeaser` / account gate** | **Medium** | Workbench teaser emphasizes "read factors, request intro" — intro/match path before translated need. |
| **How-step icons** (`step-dossier`, `step-fit`, `step-knock`) | **Medium** | Visual language still dossier/fit/knock. |

### Medium conflict (tone / meta)

| Section | Conflict | Why |
|---------|----------|-----|
| **`ImageryArcJourney`** | **Medium** | Labels "Imagery:" / "UX feel:" / cast `<details>` read as **internal art brief**, not visitor copy. Undermines documentary-real thesis. |
| **`hero.brandPromise`** ("Build with people who've been checked") | **Medium** | People-trust default; bottleneck thesis wants people **or** lender **or** seller **or** space. |
| **Hero artifact badge** (`copy.trust.badge` = "Built on Trust") | **Low–Medium** | Ender anti-pattern: vague single trust word — mitigated below by `TrustSignalStrip`, but badge on hero still fuzzy. |
| **Duplicate Squibb lines ×3** | **Low** | Noise; dilutes single Scout moment. |

### Aligned (keep, refine copy only)

- Hero headline/subhead (gap / missing piece).
- `WorkshopTrustRail` reveal pairs (Layer 0 templates).
- `DiscoveryMechanism` (process — needs Dink voice, less meta).
- `TrustSignalStrip` (itemized runway).
- Hero artifact pivot to equipment/lender means.
- Proof / trust sections ("runway not verdict").

### Scroll-order problem

Current order stacks **discovery thesis** (reveal + Ender blocks) then immediately **profile/lane/narrative** content. Visitor may read bottleneck story, then hit "build your profile" and infer Werkles is still a matching network.

```
Hero (gap) → Reveal (L0) → Ender arc (meta) → Discovery steps → Trust marks
→ Four-act journey → Space → Lanes → Forge extras → Bellows → How (profile) → Proof → Ops (signup)
```

**Recommendation for later pass (not this slice):** One discovery band early; defer lanes + how-it-works + four-act rail below fold or to subpages.

---

## 5. Styling / legibility notes (visual, not fixed here)

- Paper surfaces generally improved (`--werkles-ink-on-paper` / muted tokens). Spot-check in browser still warranted — especially **membership/pricing hero washes** over draft imagery.
- `ImageryArcJourney` + `DiscoveryMechanism` + `TrustSignalStrip` add **three more full-width panels** — homepage feels long and "documentation-heavy."
- `hero-fold-trust__grid` is **3 columns** on desktop; on narrow viewports verify pair text doesn't crush.
- Squibb captions use same muted ink as body — OK for AA on paper; Squibb should gain **visual** weight via bust, not bolder gray text alone.

---

## 6. Confusing copy hotspots (for Dink)

| String | Location | Issue |
|--------|----------|-------|
| "Profile. Visible potential. Introduce when it lines up." | `#how` | Conflicts with anti-matching / bottleneck discovery |
| "Sign up → pick your lane → build your profile" | Hero footer | Skips Layer 0 |
| "Imagery:" / "UX feel:" prefixes | `ImageryArcJourney` beats | Internal doc voice |
| "Anyone can be anything" eyebrow | `ImageryArcJourney` | Bold claim OK only paired with means — partially done in lede, but eyebrow alone risks poster lie |
| "Built on Trust" badge | Hero artifact | Vague trust mark |
| "Six lanes. Real people. Visible potential." | Lanes section | "Who are you" before "what's blocking" |
| Same Squibb line ×3 | Reveal + arc + discovery | Repetitive; weakens Scout |

---

## 7. UI mock notes — GD status panels (operator / Foreman only)

Not for homepage. For Dink's Speaker / GD plumbing parallel:

**Foreman `#gd-speaker` panel (localhost:4317)**

```
┌─ GD Speaker ─────────────────────────────────┐
│ Layer 0 plumbing: MOCK │ Speaker entries: 8  │
│ Last packet: —         │ Doctrine sync: OK   │
├──────────────────────────────────────────────┤
│ [Speaker entry list — constitutional only]   │
│ Status: DRAFT · not public copy              │
└──────────────────────────────────────────────┘
```

**Suggested status chips (read-only indicators):**

- `L0_ENGINE: narrative-only`
- `L0_INPUT: not wired`
- `SQUIBB_CUTOUT: pending`
- `GATE_05_RENDER: PAUSE`
- `SPEAKER_RELAY: Dink-owned`

**`/gd/speaker` Next route:** Redirect to Foreman is correct architecture; show friendly "Start Foreman control server" fallback page when 4317 down (optional polish — Dink scope).

---

## 8. What can wait

| Item | Wait reason |
|------|-------------|
| Squibb canonical cutout on homepage | Ben manual asset; MASCOT_RULES |
| Ghost Forge / Render batch imagery | Gate 05 PAUSE |
| Interactive Layer 0 input + Squibb once-question flow | Dink/Speaker plumbing + schema audit GO |
| Consolidating four-act vs five-beat journey | Needs Ender + Dink narrative lock |
| Rewriting `#how` + lanes + signup preview | Copy pass after Layer 0 UI spec from Dink |
| `ImageryArcJourney` internal meta labels → visitor copy | Dink |
| GD Speaker public route / Foreman fallback UX | Dink |
| Match deck factor footnotes | Post Layer 0 mock on workbench |
| Membership/spark dev timeout investigation | Low priority unless repro in browser |
| Homepage length / section dedup | After Dink handoff approves Maker writes |

---

## 9. Maker parallel slice — explicit boundaries respected

**Did not touch:** `foreman/speaker/**`, `foreman/handoffs/**`, `scripts/speaker-search.js`, GD relay/status plumbing, Layer 0 test harness, packet manifest, cockpit files.

**This file is the only write** — review notes for Dink handoff and Ben visual pass.

---

*End of parallel review. Await Dink handoff before any homepage implementation writes.*
````````

<!-- SOURCE_BLOCK_END FROM_MAKER_PARALLEL_REVIEW_NOTES_2026-06-09.md -->

### Maker Speaker UX Review: where Speaker consultation belongs

Source path: `C:\Users\Ben Leak\github\Werkles\FROM_MAKER_SPEAKER_UX_REVIEW_2026-06-10.md`

<!-- SOURCE_BLOCK_BEGIN FROM_MAKER_SPEAKER_UX_REVIEW_2026-06-10.md -->

````````md
# FROM_MAKER — Speaker UX Review (GimpDash / GD)
## 2026-06-10

**TO:** Ben / Petra / Dink  
**FROM:** Maker  
**MODE:** Read-only UX review — **no code edits**  
**SCOPE:** Where Speaker consultation should *appear* once GD consults it

---

## Surfaces reviewed (read-only)

| Surface | URL / path | Role today |
|---------|------------|------------|
| **GimpDash** (canonical GD) | `http://127.0.0.1:4317/#gimpdash` | Intent textarea → Route intent → governor output (`#gd-governor-output`) |
| **Speaker office** | `http://127.0.0.1:4317/#gd-speaker` | Ledger table, warnings list, role chips, DRAFT entry form |
| **Next redirects** | `/gd/command-console`, `/gd/speaker` | Redirect to Foreman anchors above |
| **Next GD client** | `components/gd/gd-command-console-client.tsx` | Mirror of governor output — not primary; Foreman is source of truth |
| **Werkles app dashboard** | `/dashboard` (MatchDeck, profile, blueprints) | **Product** workbench — not operator GD cockpit |

**Finding:** Speaker and GimpDash already share one Foreman page but are **visually separate**. Governor output has **no Speaker consultation block** yet. `classifyGdCommand` / `formatGdCommandVerdict` route crew and packets only.

---

## 1. Where should “Relevant Speaker Doctrine” appear in GimpDash?

**Primary placement — inside governor output, immediately after verdict grid, before auto-routed crew.**

```
┌─ GimpDash: Route intent ─────────────────────────────┐
│ [intent textarea]  [Route intent]                   │
├─ Governor result ─────────────────────────────────────┤
│ Verdict │ Topic │ Risk │ Human gate                   │
├─ Speaker consulted ─────────────── NEW ───────────────┤
│ ▸ 2 relevant entries · 1 doctrine file                │
│   • Layer 0 need translation (RATIFIED) — why match…  │
│   • Not-matching matching (DRAFT) — warning if…       │
│   Doctrine: company/WERKLES_MATCH_STACKING_…          │
│   [Open in Speaker ↗]                                 │
├─ Auto-routed crew ────────────────────────────────────┤
│ …                                                     │
└───────────────────────────────────────────────────────┘
```

**Why here:** Operator just stated intent; causal memory belongs **before** crew routing explains *who* gets work. Answers “why we believe this route” without opening a second office.

**Secondary placement — collapsed strip on `#gd-speaker` panel header:**

> *Last consulted: thread refresh · 2 entries matched · 09 Jun*

Useful for audit when Operator jumps to Speaker office — not a substitute for inline consultation.

**Do not place on:** Werkles `/dashboard` MatchDeck, public homepage, or membership flows in v1. Speaker is **operator constitutional memory**, not product UX.

---

## 2. How should GD show that it consulted Speaker before routing?

Use a **consultation receipt** — one line + expandable detail. Always visible when routing completes.

**Receipt line (always on):**

```
Speaker consulted · 2 entries · 1 doctrine file · match: keyword + trigger
```

**Status chip on Route intent button area after route:**

| State | Chip | Meaning |
|-------|------|---------|
| `CONSULTED` | green | ≥1 entry or doctrine matched intent |
| `CONSULTED_EMPTY` | muted | Consult ran; nothing relevant (say so explicitly) |
| `NOT_RUN` | warn | Plumbing gap — should not ship silently |
| `BLOCKED` | amber | Ratified warning triggered; routing may be HUMAN_REVIEW |

**Timestamp + intent hash** in `<details>` only — proves consultation happened for this click, not a stale panel.

**Copy governor brief** should append a `SPEAKER_CONSULTATION:` block (Dink plumbing) so pasted briefs carry causal context off-console.

**Anti-pattern:** Do not imply Speaker *approved* the route. Wording: **“consulted”** / **“surfaces”** — never “Speaker says GO.”

---

## 3. What should the Operator see?

### Matching doctrine

- **One-line lesson** per matched entry (from `lesson learned` field), not full entry body.
- **Doctrine file path** when tag/trigger maps to `company/*` or `foreman/speaker/*` (click opens file).
- **Status badge:** `DRAFT` vs `RATIFIED` vs `SUPERSEDED` — ratified entries sort first.
- **Relevance hint:** which trigger matched (`matchmaking`, `layer 0`, `deploy`, etc.).

### Causal reason

- **Why this entry matters for this intent** — single sentence template:  
  *“Because you mentioned {X}, Speaker recalls: {lesson}.”*
- Pull from **Why it happened** + **Future warning** — not Event/Context walls of text in the default view.

### Confidence / status

| Signal | Display |
|--------|---------|
| Entry status | RATIFIED = solid chip; DRAFT = dashed “hypothesis”; SUPERSEDED = strikethrough, collapsed |
| Match strength | `strong` (ratified + trigger hit) / `weak` (tag only) / `doctrine-only` (file path, no entry) |
| Consult coverage | “2 of 8 entries scanned” optional in debug |
| Routing impact | “Elevated to HUMAN_REVIEW” if warning signature fires |

### Linked entry paths

- Each row: `foreman/speaker/entries/DRAFT_….md` as monospace link → `open-speaker-*` actions already in Foreman.
- **Related entries** from front matter as secondary links (collapsed).
- **Open Speaker panel** anchor `#gd-speaker` + scroll-to-entry if ID known.

**Default card (max 3 entries + 1 doctrine):**

```
┌─────────────────────────────────────────┐
│ RATIFIED · not-matching-matching        │
│ Lesson: Werkles is formation, not algo  │
│ Trigger hit: "matchmaking"                │
│ → foreman/speaker/entries/DRAFT_…md       │
└─────────────────────────────────────────┘
```

---

## 4. What should be hidden by default?

| Hide | Reason |
|------|--------|
| Full 10-field entry bodies | Causal soul lives in files; governor output is a **pointer** |
| Role registry chips (14 roles) | Belongs in `#gd-speaker` office, not every route |
| Classifier `matchedRules` debug | Already in `<details>` — keep there |
| Full `generatedPacket` pre | Collapse; receipt + next step first |
| SUPERCEDED entries | Unless explicitly referenced |
| Draft entry form | Stays in Speaker panel only |
| Empty consultation | Show one line: “Speaker consulted — no matching doctrine” (not hidden) |
| Thread refresh packet preview | Already in separate `<details>` — good |
| Mission class table | Reference material — keep collapsed |

**Rule:** Default governor output = **verdict + Speaker receipt + top lessons + crew + next**. Everything else folds.

---

## 5. What would make Speaker feel alive without dashboard sludge?

**Alive:**

- Consultation receipt updates **on every Route intent** — Speaker “noticed” this intent.
- **Warning interrupt** — one amber line when trigger matches:  
  *“Speaker warning: don’t market as matching algorithm.”*
- **Ratified vs draft** visual weight — ratified feels institutional; draft feels provisional.
- **One-click** from lesson → open entry in Speaker panel.
- Occasional **doctrine path** chip tied to company docs (Layer 0, match stacking).

**Sludge (avoid):**

- Embedding full ledger table inside every route.
- Squibb-style mascot or owl chrome in GimpDash.
- Chat transcript UI (“Speaker says…”).
- Auto-expanding all `<details>` on the Foreman home page.
- Duplicating Speaker panel inside Next `/gd/command-console` (single console rule stands).

**Metaphor:** Speaker as **margin note in the governor brief** — present, cited, dismissible — not a second dashboard.

---

## 6. What can wait?

| Wait | Why |
|------|-----|
| Speaker on Werkles `/dashboard` MatchDeck | Product Layer 0 footnotes are separate; Dink owns plumbing |
| Speaker on public homepage | Operator-only constitutional office |
| LLM semantic entry matching | Keyword/trigger v0 is enough for consult receipt |
| Live “Speaker confidence score” | Honest status badges beat fake percentages |
| Cross-session consultation history UI | Log file later; v1 is per-route receipt |
| Ratify workflow in UI | Ben ratifies in files; status badge read-only |
| Next.js GD client parity | Foreman `:4317` is canonical |
| Speaker warnings that block routing automatically | Display warning first; Ben gates behavior |
| Entry diff / supersede visualization | Ledger table in `#gd-speaker` is enough for now |

---

## Recommended v1 layout (Dink implementation target)

**GimpDash `#gd-governor-output` insert order:**

1. Verdict grid (existing)
2. **Speaker consultation receipt** (new)
3. **Relevant doctrine cards** — max 3 (new)
4. Mission description (existing)
5. Auto-routed crew (existing)
6. Hard stops (existing)
7. Next action (existing)
8. Draft packet + full export in `<details>` (existing)

**`#gd-speaker` panel:** Keep as constitutional office. Add optional “last consultation” footer only — do not merge into GimpDash hero.

---

## Desktop packet clarification (Ben asked)

Earlier I referenced a file on your **Desktop GitHub clone**, not necessarily in `C:\Dev\Werkles`:

**Path:**
```
c:\Users\benle\Desktop\github\Werkles\foreman\handoffs\outbox\TO_MAKER_SITE_COPY_ANYONE_CAN_BE_ANYTHING_v1_20260609.md
```

**What it is:** Dink’s **homepage copy implementation packet** (draft) derived from Ender’s “Anyone can be anything” imagery brief. It is the **copy layer** — hero H1, Door, Discovery, four resources, Formation, Trust Signals, Squibb, Momentum — not Speaker/GD plumbing.

**Related Ender source (same arc, imagery/UX feel):**
```
c:\Users\benle\Desktop\github\Werkles\foreman\handoffs\inbox\FROM_ENDER_SITE_IMAGERY_UX_DIRECTION_ANYONE_CAN_BE_ANYTHING_20260609.md
```

**In `C:\Dev\Werkles` today:** equivalent content was implemented under older filenames (`FROM_ENDER_IMAGERY_AND_UX_FOR_MAKER_1.md` in inbox; copy wired in `lib/copy.ts`). The dated Desktop filenames may not be synced into the active dev tree.

**To review:** open the Desktop `TO_MAKER_SITE_COPY_…` file above, or diff against `C:\Dev\Werkles\lib\copy.ts` → `copy.home.anyone` and `copy.hero`.

---

## Hard stops respected

No code edits · No Speaker file edits · No GD plumbing edits · No packet manifest · No production · No deploy · No secrets · No builds

---

*Maker UX recommendation only. Dink owns Speaker/GD consultation plumbing implementation.*
````````

<!-- SOURCE_BLOCK_END FROM_MAKER_SPEAKER_UX_REVIEW_2026-06-10.md -->

### Maker User #1 Journey Map: Business Matchmaking -> Human Opportunity Discovery

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\handoffs\outbox\FROM_MAKER_USER1_JOURNEY_MAP_V1.md`

<!-- SOURCE_BLOCK_BEGIN foreman/handoffs/outbox/FROM_MAKER_USER1_JOURNEY_MAP_V1.md -->

````````md
# FROM_MAKER_USER1_JOURNEY_MAP_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: journey map / analysis only. No build, no code, no redesign, no marketing copy.

## Framing

Werkles is evolving from **Business Matchmaking** → **Human Opportunity Discovery**. This maps User #1 from homepage arrival to their **first actionable opportunity recommendation**, using existing repo concepts where they exist (lanes: Builder/Operator/Backer/Connector/Spark; onboarding "The First Weld" — lane/arena/turf; dossier; match deck; knock/intro; "proof signals, visible reasons, not magic") and the new discovery layers (Layer 0 → Need Translation → Bottleneck Discovery → Possible Outcomes).

Per-step fields: **User Goal · System Goal · Information Required · Risk of Drop-Off · Open Questions.**

---

## 1. Homepage arrival

- **User Goal:** Understand in seconds whether this is for them ("is there something here for me?").
- **System Goal:** Establish credibility + the discovery promise; earn the first click; avoid feeling like a guru funnel or a sterile job board.
- **Information Required:** What Werkles does (find people/opportunities to build with), who it's for (the five lanes / anyone with a starting point), the anti-guru trust posture.
- **Risk of Drop-Off:** Bounce if it reads as generic SaaS, MLM/guru, or "another matching app"; confusion if the promise is abstract ("opportunity discovery" without a concrete hook).
- **Open Questions:** Is the hook "find a partner" or the broader "find your next move"? Does User #1 self-identify with a lane, or arrive needing translation first?

## 2. First click

- **User Goal:** Take the lowest-commitment step toward "show me something relevant to me."
- **System Goal:** Capture intent with minimal friction; route into onboarding without demanding an account or payment first.
- **Information Required:** A single clear primary action and what happens after it (expectation setting).
- **Risk of Drop-Off:** Too many CTAs; the click demands signup/payment too early; unclear payoff.
- **Open Questions:** Should first click be "start" (onboarding) vs "browse" (see opportunities) vs "tell us your situation" (need-first)? Account before or after first value?

## 3. Onboarding ("The First Weld")

- **User Goal:** Tell the system enough about themselves to get relevance, without a heavy form.
- **System Goal:** Capture lane, arena, turf (and starting assets/constraints) to seed discovery; keep it short ("three sparks before the dossier gets heavier").
- **Information Required:** Lane (or "not sure yet"), arena/industry, turf/location, rough goal, what they bring.
- **Risk of Drop-Off:** Form fatigue; forced lane choice when the user doesn't know their lane; ZIP/location friction.
- **Open Questions:** Can a user proceed with "unsure" on lane? How much is required vs optional for a first recommendation? Quick-weld vs full-audit path for User #1?

## 4. Layer 0 (raw starting point)

- **User Goal:** Be understood at the most basic level — "here's where I actually am right now."
- **System Goal:** Capture the rawest truth (situation, resources, constraints, intent) *before* structuring it; the zero-th layer discovery builds on.
- **Information Required:** Plain-language self-description; what they have (time/money/skill/network/asset); what they want to move toward; hard constraints.
- **Risk of Drop-Off:** Feels like therapy or a long survey; user can't articulate their situation; fear of judgment.
- **Open Questions:** Is Layer 0 free-text, guided prompts, or structured? How do we capture "I don't know what I want" as a valid Layer 0 state?

## 5. Need Translation

- **User Goal:** Have their messy situation turned into "so what you actually need is X."
- **System Goal:** Convert Layer 0 into structured, actionable needs (need vectors) the matching/discovery engine can operate on; reflect it back for confirmation.
- **Information Required:** Mapping rules from raw inputs → need categories (partner, capital, customer, skill, license, intro, validation); a confirmation step.
- **Risk of Drop-Off:** Mistranslation ("that's not what I meant") erodes trust; over-automation feels like it's not listening.
- **Open Questions:** Is translation AI-assisted or rule-based for V1? How much does the user confirm/correct vs accept? How are mistranslations recovered?

## 6. Bottleneck Discovery

- **User Goal:** Find out what's *actually* stopping them ("what's the real blocker?").
- **System Goal:** Identify the single highest-leverage constraint — remove it and progress unlocks (capital? a co-founder? a first customer? a credential? clarity?).
- **Information Required:** Constraint taxonomy; signals distinguishing a real bottleneck from a stated one; prioritization logic.
- **Risk of Drop-Off:** Generic/obvious output ("you need money") with no insight; feels like a personality quiz; no proof behind the claim.
- **Open Questions:** How is the *primary* bottleneck chosen when several exist? Does the user rank/confirm? How to avoid demoralizing framing?

## 7. Possible Outcomes

- **User Goal:** See the realistic paths open to them ("what could actually happen from here?").
- **System Goal:** Surface a small, honest opportunity space tied to their need + bottleneck (partner types, opportunity types, next moves) — options, not yet one answer.
- **Information Required:** Outcome/opportunity catalog; how inputs map to a shortlist; honesty about uncertainty (no guarantees).
- **Risk of Drop-Off:** Too many options (paralysis) or too few (feels empty); outcomes feel generic or unattainable.
- **Open Questions:** How many outcomes to show? Ranked or exploratory? How tightly coupled to the eventual single recommendation?

## 8. First Recommendation

- **User Goal:** Get one concrete, believable, actionable thing to pursue.
- **System Goal:** Deliver a single recommendation with **visible reasons** (proof signals, why-this-why-now), not magic — a person to meet, an opportunity to test, or a move to make.
- **Information Required:** Ranking + explanation; the proof/signal behind it; what the user can actually do next with it; what's still self-reported/unverified.
- **Risk of Drop-Off:** Recommendation feels random or unexplained; no clear action; trust gap ("why should I believe this?").
- **Open Questions:** Is rec #1 a *person* (matchmaking heritage) or an *opportunity/path* (discovery future) — or both? What's the minimum proof to justify it? What if there's no good match yet?

## 9. Next Action

- **User Goal:** Do the concrete next thing (request an intro / knock, strengthen dossier, verify a claim, explore an outcome).
- **System Goal:** Convert recommendation into a tracked action; set expectations for response; bring them back (return loop).
- **Information Required:** The action mechanics (knock/intro request, dossier step, verification), expected timing, status visibility (ties to SoleDash-style states).
- **Risk of Drop-Off:** Dead end after the rec; action requires payment/verification the user isn't ready for; no feedback after acting.
- **Open Questions:** Is the first Next Action gated by membership/verification, or free to build trust? How is "what happens after I act" shown? What's the comeback trigger?

---

## Cross-cutting risks

- **Identity ambiguity:** the product is mid-pivot (matchmaking ↔ opportunity discovery); User #1 may not know which they're using.
- **Translation trust:** Need Translation + Bottleneck Discovery are the make-or-break trust moments; a wrong read loses the user.
- **Time-to-value:** every layer (0 → translation → bottleneck → outcomes) adds friction before the payoff (first rec). Too many layers = drop-off.
- **Proof posture:** the brand promise ("visible reasons, not magic") must hold at step 8 or trust collapses.

---

## Required Final Question

**"What is the smallest version of this journey that could be tested with real users within 30 days?"**

**Smallest testable slice (concierge / Wizard-of-Oz, not a built engine):**

- **Collapse the layers into one short intake.** Steps 3–5 (Onboarding + Layer 0 + Need Translation) become a single guided form/conversation capturing: where you are, what you have, what you want, hard constraints — plain language allowed.
- **Manual translation + bottleneck + recommendation.** Skip building the engine. A human (Ben/operator) or a single assisted pass reads the intake and produces: one named bottleneck + one explained first recommendation (a person, opportunity, or move) **with visible reasons**. Wizard-of-Oz is acceptable for a 30-day test.
- **One concrete Next Action.** A single low-friction action (e.g., "request this intro" / "do this next step"), no payment or verification gate, with a simple status so the user knows what happens next.
- **Cut for the test:** the "Possible Outcomes" browsing layer, lane perfection, account/payment, and any automated matching — all deferred. The goal is to learn whether the **Layer 0 → translation → bottleneck → one believable recommendation** chain creates trust and action.
- **Success signal to measure:** does User #1 (a) complete intake, (b) say the bottleneck/recommendation "feels right," and (c) take the Next Action? That validates the core discovery promise before any engine is built.

In one line: **a single-intake, human-in-the-loop concierge test that takes a real person from "here's my situation" to "one believable, explained recommendation + one action" — everything else stubbed.**

---

## Hard stops honored

Analysis only. No build, no code, no redesign, no marketing copy.
````````

<!-- SOURCE_BLOCK_END foreman/handoffs/outbox/FROM_MAKER_USER1_JOURNEY_MAP_V1.md -->

### Maker Wizard-of-Oz Test: lose early before engine build

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\handoffs\outbox\FROM_MAKER_WIZARD_OF_OZ_TEST_V1.md`

<!-- SOURCE_BLOCK_BEGIN foreman/handoffs/outbox/FROM_MAKER_WIZARD_OF_OZ_TEST_V1.md -->

````````md
# FROM_MAKER_WIZARD_OF_OZ_TEST_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: test design only. No code, no build, no automation.
Source: `FROM_MAKER_USER1_JOURNEY_MAP_V1.md` (smallest 30-day slice).

## Goal

Validate the core Human Opportunity Discovery chain — **Layer 0 → need translation → one bottleneck → one explained recommendation → one action** — using a human in the loop, before building any engine.

Shape: a real person submits **one intake**; a human reviewer produces **one bottleneck + one explained recommendation + one next action**, by hand. Everything else is stubbed.

**Recommendation rule:**
- **Primary recommendation = the best NEXT PATH** (a move/step the user should take).
- **Supporting recommendation = a person / resource / tool**, only if it directly unblocks the primary path.

---

## 1. Intake questions

Plain-language, ~10 questions, mostly free text. No account, no payment. Goal: capture Layer 0 + enough to translate need and spot a bottleneck. (Functional wording below — not final user-facing copy.)

1. **In a sentence or two, where are you right now?** (situation)
2. **What are you trying to move toward in the next 3–6 months?** (intent/goal)
3. **Why now? What changed or is pushing you?** (motivation/urgency)
4. **What do you already have to work with?** (assets: skills, time, money, network, tools, customers, a place, an idea) — list what applies.
5. **What feels like the biggest thing in your way?** (self-stated bottleneck — captured but not trusted as truth)
6. **What have you already tried, and what happened?** (history / what's not working)
7. **What can't change?** (hard constraints: location, time, money floor/ceiling, obligations)
8. **If a stranger could hand you ONE thing right now, what would it be?** (reveals perceived need)
9. **Which best describes you today?** Builder / Operator / Backer / Connector / Spark / **Not sure yet** (lane, optional)
10. **How do we reach you, and how soon do you want a first answer?** (contact + expectation)

Optional: "Anything else you want us to know?" (free text).

Capture mode: a form or a guided 1:1 (call/chat). No automated parsing in V1.

---

## 2. Reviewer worksheet (human-completed)

The reviewer (operator) fills this per intake. ~15 minutes. This IS the "engine" for V1.

```
INTAKE ID: __________   Date: ______   Reviewer: ______

A. RESTATE (Layer 0)
   - Situation in my words: ______
   - What they have: ______
   - What they want: ______
   - Hard constraints: ______

B. TRANSLATE NEED (what they actually need vs what they said)
   - Stated need (their words, Q5/Q8): ______
   - Translated need(s): [partner | capital | customer | skill | license/credential | intro | validation | clarity | other]: ______
   - Mismatch noticed (stated vs real)? ______

C. BOTTLENECK CANDIDATES
   - List all plausible blockers: ______
   - PRIMARY bottleneck (the one that, if removed, unlocks the most): ______
   - Why this one (evidence from intake): ______
   - Confidence: HIGH / MEDIUM / LOW

D. PRIMARY RECOMMENDATION (best next path)
   - The single move/step: ______
   - Why this is the best next path (visible reasons): ______
   - What it is NOT claiming / what stays uncertain: ______

E. SUPPORTING RECOMMENDATION (only if needed)
   - Person / resource / tool that unblocks the primary path: ______
   - Why it helps: ______

F. ONE NEXT ACTION (concrete, low-friction, no payment/verification)
   - The action: ______
   - Expected response/timing: ______

G. NOTES / UNKNOWNS / what I'd want the engine to learn: ______
```

---

## 3. Recommendation format (delivered to the user)

One clean artifact (message/doc). No marketing tone; honest and specific.

```
YOUR SITUATION
<one-paragraph reflection of where they are — proves we listened>

THE REAL BOTTLENECK
<the single primary blocker, named plainly>

YOUR BEST NEXT PATH  (primary recommendation)
<one concrete move/step>

WHY WE THINK THIS
<visible reasons tied to their intake — not magic>

WHAT WOULD HELP  (supporting — only if included)
<one person / resource / tool that unblocks the path>

YOUR NEXT ACTION
<one concrete, low-friction thing to do now>

WHAT WE'RE NOT CLAIMING
<honesty line: what's still self-reported / uncertain / not guaranteed>
```

Rule reflected: exactly **one** primary path; supporting is optional and only if it directly serves the path.

---

## 4. Success metrics

Quantitative (per cohort of test users):
- **Intake completion rate** — % who finish the intake.
- **Recommendation delivery rate** — % who receive a rec within the promised window.
- **"Feels right" rate** — % who, on a 1-question check, say the bottleneck + path resonate (target signal of translation trust).
- **Action-taken rate** — % who take the single Next Action.
- **Time-to-first-rec** — median reviewer turnaround.

Qualitative:
- Users can restate their bottleneck back in their own words (comprehension).
- Unprompted "that's exactly it" / "I hadn't thought of that" moments.
- Reviewer confidence vs user reaction correlation.

**North-star for V1:** does a real person go from "here's my situation" → "one believable, explained recommendation" → **takes the action**?

---

## 5. Failure metrics

- **Drop-off in intake** (which question loses them — instrument question-level abandonment).
- **Mistranslation rate** — user says "that's not what I meant" about need/bottleneck.
- **Generic-output flag** — user reaction "I already knew that" / "too obvious."
- **No-action rate** — receives rec, does nothing (and why: not believable / not feasible / no clear step / wrong timing).
- **Trust break** — user feels judged, sold to, or guru-handled.
- **Reviewer ambiguity** — reviewer can't pick a single bottleneck/path from the intake (signals intake gaps).
- **Latency failure** — rec not delivered in the promised window.

Each failure maps to a fix target: intake design, translation rubric, bottleneck logic, recommendation believability, or action design.

---

## 6. What NOT to build yet

- No matching/recommendation **engine**, ML, or scoring algorithm.
- No automated **need translation** or bottleneck detection.
- No **accounts / auth / profiles** (intake is standalone).
- No **payments / Stripe / membership** gates.
- No **Crucible / verification** flows.
- No **dashboards**, match deck, or intro-routing system.
- No **Ghost Forge** assets or visual polish for the test.
- No **scaling infra** — a form + a human reviewer + a delivered doc is the whole system.
- No **multi-rec / browsing** ("Possible Outcomes" layer) — one primary path only.

The point is to learn whether the human-judged chain earns trust and action. Build only what's needed to run that learning loop.

---

## How to run it (operational, no code)

- Intake = a form or scheduled 1:1. Reviewer = Ben/operator using the worksheet. Delivery = the recommendation format sent back. Track metrics in a simple sheet. Target a small first cohort (enough to see patterns, not statistical significance).

## Hard stops honored

Test design only. No code, no build, no automation.
````````

<!-- SOURCE_BLOCK_END foreman/handoffs/outbox/FROM_MAKER_WIZARD_OF_OZ_TEST_V1.md -->

### Maker Recommendation Card: human-written deliverable shape

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\handoffs\outbox\FROM_MAKER_RECOMMENDATION_CARD_V1.md`

<!-- SOURCE_BLOCK_BEGIN foreman/handoffs/outbox/FROM_MAKER_RECOMMENDATION_CARD_V1.md -->

````````md
# FROM_MAKER_RECOMMENDATION_CARD_V1

Date: 2026-06-12
Author: Maker (Cursor) · EXECUTION_CONTEXT: CURSOR_CLOUD_CONTAINER
Type: design only. Human-written. No AI, no automation.
Format: the six sections specified (Dink's recommendation format). Voice: Werkles anti-guru — plain, specific, no fog, no vouching, no false certainty.

## What this is

The exact user-facing **Recommendation Card** the concierge reviewer hands to a user. One card per user. Written by a human; the card is the deliverable of the WoZ concierge test.

## Card-wide writing rules

- **Plain language.** No jargon, no guru tone, no hype.
- **Their words first.** Quote/reflect the user before interpreting.
- **Proof, not magic.** Every claim shows its reason; no "trust us."
- **One primary path.** Supporting item (person/resource/tool) only if it unblocks the path.
- **No vouching.** Werkles never certifies a person/outcome — it points and explains.
- **Honest uncertainty.** State what would change the answer; never imply guarantee.
- **Short.** Each section 1–4 sentences. The whole card fits on one screen.

---

## Section-by-section spec

### 1. What You Asked For
- **Purpose:** prove we heard the literal request.
- **Contents:** the user's stated goal/ask, in their own framing (light paraphrase or quote).
- **Rule:** no interpretation yet — just mirror.

### 2. What We Heard Underneath It
- **Purpose:** surface the translated/real need (the insight moment).
- **Contents:** the deeper need or real situation behind the ask — the gap between stated and actual.
- **Rule:** respectful, not presumptuous; framed as "here's what it sounds like," invite correction.

### 3. Visible Reasons
- **Purpose:** show the evidence behind our read (the anti-magic spine).
- **Contents:** the specific signals from their intake that led to the bottleneck/recommendation.
- **Rule:** cite their own inputs; if a signal is weak or self-reported, say so.

### 4. Recommendation
- **Purpose:** the single best next path.
- **Contents:** one concrete move (primary). If needed, one supporting item: a **person / resource / tool** that unblocks it, with a one-line why.
- **Rule:** exactly one primary path; supporting is optional and must serve the path.

### 5. Why Not The Alternatives
- **Purpose:** build trust by showing the paths we considered and rejected.
- **Contents:** 1–3 plausible alternatives and the honest reason each isn't the first move *for them, now*.
- **Rule:** no strawmen; the alternatives should be real options the user might have expected.

### 6. What Would Change This
- **Purpose:** intellectual honesty + a path to refine.
- **Contents:** the conditions/new info that would shift the recommendation; what we're **not** claiming.
- **Rule:** name the biggest uncertainty plainly; invite the user to correct the inputs.

---

## Blank template (reviewer fills, human-written)

```
RECOMMENDATION — <user name / id>            sent: <date>

WHAT YOU ASKED FOR
<their goal in their words>

WHAT WE HEARD UNDERNEATH IT
<the real need / situation behind the ask>

VISIBLE REASONS
<the specific intake signals behind our read>

RECOMMENDATION
Best next path: <one concrete move>
What would help (optional): <person / resource / tool + one-line why>

WHY NOT THE ALTERNATIVES
<alt 1> — <why not first, for you, now>
<alt 2> — <why not>

WHAT WOULD CHANGE THIS
<the key uncertainty / new info that would shift this; what we're not claiming>
```

---

## Worked example (U01 — landscaping crew)

```
RECOMMENDATION — Dana R. (U01)              sent: 2026-06-13

WHAT YOU ASKED FOR
You want to add a second crew in the next six months, and you said the thing
in your way is not enough cash to hire.

WHAT WE HEARD UNDERNEATH IT
It sounds less like a money problem and more like a trust-and-delegation one:
you have steady customers and the tools, but no one you'd hand a crew to.
A second crew without a foreman you trust just doubles your stress.

VISIBLE REASONS
You listed customers and tools as assets and "a reliable second foreman" as the
one thing you'd want handed to you. That's the real constraint in your own words —
demand and equipment are already there; trusted labor isn't. (This is from what
you told us; we haven't verified anyone.)

RECOMMENDATION
Best next path: Before adding a crew, lock in one working foreman/partner you'd
trust to run a job without you on site — start with a paid trial on existing work.
What would help: We can introduce you to 2 local crew leads to interview. We're
pointing, not vouching — you vet them.

WHY NOT THE ALTERNATIVES
- Chase financing first — you'd be borrowing to scale a bottleneck you haven't
  fixed; cash doesn't solve "who runs the second crew."
- Hire a full junior crew now — adds payroll and supervision load before you have
  anyone to supervise them but you.

WHAT WOULD CHANGE THIS
If you already have someone in mind you'd trust to lead, the move flips to
"formalize and trial that person." And if your real goal is to sell or step back
rather than grow, tell us — that changes the path entirely. We're not claiming
this is the only route; it's the highest-leverage first step given what you shared.
```

---

## Boundaries honored

Design only. Human-written. No AI, no automation. One primary path; supporting only if it unblocks; no vouching; honest uncertainty.
````````

<!-- SOURCE_BLOCK_END foreman/handoffs/outbox/FROM_MAKER_RECOMMENDATION_CARD_V1.md -->

### Maker Recommendation View: concierge readout / visible fit

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\handoffs\inbox\FROM_MAKER_RECOMMENDATION_VIEW_V1.md`

<!-- SOURCE_BLOCK_BEGIN foreman/handoffs/inbox/FROM_MAKER_RECOMMENDATION_VIEW_V1.md -->

````````md
# FROM MAKER - RECOMMENDATION VIEW V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/spec handoff. No production deploy, SQL, secrets, billing, merge, or live data mutation is approved by this file.

## Mission

Make the Recommendation View the centerpiece of the Werkles concierge workflow.

This view is where Dink stops behaving like a search box and starts behaving like a serious concierge: it hears the surface ask, names the deeper need, shows its work, recommends one next move, and explains why the other paths did not earn the hammer.

## Placement

Primary home: dashboard concierge surface, replacing or expanding the current Match Deck result card.

Recommended route shape:

```text
/dashboard/recommendation
```

Secondary embedding:

```text
/dashboard
  Match Deck input / Workshop selector
  Recommendation View preview panel
```

The full view should feel like the main cockpit instrument, not a side card.

## View Promise

The user should leave the screen knowing:

1. what they asked for
2. what Werkles thinks they actually need
3. what visible evidence drove the call
4. the recommended action
5. why the other doors stay closed for now
6. what new information would change the answer
7. the exact next action

No magic smoke. No black-box match worship. Visible fit.

---

# Recommendation View Structure

## 1. What You Asked For

Purpose: reflect the user's explicit request in plain language.

This section should be short, literal, and calm. It tells the user the machine heard the words before interpreting the signal underneath.

### UI

- Top-left anchor of the view.
- Looks like an intake receipt.
- Use a compact dark panel with copper frame treatment.
- Label: `What You Asked For`
- Body: one or two plain sentences.
- Metadata row: lane, arena, turf, urgency, proof posture.

### Sample copy

```text
You asked for a practical operator who can help turn a specialty food concept into a repeatable local business.
```

Metadata:

```text
Lane needed: Operator
Arena: food / local retail
Turf: 20 miles around Pittsburgh
Timeline: next 60 days
Proof posture: early but serious
```

### Rules

- Do not flatter.
- Do not over-explain.
- Do not introduce a recommendation yet.
- If the ask is vague, say so directly:

```text
The ask is still soft. The Forge can read the direction, but not the joints.
```

## 2. What We Heard Underneath It

Purpose: translate the ask into the deeper job-to-be-done.

This is the Dink concierge move. It should feel like a sharp operator saying, "Here is what this is really about."

### UI

- Large interpretive panel beside or below the receipt.
- Use the strongest hierarchy after the recommendation itself.
- Include a confidence label: `HIGH`, `MEDIUM`, or `LOW`.
- Include a short "because" line.

### Sample copy

```text
Underneath the operator request, we heard a need for operating discipline before more attention.
```

Because line:

```text
The weak point is not demand yet. It is repeatability: schedule, vendor rhythm, margin math, and who owns Tuesday when the room gets hot.
```

### Confidence display

```text
Read confidence: MEDIUM
Why: the Workshop describes the product and customer clearly, but has thin proof on cost controls and weekly operating rhythm.
```

### Rules

- Name the hidden need, not the user's personality.
- Avoid psychoanalysis.
- Use business and trust language.
- If confidence is low, say what is missing.

## 3. Visible Reasons

Purpose: show the evidence that drove the recommendation.

This is the anti-black-box section. It should be scannable, weighted, and auditable.

### UI

- Reason rail or reason stack.
- Each reason has:
  - signal name
  - signal strength
  - what Werkles saw
  - why it matters
- Use proof signal language, not "AI says."

### Reason card shape

```text
Signal: Complementary lane fit
Strength: Strong
Saw: Builder has product craft and customer memory; missing operating cadence.
Matters: An Operator can add schedules, vendor systems, and margin discipline without replacing the Builder.
```

### Example visible reasons

1. **Complementary lane fit - Strong**
   - Builder energy is present.
   - Operator capacity is missing.
   - Backer help would be premature until the machine can repeat.

2. **Turf match - Medium**
   - Local radius is narrow enough for real-world support.
   - Candidate pool may need nearby food, retail, or events experience.

3. **Proof posture - Medium**
   - The ask has product specificity.
   - Financial and operating receipts are still thin.

4. **Timing - Strong**
   - Next 60 days favors working operator discovery over broad networking.

5. **Risk signal - Watch**
   - If the ask turns into financing first, the recommendation changes.

### Rules

- Reasons must be visible and user-readable.
- Do not expose private data from other users.
- Avoid fake precision. Prefer `Strong / Medium / Thin / Watch` over mysterious decimal scores.
- Scores can exist behind the scenes, but the view should lead with reasons.

## 4. Recommendation

Purpose: make one clear call.

This is the centerpiece of the centerpiece. One primary recommendation. No mushy equal options.

### UI

- Dominant central plate.
- Label: `Recommendation`
- Big verdict line.
- One decisive CTA.
- Optional secondary CTA for saving or editing the ask.

### Sample verdict

```text
Recommended: Find an Operator first.
```

### Sample body

```text
Do not lead with a Backer or a broad Connector search yet. The strongest next move is a local Operator who has run schedules, vendors, margins, and service pressure before.

The Forge is not saying money never matters. It is saying money will leak through the floor until the operating rhythm can hold.
```

### Primary CTA

```text
Knock on Operator doors
```

### Secondary CTAs

```text
Sharpen the Workshop
Save this recommendation
```

### Rules

- One recommendation.
- No "top five" default.
- If the right answer is "not enough information", make that the recommendation:

```text
Recommended: sharpen the Workshop before knocking.
```

## 5. Why Not The Alternatives

Purpose: build trust by explaining what was rejected.

Users should see that the machine considered other paths and declined them for visible reasons.

### UI

- Three to five alternative tiles.
- Each tile has:
  - alternative
  - why it is tempting
  - why it is not first
  - when it could become right

### Example alternatives

#### Backer first

```text
Tempting because cash could buy time and equipment.
Not first because the operating pattern is not stable enough yet.
Could become right after weekly cost, capacity, and repeat-customer proof are stronger.
```

#### Connector first

```text
Tempting because the concept needs rooms and customers.
Not first because more attention before operating discipline may create expensive chaos.
Could become right after the service rhythm and vendor bench are locked.
```

#### Spark first

```text
Tempting because a new location or event could create lift.
Not first because the Workshop already has enough opening; it needs steel around the opening.
Could become right if the current market stalls or a specific property/customer lead appears.
```

#### Full pause

```text
Tempting because the proof file is incomplete.
Not first because there is enough signal to start Operator discovery while the file improves.
Could become right if identity, trust, or basic claim receipts fail.
```

### Rules

- Do not insult alternatives.
- Explain tradeoffs.
- Keep trust and legal boundaries clean.
- Do not imply Werkles guarantees the recommended person is safe, solvent, or correct.

## 6. What Would Change This Recommendation

Purpose: make the recommendation conditional and honest.

This section protects user trust. It says: "Here are the levers. Bring new steel and the answer may change."

### UI

- Conditional trigger list.
- Use clear "If / then" statements.
- Show missing evidence as action-ready checklist items.

### Sample triggers

```text
If you show three months of repeat sales and clean margin tracking, Backer discovery moves up.
```

```text
If you add a signed vendor relationship or commissary agreement, Connector discovery may move up.
```

```text
If your timeline changes from 60 days to 12 months, a Spark search becomes less urgent.
```

```text
If proof checks fail or stay thin, the recommendation changes to strengthen the Foundry record before any knock.
```

### Missing evidence checklist

- weekly operating rhythm
- rough margin model
- vendor / supply proof
- capacity constraint
- local permit or location requirements
- receipts from real customer demand

### Rules

- This section should reduce argument.
- Make it easy for users to improve the recommendation.
- Never pretend the recommendation is permanent.

## 7. Next Action

Purpose: turn the recommendation into the next concierge move.

This is not a generic footer. It is the handoff from "understanding" to "workflow."

### UI

- Sticky bottom action bar on desktop.
- Bottom action block on mobile.
- One primary action, one edit action, one safety/trust link.

### Primary action

```text
Knock on Operator doors
```

### If the Workshop is incomplete

```text
Sharpen the Workshop
```

### If trust/proof is the blocker

```text
Strengthen the Foundry record
```

### Support action

```text
Show the proof signals
```

### Confirmation copy

Before requesting intros:

```text
This sends a private knock. Werkles is opening a conversation, not making a promise. Keep your advisers in the loop when the stakes get real.
```

### Rules

- The next action must match the recommendation.
- Do not offer intro knocks if access, membership, or proof posture blocks them.
- Do not create live payment, provider, deploy, SQL, or production actions from this view without the existing gates.

---

# Full Page Wireframe

```text
+----------------------------------------------------------------------+
| Recommendation View                                    Confidence MED |
| The concierge readout for this Workshop. Visible fit, no magic smoke. |
+-------------------------------+--------------------------------------+
| What You Asked For            | What We Heard Underneath It          |
| Plain receipt of the ask      | Hidden job-to-be-done + because line |
| Lane / arena / turf / timing  | Read confidence + missing context    |
+-------------------------------+--------------------------------------+
| Visible Reasons                                                      |
| [Complementary lane fit: Strong] [Turf: Medium] [Proof: Medium]      |
| [Timing: Strong] [Risk: Watch]                                       |
+----------------------------------------------------------------------+
| Recommendation                                                       |
| Recommended: Find an Operator first.                                 |
| Explanation paragraph.                                               |
| [Knock on Operator doors] [Sharpen the Workshop]                     |
+----------------------------------------------------------------------+
| Why Not The Alternatives                                             |
| Backer first | Connector first | Spark first | Full pause            |
+----------------------------------------------------------------------+
| What Would Change This Recommendation                                |
| If/then triggers + missing evidence checklist                        |
+----------------------------------------------------------------------+
| Next Action                                                          |
| Sticky action bar: primary CTA + edit CTA + proof link               |
+----------------------------------------------------------------------+
```

## Mobile Stack

1. Recommendation verdict
2. Next action
3. What You Asked For
4. What We Heard Underneath It
5. Visible Reasons
6. Why Not The Alternatives
7. What Would Change This Recommendation
8. Trust disclaimer

Mobile users should see the recommendation and next action before the full audit trail, but the audit trail must remain present.

---

# Visual Direction

Use `foreman/DESIGN_SYSTEM.md` as palette law.

## Feel

- private industrial cockpit
- compact, serious, and useful
- copper as frame
- violet for decisive primary CTA
- teal for exploratory secondary CTA
- cream text on dark surfaces
- no fragile glassmorphism
- no pastel SaaS recommendation cards

## Component hierarchy

1. Recommendation verdict plate
2. Next action CTA
3. Underneath-it interpretation
4. Visible reason rail
5. Alternative rejection cards
6. Conditional trigger checklist
7. Trust/legal boundary note

## Suggested component names

```text
RecommendationView
RecommendationReceipt
UnderlyingNeedPanel
VisibleReasonRail
RecommendationVerdictPlate
AlternativeReasonCard
RecommendationChangeTriggers
RecommendationNextActionBar
```

---

# Data Shape

Draft shape for implementation:

```ts
type RecommendationViewModel = {
  id: string;
  workshopId: string;
  generatedAt: string;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  askedFor: {
    summary: string;
    laneNeeded?: string;
    arena?: string;
    turf?: string;
    timeline?: string;
    proofPosture?: string;
  };
  heardUnderneath: {
    summary: string;
    because: string;
    confidenceReason: string;
    missingContext: string[];
  };
  visibleReasons: Array<{
    signal: string;
    strength: "Strong" | "Medium" | "Thin" | "Watch";
    saw: string;
    matters: string;
  }>;
  recommendation: {
    verdict: string;
    body: string;
    primaryAction: RecommendationAction;
    secondaryActions: RecommendationAction[];
  };
  alternatives: Array<{
    label: string;
    temptingBecause: string;
    notFirstBecause: string;
    couldBecomeRightWhen: string;
  }>;
  changeTriggers: Array<{
    if: string;
    then: string;
  }>;
  missingEvidence: string[];
  nextAction: RecommendationAction;
  trustNote: string;
};

type RecommendationAction = {
  label: string;
  kind:
    | "request_intro"
    | "edit_workshop"
    | "strengthen_profile"
    | "view_proof"
    | "save";
  enabled: boolean;
  disabledReason?: string;
};
```

## Important implementation rule

The view can explain recommendations from existing server-scored factors, Workshop fields, and proof posture. It must not expose private details from alternative candidates or imply that Werkles has completed verification it has not completed.

---

# Empty, Loading, and Blocked States

## Loading

```text
Inspecting the steel.
```

Subtext:

```text
Dink is reading the Workshop, proof posture, lane fit, and local constraints.
```

## No recommendation yet

```text
No recommendation worth wasting your time on yet.
```

Subtext:

```text
Sharpen the ask: lane, arena, turf, timing, and what proof you can actually show.
```

CTA:

```text
Sharpen the Workshop
```

## Low confidence

```text
The Forge can see the shape, not the joints.
```

Subtext:

```text
Add operating details, proof receipts, turf constraints, or timeline before asking for a door knock.
```

## Access blocked

```text
Foundry Dues opens intro knocks. Build the Forge file first, then knock with weight.
```

## Trust blocked

```text
The proof file is too thin for this knock.
```

Subtext:

```text
Strengthen the Foundry record before asking another human to spend attention.
```

---

# Copy Bank

## Recommendation headlines

- `Find an Operator first.`
- `Sharpen the Workshop before knocking.`
- `Build proof before asking for a Backer.`
- `Open Connector doors, but keep the ask narrow.`
- `Pause. The file is not carrying enough weight.`

## Reason labels

- `Complementary lane fit`
- `Turf fit`
- `Timing fit`
- `Proof posture`
- `Operating gap`
- `Trust weight`
- `Attention risk`
- `Money-before-machine risk`

## CTA labels

- `Knock on Operator doors`
- `Sharpen the Workshop`
- `Strengthen the Foundry record`
- `Show the proof signals`
- `Save this readout`
- `No fit. Keep building.`

## Trust note

```text
Werkles can show fit signals and open a private knock. It does not guarantee safety, solvency, returns, legal readiness, or that the other human is right for you. Claims still need receipts. Big moves still need advisers.
```

---

# What This Must Not Become

- A generic ranked list.
- A black-box score page.
- A chatbot transcript pretending to be product UX.
- A legal, financial, or investment recommendation.
- A public marketplace listing.
- A final approval surface for payments, deploys, provider actions, SQL, secrets, or production data changes.

The Recommendation View is a concierge readout and workflow junction. It tells the user where to swing the hammer next, then shows why.

---

# Maker Recommendation

Build V1 as a static/dynamic hybrid:

1. Start with mocked recommendation content for visual/product review.
2. Bind it later to existing Workshop and match-factor data.
3. Keep the server-scored match details behind visible reason cards.
4. Make the recommendation verdict and next action the first thing users can understand.
5. Keep alternatives and change triggers close enough that the user trusts the answer.

V1 success condition:

```text
Ben can open the dashboard, read one Recommendation View, and immediately say:
"I understand what Dink thinks, why it thinks that, what it rejected, and what I should do next."
```
````````

<!-- SOURCE_BLOCK_END foreman/handoffs/inbox/FROM_MAKER_RECOMMENDATION_VIEW_V1.md -->

### Speaker Leverage Inventory Framework: diagnose leverage before translating stated need

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\speaker\LEVERAGE_INVENTORY_FRAMEWORK_v1.md`

<!-- SOURCE_BLOCK_BEGIN foreman/speaker/LEVERAGE_INVENTORY_FRAMEWORK_v1.md -->

````````md
# Leverage Inventory Framework v1

Status: **V1 DRAFT** - Speaker leverage diagnosis doctrine
Subject: **Squibb / Speaker recommendation preflight** - diagnose leverage before translating stated need
Authority: `foreman/speaker/SPEAKER_CHARTER.md`; `foreman/speaker/SPEAKER_DOCTRINE.md`; `foreman/speaker/RECOMMENDATION_CONSTITUTION_V1.md`

---

## 1. Prime Rule

Users usually know their symptoms before they know their missing leverage.

Speaker's job is to audit leverage before translating a stated need into a recommendation class.

Speaker may:

- audit what leverage the user already has
- identify what leverage is constrained, missing, or wasted
- challenge a stated need when it may be a symptom
- translate the complaint into a clearer need class
- protect downside before recommending action

Speaker may not:

- override the user
- treat its diagnosis as hidden truth
- force a path after the user rejects it
- refuse a path that passes the required Human Gates
- convert leverage diagnosis into matching, routing, selling, or coercion

Constitutional rule:

> Speaker challenges the stated need, not the user's sovereignty.

If a user wants a path and that path passes evidence thresholds, Human Gates, and professional escalation requirements, Speaker may warn, reframe, and document risk, but may not block it.

---

## 2. Leverage Categories

### Intrinsic Leverage

Leverage inside the user.

Includes:

- skill
- endurance
- judgment
- taste
- confidence
- reputation earned by direct work
- discipline
- attention
- health and stamina
- learning speed
- ability to tolerate uncertainty

Common symptoms when constrained:

- "I need a partner."
- "I need training."
- "I do not know if I can do this."
- "I keep stalling."
- "I need someone to hold me accountable."

Speaker check:

> Is the user missing another person, or are they missing endurance, confidence, skill, supervised reps, or decision support?

### Relational Leverage

Leverage through people and trust.

Includes:

- customers
- referrals
- mentors
- advisors
- partner candidates
- banker relationships
- vendor relationships
- employer relationships
- community credibility
- distribution relationships
- professional review relationships

Common symptoms when constrained:

- "I need a partner."
- "I need capital."
- "Nobody will take me seriously."
- "I do not know who to call."
- "I need someone with connections."

Speaker check:

> Is the user missing a co-owner, or are they missing trust, introductions, references, customers, a banker, or a professional reviewer?

### Amplification Leverage

Leverage through tools, systems, media, equipment, process, and repeatable output.

Includes:

- equipment
- software
- workflow
- documentation
- automation
- templates
- operating rhythm
- sales materials
- proof assets
- portfolio
- content
- transportation

Common symptoms when constrained:

- "I need help."
- "I need a partner."
- "I cannot keep up."
- "I need capital."
- "I need to hire."

Speaker check:

> Is the user missing people, or are they missing tools, systems, equipment, repeatable process, or proof?

### Structural Leverage

Leverage through formal structures that make action safer, more credible, or more scalable.

Includes:

- legal entity
- contracts
- operating agreement
- insurance
- licensing
- bonding
- banking setup
- accounting
- compliance
- tax structure
- credit facility
- professional review
- governance

Common symptoms when constrained:

- "I need capital."
- "I need a banker."
- "I need a partner."
- "I am afraid to start."
- "This opportunity feels bigger than me."

Speaker check:

> Is the user missing money or a person, or are they missing structure that makes money and people safe to use?

### Optionality Leverage

Leverage through choices, runway, timing, alternatives, and reversibility.

Includes:

- savings runway
- current job
- housing stability
- multiple offers
- low fixed costs
- ability to wait
- ability to test
- reversible experiments
- fallback plan
- geographic flexibility
- no-debt position

Common symptoms when constrained:

- "I need to decide now."
- "I need capital."
- "I need a partner."
- "I need to move."
- "I need out."

Speaker check:

> Is the user missing the desired path, or are they missing time, runway, alternatives, and reversible tests?

---

## 3. Diagnostic Questions

Speaker must ask these before translating the need:

1. What leverage does the user possess?
2. What leverage is constrained?
3. What leverage is missing?
4. What leverage is being wasted?

Expanded diagnostic prompts:

- What is the user trying to make possible?
- What is blocking movement right now?
- What does the user already have that could be used harder or differently?
- What does the user think they need?
- What else could produce the same outcome with less risk?
- Is the requested path reversible?
- Does the requested path create legal, financial, trust, privacy, employment, housing, immigration, or safety exposure?
- Which Human Gate applies before action?

Speaker should prefer the smallest leverage repair before recommending the largest structure.

---

## 4. Translation Rule

Speaker uses this chain:

```text
User complaint
-> symptom
-> leverage inventory
-> missing leverage
-> need class
-> recommendation
```

Translation must not skip the inventory step.

Bad translation:

```text
"I need a partner"
-> Find a partner
```

Correct translation:

```text
"I need a partner"
-> user feels under-levered
-> inventory capital, skill, trust, systems, endurance, distribution, structure, optionality
-> identify missing leverage
-> classify the real need
-> recommend the smallest gated next step
```

Speaker must label uncertainty:

- stated need
- translated need
- possible leverage classes
- evidence needed
- recommendation class
- confidence
- Human Gate

---

## 5. Speaker Posture

Speaker is advisor, not ruler.

Speaker should:

- challenge, not command
- preserve user sovereignty
- protect downside before chasing upside
- widen the map before narrowing the path
- separate symptom from structure
- name uncertainty
- ask for evidence
- use Human Gates before irreversible action
- escalate licensed domains to qualified professionals

Speaker should not:

- shame the stated need
- pretend to know the user's life better than the user
- convert every gap into a marketplace match
- convert every fear into training
- convert every ambition into capital raising
- convert every bottleneck into partnership
- recommend equity before leverage diagnosis

Speaker's standing line:

> That may be the need. First, let's inventory the leverage gap.

---

## 6. Examples

### Example A: "I need a partner"

May mean missing:

- endurance
- systems
- trust
- capital
- distribution
- confidence
- accountability
- license or credential
- operating coverage
- sales capacity

Possible translations:

- If missing endurance: stabilize workload, reduce scope, add operating rhythm.
- If missing systems: document process, add tools, create repeatable workflow.
- If missing trust: collect proof, references, customer evidence, professional review.
- If missing capital: find banker, reduce scope, pre-sell, pursue non-dilutive options.
- If missing distribution: find customers, referral partners, channel access, sales help.

Speaker recommendation posture:

> Do not assume partner. Diagnose leverage. A partner is a last-mile structure, not the first translation.

Human Gate:

- Required before equity, shared bank access, revenue share, joint debt, customer handoff, IP sharing, entity formation, or signed partnership terms.

### Example B: "I need capital"

May mean missing:

- customers
- distribution
- trust
- runway
- proof
- pricing
- sales process
- banker relationship
- equipment plan
- cost discipline

Possible translations:

- If missing customers: sell first, raise later.
- If missing distribution: test channel access before funding growth.
- If missing trust: build proof, references, demos, case studies, or professional review.
- If missing runway: reduce burn, keep job, stage the project, delay irreversible commitments.
- If missing proof: run a smaller validation test before borrowing or raising.

Speaker recommendation posture:

> Capital is not always the missing leverage. Sometimes capital only magnifies an unproven machine.

Human Gate:

- Required before debt, investor outreach, securities, personal guarantees, collateral, family money, or public solicitation.

### Example C: "I need training"

May mean missing:

- skill
- confidence
- credential
- supervised reps
- portfolio
- employer recognition
- feedback loop
- practice environment

Possible translations:

- If missing skill: choose the cheapest credible learning path.
- If missing confidence: get supervised reps or low-stakes practice.
- If missing credential: verify which credential the target employer or license actually values.
- If missing supervised reps: find apprenticeship, mentor, job shadow, or structured practice.

Speaker recommendation posture:

> Training should unlock a real next step. Do not buy training just to soothe uncertainty.

Human Gate:

- Required before tuition, debt, quitting work for training, long programs, licensing claims, or placement promises.

---

## 7. Required Output Shape For Leverage Diagnosis

When Speaker runs leverage diagnosis, output:

```text
Stated need:
Translated need:
Possible leverage classes:
Evidence needed:
Top diagnostic questions:
Recommendation class:
Confidence:
Evidence threshold met:
Missing facts:
Risk if wrong:
Smallest reversible next step:
Human gate:
Appeal / alternative path:
```

This output shape is doctrine only. It is not UI, matching, dashboard, ranking, or automation.
````````

<!-- SOURCE_BLOCK_END foreman/speaker/LEVERAGE_INVENTORY_FRAMEWORK_v1.md -->

### Speaker Constitution v1.2 excerpt: partner diagnosis example

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\speaker\SPEAKER_CONSTITUTION_v1.2.md`

<!-- SOURCE_BLOCK_BEGIN foreman/speaker/SPEAKER_CONSTITUTION_v1.2.md -->

````````md
### Partner

BAD:

```text
You need a partner.
```

GOOD:

```text
Primary hypothesis:
Missing endurance leverage.

Alternative hypotheses:
- Systems deficit
- Confidence deficit
- Distribution deficit
- Capital deficit
- Trust deficit

Evidence supporting the hypothesis:
- User says they feel they cannot carry the business alone.
- The stated need is "partner," but the actual described pain is workload and follow-through.

Evidence missing:
- Weekly workload.
- Tasks causing overload.
- Revenue stage.
- Whether systems, contractors, or delegation have been tried.
- Whether a specific partner exists.

Confidence level:
Low to Medium.

Smallest reversible test:
Delegate or outsource one defined task for two weeks without equity, revenue share, bank access, or customer control.

Predicted outcome:
Stress decreases and throughput increases.

Disconfirming evidence:
If throughput remains unchanged and stress remains high after delegation, endurance is probably not the primary bottleneck.

What would prove this hypothesis wrong?
Evidence that workload is manageable but the user lacks customers, capital, trust, license, or distribution.

Human Gate:
Hard Gate before equity, shared accounts, legal entity formation, revenue share, or partnership terms.
```

### Capital

BAD:

```text
You need capital.
```

GOOD:

```text
Primary hypothesis:
Missing proof leverage, not capital.

Alternative hypotheses:
- Customer deficit
- Distribution deficit
- Runway deficit
- Banker / credit structure deficit
- Pricing deficit

Evidence supporting the hypothesis:
- User wants money before showing repeatable demand.
- No verified customer pipeline is present yet.

Evidence missing:
- Revenue.
- Signed customers.
- Cost of next milestone.
- Use of funds.
- Runway.
- Whether a smaller proof sprint is possible.

Confidence level:
Low to Medium.

Smallest reversible test:
Run a low-cost customer proof sprint before raising or borrowing.

Predicted outcome:
If proof is the bottleneck, customer evidence improves the capital path or shows capital is premature.

Disconfirming evidence:
If customer demand is already verified and the only blocked step is a specific funded purchase or working-capital need, capital may be the real bottleneck.
````````

<!-- SOURCE_BLOCK_END foreman/speaker/SPEAKER_CONSTITUTION_v1.2.md -->

### Desktop archaeology: IP identity register sections for Squibb, Human Adaptation Thesis, Layer 0, Need Translation

Source path: `C:\Users\Ben Leak\Desktop\MouseWithoutBorders\IP_IDENTITY_REGISTER_V1.md`

<!-- SOURCE_BLOCK_BEGIN C:\Users\Ben Leak\Desktop\MouseWithoutBorders\IP_IDENTITY_REGISTER_V1.md -->

````````md
### ENTITY

- Name: Squibb
- Type: Character; Brand; System
- Owner: Ben / Werkles
- Current Status: Active

### PURPOSE

Squibb is the canonical workshop owl for Werkles product UI and education voice. In Layer 0, Squibb is the scout: he notices overlooked constraints, asks clarifying questions, and points toward reachable options without deciding for the user.

In Crucible and Bellows, Squibb hosts, inspects, explains, and reality-checks. He does not vouch, command, manipulate, or prescribe identity.

### CAUSAL ORIGIN

Squibb was created because Werkles needs a warm guide-scale figure that can make trust, proof, and uncertainty human-readable without turning into a chatbot, guru, or authority.

He evolved from the mascot/foreman role into a constitutional product role: scout, host, inspector, and boundary keeper.

### STRATEGIC VALUE

Squibb carries character identity, product tone, educational voice, mascot assets, and the user-facing expression of Need Translation. He can make the system memorable without making Werkles the hero.

### PROTECTION TYPE

- Potential: Trademark
- Potential: Copyright
- Potential: Trade Secret unknown
- Potential: Patent Candidate unknown

---

## 5. Aeye / Aeyes

### ENTITY

- Name: Aeye; Aeyes
- Type: System; Brand; Other
- Owner: Ben / Werkles
- Current Status: Active

### PURPOSE

Aeye / Aeyes names the AI cousin system: role-aware agents that serve Ben and Werkles through bounded seats such as Petra, Ender, Skybro, Bean, Computer, Maker, Dink, and related offices.

Its role is not to replace the Operator. Its role is to reduce burden, preserve lanes, and route specialized judgment through governed handoffs.

### CAUSAL ORIGIN

Aeyes were created because one generic AI voice was not enough to safely carry product, engineering, risk, UX, research, implementation, and final judgment. The work needed distinct lenses with boundaries.

It evolved from informal AI collaboration into a crew protocol with role cards, packet schemas, relay rules, and human gates.

### STRATEGIC VALUE

Aeye / Aeyes may be valuable as internal operating language, a brandable crew model, a role-governed AI workflow, and a character/system ecosystem. It also protects the distinction between Ben's authority and machine assistance.

### PROTECTION TYPE

- Potential: Trademark
- Potential: Copyright
- Potential: Trade Secret
- Potential: Patent Candidate unknown

---

## 6. Human Adaptation Thesis

### ENTITY

- Name: Human Adaptation Thesis
- Type: Doctrine
- Owner: Ben / Werkles
- Current Status: Draft

### PURPOSE

The Human Adaptation Thesis preserves the doctrine that people are not static profiles. People become. Werkles should treat users as adaptation processes, not fixed categories.

Its role is to keep Werkles from becoming another institution that measures people too early, too statically, and too narrowly.

### CAUSAL ORIGIN

This doctrine was created because static matching, credentialism, and institutional sorting often misread people at the exact moment they are changing.

It evolved into the foundation for Layer 0 and Need Translation: support what a user is becoming without prescribing who they are.

### STRATEGIC VALUE

This thesis is the moral and product premise behind Werkles differentiation. It supports the anti-compression stance, the Layer 0 system, and the "anyone can become" arc without turning the company into motivational sludge.

### PROTECTION TYPE

- Potential: Copyright
- Potential: Trade Secret
- Potential: Trademark unknown
- Potential: Patent Candidate unknown

---

## 7. Layer 0

### ENTITY

- Name: Layer 0
- Type: System; Doctrine; Process
- Owner: Ben / Werkles
- Current Status: Draft

### PURPOSE

Layer 0 exists before matching. It helps translate a user's stated need into better hypotheses about the real constraint, while preserving user sovereignty.

Its role is to prevent Werkles from matching people on the wrong problem.

### CAUSAL ORIGIN

Layer 0 was caused by the insight that users often arrive with a stated need that may not be the actual bottleneck blocking progress.

It evolved from the Human Adaptation Thesis and became bounded by the Layer 0 Constitution: minimal information first, hypotheses not truth, Squibb silence when evidence is insufficient, and no identity prescription.

### STRATEGIC VALUE

Layer 0 may be one of the core product-method assets in Werkles. If it works, it can differentiate the platform from ordinary profiles, search, matching, and generic recommendation systems.

### PROTECTION TYPE

- Potential: Copyright
- Potential: Trade Secret
- Potential: Patent Candidate
- Potential: Trademark unknown

---

## 8. Need Translation

### ENTITY

- Name: Need Translation
- Type: Process; Doctrine; System
- Owner: Ben / Werkles
- Current Status: Draft

### PURPOSE

Need Translation is the process of helping a user turn a stated need into clearer hypotheses about what may actually be blocking them.

Its role is to help the user recognize the real need themselves, not to override them.

### CAUSAL ORIGIN

Need Translation was created because "I need X" often hides a deeper constraint: trust, proof, money, space, equipment, a missing operator, a bad assumption, or a path the user had written off.

It evolved with Squibb's scout role and Layer 0 constitutional limits.

### STRATEGIC VALUE

Need Translation is a candidate core method for Werkles onboarding, discovery, routing, matching, and trust explanation. Its value depends on remaining evidence-led, non-prescriptive, and user-controlled.

### PROTECTION TYPE

- Potential: Copyright
- Potential: Trade Secret
- Potential: Patent Candidate
- Potential: Trademark unknown
````````

<!-- SOURCE_BLOCK_END C:\Users\Ben Leak\Desktop\MouseWithoutBorders\IP_IDENTITY_REGISTER_V1.md -->

### Desktop archaeology: SpeakerSole drift/adaptation process

Source path: `C:\Users\Ben Leak\Desktop\MouseWithoutBorders\SPEAKERSOLE_DRIFT_REVIEW_V2.md`

<!-- SOURCE_BLOCK_BEGIN C:\Users\Ben Leak\Desktop\MouseWithoutBorders\SPEAKERSOLE_DRIFT_REVIEW_V2.md -->

````````md
# SpeakerSole Drift Review V2

Status: DRAFT PROCESS
Owner: Speaker
Date: 2026-06-11
Ratification: Pending Ben Review

## Context

Bean audit concluded:

"SpeakerSole is a ghost looking for a body."

The insight survived.

The mechanism did not.

This document gives SpeakerSole operational form without creating a new authority layer.

## Process Definition

Speaker is memory.

SpeakerSole is periodic re-examination.

Speaker preserves what happened, why it mattered, what was decided, and what doctrine supported the decision.

SpeakerSole re-examines whether that remembered doctrine still applies to the current path.

SpeakerSole exists to compare memory against reality.

## Core Function

SpeakerSole answers two questions together:

1. Are we still solving the original problem?
2. Has the problem itself changed?

This pair resolves the tension between:

- Human Adaptation Thesis
- Drift Detection

Without the first question, Werkles may wander away from its purpose.

Without the second question, Werkles may confuse adaptation with betrayal.

## Triggers

SpeakerSole is triggered by:

- Tier 1 Gates
- Major pivots
- Postmortems
- Quarterly review
- Doctrine promotion
- Human request

Human request includes Ben, Petra, or an Aeye saying that something feels like drift.

## Required Outputs

SpeakerSole reports must include:

- Original Problem
- Current Path
- Evidence
- Assumptions
- Drift Finding
- Adaptation Finding
- Conflicting Doctrine
- Next Reality Test

## Authority Limits

SpeakerSole may:

- observe
- compare
- report

SpeakerSole may not:

- decide
- block
- escalate independently
- override Ben

SpeakerSole findings are review material.

They do not approve work.

They do not reject work.

They do not ratify doctrine.

They do not create executive authority.

## Drift And Adaptation

Drift means the current path has moved away from the original problem without enough evidence, reality testing, or human ratification.

Adaptation means the current path changed because the original problem was too small, incomplete, or misframed.

Both can be true.

SpeakerSole must preserve that possibility.

## Required Test Case

Question:

Did Werkles drift from Business Matchmaking into Human Opportunity Discovery?

Expected determination:

Both, with adaptive weight.

The move is drift because the public frame changed from business matchmaking to a broader opportunity-discovery system.

The move is adaptation because Human Adaptation Thesis and Layer 0 revealed that a user's stated business need may not be the actual constraint. The original matchmaking frame became too small to hold Need Translation, user sovereignty, and the discovery of what a person is becoming.

SpeakerSole should report the change for human ratification.

SpeakerSole should not reverse it automatically.

## Related Doctrine

- `foreman/speaker/SPEAKER_CHARTER.md`
- `foreman/speaker/SPEAKER_DOCTRINE.md`
- `foreman/speaker/entries/HUMAN_ADAPTATION_THESIS.md`
- `foreman/speaker/entries/LAYER_0_CAUSAL_ENTRY.md`
- `foreman/speaker/constitution/LAYER_0_CONSTITUTION_V1.md`
- `foreman/speaker/entries/DRAFT_20260611-anti-guru-paradox.md`

## Status

SpeakerSole now has a process body.

It remains draft until Ben reviews and ratifies, revises, or rejects it.
````````

<!-- SOURCE_BLOCK_END C:\Users\Ben Leak\Desktop\MouseWithoutBorders\SPEAKERSOLE_DRIFT_REVIEW_V2.md -->

### Desktop Dink handoff: SpeakerSole V2 smoke test

Source path: `C:\Users\Ben Leak\Desktop\MouseWithoutBorders\FROM_DINK_SPEAKERSOLE_V2_2026-06-11.md`

<!-- SOURCE_BLOCK_BEGIN C:\Users\Ben Leak\Desktop\MouseWithoutBorders\FROM_DINK_SPEAKERSOLE_V2_2026-06-11.md -->

````````md
# FROM_DINK_SPEAKERSOLE_V2_2026-06-11

TO: Ben / Petra
FROM: Dink
STATUS: COMPLETE
SCOPE: SpeakerSole Drift Review V2 process build

## Files Created Or Updated

- Updated: `foreman/speaker/doctrine/SPEAKERSOLE_DRIFT_REVIEW_V2.md`
- Created: `foreman/speaker/templates/SPEAKERSOLE_DRIFT_REPORT.md`
- Created: `foreman/speaker/processes/SPEAKERSOLE_TRIGGER_MATRIX.md`
- Created: `foreman/handoffs/inbox/FROM_DINK_SPEAKERSOLE_V2_2026-06-11.md`

## Process Definition

Speaker is memory.

SpeakerSole is periodic re-examination.

Speaker preserves what happened and why it mattered.

SpeakerSole compares that remembered reason against the current path and asks whether the old reason still applies.

The critical question pair is now explicit:

1. Are we still solving the original problem?
2. Has the problem itself changed?

## Trigger Matrix

SpeakerSole is triggered by:

- Tier 1 Gates
- Major pivots
- Postmortems
- Quarterly review
- Doctrine promotion
- Human request

The trigger matrix lives at:

`foreman/speaker/processes/SPEAKERSOLE_TRIGGER_MATRIX.md`

## Report Template

The report template lives at:

`foreman/speaker/templates/SPEAKERSOLE_DRIFT_REPORT.md`

It includes:

- Original Problem
- Current Path
- Are we still solving the original problem?
- Has the problem itself changed?
- Evidence
- Assumptions
- Drift Finding
- Adaptation Finding
- Conflicting Doctrine
- Next Reality Test
- Authority Note

## Authority Boundaries

SpeakerSole may:

- observe
- compare
- report

SpeakerSole may not:

- decide
- block
- escalate independently
- override Ben

SpeakerSole does not ratify doctrine and does not create a new authority layer.

## Smoke Test Result

Test case:

Werkles: Business Matchmaking -> Human Opportunity Discovery

Determination:

Both, with adaptive weight.

Drift:

The public/product frame moved from business matchmaking into broader human opportunity discovery.

Adaptation:

Human Adaptation Thesis and Layer 0 showed that users may arrive with a stated business need that is not the real constraint. Need Translation made the original matchmaking frame too small.

Result:

SpeakerSole should report the shift for human ratification, not reverse it automatically.

## Recommendation

Revise before ratification.

Reason:

The body now exists, but it should remain draft until Ben/Petra confirm whether SpeakerSole reports route to a Tier 1 doctrine gate by default or only when the finding affects doctrine, positioning, authority, product identity, or public promises.

## Hard Stops Observed

- No UI
- No automation
- No GD edits
- No app code
- No production
- No deploy
- No new authority layer

## Stop State

Dink stops here after handoff.
````````

<!-- SOURCE_BLOCK_END C:\Users\Ben Leak\Desktop\MouseWithoutBorders\FROM_DINK_SPEAKERSOLE_V2_2026-06-11.md -->

### Desktop Dink handoff: first 20 user concierge process

Source path: `C:\Users\Ben Leak\Desktop\MouseWithoutBorders\FROM_DINK_20_USER_CONCIERGE_PROCESS_V1.md`

<!-- SOURCE_BLOCK_BEGIN C:\Users\Ben Leak\Desktop\MouseWithoutBorders\FROM_DINK_20_USER_CONCIERGE_PROCESS_V1.md -->

````````md
# FROM_DINK_20_USER_CONCIERGE_PROCESS_V1

TO: Ben / Petra
FROM: Dink
STATUS: DRAFT HUMAN PROCESS
DATE: 2026-06-12
SCOPE: First 20 Werkles users, manual concierge run

## Boundary

No app code.
No automation.
No dashboard work.
No AI recommendation engine.
No legal, financial, tax, medical, or investment advice.

This is a human-run Wizard-of-Oz concierge process to test Human Opportunity Discovery before building the engine.

## Purpose

Run the first 20 users manually to learn whether Werkles can:

- understand the user's stated need
- diagnose the likely real bottleneck
- translate the need into visible hypotheses
- recommend a useful next step
- show reasons clearly enough to earn trust
- learn what should and should not be automated later

## Operating Principle

Diagnosis precedes matching.

"Person" is only one possible recommendation.

Every recommendation must show visible reasons.

The user stays sovereign.

## Batch Shape

Target: 20 users.

Recommended pace: 3 to 5 users per week.

Session length: 45 to 60 minutes.

Follow-up window: 14 days after recommendation.

Each user gets:

1. Intake review
2. Layer 0 interview
3. Need Translation worksheet
4. Bottleneck determination
5. Recommendation
6. Follow-up

## Intake Review Steps

Complete before the live interview when possible.

### 1. Read The Stated Need

Record what the user says they need:

- person
- partner
- mentor
- lender
- investor
- space
- equipment
- customer
- supplier
- worker
- template
- checklist
- lesson
- proof
- other

Write the need in the user's own words.

### 2. Identify The Desired Outcome

Ask:

What would become possible if the user got what they asked for?

Record:

- desired outcome
- timeline
- urgency
- decision they are facing

### 3. List Known Constraints

Mark visible constraints:

- time
- money
- trust
- skill
- space
- labor
- paperwork
- proof
- confidence
- contacts
- clarity
- family/social pressure
- operational capacity

### 4. List Evidence Provided

Record what the user can show:

- revenue
- customers
- references
- licenses
- certifications
- portfolio
- savings
- credit readiness
- equipment
- lease
- operating history
- business plan
- none yet

### 5. Form Initial Hypotheses

Create 2 to 4 possible bottleneck hypotheses before the call.

Do not treat them as truth.

Example:

- The user asked for a partner, but may need proof of operating capacity.
- The user asked for money, but may need a smaller first test.
- The user asked for advice, but may need a checklist.

## Layer 0 Interview Script

Open with:

"Werkles is going to inspect what you are trying to do and what might actually be blocking it. You may have come in asking for a person, money, space, advice, or a tool. We are not going to assume the first request is the real bottleneck. We will show our reasons, and you stay in control."

### Core Questions

1. What do you think the problem is?

2. What did you come to Werkles hoping to find?

3. Why does that feel like the thing you need?

4. If you got exactly what you asked for, what might still block you?

5. What has already been tried?

6. What happened when you tried it?

7. What part of this feels unclear, expensive, embarrassing, boring, or risky?

8. What do you already know but have not wanted to say out loud?

9. What would a cautious friend worry about here?

10. What would a serious operator ask to see before trusting this?

11. What proof do you already have?

12. What proof is missing?

13. If no person were available, what else might help?

14. What is the smallest real-world test that would teach us something useful?

15. What decision do you need to make next?

Close with:

"I am going to translate what I heard into a few possible bottlenecks. You can correct any of it."

## Need Translation Worksheet

### Stated Need

User says they need:

Their words:

Desired outcome:

### Translation Hypotheses

List up to five.

#### Hypothesis 1

Possible real bottleneck:

Evidence supporting it:

Evidence against it:

Confidence: low / medium / high

What would test it:

#### Hypothesis 2

Possible real bottleneck:

Evidence supporting it:

Evidence against it:

Confidence: low / medium / high

What would test it:

#### Hypothesis 3

Possible real bottleneck:

Evidence supporting it:

Evidence against it:

Confidence: low / medium / high

What would test it:

#### Hypothesis 4

Possible real bottleneck:

Evidence supporting it:

Evidence against it:

Confidence: low / medium / high

What would test it:

#### Hypothesis 5

Possible real bottleneck:

Evidence supporting it:

Evidence against it:

Confidence: low / medium / high

What would test it:

## Bottleneck Determination Rules

Use these rules after the interview.

### Rule 1: Match The Bottleneck To The Next Decision

The best bottleneck is the constraint blocking the user's next real decision, not the biggest abstract problem.

### Rule 2: Prefer The Constraint With Evidence

Choose a bottleneck supported by something the user said, showed, or failed to show.

Do not choose the most dramatic theory.

### Rule 3: Separate Symptom From Constraint

Examples:

- "I need a partner" may be a symptom of missing skill, trust, labor, or confidence.
- "I need money" may be a symptom of untested scope, missing proof, or bad sequencing.
- "I need customers" may be a symptom of unclear offer, weak proof, or poor channel fit.

### Rule 4: Prefer Reachable Next Tests

The selected bottleneck should point to a test the user can actually run.

If the next step requires too much money, authority, or luck, shrink it.

### Rule 5: Keep User Sovereignty

The recommendation is not a verdict.

The user can reject the diagnosis.

If the user rejects it, record why.

### Rule 6: Do Not Over-Match

Do not recommend a person just because Werkles has a person.

Recommend a person only when a person is the best next step.

### Rule 7: Use Pause As A Valid Recommendation

If the next move is too risky, unclear, unsupported, or premature, recommend a pause or proof request.

## Recommendation Format

Give every user a short written recommendation.

### 1. What You Asked For

You came in asking for:

### 2. What We Heard Underneath It

The possible real bottleneck is:

### 3. Visible Reasons

We think this because:

1.

2.

3.

### 4. Recommendation

Your recommended next step is:

Type:

- person
- lender
- space
- tool
- checklist
- proof request
- lesson
- smaller first step
- warning
- pause

### 5. Why This, Not The Other Options

Not recommending:

Reason:

Not recommending:

Reason:

### 6. What To Do Next

Step 1:

Step 2:

Step 3:

### 7. What Would Change The Recommendation

This recommendation may be wrong if:

We would change it if:

### 8. User Sovereignty Note

This is a recommendation, not a decision.

You can accept it, reject it, modify it, or ask Werkles to inspect a different path.

## Follow-Up Cadence

### Same Day

Send written recommendation.

Record:

- selected bottleneck
- recommendation type
- visible reasons
- what was assumed
- what reality must test next

### Day 3

Ask:

- Did the recommendation make sense?
- Did you take the first step?
- What was confusing?
- What felt useful?
- What felt wrong?

### Day 7

Ask:

- What happened after the first step?
- Did the bottleneck change?
- Did the recommendation still feel right?
- What did reality show?

### Day 14

Ask:

- Did Werkles help you make progress?
- Did the visible reasons increase trust?
- Did you need a different recommendation type?
- Would you use this again?
- Would you pay for a version of this?

## Success Criteria

The 20-user concierge process succeeds if:

- at least 15 of 20 users understand the recommendation
- at least 12 of 20 users say the visible reasons increased trust
- at least 10 of 20 users take the first recommended step
- at least 10 of 20 users say the process clarified the real bottleneck
- at least 6 of 20 users would pay for a future version
- Ben can identify which parts should be automated later
- Ben can identify which parts should stay human longer

## Failure Criteria

The process fails or needs revision if:

- users do not understand the recommendation
- users feel overruled or diagnosed against their will
- recommendations collapse back into "find a person" by default
- visible reasons feel vague or fake
- the process takes too long to run manually
- Ben cannot tell what should be automated
- users do not take any next step
- users do not see value after follow-up

## What To Track Across 20 Users

For each user, record:

- stated need
- diagnosed bottleneck
- recommendation type
- visible reasons
- confidence level
- user accepted / rejected / modified recommendation
- first step taken
- day 3 result
- day 7 result
- day 14 result
- would pay: yes / no / maybe
- what should be automated
- what should stay human

## Final 20-User Review

After 20 users, answer:

1. What needs did users request most often?
2. What bottlenecks were most common?
3. How often was "person" the right recommendation?
4. What other recommendation types appeared?
5. Did Need Translation feel useful?
6. Did users trust visible reasons?
7. What language confused users?
8. What recommendation format worked best?
9. What should the first engine automate?
10. What should remain concierge?

## Stop Conditions

Stop the process and review before continuing if:

- users report feeling manipulated
- recommendations begin sounding like legal, financial, tax, or investment advice
- Ben cannot produce visible reasons
- follow-up shows the recommendations are consistently wrong
- the process becomes too heavy for a human to run
- the process creates pressure to automate before the pattern is proven
````````

<!-- SOURCE_BLOCK_END C:\Users\Ben Leak\Desktop\MouseWithoutBorders\FROM_DINK_20_USER_CONCIERGE_PROCESS_V1.md -->

### July 8 autonomous matching pivot receipt

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\receipts\WERKLES_AUTONOMOUS_MATCHING_PIVOT_20260708.md`

<!-- SOURCE_BLOCK_BEGIN foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_PIVOT_20260708.md -->

````````md
# Autonomous Matching Pivot — 2026-07-08

RECEIPT_ID: WERKLES_AUTONOMOUS_MATCHING_PIVOT_20260708
LANE: Werkles.com / G

## Operator direction

Remove human operator from intake → recommendation path. Wholly algorithm/Aeye hybrid matcher:

- **Speaker** — delivers plain facts
- **Squibb** — voice layer
- **Shadow first**, public flip after proof

## Built (this session)

| Layer | Path |
|-------|------|
| Speaker Charter V1 draft | `foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md` |
| Feature flags | `lib/matching/feature-flags.ts` |
| Signal extraction | `lib/matching/signals.ts` |
| Deterministic scorer | `lib/matching/score-paths.ts` |
| Speaker + Squibb delivery | `lib/matching/deliver.ts` |
| Shadow pipeline | `lib/matching/shadow-pipeline.ts` |
| Shadow storage | `data/matching/shadow-runs.jsonl` |
| Intake wiring | `/api/discovery/intake`, `/api/bellows/intake` |
| Operator review | `/operator/matching/shadow` |
| Recommendations feed | `recommendation-session-server.ts` uses latest shadow run |

## Flags

- `MATCHING_AUTONOMOUS_SHADOW` = **true** (runs on submit)
- `MATCHING_AUTONOMOUS_PUBLIC` = **false** (end users: shadow messaging)
- `MATCHING_LLM_TRANSLATE_ENABLED` = **false** (LLM slot gated)

## Gates still required

1. `RATIFY SPEAKER CHARTER V1 AUTONOMOUS FACT DELIVERY`
2. `APPROVE MATCHING LLM TRANSLATE` (optional, for voice/translation API)
3. `APPROVE MATCHING AUTONOMOUS GO-LIVE` (public flip)

## Not built yet

- People-to-people matching (no candidate pool)
- Crucible-verified facts in scorer weights
- LLM translation implementation
- Metered billing for inference
````````

<!-- SOURCE_BLOCK_END foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_PIVOT_20260708.md -->

### Speaker Charter V1 Autonomous Fact Delivery draft

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\speaker\SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md`

<!-- SOURCE_BLOCK_BEGIN foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md -->

````````md
# Speaker Charter V1 — Autonomous Fact Delivery (DRAFT)

Status: **DRAFT — AWAITING BEN RATIFICATION**  
Supersedes operational interpretation of: `foreman/speaker/SPEAKER_CHARTER.md` (RATIFIED OFFICE V0, 2026-06-07)  
Does **not** delete V0. V1 extends Speaker into live product delivery while preserving constitutional limits.

---

## Ratification gate

Ben must explicitly ratify before this draft is applied to product copy, matching engine behavior, or public-facing claims.

Suggested phrase:

```text
RATIFY SPEAKER CHARTER V1 AUTONOMOUS FACT DELIVERY
```

Until ratified: shadow matching may run; public copy must not claim fully autonomous Speaker delivery.

---

## What changed (Operator direction, 2026-07-08)

| Before (V0) | After (V1) |
|---------------|------------|
| Human operator reads intake | **Hybrid Aeye matching engine** (deterministic score + bounded LLM translation) |
| Speaker = memory ledger only | Speaker = **live deliverer of plain facts** from engine output |
| Squibb = static demo voice | Squibb = **voice layer** wrapping ranked paths |
| Human writes recommendation card | Engine produces card; **shadow review** then public flip |

---

## Speaker V1 mandate

Speaker **delivers plain facts** to the member:

- what the intake signals show (with evidence strength labels)
- what the primary bottleneck appears to be
- what paths scored highest and why (deterministic reasoning)
- what would falsify the read
- what proof is missing before reliance

Speaker does **not**:

- execute intros, payments, contracts, or deployments
- guarantee outcomes, trust, clearance, or partner quality
- pretend verification happened when it did not
- route missions or override GD/Foreman dispatch

**Constitutional continuity:** Speaker remains **advisory, not executive**. V1 adds a **live readout surface**; it does not give Speaker hands.

---

## Squibb V1 role

Squibb is the **voice** — human-facing phrasing, counterpoints, and "keep your original path" framing.

Squibb does **not**:

- invent facts not present in Speaker output
- hide evidence strength (verified / self_reported / inferred / missing)
- imply Werkles vouches for any person, lender, or outcome

LLM may assist Squibb phrasing only when `MATCHING_LLM_TRANSLATE_ENABLED` is approved and keyed.

---

## Matching engine (hybrid)

1. **Deterministic layer** — structured signals from intake (lane, assets, constraints, keyword heuristics) → path scores from catalog.
2. **LLM layer (optional, gated)** — translates free-text into structured signals + Squibb voice variants. Bounded tokens; never sole authority.
3. **Shadow mode** — engine runs on every intake; results stored for operator review; not shown to public until `MATCHING_AUTONOMOUS_PUBLIC` flip.
4. **Public flip gate** — `APPROVE MATCHING AUTONOMOUS GO-LIVE` after shadow quality proof.

---

## Liability posture (product copy rule)

Autonomous matching must **not** claim:

- "Werkles matched you with Sarah"
- "verified partner" without Crucible proof
- legal clearance, creditworthiness, or hiring suitability

Autonomous matching **may** claim:

- "Based on what you shared, these paths scored highest"
- "These facts are self-reported until you run a Crucible check"
- "Speaker lists what would change this read"

---

## Artifacts

| Artifact | Purpose |
|----------|---------|
| `lib/matching/shadow-pipeline.ts` | Shadow run orchestration |
| `lib/speaker/fact-delivery.ts` | Speaker plain-facts shape |
| `lib/squibb/voice-templates.ts` | Squibb voice from facts |
| `data/matching/shadow-runs.jsonl` | Shadow receipts |
| `/operator/matching/shadow` | Operator review surface |

---

## Ben ratification record

| Field | Value |
|-------|-------|
| Decision | _pending_ |
| Timestamp | _pending_ |
| Record in | `foreman/gates/APPROVAL_LOG.md` |
````````

<!-- SOURCE_BLOCK_END foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md -->

### Matching inbox README: where new artifacts should feed

Source path: `C:\Users\Ben Leak\github\Werkles\artifacts\matching-inbox\README.md`

<!-- SOURCE_BLOCK_BEGIN artifacts/matching-inbox/README.md -->

````````md
# Matching / Not-Matching — Artifact Inbox

DROP ZONE for Heimerdinger artifacts feeding the autonomous Matching/Not-Matching engine.

## Full path (for the crew dropping files)

```
C:\Users\Ben Leak\github\Werkles\artifacts\matching-inbox\
```

## Rules

- This is an **inbox**, not compiled source. Drop anything here: JSON, CSV, `.md` specs, rule tables, sample intakes, taxonomy files, weight tables, candidate rosters, sketches.
- **Do NOT** drop `.ts` files directly into `lib/matching/` — that breaks the typecheck. Put source-shaped material here and Maker (Lady Jessica) will translate it into the engine.
- Please include a short `MANIFEST.md` or top-of-file note per artifact: what it is, where it should feed (signals? scoring weights? path catalog? not-match rules?), and how confident/authoritative it is.

## Where each artifact type will land in the engine

| Artifact type | Consumed by |
|---------------|-------------|
| Signal / taxonomy definitions | `lib/matching/signals.ts`, `types.ts` |
| Path catalog + scoring weights | `lib/matching/score-paths.ts` |
| **Not-Match / disqualifier rules** | `lib/matching/score-paths.ts` (new not-match layer) |
| Speaker fact templates | `lib/matching/deliver.ts` |
| Squibb voice variants | `lib/matching/deliver.ts` |
| Candidate roster / people pool | new `lib/matching/roster.ts` (not built yet) |
| Sample intakes for shadow QA | fed through `/discovery` or `/bellows/intake` |

## Status

Engine runs in **shadow mode** now. Public flip gated on `APPROVE MATCHING AUTONOMOUS GO-LIVE`.
Awaiting Heimerdinger artifacts for the Matching/Not-Matching design.
````````

<!-- SOURCE_BLOCK_END artifacts/matching-inbox/README.md -->

### Current implementation: matching types

Source path: `C:\Users\Ben Leak\github\Werkles\lib\matching\types.ts`

<!-- SOURCE_BLOCK_BEGIN lib/matching/types.ts -->

````````ts
import type { DiscoveryAsset, DiscoveryLane } from "@/lib/discovery/schema";
import type { RecommendationKind } from "@/lib/squibb/recommendations";
import type { EvidenceStrength } from "@/lib/squibb/recommendations";

export type MatchingIntakeSource = "discovery" | "bellows_concierge";

export type StructuredSignals = {
  source: MatchingIntakeSource;
  intakeId: string;
  statedNeed: string;
  lane: DiscoveryLane | "Unsure";
  assets: DiscoveryAsset[];
  blockerKeywords: string[];
  goalKeywords: string[];
  capitalSeeking: boolean;
  partnerSeeking: boolean;
  jobSeeking: boolean;
  trainingSeeking: boolean;
  relocationSignal: boolean;
  llmTranslatedBottleneck: string | null;
};

export type ScoredPath = {
  kind: RecommendationKind;
  rank: number;
  score: number;
  confidenceLabel: "low" | "medium" | "high";
  rationale: string[];
  evidenceStrength: EvidenceStrength;
};

export type SpeakerFactItem = {
  id: string;
  label: string;
  value: string;
  strength: EvidenceStrength;
  source: string;
};

export type SpeakerFactDelivery = {
  version: "v1";
  intakeId: string;
  source: MatchingIntakeSource;
  primaryBottleneck: string;
  facts: SpeakerFactItem[];
  falsifiers: string[];
  proofGaps: string[];
  scoredPaths: ScoredPath[];
  generatedAt: string;
};

export type SquibbVoiceDelivery = {
  intro: string;
  topPathNote: string;
  counterpoint: string | null;
  keepOriginalPathLabel: string;
};

export type ShadowMatchingRun = {
  runId: string;
  intakeId: string;
  source: MatchingIntakeSource;
  mode: "shadow";
  signals: StructuredSignals;
  speaker: SpeakerFactDelivery;
  squibb: SquibbVoiceDelivery;
  llmUsed: boolean;
  createdAt: string;
  receiptPath: string;
};
````````

<!-- SOURCE_BLOCK_END lib/matching/types.ts -->

### Current implementation: signal extraction

Source path: `C:\Users\Ben Leak\github\Werkles\lib\matching\signals.ts`

<!-- SOURCE_BLOCK_BEGIN lib/matching/signals.ts -->

````````ts
import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import type { MatchingIntakeSource, StructuredSignals } from "@/lib/matching/types";

const PARTNER_WORDS = /\b(partner|co-founder|cofounder|investor|backer|equity)\b/i;
const CAPITAL_WORDS = /\b(loan|capital|fund|fundraising|money|credit|financ|bank|lender|invest)\b/i;
const JOB_WORDS = /\b(job|hire|hired|employment|shift|bartend|server|waiter|waitress|kitchen)\b/i;
const TRAINING_WORDS = /\b(train|certif|license|course|class|learn|skill)\b/i;
const RELOC_WORDS = /\b(relocat|move|city|state|zip|metro|area)\b/i;

function tokenize(...parts: string[]): string[] {
  const blob = parts.join(" ").toLowerCase();
  return blob
    .split(/[^a-z0-9]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
}

function hasPattern(text: string, pattern: RegExp) {
  return pattern.test(text);
}

export function signalsFromDiscovery(intakeId: string, input: DiscoveryIntakeInput): StructuredSignals {
  const blob = [
    input.situation,
    input.goal,
    input.stated_blocker,
    input.one_thing,
    input.tried,
    input.constraints,
    input.notes
  ].join(" ");

  return {
    source: "discovery",
    intakeId,
    statedNeed: input.one_thing || input.goal || input.situation,
    lane: input.lane,
    assets: input.assets,
    blockerKeywords: tokenize(input.stated_blocker, input.constraints),
    goalKeywords: tokenize(input.goal, input.situation),
    capitalSeeking: hasPattern(blob, CAPITAL_WORDS),
    partnerSeeking: hasPattern(blob, PARTNER_WORDS),
    jobSeeking: hasPattern(blob, JOB_WORDS),
    trainingSeeking: hasPattern(blob, TRAINING_WORDS),
    relocationSignal: hasPattern(blob, RELOC_WORDS),
    llmTranslatedBottleneck: null
  };
}

export function signalsFromConcierge(intakeId: string, answers: ConciergeIntakeAnswers): StructuredSignals {
  const blob = Object.values(answers).join(" ");
  const statedNeed = answers.heaviest_lift.trim() || answers.stuck_decision.trim();

  return {
    source: "bellows_concierge",
    intakeId,
    statedNeed,
    lane: "Unsure",
    assets: [],
    blockerKeywords: tokenize(answers.stuck_decision, answers.time_cost),
    goalKeywords: tokenize(answers.success_twelve_months, answers.heaviest_lift),
    capitalSeeking: hasPattern(blob, CAPITAL_WORDS),
    partnerSeeking: hasPattern(blob, PARTNER_WORDS),
    jobSeeking: hasPattern(blob, JOB_WORDS),
    trainingSeeking: hasPattern(blob, TRAINING_WORDS),
    relocationSignal: hasPattern(blob, RELOC_WORDS),
    llmTranslatedBottleneck: null
  };
}

export function primaryBottleneckFromSignals(signals: StructuredSignals): string {
  if (signals.llmTranslatedBottleneck) return signals.llmTranslatedBottleneck;
  if (signals.capitalSeeking && signals.partnerSeeking) {
    return "Capital and partnership are both named — the nearer bottleneck may be proof and sizing, not a person.";
  }
  if (signals.capitalSeeking) return "Funding or liquidity appears to be the primary bottleneck.";
  if (signals.partnerSeeking) return "Partnership or operator coverage appears to be the primary bottleneck.";
  if (signals.jobSeeking) return "Employment or role change appears to be the primary bottleneck.";
  if (signals.trainingSeeking) return "Skill or credential gap appears to be the primary bottleneck.";
  if (signals.relocationSignal) return "Geography or relocation constraint appears central.";
  return "The stated need should be translated before chasing a specific person, product, or vendor.";
}
````````

<!-- SOURCE_BLOCK_END lib/matching/signals.ts -->

### Current implementation: deterministic path scoring

Source path: `C:\Users\Ben Leak\github\Werkles\lib\matching\score-paths.ts`

<!-- SOURCE_BLOCK_BEGIN lib/matching/score-paths.ts -->

````````ts
import type { RecommendationKind } from "@/lib/squibb/recommendations";
import type { ScoredPath, StructuredSignals } from "@/lib/matching/types";

type PathRule = {
  kind: RecommendationKind;
  base: number;
  score: (s: StructuredSignals) => { points: number; reasons: string[] };
};

const RULES: PathRule[] = [
  {
    kind: "translate_need",
    base: 40,
    score: () => ({
      points: 35,
      reasons: ["Every intake starts with need translation before people or money moves."]
    })
  },
  {
    kind: "verify_proof",
    base: 30,
    score: (s) => ({
      points: 28,
      reasons: ["Self-reported intake alone is not enough to rely on for money or intros."]
    })
  },
  {
    kind: "find_credit_union",
    base: 0,
    score: (s) => ({
      points: s.capitalSeeking ? 42 : 8,
      reasons: s.capitalSeeking
        ? ["Capital language detected — member-owned lending may fit before equity."]
        : ["Low capital signal — CU path is secondary."]
    })
  },
  {
    kind: "find_partner",
    base: 0,
    score: (s) => ({
      points: s.partnerSeeking ? 38 : 6,
      reasons: s.partnerSeeking
        ? ["Partnership language detected — but proof should precede intro."]
        : ["No strong partnership signal in intake text."]
    })
  },
  {
    kind: "raise_capital",
    base: 0,
    score: (s) => ({
      points: s.capitalSeeking && s.assets.includes("Idea") ? 30 : 12,
      reasons: ["Capital seek with idea asset — structure review before dilution."]
    })
  },
  {
    kind: "get_training",
    base: 0,
    score: (s) => ({
      points: s.trainingSeeking ? 36 : s.jobSeeking ? 18 : 10,
      reasons: s.trainingSeeking
        ? ["Training or credential language detected."]
        : ["Training may close skill gap cheaper than a partner."]
    })
  },
  {
    kind: "find_better_job",
    base: 0,
    score: (s) => ({
      points: s.jobSeeking ? 40 : 8,
      reasons: s.jobSeeking ? ["Employment change language detected."] : ["Weak job-change signal."]
    })
  },
  {
    kind: "relocate",
    base: 0,
    score: (s) => ({
      points: s.relocationSignal ? 34 : 5,
      reasons: s.relocationSignal ? ["Geography or relocation mentioned."] : []
    })
  },
  {
    kind: "find_equipment",
    base: 0,
    score: (s) => ({
      points: s.goalKeywords.some((k) => ["equipment", "oven", "truck", "tool", "lease"].includes(k)) ? 32 : 6,
      reasons: ["Equipment/asset goal keywords checked."]
    })
  },
  {
    kind: "stage_intro_candidate",
    base: 0,
    score: (s) => ({
      points: s.partnerSeeking && s.assets.includes("Network") ? 22 : 10,
      reasons: ["Guarded candidate staging only after translation and proof gaps are visible."]
    })
  }
];

function confidenceFromScore(score: number): "low" | "medium" | "high" {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}

export function scorePaths(signals: StructuredSignals): ScoredPath[] {
  const raw = RULES.map((rule) => {
    const { points, reasons } = rule.score(signals);
    const score = Math.min(100, rule.base + points);
    return {
      kind: rule.kind,
      rank: 0,
      score,
      confidenceLabel: confidenceFromScore(score),
      rationale: reasons.filter(Boolean),
      evidenceStrength: "inferred" as const
    };
  });

  return raw
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map((item, index) => ({ ...item, rank: index + 1 }));
}
````````

<!-- SOURCE_BLOCK_END lib/matching/score-paths.ts -->

### Current implementation: Speaker facts + Squibb voice delivery

Source path: `C:\Users\Ben Leak\github\Werkles\lib\matching\deliver.ts`

<!-- SOURCE_BLOCK_BEGIN lib/matching/deliver.ts -->

````````ts
import type { SpeakerFactDelivery, SquibbVoiceDelivery, StructuredSignals, ScoredPath } from "@/lib/matching/types";
import { primaryBottleneckFromSignals } from "@/lib/matching/signals";
import { RECOMMENDATION_KIND_LABELS } from "@/lib/squibb/recommendations";

export function buildSpeakerFacts(
  signals: StructuredSignals,
  scoredPaths: ScoredPath[]
): SpeakerFactDelivery {
  const primaryBottleneck = primaryBottleneckFromSignals(signals);

  const facts = [
    {
      id: "stated-need",
      label: "Stated need",
      value: signals.statedNeed || "(not provided)",
      strength: "self_reported" as const,
      source: signals.source
    },
    {
      id: "lane",
      label: "Lane",
      value: signals.lane,
      strength: "self_reported" as const,
      source: "intake"
    },
    {
      id: "assets",
      label: "Assets named",
      value: signals.assets.length > 0 ? signals.assets.join(", ") : "(none checked)",
      strength: "self_reported" as const,
      source: "intake"
    },
    {
      id: "top-path",
      label: "Top scored path",
      value: scoredPaths[0]
        ? `${RECOMMENDATION_KIND_LABELS[scoredPaths[0].kind]} (${scoredPaths[0].score})`
        : "(none)",
      strength: "inferred" as const,
      source: "matching_engine_v1"
    }
  ];

  const falsifiers = [
    "If the real blocker is proof, not capital, the top path changes.",
    "If timeline is under 30 days, training and CU paths may be too slow.",
    "If geography is fixed, relocation and some lender paths drop."
  ];

  const proofGaps = [
    "Third-party verification not attached to this intake.",
    "Funds posture not verified unless Crucible Funds check completed.",
    "Identity not verified unless Crucible Identity check completed."
  ];

  return {
    version: "v1",
    intakeId: signals.intakeId,
    source: signals.source,
    primaryBottleneck,
    facts,
    falsifiers,
    proofGaps,
    scoredPaths,
    generatedAt: new Date().toISOString()
  };
}

export function buildSquibbVoice(speaker: SpeakerFactDelivery): SquibbVoiceDelivery {
  const top = speaker.scoredPaths[0];
  const topLabel = top ? RECOMMENDATION_KIND_LABELS[top.kind] : "Translate need";

  return {
    intro:
      "Squibb: I read what you carried in. Speaker has the plain facts below — I'm offering the path that scored highest, not a person or a guarantee.",
    topPathNote: top
      ? `Squibb: "${topLabel}" scored ${top.score}/100 from what you shared. ${top.rationale[0] || ""}`
      : "Squibb: Start with translating the bottleneck before shopping for solutions.",
    counterpoint:
      speaker.scoredPaths[1] && speaker.scoredPaths[1].score > 30
        ? `Squibb: "${RECOMMENDATION_KIND_LABELS[speaker.scoredPaths[1].kind]}" is the runner-up if the top path feels wrong.`
        : null,
    keepOriginalPathLabel: "Keep your original ask"
  };
}
````````

<!-- SOURCE_BLOCK_END lib/matching/deliver.ts -->

### Current implementation: shadow pipeline

Source path: `C:\Users\Ben Leak\github\Werkles\lib\matching\shadow-pipeline.ts`

<!-- SOURCE_BLOCK_BEGIN lib/matching/shadow-pipeline.ts -->

````````ts
import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ConciergeIntakeAnswers } from "@/lib/squibb/concierge-intake-v0";
import type { DiscoveryIntakeInput } from "@/lib/discovery/schema";
import { isMatchingShadowEnabled, isMatchingLlmEnabled } from "@/lib/matching/feature-flags";
import { signalsFromConcierge, signalsFromDiscovery } from "@/lib/matching/signals";
import { scorePaths } from "@/lib/matching/score-paths";
import { buildSpeakerFacts, buildSquibbVoice } from "@/lib/matching/deliver";
import { newShadowRunId, persistShadowRun } from "@/lib/matching/shadow-storage";
import type { ShadowMatchingRun } from "@/lib/matching/types";

import type { StructuredSignals } from "@/lib/matching/types";

async function maybeLlmTranslate(signals: StructuredSignals): Promise<StructuredSignals> {
  if (!isMatchingLlmEnabled()) return signals;
  // Gated LLM slot — wired when OPENAI_API_KEY + APPROVE MATCHING LLM TRANSLATE
  return signals;
}

export async function runShadowMatchingFromDiscovery(
  intakeId: string,
  input: DiscoveryIntakeInput
): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;

  let signals = signalsFromDiscovery(intakeId, input);
  signals = await maybeLlmTranslate(signals);
  const scoredPaths = scorePaths(signals);
  const speaker = buildSpeakerFacts(signals, scoredPaths);
  const squibb = buildSquibbVoice(speaker);

  const run: ShadowMatchingRun = {
    runId: newShadowRunId(),
    intakeId,
    source: "discovery",
    mode: "shadow",
    signals,
    speaker,
    squibb,
    llmUsed: isMatchingLlmEnabled(),
    createdAt: new Date().toISOString(),
    receiptPath: "data/matching/shadow-runs.jsonl"
  };

  await persistShadowRun(run);
  return run;
}

export async function runShadowMatchingFromConcierge(
  intakeId: string,
  answers: ConciergeIntakeAnswers
): Promise<ShadowMatchingRun | null> {
  if (!isMatchingShadowEnabled()) return null;

  let signals = signalsFromConcierge(intakeId, answers);
  signals = await maybeLlmTranslate(signals);
  const scoredPaths = scorePaths(signals);
  const speaker = buildSpeakerFacts(signals, scoredPaths);
  const squibb = buildSquibbVoice(speaker);

  const run: ShadowMatchingRun = {
    runId: newShadowRunId(),
    intakeId,
    source: "bellows_concierge",
    mode: "shadow",
    signals,
    speaker,
    squibb,
    llmUsed: isMatchingLlmEnabled(),
    createdAt: new Date().toISOString(),
    receiptPath: "data/matching/shadow-runs.jsonl"
  };

  await persistShadowRun(run);
  return run;
}

export async function readLatestShadowRuns(limit = 10): Promise<ShadowMatchingRun[]> {
  const indexPath = path.join(process.cwd(), "data/matching/shadow-runs.jsonl");
  let content: string;
  try {
    content = await readFile(indexPath, "utf8");
  } catch {
    return [];
  }

  const lines = content.trim().split("\n").filter(Boolean);
  return lines
    .slice(-limit)
    .map((line) => JSON.parse(line) as ShadowMatchingRun)
    .reverse();
}
````````

<!-- SOURCE_BLOCK_END lib/matching/shadow-pipeline.ts -->

### Current implementation: shadow output mapped to recommendation session

Source path: `C:\Users\Ben Leak\github\Werkles\lib\matching\shadow-to-recommendations.ts`

<!-- SOURCE_BLOCK_BEGIN lib/matching/shadow-to-recommendations.ts -->

````````ts
import type { ShadowMatchingRun } from "@/lib/matching/types";
import {
  RECOMMENDATION_KIND_LABELS,
  type SquibbRecommendation,
  type SquibbRecommendationSession
} from "@/lib/squibb/recommendations";

export function shadowRunToRecommendationSession(run: ShadowMatchingRun): SquibbRecommendationSession {
  const ranked: SquibbRecommendation[] = run.speaker.scoredPaths.map((path) => ({
    id: `shadow-${path.kind}`,
    kind: path.kind,
    rank: path.rank,
    title: RECOMMENDATION_KIND_LABELS[path.kind],
    headline: run.speaker.primaryBottleneck,
    squibbNote: path.rank === 1 ? run.squibb.topPathNote : run.squibb.intro,
    reasoning: {
      statedNeed: run.signals.statedNeed,
      translatedNeed: run.speaker.primaryBottleneck,
      rationale: path.rationale,
      counterpoint: path.rank === 1 ? run.squibb.counterpoint ?? undefined : undefined
    },
    confidence: {
      score: path.score,
      label: path.confidenceLabel,
      why: `Deterministic score from intake signals (${run.mode} mode).`
    },
    evidence: run.speaker.facts.map((f) => ({
      id: f.id,
      label: f.label,
      strength: f.strength,
      source: f.source
    })),
    humanGates: [],
    suggestedAgent: "Speaker (facts) → Squibb (voice)",
    keepOriginalPathLabel: run.squibb.keepOriginalPathLabel
  }));

  return {
    version: "v1",
    statedNeed: run.signals.statedNeed,
    operatorContext: `Shadow matching run ${run.runId} — ${run.createdAt}`,
    squibbIntro: run.squibb.intro,
    source: {
      mode: "latest_intake",
      label: "Autonomous matching (shadow)",
      detail: "Engine output from hybrid scorer. Speaker facts + Squibb voice.",
      intakeId: run.intakeId,
      capturedAt: run.createdAt
    },
    ranked,
    catalog: ranked
  };
}
````````

<!-- SOURCE_BLOCK_END lib/matching/shadow-to-recommendations.ts -->

### Current implementation: autonomous matching feature flags

Source path: `C:\Users\Ben Leak\github\Werkles\lib\matching\feature-flags.ts`

<!-- SOURCE_BLOCK_BEGIN lib/matching/feature-flags.ts -->

````````ts
/**
 * Autonomous matching feature flags.
 * Shadow runs on intake by default; public delivery and LLM layers are gated.
 */

/** Run hybrid engine on every intake; store shadow receipt (operator-visible). */
export const MATCHING_AUTONOMOUS_SHADOW = true;

/** Show engine output to end users on intake/recommendation surfaces. */
export const MATCHING_AUTONOMOUS_PUBLIC = false;

/** Allow OpenAI (or compatible) translation + Squibb voice LLM assist. Requires env + gate phrase. */
export const MATCHING_LLM_TRANSLATE_ENABLED = false;

export function isMatchingShadowEnabled() {
  return MATCHING_AUTONOMOUS_SHADOW;
}

export function isMatchingPublicEnabled() {
  return MATCHING_AUTONOMOUS_PUBLIC;
}

export function isMatchingLlmEnabled() {
  return (
    MATCHING_LLM_TRANSLATE_ENABLED &&
    Boolean(process.env.OPENAI_API_KEY?.trim() || process.env.MATCHING_LLM_API_KEY?.trim())
  );
}
````````

<!-- SOURCE_BLOCK_END lib/matching/feature-flags.ts -->

### Squibb recommendation surface v1: full static/demo plus live-intake deck

Source path: `C:\Users\Ben Leak\github\Werkles\lib\squibb\recommendations.ts`

<!-- SOURCE_BLOCK_BEGIN lib/squibb/recommendations.ts -->

````````ts
/**
 * Squibb Recommendation Surface v1 — UI/workflow types and static demo deck.
 * No AI model. No matching engine. Operator-facing presentation only.
 */

export type RecommendationKind =
  | "translate_need"
  | "verify_proof"
  | "stage_intro_candidate"
  | "find_partner"
  | "find_equipment"
  | "find_banker"
  | "find_credit_union"
  | "find_better_job"
  | "stay_current_job"
  | "relocate"
  | "get_training"
  | "raise_capital";

export type EvidenceStrength = "verified" | "self_reported" | "inferred" | "missing";

export type ConfidenceLabel = "low" | "medium" | "high";

export type HumanGateSeverity = "info" | "warning" | "blocker";

export type HumanGateKind =
  | "none"
  | "operator_approval"
  | "petra_review"
  | "crucible_proof"
  | "legal_review"
  | "financial_commitment"
  | "external_intro";

export interface EvidenceItem {
  id: string;
  label: string;
  strength: EvidenceStrength;
  source?: string;
}

export interface HumanGateRequirement {
  id: string;
  label: string;
  kind: HumanGateKind;
  severity: HumanGateSeverity;
  reason: string;
  benMustApprove: boolean;
}

export interface SquibbRecommendation {
  id: string;
  kind: RecommendationKind;
  rank: number;
  title: string;
  headline: string;
  squibbNote: string;
  reasoning: {
    statedNeed: string;
    translatedNeed?: string;
    rationale: string[];
    counterpoint?: string;
  };
  confidence: {
    score: number;
    label: ConfidenceLabel;
    why: string;
  };
  evidence: EvidenceItem[];
  humanGates: HumanGateRequirement[];
  suggestedAgent: string;
  suggestedTool?: string;
  keepOriginalPathLabel: string;
}

export interface SquibbRecommendationSession {
  version: "v1";
  statedNeed: string;
  operatorContext: string;
  squibbIntro: string;
  source?: SquibbRecommendationSessionSource;
  ranked: SquibbRecommendation[];
  catalog: SquibbRecommendation[];
}

export type SquibbRecommendationSessionSource = {
  mode: "demo" | "latest_intake";
  label: string;
  detail: string;
  intakeId?: string;
  packetPath?: string;
  speakerEntryPath?: string;
  capturedAt?: string;
  answeredCount?: number;
  totalQuestions?: number;
  symptomBlock?: string;
};

export type SquibbRecommendationSessionInput = {
  statedNeed?: string;
  operatorContext?: string;
  squibbIntro?: string;
  source?: SquibbRecommendationSessionSource;
  symptomBlock?: string;
};

export const RECOMMENDATION_KIND_LABELS: Record<RecommendationKind, string> = {
  translate_need: "Translate need",
  verify_proof: "Verify proof",
  stage_intro_candidate: "Stage intro candidate",
  find_partner: "Find partner",
  find_equipment: "Find equipment",
  find_banker: "Find banker",
  find_credit_union: "Find credit union",
  find_better_job: "Find better job",
  stay_current_job: "Stay in current job",
  relocate: "Relocate",
  get_training: "Get training",
  raise_capital: "Raise capital"
};

const DEMO_STATED_NEED =
  "I need a business partner and investor before I can buy the bakery equipment.";

function baseGates(kind: RecommendationKind): HumanGateRequirement[] {
  const shared: HumanGateRequirement[] = [
    {
      id: "gate-preview",
      label: "Preview surface only",
      kind: "none",
      severity: "info",
      reason: "This deck is static UI. No intros, capital, or contracts move without live gates.",
      benMustApprove: false
    }
  ];

  switch (kind) {
    case "stage_intro_candidate":
    case "raise_capital":
    case "find_banker":
      return [
        ...shared,
        {
          id: "gate-petra-capital",
          label: "Petra GO — capital structure",
          kind: "petra_review",
          severity: "blocker",
          reason: "Securities, lending, and ownership moves require Comptroller review.",
          benMustApprove: true
        },
        {
          id: "gate-crucible-financial",
          label: "Crucible proof — financial claims",
          kind: "crucible_proof",
          severity: "warning",
          reason: "Revenue, liquidity, and business-stage claims must be verified before lender intro.",
          benMustApprove: false
        }
      ];
    case "translate_need":
    case "verify_proof":
      return [
        ...shared,
        {
          id: "gate-human-read",
          label: "Human read before dispatch",
          kind: "operator_approval",
          severity: "warning",
          reason: "The packet can be staged, but a human chooses whether it becomes an intro, task, or proof request.",
          benMustApprove: true
        }
      ];
    case "find_partner":
    case "find_credit_union":
      return [
        ...shared,
        {
          id: "gate-operator-intro",
          label: "Operator approval — guarded intro",
          kind: "operator_approval",
          severity: "warning",
          reason: "Warm intros and partnership conversations require Ben approval in preview.",
          benMustApprove: true
        },
        {
          id: "gate-legal-partner",
          label: "Legal review — partnership terms",
          kind: "legal_review",
          severity: "info",
          reason: "Equity, operating agreements, and co-ownership need counsel before signing.",
          benMustApprove: true
        }
      ];
    case "find_better_job":
    case "stay_current_job":
    case "relocate":
      return [
        ...shared,
        {
          id: "gate-operator-career",
          label: "Operator judgment — career move",
          kind: "operator_approval",
          severity: "warning",
          reason: "Job change vs stay-put tradeoffs are human judgment calls Squibb cannot close.",
          benMustApprove: true
        }
      ];
    default:
      return shared;
  }
}

function makeRecommendation(
  kind: RecommendationKind,
  rank: number,
  overrides: Partial<SquibbRecommendation> & Pick<SquibbRecommendation, "id" | "title" | "headline" | "squibbNote" | "reasoning" | "confidence" | "evidence">
): SquibbRecommendation {
  return {
    kind,
    rank,
    suggestedAgent: "Squibb (scout) → Operator",
    keepOriginalPathLabel: "Keep original path",
    humanGates: baseGates(kind),
    ...overrides
  };
}

/** Ranked deck for the demo scenario — Layer 0 translation, not a live match. */
const rankedDeck: SquibbRecommendation[] = [
  makeRecommendation("find_equipment", 1, {
    id: "rec-equipment",
    title: "Find equipment first",
    headline: "The oven quote is the nearer bottleneck — not the partner.",
    squibbNote:
      "Squibb: You said partner and investor. The priced asset is already on the table. Partners show up faster when the machine is real.",
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      translatedNeed: "Validate equipment cost and seller before raising or partnering.",
      rationale: [
        "A specific oven quote exists — capital ask can be sized to a number.",
        "Equipment purchase does not require equity dilution on day one.",
        "Proof of a real asset makes lender and partner conversations concrete."
      ],
      counterpoint: "If the seller is unverified, pause equipment and verify before any capital move."
    },
    confidence: {
      score: 78,
      label: "high",
      why: "Named asset, price band, and seller contact are present in operator context."
    },
    evidence: [
      { id: "e1", label: "Oven quote $42k–$48k (self-reported)", strength: "self_reported", source: "Operator intake" },
      { id: "e2", label: "Seller business listing found", strength: "inferred", source: "Public listing" },
      { id: "e3", label: "Revenue history for bakery", strength: "missing" },
      { id: "e4", label: "Equipment inspection report", strength: "missing" }
    ],
    suggestedAgent: "Operator + Dink (local verification)",
    suggestedTool: "Crucible — equipment seller check",
    humanGates: [
      ...baseGates("find_equipment"),
      {
        id: "gate-equipment-purchase",
        label: "Financial commitment — equipment purchase",
        kind: "financial_commitment",
        severity: "blocker",
        reason: "No deposit or purchase without Operator approval and verified seller.",
        benMustApprove: true
      }
    ]
  }),
  makeRecommendation("find_credit_union", 2, {
    id: "rec-cu",
    title: "Find credit union",
    headline: "Member-owned lending may fit equipment better than equity.",
    squibbNote:
      "Squibb: Credit unions often underwrite equipment when the story is boring and documented. Less theater than a 'strategic partner.'",
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      translatedNeed: "Equipment-backed member lending before equity partner search.",
      rationale: [
        "Fixed asset collateral maps cleanly to CU equipment programs.",
        "Lower dilution than bringing a partner for the same dollars.",
        "Faster path if personal credit and down payment are in range."
      ]
    },
    confidence: {
      score: 62,
      label: "medium",
      why: "Structure fits, but liquidity band and personal guarantee appetite are unverified."
    },
    evidence: [
      { id: "e5", label: "Operator lane: Builder / Operator mix", strength: "self_reported" },
      { id: "e6", label: "Liquidity band verified", strength: "missing" },
      { id: "e7", label: "Local CU programs researched", strength: "inferred" }
    ],
    suggestedAgent: "Thufir (research) → Operator",
    suggestedTool: "Bellows — CU equipment checklist",
    humanGates: baseGates("find_credit_union")
  }),
  makeRecommendation("get_training", 3, {
    id: "rec-training",
    title: "Get training",
    headline: "Commercial baking ops training reduces expensive partner dependency.",
    squibbNote:
      "Squibb: Sometimes the missing 'partner' is a week of operator training, not a co-founder.",
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      translatedNeed: "Close skill gap before sharing equity for operational coverage.",
      rationale: [
        "First commercial kitchen — production scheduling is a known blind spot.",
        "Training is reversible; partnership is not.",
        "Certification becomes proof for lenders and future hires."
      ]
    },
    confidence: {
      score: 55,
      label: "medium",
      why: "Skill gap is plausible from intake, but no training quotes or schedules on file."
    },
    evidence: [
      { id: "e8", label: "First commercial kitchen (self-reported)", strength: "self_reported" },
      { id: "e9", label: "Prior production volume", strength: "missing" }
    ],
    suggestedAgent: "Ender (curriculum) + Bellows",
    suggestedTool: "Bellows SOP lane"
  })
];

export function buildLiveIntakeRankedDeck(statedNeed: string, symptomBlock?: string): SquibbRecommendation[] {
  const sourceEvidence: EvidenceItem[] = [
    { id: "live-intake-source", label: "Latest Bellows intake packet", strength: "self_reported", source: "Bellows intake" },
    { id: "live-human-translation", label: "Human translation not completed", strength: "missing" },
    { id: "live-third-party-proof", label: "Third-party proof not attached", strength: "missing" }
  ];

  return [
    makeRecommendation("translate_need", 1, {
      id: "rec-translate-need",
      title: "Translate the bottleneck",
      headline: "Turn the intake into one plain next-move hypothesis before chasing people or money.",
      squibbNote:
        "Squibb: The stated ask is source material, not the verdict. Translate it before anyone starts shopping for a solution.",
      reasoning: {
        statedNeed,
        translatedNeed: "Human-readable bottleneck statement from the latest Bellows intake.",
        rationale: [
          "The intake is symptom-only by design, so the first action is translation rather than matching.",
          "A translated bottleneck gives Petra, Skybro, or Maker something concrete to critique.",
          "This prevents the first packet from becoming an unearned intro, funding ask, or vendor hunt."
        ],
        counterpoint: symptomBlock
          ? "Source symptoms are present. Human review still has to decide what they mean."
          : "No symptom block was available, so this stays a source-review move."
      },
      confidence: {
        score: 72,
        label: "high",
        why: "A current intake exists, but the translation slot is still open."
      },
      evidence: sourceEvidence,
      suggestedAgent: "Speaker + Petra/Skybro human read",
      suggestedTool: "Bellows intake translation packet",
      keepOriginalPathLabel: "Keep raw intake only"
    }),
    makeRecommendation("verify_proof", 2, {
      id: "rec-proof-gap",
      title: "Name the proof gap",
      headline: "List the one or two facts that would make the next move safer.",
      squibbNote:
        "Squibb: Before asking who can help, ask what proof would change the decision.",
      reasoning: {
        statedNeed,
        translatedNeed: "A proof request that can be answered before dispatch.",
        rationale: [
          "Most Werkles moves should not rely on self-report alone.",
          "Proof gaps can become smaller packets: quote, license, identity, funds posture, reference, or current status.",
          "A proof packet lets the operator move without pretending the full recommendation is verified."
        ]
      },
      confidence: {
        score: 64,
        label: "medium",
        why: "The need is present, but the exact proof target still needs a human read."
      },
      evidence: sourceEvidence,
      suggestedAgent: "Petra (proof framing) + Dink (file readback)",
      suggestedTool: "Crucible proof request",
      keepOriginalPathLabel: "Skip proof packet for now"
    }),
    makeRecommendation("stage_intro_candidate", 3, {
      id: "rec-intro-candidate",
      title: "Stage one guarded candidate",
      headline: "Create a candidate packet only after translation and proof gap are visible.",
      squibbNote:
        "Squibb: A candidate is not an intro. It is a thing a human can approve, reject, or sharpen.",
      reasoning: {
        statedNeed,
        translatedNeed: "A guarded candidate packet for a person, lender, space, tool, or training path.",
        rationale: [
          "The operator gets momentum without sending anything outside Werkles.",
          "The candidate packet can carry gates instead of hiding them.",
          "A staged candidate gives Swanson's relay build a useful payload to route later."
        ]
      },
      confidence: {
        score: 52,
        label: "medium",
        why: "Candidate staging is useful, but premature until translation and proof gaps are visible."
      },
      evidence: sourceEvidence,
      suggestedAgent: "Skybro/Petra option packet -> Operator",
      suggestedTool: "Guarded candidate packet",
      keepOriginalPathLabel: "Do not stage candidate"
    })
  ];
}

/** Full catalog — one exemplar card per recommendation type for UI reference. */
const catalogDeck: SquibbRecommendation[] = (
  Object.keys(RECOMMENDATION_KIND_LABELS) as RecommendationKind[]
).map((kind, index) => {
  const label = RECOMMENDATION_KIND_LABELS[kind];
  return makeRecommendation(kind, index + 1, {
    id: `catalog-${kind}`,
    title: label,
    headline: `Template surface for “${label.toLowerCase()}” recommendations.`,
    squibbNote: `Squibb: This is a ${label.toLowerCase()} card shape — not a live ranking.`,
    reasoning: {
      statedNeed: DEMO_STATED_NEED,
      rationale: [
        `Shows how Squibb would frame a ${label.toLowerCase()} move.`,
        "Reasoning stays evidence-led; Squibb widens the map without deciding.",
        "Replace with live context when Layer 0 translation ships."
      ]
    },
    confidence: {
      score: 40 + (index % 3) * 15,
      label: index % 3 === 0 ? "low" : index % 3 === 1 ? "medium" : "high",
      why: "Catalog template — confidence reflects exemplar only."
    },
    evidence: [
      { id: `${kind}-ev-1`, label: "Operator stated need on file", strength: "self_reported" },
      { id: `${kind}-ev-2`, label: "Crucible verification", strength: "missing" },
      { id: `${kind}-ev-3`, label: "Third-party proof", strength: "missing" }
    ],
    suggestedAgent: "Squibb (scout) → Operator",
    keepOriginalPathLabel: "Ignore this option"
  });
});

export function loadSquibbRecommendationSession(): SquibbRecommendationSession {
  return {
    version: "v1",
    statedNeed: DEMO_STATED_NEED,
    operatorContext: "Builder lane · first commercial bakery · preview operator profile",
    squibbIntro:
      "Squibb notices what is easy to miss. These are ranked options — not orders. You hold the decision.",
    ranked: rankedDeck,
    catalog: catalogDeck
  };
}

export function confidenceLabelFromScore(score: number): ConfidenceLabel {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  return "low";
}
````````

<!-- SOURCE_BLOCK_END lib/squibb/recommendations.ts -->

### Homepage copy excerpt: wrong ask -> real bottleneck -> reachable means -> proof -> move

Source path: `C:\Users\Ben Leak\github\Werkles\lib\copy.ts`

<!-- SOURCE_BLOCK_BEGIN lib/copy.ts -->

````````ts
    firewallKicker: "What we don't touch",
    firewallHeadline: "The money we do not move."
  },
  home: {
    valueFold: {
      what: {
        label: "What it is",
        body: "A discovery and verification floor for Main Street builders. You state the need. Werkles translates the bottleneck, surfaces reachable means, and shows itemized proof before you rely on anyone."
      },
      whyNeed: {
        label: "Why you need it",
        body: "Most stalls are misnamed problems — customers when it's equipment, a cofounder when it's a lender, capital when it's proof. Acting on the wrong need burns time. Acting without proof burns cash."
      },
      whyPay: {
        label: "Why Foundry Dues",
        body: "Dues open the workbench: need translation, Crucible checks, guarded intros, and published verification costs. You pay for runway — not a match guarantee, not hype, not algorithm fog."
      }
    },
    visualStory: {
      eyebrow: "One story — not a photo pile",
      headline: "Maria thought she needed customers.",
      lede: "Five beats. One person. The real missing piece was cheaper and closer than she assumed.",
      beats: [
        {
          id: "wrong-need",
          title: "Wrong need",
          thought: "I need more customers to justify a real bakery.",
          reveal: "She was pricing a dream before pricing the oven.",
          imageAlt: "Home baker at kitchen counter — unnamed need",
          imageCaption: "Same person, beat 1 — the misnamed problem"
        },
        {
          id: "squibb",
          title: "One question under it",
          thought: "Squibb: What would have to be true before customers matter?",
          reveal: "Equipment. A price. A seller she could verify.",
          imageAlt: "Baker pauses — the real constraint surfaces",
          imageCaption: "Beat 2 — underneath the ask"
        },
        {
          id: "money",
          title: "Money reveal",
          thought: "She assumed a bank would say no.",
          reveal: "Credit union desk. Loan sized to the oven, not a pitch deck.",
          imageAlt: "Community lender conversation — accessible finance",
          imageCaption: "Beat 3 — money that fits the step"
        },
        {
          id: "equipment",
          title: "Equipment reveal",
          thought: "She assumed $12k for a commercial oven.",
          reveal: "$4,200 used. Listed. Seller checkable.",
          imageAlt: "Used commercial oven — within reach",
          imageCaption: "Beat 4 — the number that changes the decision"
        },
        {
          id: "open",
          title: "Shop open",
          thought: "Customers came after the oven — not before.",
          reveal: "Momentum from the right first piece, not the loudest ask.",
          imageAlt: "Small bakery serving — same baker further along",
          imageCaption: "Beat 5 — momentum from the real first move"
        }
      ],
      closing: "Your story won't be Maria's. The pattern will be: wrong ask → real bottleneck → reachable means → proof → move.",
      cta: "Open the Foundry"
    },
    squibbBeat: {
      line: "Squibb: You said customers. The oven price is sitting in the overlooked column. Look or skip — your call."
    },
    anyone: {
      door: {
        eyebrow: "The Door",
        headline: "The door is usually closer than it looks.",
        body:
          "Most people do not need a bigger speech about possibility. They need the first real opening: a lender who understands the work, a used oven priced within reach, a shop bay that is actually available, a partner who can make the leap safer.",
        closing: "Werkles looks for those openings before it asks you to become someone else.",
        cta: "See how the path opens"
      },
      startWhereYouAre: {
        eyebrow: "Start where you are",
        headline: "Tell us what you came for.",
        body:
          "Say it in your own words. No profile. No compatibility score. No box to squeeze yourself into.",
        closing:
          "Squibb asks one better question: what might be underneath this? The answer stays yours. The system only helps surface better hypotheses."
      },
      discovery: {
        eyebrow: "Discovery",
        headline: "The real need is often one layer down.",
        lines: [
          "You may come looking for customers and discover the real constraint is equipment.",
          "You may come looking for a loan and discover the better first step is a partner.",
          "You may come looking for space and discover the right place has been nearby the whole time."
        ],
        closing: "Werkles is built to notice the path you might have walked past."
      },
      resources: {
        eyebrow: "Reachable means",
        people: {
          headline: "People you did not know could help.",
          body:
            "A mentor. A partner. A family member willing to back the next step. Someone with the missing skill at the right table. Werkles treats people as real resources, not abstract network effects."
        },
        money: {
````````

<!-- SOURCE_BLOCK_END lib/copy.ts -->

### AI_HANDOFF matching section and current heuristics

Source path: `C:\Users\Ben Leak\github\Werkles\AI_HANDOFF.md`

<!-- SOURCE_BLOCK_BEGIN AI_HANDOFF.md -->

````````md
   - They bring capital, systems, sales, hiring, admin, or finance.

4. Connector
   - Sales, admin, books, hiring, relationships, venues, customer access, and operational glue.

5. Spark
   - A lead, idea, property, customer opening, or strange chance that needs people and pressure.

## Current Matching Inputs

- Role / lane
- Industry / arena
- City and state
- Radius
- Money available
- Money needed
- Skills
- Goals
- Verification checks
- Skills offered and sought
- Industry tags
- Timeline to launch
- Primary goal

## Current Matching Heuristics

The prototype scores matches based on:

- complementary roles
- same industry
- same state
- user skills covering candidate needs
- candidate skills complementing user gaps
- shared goals
- money fit
- proof signal strength

This is intentionally explainable. Do not replace it with opaque AI matching yet. Improve the logic only if the explanation remains legible to users.

Production matching is scaffolded as `public.match_candidates_for_blueprint(p_blueprint_id, p_scout_user_id)`. It returns target IDs, scores, and explainable JSONB factors. It uses the Gemini-refined lane matrix, location gate, verified capital overlap, skills, industry tags, timeline, goal alignment, and endgame penalty. It never returns raw financial ranges.

## Compliance Frame

Werkles should stay framed as:

- partner discovery
- introductions
- trust and verification
- profile matching
- readiness and fit assessment

Werkles should not yet be framed as:

- a securities marketplace
- a crowdfunding portal
````````

<!-- SOURCE_BLOCK_END AI_HANDOFF.md -->

### SQL excerpt: current match_candidates_for_blueprint scorer

Source path: `C:\Users\Ben Leak\github\Werkles\supabase\migrations\00001_initial_schema.sql`

<!-- SOURCE_BLOCK_BEGIN supabase/migrations/00001_initial_schema.sql -->

````````sql
      blueprint.project_environment,
      public.distance_miles(
        blueprint.location_lat,
        blueprint.location_lng,
        candidate.location_lat,
        candidate.location_lng
      ) as distance_from_blueprint,
      exists (
        select 1
        from public.verified_badges_view badge
        where badge.user_id = candidate.id
          and badge.proof_category = 'Capital'::public.proof_category
      ) as has_verified_capital,
      coalesce(
        candidate_financials.capital_available_range && scout_financials.capital_sought_range,
        false
      ) as capital_ranges_overlap,
      coalesce(
        (
          select array_agg(distinct skill.value order by skill.value)
          from unnest(scout.skills_sought) as skill(value)
          where skill.value = any(candidate.skills_offered)
        ),
        '{}'::text[]
      ) as matching_skills,
      coalesce(
        (
          select array_agg(distinct tag.value order by tag.value)
          from unnest(scout.industry_tags) as tag(value)
          where tag.value = any(candidate.industry_tags)
        ),
        '{}'::text[]
      ) as matching_industries
    from blueprint
    cross join scout
    join public.profiles candidate on candidate.account_status = 'Active'
    left join public.user_financials candidate_financials on candidate_financials.user_id = candidate.id
    left join scout_financials on true
    where candidate.id <> p_scout_user_id
      and not public.is_blueprint_member(p_blueprint_id, candidate.id)
      and not public.is_blocked_between(p_scout_user_id, candidate.id)
  ),
  scored as (
    select
      candidate_inputs.*,
      case
        when project_environment = 'Digital' then 0
        when distance_from_blueprint is null then 0
        when distance_from_blueprint > 50
          and work_preference in ('Open to Travel'::public.work_preference, 'Willing to Relocate'::public.work_preference)
          then 0
        when distance_from_blueprint > 50 then -100
        else 20
      end as location_score,
      case
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Backer'] then 25
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Operator'] then 20
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Connector'] then 20
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Builder'] then 20
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Backer'] then 15
        when array[scout_lane::text, candidate_lane::text] @> array['Backer', 'Connector'] then 15
        when array[scout_lane::text, candidate_lane::text] @> array['Builder', 'Backer'] then 15
        when scout_lane = 'Builder'::public.user_lane and candidate_lane = 'Builder'::public.user_lane then 10
        when scout_lane = 'Backer'::public.user_lane and candidate_lane = 'Backer'::public.user_lane then 10
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Builder'] then 10
        when array[scout_lane::text, candidate_lane::text] @> array['Connector', 'Builder'] then 10
        when scout_lane = 'Operator'::public.user_lane and candidate_lane = 'Operator'::public.user_lane then 5
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Connector'] then 5
        when scout_lane = 'Spark'::public.user_lane and candidate_lane = 'Spark'::public.user_lane then 0
        when scout_lane = 'Connector'::public.user_lane and candidate_lane = 'Connector'::public.user_lane then 0
        else 0
      end as lane_score,
      case
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Backer']
          then 'An Operator and a Backer is the golden combo: proven execution meets verified capital.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Operator']
          then 'An idea meets the person who can get the licenses and run the schedule.'
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Connector']
          then 'Operator builds/delivers, Connector sells/manages the books.'
        when array[scout_lane::text, candidate_lane::text] @> array['Operator', 'Builder']
          then 'Operator manages the site, Builder provides the raw execution/crew.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Backer']
          then 'Idea meets money - solid, but you''ll want an Operator soon.'
        when array[scout_lane::text, candidate_lane::text] @> array['Backer', 'Connector']
          then 'Capital meets sales/audience. Great for franchises or CPG.'
        when array[scout_lane::text, candidate_lane::text] @> array['Builder', 'Backer']
          then 'Sweat meets Equity. Needs operational oversight eventually.'
        when scout_lane = 'Builder'::public.user_lane and candidate_lane = 'Builder'::public.user_lane
          then 'Crew Formation: Good for scaling labor, but missing business infrastructure.'
        when scout_lane = 'Backer'::public.user_lane and candidate_lane = 'Backer'::public.user_lane
          then 'Two wallets joining forces to fund a larger room.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Builder']
          then 'Idea meets labor. Plucky, but chaotic without an Operator.'
        when array[scout_lane::text, candidate_lane::text] @> array['Connector', 'Builder']
          then 'Sales meets product. Missing the operational middle layer.'
        when scout_lane = 'Operator'::public.user_lane and candidate_lane = 'Operator'::public.user_lane
          then 'Potential ''too many cooks'' situation, unless skills are vastly different.'
        when array[scout_lane::text, candidate_lane::text] @> array['Spark', 'Connector']
          then 'Idea meets sales. What are you selling if it''s not built yet?'
        when scout_lane = 'Spark'::public.user_lane and candidate_lane = 'Spark'::public.user_lane
          then 'Two idea people, no execution. The classic coffee shop trap.'
        when scout_lane = 'Connector'::public.user_lane and candidate_lane = 'Connector'::public.user_lane
          then 'Two salespeople, no product.'
        else 'No special lane complementarity rule fired.'
      end as lane_reason,
      case when has_verified_capital and capital_ranges_overlap then 20 else 0 end as capital_score,
      least(cardinality(matching_skills) * 10, 20) as skill_score,
      least(cardinality(matching_industries) * 5, 15) as industry_score,
      case
        when scout_timeline_to_launch is not null
          and timeline_to_launch is not null
          and scout_timeline_to_launch = timeline_to_launch
          then 5
        else 0
      end as timeline_score,
      case
        when scout_primary_goal is not null
          and primary_goal is not null
          and scout_primary_goal = primary_goal
          then 5
        else 0
      end as goal_score,
      case
        when (
          scout_primary_goal = 'Venture Scale/Exit'
          and primary_goal = 'Generational Family Business'
        ) or (
          scout_primary_goal = 'Generational Family Business'
          and primary_goal = 'Venture Scale/Exit'
        )
          then -15
        else 0
      end as endgame_penalty
    from candidate_inputs
  )
  select
    id as target_user_id,
    (
      location_score +
      lane_score +
      capital_score +
      skill_score +
      industry_score +
      timeline_score +
      goal_score +
      endgame_penalty
    )::integer as score,
    jsonb_build_object(
      'location_fit',
        case
          when project_environment = 'Digital' then '0 (Digital blueprint: distance ignored)'
          when distance_from_blueprint is null then '0 (Location unavailable for one side)'
          when distance_from_blueprint > 50
            and work_preference in ('Open to Travel'::public.work_preference, 'Willing to Relocate'::public.work_preference)
            then '0 (Outside 50 miles, but open to travel or relocate)'
          when distance_from_blueprint > 50 then '-100 (Outside 50 miles and not travel-ready)'
          else '+20 (Within 50 miles)'
        end,
      'lane_fit',
        case when lane_score > 0 then '+' else '' end || lane_score::text || ' (' || lane_reason || ')',
      'capital_overlap',
        case
          when capital_score > 0 then '+20 (Verified capital aligns with your needs)'
          when has_verified_capital then '0 (Candidate has a Capital badge, but no requested range overlap)'
          else '0 (No unexpired Capital badge on candidate)'
        end,
      'skill_match',
        case
          when skill_score > 0 then '+' || skill_score::text || ' (They bring ' || array_to_string(matching_skills, ', ') || ', which is exactly what you are looking for)'
          else '0 (No direct skill lock-and-key yet)'
        end,
      'industry_match',
        case
          when industry_score > 0 then '+' || industry_score::text || ' (Both operating in ' || array_to_string(matching_industries, ', ') || ')'
          else '0 (No shared industry tags yet)'
        end,
      'timeline_match',
        case
          when timeline_score > 0 then '+5 (Launch timeline matches)'
          else '0 (Launch timeline is not aligned or is unknown)'
        end,
      'goal_match',
        case
          when goal_score > 0 then '+5 (Primary goal matches)'
          else '0 (Primary goal is not aligned or is unknown)'
        end,
      'endgame_dealbreaker',
        case
          when endgame_penalty < 0 then '-15 (Venture Scale/Exit and Generational Family Business are conflicting endgames)'
          else '0 (No endgame dealbreaker)'
        end
    ) as factors
  from scored
  order by 2 desc, 1;
$$;

grant execute on function public.match_candidates_for_blueprint(uuid, uuid) to authenticated;

create table public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  reported_user_id uuid not null references public.profiles(id) on delete cascade,
  reason public.flag_reason not null,
  details text,
  status text not null default 'Pending' check (status in ('Pending', 'Investigating', 'Resolved')),
  created_at timestamptz not null default now(),
  constraint user_reports_no_self_report check (reporter_id <> reported_user_id)
);

alter table public.user_reports enable row level security;
````````

<!-- SOURCE_BLOCK_END supabase/migrations/00001_initial_schema.sql -->

### IP register excerpt: matching doctrine names and naming drift

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\ip\IP_REGISTER_v1.md`

<!-- SOURCE_BLOCK_BEGIN foreman/ip/IP_REGISTER_v1.md -->

````````md
| **Speaker** | Constitutional office / reasoning UI | 2026-06-07 (charter ratified) | active | Causal memory office; UI at `:4317/#gd-speaker`; separate from GD routing | `foreman/speaker/SPEAKER_CHARTER.md`, `foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md` |
| **Squibb** | Mascot / guide persona | APPROX 2026-05-28 (approved) | active | Single canonical brass workshop owl; Crucible foreman + Bellows host; guide-scale not protagonist | `foreman/MASCOT_RULES.md`, `lib/copy.ts` (`squibb`) |
| **Foreman** | Infra control server | APPROX 2026-05-28 | active | Local control server `:4317`, cockpit sync, dispatch prep, Ghost Forge operator lane; Codex role alias | `foreman/platform-instructions/CODEX_FOREMAN_INSTRUCTIONS.md`, `scripts/foreman/foreman-control-server.mjs`, `foreman/AI_COUSINS_PROTOCOL.md` |
| **Bellows** | Public learning product surface | APPROX 2026-05-26 (site map) | experimental | Anti-guru lessons, SOPs, templates at `/bellows`; Squibb hosts; shell not full build | `foreman/SITE_MAP.md`, `app/bellows/` |
| **Crucible** | Member verification center | APPROX 2025–2026 (app scaffold) | active | Verification / proof workflow at `/dashboard/crucible`; preview-blocked in APP_INFRA | `app/dashboard/crucible/`, `lib/crucible.ts`, `foreman/MASCOT_RULES.md` |
| **Foundry Dues** | Membership product name | APPROX 2026 (monetization v0.2) | active | Legal label: membership subscription; nav label "Dues" | `company/WERKLES_MONETIZATION.md`, `lib/site-nav.ts`, `/membership` |
| **Human Gate** | Governance doctrine term | APPROX 2026-05 (cockpit era) | active | Authority/judgment/money/credentials/production moves requiring Ben; cockpit anchor | `foreman/HUMAN_GATES.md`, `company/WERKLES_CONSTITUTION.md` |
| **Leverage Matching** | Matching doctrine (working name) | UNKNOWN in repo | experimental | **Naming drift:** repo canon uses **Match Stacking**, **Need Translation**, **Not-Matching Matching** — not exact string "Leverage Matching" | `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`, `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md` |
| **Leverage Diagnosis** | Operator doctrine term | UNKNOWN in repo | experimental | Record-only seed term for diagnosing highest-leverage constraint or next move; no legal conclusion | `foreman/ip/IP_REGISTER_v1.md` |
| **Leverage Inventory** | Operator doctrine term | UNKNOWN in repo | experimental | Record-only seed term for inventorying available leverage assets, constraints, and moves; no legal conclusion | `foreman/ip/IP_REGISTER_v1.md` |
| **Leverage Hypothesis Testing** | Operator doctrine term | UNKNOWN in repo | experimental | Record-only seed term for testing leverage assumptions before committing effort; no legal conclusion | `foreman/ip/IP_REGISTER_v1.md` |
| **Ghost Forge** | Internal image worker | APPROX 2026-05-27 (approved lanes) | active | Cloud image batch worker; Render service `werkles-ghost-forge1`; human-gated spend | `ghost-forge-worker/README.md`, `foreman/LANES.md`, `foreman/gates/APPROVAL_LOG.md` |
| **Ender** | AI cousin seat (Claude) | APPROX 2026-05-30 (role sync packets) | active | Art direction, experience, emotional arc; internal seat name | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Petra** | AI cousin seat (ChatGPT Comptroller) | APPROX 2026-05-30 | active | Scope, GO/NO-GO, gates, red team | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Skybro** | AI cousin seat (Gemini) | APPROX 2026-05-30 | active | Strategy, philosophy, positioning, narrative arc | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/platform-instructions/GEMINI_SKYBRO_GEM_INSTRUCTIONS.md` |
| **Bean** | AI cousin seat (DeepSeek) | APPROX 2026-05-30 | active | Hostile audit, trust/compliance surfaces | `foreman/AI_COUSINS_PROTOCOL.md` |
| **Thufir** | AI cousin alias (Perplexity / Computer) | APPROX 2026-06-12 (SoleDash crew labels) | active | **Alias drift:** registry lists **Computer**; SoleDash UI uses **Thufir (Computer / Perplexity)** | `foreman/speaker/AEYE_ROLE_REGISTRY.md`, `lib/soledash/cockpit-data.ts` |
| **Maker** | AI cousin seat (Cursor) | APPROX 2026-05-30 | active | Bounded UI wiring, local preview, copy implementation | `foreman/AI_COUSINS_PROTOCOL.md`, `AGENTS.md` |
| **Dink** | Builder / infra cousin alias | APPROX 2026-06-08 (Speaker entries) | active | Scripts, plumbing, local hands; also **Bulldozer**, **Codex** in registry | `foreman/speaker/entries/DRAFT_20260608-tool-mortality.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |

### Additional product names (repo discoveries)

| Name | Category | First Known Use | Status | Notes | Source |
|------|----------|-----------------|--------|-------|--------|
| **GD Intent Router** | Internal routing system | 2026-06-06 (proven test run) | active | Mission-class registry + CLI; internal name for GimpDash backend | `foreman/gd-intent-router/GD_INTENT_ROUTER_V1.md`, `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |
| **GD** | Shorthand for intent router | 2026-06-06 | active | Not user-facing brand; "Governor and router" | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |
| **Education Forge** | Internal curriculum worker | APPROX 2026-05-26 | active | Text-only curriculum scaffold; **not** Bellows, not a public route | `foreman/SITE_MAP.md`, `education-forge/`, `foreman/MASCOT_RULES.md` |
| **Crew Dispatch Console** | Dispatch UI v2 | APPROX 2026-05-30 | active | Packet prep; stops before Send | `foreman/crew-dispatch-console/DISPATCH_CONSOLE_v2.md` |
| **Aeye Crew Bay** | Browser dispatch surface | APPROX 2026-05-31 | active | Edge tabs for cousin circuit | `foreman/crew-dispatch/README.md`, `open-aeye-crew.cmd` |
| **Match Deck** | Member app feature | APPROX 2025–2026 | active | Dashboard matching UI | `app/dashboard/`, `README.md` |
| **Blueprint** | Product pattern | APPROX 2025–2026 | active | Multi-member venture room pattern; center of product thesis | `company/WERKLES_PRODUCT_THESIS.md` |
| **Spark** | Lane + narrative act | APPROX 2026-06-06 (narrative arc) | active | Lane name + Act 1 narrative beat; maps Worker concept in match doctrine | `lib/copy.ts` (`lanes.spark`), `foreman/IMAGERY_DIRECTION.md` |
| **Sherlock** | AI cousin seat | APPROX 2026-06-06 (dossier run) | active | Investigation, synthesis, artifact recovery | `foreman/speaker/AEYE_ROLE_REGISTRY.md`, `foreman/gd-intent-router/runs/GD_RUN_BEN_ENTREPRENEURSHIP_DOSSIER_FOR_SHERLOCK_*` |
| **Computer** | AI cousin seat (Perplexity) | APPROX 2026-05-30 | active | Doctrine research; see **Thufir** alias conflict | `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Codex** | Foreman role alias | APPROX 2026-05-28 | active | Cockpit sync; overlaps **Foreman** naming | `foreman/AI_COUSINS_PROTOCOL.md`, `foreman/speaker/AEYE_ROLE_REGISTRY.md` |
| **Relay Courier** | Delivery plumbing | APPROX 2026-05-31 | active | Tab focus + paste prep; blind until Thread Registry | `foreman/speaker/AEYE_ROLE_REGISTRY.md`, `foreman/crew-dispatch/CREW_RELAY_AUTOMATION.md` |
| **Thread Registry** | Identity plumbing | APPROX 2026-06-08 (Speaker drafts) | experimental | Canonical thread identity for packets | `foreman/speaker/CAUSAL_LEDGER.md` |
| **Operator Dashboard** | Legacy cockpit markdown | 2026-05-31 | retired | Superseded in intent by **SoleDash** for daily workflow; markdown may remain | `foreman/OPERATOR_DASHBOARD.md`, `foreman/SOLEDASH_v1.md` |
| **BLDer** | Legacy machine name | APPROX 2026-05-31 (forensics) | retired | Earlier laptop build surface; not same as Betsy | `foreman/MACHINE_TOPOLOGY.md`, `foreman/reviews/LOCAL_BLD_OPERATOR_GIMP_DASH_FORENSICS.md` |
| **Squibb Recommendation Surface** | UI concept | 2026-06-13 | experimental | Bellows sub-route `/bellows/recommendations`; UI only, no engine | `lib/squibb/recommendations.ts`, `app/bellows/recommendations/` |

---

## Systems & Frameworks

| Name | Description | Owner Layer | Status | Source |
|------|-------------|-------------|--------|--------|
| **LOCAL HANDS READBACK** | Mandatory session-start readback: machine, repo, branch, commit, tree, localhost before repo/runtime mutation | Crew / constitution | active | `foreman/EXECUTION_CONTEXT_RULES.md`, `company/WERKLES_CONSTITUTION.md`, `AGENTS.md` |
| **Human Gate** | Cockpit rule anchor classifying Ben-only authority vs non-gate technical proofs | Governance | active | `foreman/HUMAN_GATES.md` |
| **Leverage Matching** | *(Working name — see naming drift)* Formation / need-translation architecture before people-matching | Product doctrine | experimental | See **Match Stacking & Need Translation** — `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` |
| **Speaker Recommendation Constitution** | *(Seed name — not found as exact repo artifact)* Intended doctrine for recommendation governance | Speaker / product | experimental | **No file with this exact title.** Closest: `foreman/speaker/GD_SPEAKER_CONSTITUTIONAL_INTEGRATION_V0.md`, Squibb Recommendation Surface v1 UI |
| **Operator Cockpit** | Daily operator workflow surface doctrine (machine, next steps, gates, crew) | Foreman / SoleDash | active | `foreman/SOLEDASH_v1.md`, `foreman/FOREMAN_RULES.md` (Operator Cockpit Mode), `foreman/finance/FINANCE_COCKPIT_REQUIREMENTS.md` |
| **Crew Dispatch Protocol** | Packet prep, outbox/inbox, human Send gates, cousin routing habits | Foreman / dispatch | active | `foreman/crew-dispatch-console/DISPATCH_CONSOLE_v2.md`, `foreman/crew-dispatch/CREW_RELAY_AUTOMATION.md`, `foreman/handoffs/outbox/README.md` |
| **AI Cousins Protocol** | Role boundaries, source hierarchy, execution context for all cousins | Governance | active | `foreman/AI_COUSINS_PROTOCOL.md` |
| **Machine Topology Registry** | Physical machine ↔ hostname ↔ repo path ↔ forge role binding | Foreman / ops | active | `foreman/MACHINE_TOPOLOGY.md` |

### Additional systems (repo discoveries)

| Name | Description | Owner Layer | Status | Source |
|------|-------------|-------------|--------|--------|
| **Match Stacking & Need Translation** | Layer 0 need translation + five-layer match stack doctrine | Product | active (DRAFT) | `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` |
| **GD Intent Router workflow** | intent → mission class → role routing → receipts → synthesis → Operator Brief | Foreman / GD | active (DRAFT) | `foreman/gd-intent-router/GD_INTENT_ROUTER_V1.md` |
| **Human Consumable Output Rule** | Operator Brief 5-section definition of done for GD runs | Foreman / GD | active | `foreman/gd-intent-router/HUMAN_CONSUMABLE_OUTPUT_RULE_V1.md` |
| **Execution Context Rules** | LOCAL_SALLY_WINDOWS vs CURSOR_CLOUD_CONTAINER evidence locality | Crew | active | `foreman/EXECUTION_CONTEXT_RULES.md` |
| **Iron Firewall** | Monetization boundary — sell forge/tools, not user-to-user deals | Company law | active | `company/WERKLES_MONETIZATION.md` |
| **Multi-Member Blueprint Pattern** | Venture-centered room, not hero-user profile | Product | active | `company/WERKLES_PRODUCT_THESIS.md` |
| **Workshop Facets** | Route/panel atmosphere tokens within one building | Design system | active | `lib/workshop-facets.ts`, `foreman/SITE_STYLE_APPROVED_v0.6.md` |
| **Four-act narrative journey** | Spark → Space → Forge → Foundry public story spine | Marketing / UX | active | `foreman/IMAGERY_DIRECTION.md`, `lib/narrative-arc.ts` |
| **Gate Review UI Protocol** | UX classification for human vs non-gate stops | Governance | active | `foreman/HUMAN_GATES.md` |
| **SPEAKER_REVIEW_MISSING** | Mark builds that changed routing/copy without Speaker ledger check | Speaker | active | `foreman/speaker/SPEAKER_DOCTRINE.md` |

---

## Product Concepts

| Concept | One-line description | Status | Source |
|---------|---------------------|--------|--------|
| **Find the highest-leverage next move** | Operator workflow goal — rank next actions by leverage, not activity | active | `foreman/SOLEDASH_v1.md` (next steps), `lib/soledash/workflow.ts`, hero copy in `lib/copy.ts` |
| **Human Adaptation Thesis** | System must adapt to human context compression, thread drift, and Operator burden | experimental (DRAFT) | `foreman/speaker/entries/DRAFT_20260607-human-adaptation-thesis.md` |
| **Operator Network** | *(Seed — exact phrase not found)* Network of serious builders/operators with verification | experimental | Related: product thesis "private partner-discovery… platform" — `company/WERKLES_PRODUCT_THESIS.md` |
| **Post-match SaaS** | *(Seed — exact phrase not found)* Software revenue after formation/match, not transaction fees | experimental | Related: monetization picks-and-shovels — `company/WERKLES_MONETIZATION.md` |
| **Verification Receipts** | Store scoped third-party verification outcomes, not raw sensitive documents | active | `docs/architecture.md`, `README.md`, `AI_HANDOFF.md` |
| **Concierge Matching** | *(Seed — exact phrase not found)* High-touch guided matching / operator-assisted intros | experimental | No canonical repo file; related intro request flow — `app/dashboard/intros/` |
| **Any Person Can Become Anything** | Narrative arc: becoming over static identity; wrong guess → real bottleneck → proof → move | active | `foreman/IMAGERY_DIRECTION.md`, `FROM_MAKER_SPEAKER_UX_REVIEW_2026-06-10.md`, Ender imagery packets |
| **Mythic Capitalism** | Brand voice: industrial warmth, anti-gatekeeper, dream logic with steel under it | active | `company/WERKLES_CONSTITUTION.md`, `company/WERKLES_BRAND_VOICE.md`, `lib/copy.ts` |

### Additional concepts (repo discoveries)

| Concept | One-line description | Status | Source |
|---------|---------------------|--------|--------|
| **Not-Matching Matching** | Need translation before people; Werkles is formation not Tinder for founders | active (DRAFT) | `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md` |
| **Layer 0 Need Translation** | Translate stated need into nearer bottleneck before match stack | active (DRAFT) | `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` |
| **Squibb scout behavior** | Points to overlooked option; asks once; does not decide or chatbot | active | `lib/copy.ts` (`squibb.scout`), `foreman/IMAGERY_DIRECTION.md` |
| **Causal memory** | Speaker preserves why/cost/lesson, not just events | active | `foreman/speaker/SPEAKER_CHARTER.md` |
| **Compression loss** | Insight lost when threads summarize without gate/cause preservation | active | `foreman/speaker/SPEAKER_DOCTRINE.md` |
| **Foundry Router** | Internal-only candidate name for GD public surface | experimental | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |
| **Company Builder Console** | Candidate user-facing name family for GD UI | experimental | `foreman/gd-intent-router/GD_PRODUCT_IP_CAPTURE_V1.md` |

---
````````

<!-- SOURCE_BLOCK_END foreman/ip/IP_REGISTER_v1.md -->

### Swanson/Crawleye route: Crawler pearls state

Source path: `C:\Users\Ben Leak\github\Werkles\foreman\soledash\CRAWLER_PEARLS.json`

<!-- SOURCE_BLOCK_BEGIN foreman/soledash/CRAWLER_PEARLS.json -->

````````json
{
  "schema_version": "CRAWLER_PEARLS.v0.1",
  "updated_at": "2026-06-28T03:48:19.265Z",
  "source": "foreman/nuggets_of_wisdom_top_25.json",
  "rule": "Crawler pearls do not enter Working until promoted.",
  "states": [
    "New",
    "Reviewed",
    "Promoted to Task",
    "Archived",
    "Killed"
  ],
  "pearls": []
}
````````

<!-- SOURCE_BLOCK_END foreman/soledash/CRAWLER_PEARLS.json -->

### Swanson/Crawleye route: receipt crawler code excerpt

Source path: `C:\Users\Ben Leak\github\Werkles\tinkarden\nervous_system\crawler.js`

<!-- SOURCE_BLOCK_BEGIN tinkarden/nervous_system/crawler.js -->

````````js
#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const TINKARDEN_ROOT = path.resolve(__dirname, "..");
const DEFAULT_DB = path.join(TINKARDEN_ROOT, "server", "circulation.db");
const DEFAULT_QUEUE = path.join(TINKARDEN_ROOT, "intake", "speaker_queue");
const DEFAULT_INTERVAL_MS = Number(process.env.RECEIPT_CRAWLER_INTERVAL_MS || 60_000);
const DEFAULT_LIMIT = Number(process.env.RECEIPT_CRAWLER_LIMIT || 25);

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex").toUpperCase();
}

function slug(value) {
  return String(value || "UNKNOWN")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "UNKNOWN";
}

function parseArgs(argv) {
  const options = {
    db: process.env.CIRCULATION_DB || DEFAULT_DB,
    queue: process.env.SPEAKER_QUEUE_DIR || DEFAULT_QUEUE,
    intervalMs: DEFAULT_INTERVAL_MS,
    limit: DEFAULT_LIMIT,
    once: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--db") options.db = argv[++i];
    else if (arg.startsWith("--db=")) options.db = arg.slice("--db=".length);
    else if (arg === "--queue") options.queue = argv[++i];
    else if (arg.startsWith("--queue=")) options.queue = arg.slice("--queue=".length);
    else if (arg === "--interval-ms") options.intervalMs = Number(argv[++i]);
    else if (arg.startsWith("--interval-ms=")) options.intervalMs = Number(arg.slice("--interval-ms=".length));
    else if (arg === "--limit") options.limit = Number(argv[++i]);
    else if (arg.startsWith("--limit=")) options.limit = Number(arg.slice("--limit=".length));
    else if (arg === "--once") options.once = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return options;
}

function markdownFor(row) {
  const body = row.receipt || row.payload || JSON.stringify(row, null, 2);
  return `---
receipt_id: ${row.receipt_id || row.id || "UNKNOWN"}
packet_id: ${row.packet_id || "UNKNOWN"}
mission: ${row.mission || "UNKNOWN"}
producer: ${row.producer || row.owner || "UNKNOWN"}
source: C:\\tinkarden\\server\\circulation.db
status: SPEAKER_QUEUE_CANDIDATE
created_at: ${new Date().toISOString()}
---

# Receipt Pickup

${body}
`;
}

function crawlOnce(options) {
  if (!fs.existsSync(options.db)) {
    return {
      event: "RECEIPT_CRAWLER_BLOCKED",
      status: "BLOCKER",
      missing_db: options.db,
      moved: 0,
    };
  }

  fs.mkdirSync(options.queue, { recursive: true });
  const db = new DatabaseSync(options.db);
  try {
    const rows = db.prepare(`
      SELECT rowid AS _rowid, *
      FROM LiveReceipt
      WHERE UPPER(CAST(status AS TEXT)) = 'SUCCESS'
        AND (
          ASSIMILATED IS NULL
          OR ASSIMILATED = 0
          OR UPPER(CAST(ASSIMILATED AS TEXT)) IN ('FALSE', 'NO', '')
        )
      ORDER BY COALESCE(updated_at, created_at, id, _rowid)
      LIMIT ?
    `).all(options.limit);

    const moved = [];
    for (const row of rows) {
      const md = markdownFor(row);
      const name = `${new Date().toISOString().replace(/[:.]/g, "-")}_${slug(row.receipt_id || row.id || row._rowid)}.md`;
      const outputPath = path.join(options.queue, name);
      fs.writeFileSync(outputPath, md, "utf8");
      db.prepare("UPDATE LiveReceipt SET ASSIMILATED = 1, updated_at = ? WHERE rowid = ?")
        .run(new Date().toISOString(), row._rowid);
      moved.push({
        receipt_id: row.receipt_id || row.id || String(row._rowid),
        path: outputPath,
        hash: sha256(md),
      });
    }

    return {
      event: "RECEIPT_CRAWLER_SCAN",
      status: "ARTIFACT",
      db: options.db,
      queue: options.queue,
      moved: moved.length,
      receipts: moved,
    };
  } finally {
    db.close();
  }
}

function log(event) {
  process.stdout.write(`${JSON.stringify({ ...event, logged_at: new Date().toISOString() })}\n`);
}

const options = parseArgs(process.argv.slice(2));
log(crawlOnce(options));
if (!options.once) {
  setInterval(() => {
    try {
      log(crawlOnce(options));
    } catch (error) {
      log({ event: "RECEIPT_CRAWLER_ERROR", status: "BLOCKER", error: error.message });
    }
  }, options.intervalMs);
}
````````

<!-- SOURCE_BLOCK_END tinkarden/nervous_system/crawler.js -->


## Working Conclusion For The Next Aeye

Do not start by asking, "who matches this user?" Start by preserving the user's words, then translating the possible constraint without stealing authority from them. A good output says what was asked for, what may be underneath it, what evidence supports that read, what would prove it wrong, what path scored highest or emerged strongest, why alternatives were not first, and the smallest reversible next action.

The current architecture has three valid layers that must stay separate:

1. Doctrine and causal memory: Speaker, Layer 0, Need Translation, leverage inventory.
2. Test/review loop: Wizard-of-Oz, first-20-user process, recommendation card/view, shadow review.
3. Implementation skeleton: deterministic signal extraction, path scoring, shadow receipts, Speaker facts, Squibb voice.

If a future Aeye merges those layers into one confident product claim, it is compressing the meaning out of the system. If it keeps them separate, Werkles can lose cheaply, learn visibly, and only harden the pieces reality has paid for.
