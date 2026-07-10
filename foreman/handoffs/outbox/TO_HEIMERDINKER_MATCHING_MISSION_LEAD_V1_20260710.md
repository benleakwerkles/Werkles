# TO HEIMERDINKER — Matching / Not-Matching Mission Lead V1

| Field | Value |
|-------|-------|
| **Packet** | `TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710` |
| **Dispatched** | 2026-07-10 |
| **From** | Lady Jessica (Maker@Betsy) |
| **To** | **Heimerdinker** = **Direwolf Dink@Betsy** (same seat, two modes) |
| **Lane** | Werkles.com / G only — **not Harvey** |
| **Mission class** | MISSION_LEAD + FOREMAN + ALGORITHM_SPEC + MECHANICAL_PROOF |
| **Build deputy** | Lady Jessica (Maker@Betsy) — stays on board, tagged by you |
| **Sovereign** | Ben (Operator) — architecture ratifier + human gates |
| **Supersedes** | Partially absorbs `TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710` (shadow QA = Phase 1 of this packet) |

---

## Table of contents

1. [Identity and nicknames](#1-identity-and-nicknames)
2. [LOCAL HANDS READBACK (mandatory first)](#2-local-hands-readback-mandatory-first)
3. [Executive summary](#3-executive-summary)
4. [Who owns what](#4-who-owns-what)
5. [Product thesis (do not collapse)](#5-product-thesis-do-not-collapse)
6. [Five-layer doctrine stack](#6-five-layer-doctrine-stack)
7. [What Maker built (bootstrap inventory)](#7-what-maker-built-bootstrap-inventory)
8. [Pipeline architecture](#8-pipeline-architecture)
9. [Module reference (lib/matching)](#9-module-reference-libmatching)
10. [Wired surfaces](#10-wired-surfaces)
11. [Feature flags and gates](#11-feature-flags-and-gates)
12. [Git, deploy, and environment](#12-git-deploy-and-environment)
13. [Phase plan (your mission)](#13-phase-plan-your-mission)
14. [Phase 1 — Shadow QA (immediate)](#14-phase-1--shadow-qa-immediate)
15. [Phase 2 — Algorithm catalog v1 (Heimerdinker mode)](#15-phase-2--algorithm-catalog-v1-heimerdinker-mode)
16. [Phase 3 — Tag Maker in (build deputy packets)](#16-phase-3--tag-maker-in-build-deputy-packets)
17. [Phase 4 — Public flip prep](#17-phase-4--public-flip-prep)
18. [Phase 5 — Deferred (do not start)](#18-phase-5--deferred-do-not-start)
19. [How to tag Maker properly](#19-how-to-tag-maker-properly)
20. [Smoke mule and golden scenarios](#20-smoke-mule-and-golden-scenarios)
21. [Known gaps and technical debt](#21-known-gaps-and-technical-debt)
22. [Anti-patterns and Speaker warnings](#22-anti-patterns-and-speaker-warnings)
23. [Parallel work (Ben + Maker, do not collide)](#23-parallel-work-ben--maker-do-not-collide)
24. [Foreman cockpit updates you own](#24-foreman-cockpit-updates-you-own)
25. [Receipt and communication protocol](#25-receipt-and-communication-protocol)
26. [Appendix A — Path catalog (code v0)](#appendix-a--path-catalog-code-v0)
27. [Appendix B — Not-match rules (code v0)](#appendix-b--not-match-rules-code-v0)
28. [Appendix C — Layer 0 translation rules (code v0)](#appendix-c--layer-0-translation-rules-code-v0)
29. [Appendix D — Signal keyword patterns](#appendix-d--signal-keyword-patterns)
30. [Appendix E — Type contracts](#appendix-e--type-contracts)
31. [Appendix F — File index](#appendix-f--file-index)
32. [Appendix G — Doctrine and inbox reading order](#appendix-g--doctrine-and-inbox-reading-order)

---

## 1. Identity and nicknames

Ben clarified 2026-07-10:

| Name | Same seat? | Mode |
|------|------------|------|
| **Direwolf Dink** | Yes | Mechanical proof, deploy, smoke, receipts, Foreman cockpit |
| **Heimerdinker** | Yes | Doctrine compile, algorithm tables, dossier archaeology, path catalog |
| **Lady Jessica / Maker** | No — different seat | Code integration, UI wiring, tuning from your receipts |

You are **mission lead** on matching/not-matching for Werkles.com. Maker built the bootstrap engine and hands off to you. Maker remains **build deputy** — you tag her in with spec + false-positive lists; she does not invent doctrine in code.

**Harvey / Nerdkle is out of scope.** `foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md` is active.

---

## 2. LOCAL HANDS READBACK (mandatory first)

Per `foreman/EXECUTION_CONTEXT_RULES.md` — deliver before edits, deploy, push, or package install:

```text
LOCAL HANDS READBACK
Machine: <hostname>  (expected: DESKTOP-KTBH0LA / Betsy)
Repo: C:\Users\Ben Leak\github\Werkles
Branch: maker/site-g-20260703
Commit: <git rev-parse --short HEAD>
Working tree: <clean | dirty summary>
Terminal: available
Localhost: <running | not running>
Port: <3000 | none>
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
```

**Canonical repo:** `C:\Users\Ben Leak\github\Werkles` — not Desktop clone.

---

## 3. Executive summary

Werkles matching is **not-matching matching**: need translation before people, formation before fit scores, shadow before public claims.

**Maker admirably left off with:**

- A working **shadow pipeline** on every discovery and bellows intake
- Layer 0 preflight, not-match guards, path scoring, Speaker facts, 7-section recommendation card, Squibb voice
- Operator review UI at `/operator/matching/shadow`
- Bellows recommendations wired to latest shadow run
- Smoke mule for three discovery scenarios
- Receipt: `foreman/receipts/WERKLES_MATCHING_NOT_MATCHING_ENGINE_20260709.md`

**What is honest about maturity:**

| True | Not true yet |
|------|----------------|
| Right layered architecture | Elegant unified algorithm |
| Explainable heuristic scorer | Learned ranker |
| Path-type recommendations | People roster matching |
| Shadow receipts for operator QA | Public autonomous claims |
| Doctrine-aligned not-match rules | Crucible-weighted proof multipliers |

**Your job:** Run the lane. Prove shadow quality. Drop algorithm catalog v1 into inbox. Tag Maker to encode your tables. Keep Foreman cockpit honest. Escalate gates to Ben — never approve human gates for him.

---

## 4. Who owns what

```
Ben (Operator)
 └─ sovereign architect ratifier · human gates only

Heimerdinker / Dink (YOU) — MISSION LEAD
 ├─ Foreman: handoffs, NEXT_ACTION, lane status, gate queue
 ├─ Heimerdinker: path catalog, not-match tables, golden examples → artifacts/matching-inbox/
 ├─ Dink: deploy confirm, shadow smoke, operator review, QA receipt
 └─ Dispatch: TO_MAKER_* packets when spec is ready

Lady Jessica / Maker — BUILD DEPUTY (stays on board)
 ├─ lib/matching/* implementation from your spec
 ├─ Public recommendation card UI polish
 ├─ Wire discovery → recommendations when you say go
 └─ Does NOT own mission lead or doctrine invention

Ender — LATE JOIN
 └─ Card surface elegance, Squibb warmth, imagery — after shadow QA passes

Petra — GATE MOMENTS
 └─ GO/NO-GO on public flip, scope kill, charter alignment

GD — ROUTER ONLY
 └─ Routes packets; does not absorb Speaker or lead the build

Speaker — MEMORY / WARNINGS
 └─ `DRAFT_20260608-not-matching-matching` interrupts "AI matching" collapse
```

---

## 5. Product thesis (do not collapse)

From `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` and Speaker entry `DRAFT_20260608-not-matching-matching`:

**Werkles does not answer:** "Who matches this person?"

**Werkles answers:** "What structure helps this person move forward?"

Sometimes structure is:

- a person
- capital
- proof
- training
- a smaller reversible step
- the discovery that the stated need is wrong

**Output rule:** Recommendations explain the **next path**, not "you matched with Sarah."

**Marketing trap:** Calling this "AI matchmaking" invites Tinder/LinkedIn comparison and bypasses Layer 0.

---

## 6. Five-layer doctrine stack

| Layer | Name | Status in code |
|-------|------|----------------|
| **0** | Need translation (preflight) | **Built** — `layer0.ts` rule table |
| **1** | Path eligibility | **Partial** — keyword signals + path rules |
| **2** | Path scoring | **Partial** — heuristic weights in `score-paths.ts` |
| **3** | Recommendation delivery | **Built** — Speaker facts + 7-section card |
| **4** | People / candidate matching | **Not built** — intentional defer |
| **5** | Cohort builder | **Not built** — waits for paying-stranger signal |

**Invariant:** Layer 0 always runs before path ranking. Not-match runs after Layer 0, before scoring.

---

## 7. What Maker built (bootstrap inventory)

### Engine modules (`lib/matching/`)

| File | Role |
|------|------|
| `feature-flags.ts` | Shadow ON, public OFF, LLM OFF |
| `signals.ts` | Keyword extraction + leverage diagnosis from intake |
| `leverage.ts` | Five leverage categories (intrinsic, relational, amplification, structural, optionality) |
| `layer0.ts` | Need translation preflight — rule table, always first |
| `not-match.ts` | Disqualifiers, pause, proof-only, Rules 6–7 |
| `score-paths.ts` | Path scoring after Layer 0 + not-match |
| `deliver.ts` | Speaker facts + 7-section recommendation card + Squibb voice |
| `shadow-pipeline.ts` | Orchestration: intake → full run → persist |
| `shadow-storage.ts` | Append to `data/matching/shadow-runs.jsonl` |
| `shadow-to-recommendations.ts` | Maps shadow run → Squibb recommendation session |
| `types.ts` | All contracts |

### App surfaces

| Path | Role |
|------|------|
| `app/api/discovery/intake/route.ts` | POST intake → `runShadowMatchingFromDiscovery` |
| `app/api/bellows/intake/route.ts` | POST concierge → `runShadowMatchingFromConcierge` |
| `app/operator/matching/shadow/page.tsx` | Operator review: Layer 0, not-match, card, paths |
| `lib/squibb/recommendation-session-server.ts` | Reads latest shadow for bellows recs |

### Scripts

| Path | Role |
|------|------|
| `scripts/foreman/Test-WerklesMatchingShadowSmoke.ps1` | Three-scenario smoke |
| `scripts/foreman/test-matching-shadow-smoke.Inner.mjs` | Node inner runner |

### Receipts and prior handoffs

| Path | Role |
|------|------|
| `foreman/receipts/WERKLES_MATCHING_NOT_MATCHING_ENGINE_20260709.md` | Build receipt |
| `foreman/receipts/WERKLES_AUTONOMOUS_MATCHING_PIVOT_20260708.md` | Pivot receipt |
| `foreman/handoffs/outbox/TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710.md` | Shadow QA sub-packet (Phase 1 here) |
| `foreman/messages/DINK_MATCHING_SHADOW_QA_TAG_20260710.md` | Prior tag message |

### Doctrine consumed

| Path | Role |
|------|------|
| `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md` | Constitutional architecture |
| `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md` | Speaker warning entry |
| `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md` | Schema audit (Layer 0 was "narrative only" pre-engine) |
| `foreman/speaker/LEVERAGE_INVENTORY_FRAMEWORK_v1.md` | Leverage taxonomy |
| `artifacts/matching-inbox/WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md` | Compiled map (4300+ lines) |

### Git reference (at handoff time)

| Field | Value |
|-------|-------|
| Branch | `maker/site-g-20260703` |
| Matching commit | `8e77ace` — Layer 0 + not-match engine |
| Remote | Pushed to `origin/maker/site-g-20260703` |
| Deploy | **Confirm werkles.com has this branch** before blaming engine |

---

## 8. Pipeline architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│ INTAKE POST                                                             │
│  /api/discovery/intake  OR  /api/bellows/intake                         │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ SIGNALS (signals.ts)                                                    │
│  statedNeed, lane, assets, keyword flags, leverage diagnosis            │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ OPTIONAL LLM (gated — stubbed)                                          │
│  maybeLlmTranslate() — returns signals unchanged unless LLM gate + key  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 0 (layer0.ts) — ALWAYS FIRST                                    │
│  stated need → translated need, hypotheses, confidence, smallest step  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ NOT-MATCH (not-match.ts)                                                │
│  outcome: proceed | pause | proof_only                                  │
│  disqualifiers, warnings, Rule 6 partner-as-symptom, Rule 7 thin proof  │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PATH SCORE (score-paths.ts)                                             │
│  10 path kinds, base + keyword points - penalties - disqualification    │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ DELIVER (deliver.ts)                                                    │
│  SpeakerFactDelivery + 7-section RecommendationCard + SquibbVoice      │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ PERSIST (shadow-storage.ts)                                             │
│  data/matching/shadow-runs.jsonl + runId                                │
└───────────────────────────────────┬─────────────────────────────────────┘
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ SURFACES                                                                │
│  /operator/matching/shadow  ·  /bellows/recommendations (latest run)    │
└─────────────────────────────────────────────────────────────────────────┘
```

**Storage path:** `data/matching/shadow-runs.jsonl` (append-only JSONL, last N runs read for operator page).

**Mode:** `shadow` — end users do not see engine output until `MATCHING_AUTONOMOUS_PUBLIC` flip.

---

## 9. Module reference (lib/matching)

### 9.1 `signals.ts`

Builds `StructuredSignals` from discovery or concierge intake.

**Boolean flags** (regex on intake text blob):

| Flag | Pattern family |
|------|----------------|
| `partnerSeeking` | partner, co-founder, investor, equity… |
| `capitalSeeking` | loan, capital, fund, credit, bank… |
| `jobSeeking` | job, hire, employment, bartend… |
| `trainingSeeking` | train, certif, license, course… |
| `relocationSignal` | relocat, move, city, zip… |

Also extracts `blockerKeywords`, `goalKeywords`, lane, assets from discovery schema.

**Leverage:** `diagnoseLeverage()` from `leverage.ts` — primary hypothesis + constrained/possible categories.

### 9.2 `layer0.ts`

Rule table `TRANSLATION_RULES` — first matching rule wins.

Outputs `Layer0Translation`:

- `statedNeed`, `translatedNeed`
- `leverageClasses`, `alternativeHypotheses`, `visibleReasons`
- `confidence`: low | medium | high (word count + constraint count heuristic)
- `preflightComplete: true`
- `smallestReversibleStep`

Falls back to generic translation if no rule matches.

### 9.3 `not-match.ts`

`evaluateNotMatch(signals, layer0)` → `NotMatchResult`

**Outcomes:**

| Outcome | Meaning |
|---------|---------|
| `pause` | Too thin to rank — proof request only |
| `proof_only` | Capital + partner + low confidence — no people/money paths |
| `proceed` | Ranking allowed (with possible per-path disqualifiers) |

See Appendix B for full rule list.

### 9.4 `score-paths.ts`

`scorePaths(signals, layer0, notMatch)` → top 6 `ScoredPath[]`

If `pause`: only `verify_proof` at score 55.

Each path: base + dynamic points - Layer0 penalty - disqualification cap (max 15 if blocked).

Confidence labels: high ≥70, medium ≥45, else low.

### 9.5 `deliver.ts`

**Speaker facts:** bottleneck, evidence items, falsifiers, proof gaps, scored paths.

**7-section recommendation card:**

1. `whatYouAskedFor`
2. `whatWeHeardUnderneath`
3. `visibleReasons`
4. `recommendation` (type, headline, pathKind)
5. `whyNotAlternatives`
6. `whatToDoNext`
7. `whatWouldChange` + `userSovereigntyNote`

**Squibb voice:** intro, topPathNote, counterpoint, keepOriginalPathLabel (template-based, not LLM unless gated).

### 9.6 `shadow-pipeline.ts`

Entry points:

- `runShadowMatchingFromDiscovery(intakeId, input)`
- `runShadowMatchingFromConcierge(intakeId, answers)`
- `readLatestShadowRuns(limit)`

Returns `null` if shadow flag off.

---

## 10. Wired surfaces

| URL / API | Behavior |
|-----------|----------|
| `POST /api/discovery/intake` | Stores intake, runs shadow, returns intake record |
| `POST /api/bellows/intake` | Stores concierge answers, runs shadow |
| `GET /operator/matching/shadow` | Lists latest shadow runs with full card |
| `/bellows/recommendations` | Uses latest bellows-sourced shadow via `recommendation-session-server` |
| `/discovery` | Intake form — copy updated: no human-operator matching promise |

**Not wired yet:**

- Discovery-sourced shadow → member-facing recommendations page (Maker task when you tag)
- Public card on homepage or dashboard
- Crucible proof weights in scorer

---

## 11. Feature flags and gates

### Flags (`lib/matching/feature-flags.ts`)

| Flag | Current | Meaning |
|------|---------|---------|
| `MATCHING_AUTONOMOUS_SHADOW` | `true` | Run engine on every intake |
| `MATCHING_AUTONOMOUS_PUBLIC` | `false` | Hide from end users |
| `MATCHING_LLM_TRANSLATE_ENABLED` | `false` | LLM translation + Squibb assist |

### Human gates (Ben only — you do not approve)

| Gate phrase | Tier | When |
|-------------|------|------|
| `RATIFY SPEAKER CHARTER V1 AUTONOMOUS FACT DELIVERY` | 1 | Before public claims reference autonomous Speaker |
| `APPROVE MATCHING LLM TRANSLATE` | 2 | Optional LLM layer |
| `APPROVE MATCHING AUTONOMOUS GO-LIVE` | 1 | Flip `MATCHING_AUTONOMOUS_PUBLIC` |
| Production deploy / push to main | — | Operator explicit approval |

Draft charter: `foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md`

**Hard stops for you:**

- Do not flip `MATCHING_AUTONOMOUS_PUBLIC`
- Do not ratify Speaker Charter for Ben
- Do not push/merge/deploy without Operator approval
- No SQL, secrets, Harvey lane work

Authority chain: `foreman/HUMAN_GATES.md` → `foreman/LANES.md` → `foreman/BUDGET.md`

---

## 12. Git, deploy, and environment

| Field | Value |
|-------|-------|
| Git root | `C:\Users\Ben Leak\github\Werkles` |
| Active branch | `maker/site-g-20260703` |
| Project lock | `foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md` |
| Local preview | `npm run dev` (port 3000 default) |
| Typecheck | `npm run typecheck` — Harvey mobile path may noise; ignore for G lane |

**First action:** Confirm production deploy. If `https://werkles.com/operator/matching/shadow` 404s or shows old copy, engine may be fine but deploy is behind — note in receipt before tuning rules.

---

## 13. Phase plan (your mission)

| Phase | Owner | Deliverable |
|-------|-------|-------------|
| **1** | Dink | Shadow QA receipt + smoke PASS |
| **2** | Heimerdinker | Catalog v1 drops in `artifacts/matching-inbox/` |
| **3** | Dink → Maker | `TO_MAKER_MATCHING_ENCODE_CATALOG_V1_*` packet |
| **4** | Maker + Ender | Public card UI + voice pass |
| **5** | Ben + Petra | Charter ratification + public flip gate |

---

## 14. Phase 1 — Shadow QA (immediate)

Full detail in `TO_DINK_MATCHING_NOT_MATCHING_SHADOW_QA_20260710.md`. Summary:

### 14.1 Confirm deploy

Hit `https://werkles.com/operator/matching/shadow` — expect **Autonomous matching / Shadow runs**.

### 14.2 Run smoke mule

```powershell
cd C:\Users\Ben Leak\github\Werkles
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1
# Local:
.\scripts\foreman\Test-WerklesMatchingShadowSmoke.ps1 -SiteOrigin "http://localhost:3000"
```

Receipt: `foreman/receipts/WERKLES_MATCHING_SHADOW_SMOKE_YYYYMMDD.json`

### 14.3 Human review (required)

For each smoke scenario + one real bellows intake, record at `/operator/matching/shadow`:

- Stated vs translated need
- Not-match outcome
- Top path + score
- False positive / false negative / missing silence

### 14.4 File QA receipt

`foreman/receipts/WERKLES_MATCHING_SHADOW_QA_YYYYMMDD.md`

### 14.5 Reply RECEIVED

`foreman/handoffs/inbox/RECEIVED_TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710_<PASS|PARTIAL|BLOCKED>.md`

---

## 15. Phase 2 — Algorithm catalog v1 (Heimerdinker mode)

Drop these into `artifacts/matching-inbox/` (no code in inbox — spec only):

### Required artifacts

| File | Contents |
|------|----------|
| `MATCHING_PATH_CATALOG_V1.json` | Each `RecommendationKind`: base weight, prerequisites, disqualifiers, evidence strength default |
| `NOT_MATCH_RULES_V1.json` | Ordered rules: condition, outcome, disqualified paths, priority |
| `LAYER0_TRANSLATION_RULES_V1.json` | Rule table mirroring/extending `layer0.ts` with Ben-approved copy |
| `GOLDEN_EXAMPLES_V1.md` | Minimum 5 intakes: input → expected Layer 0, not-match, top 2 paths, card headline |

### Optional but valuable

| File | Contents |
|------|----------|
| `LEVERAGE_TO_PATH_MAP_V1.json` | Which paths rise/fall per leverage hypothesis |
| `RECOMMENDATION_CARD_FIELD_SPEC_V1.md` | Standalone 7-section spec for Ender handoff |
| `WIZARD_OF_OZ_WORKSHEET_V1.md` | Operator shadow review rubric |

Update `artifacts/matching-inbox/MANIFEST_20260709.md` or add `MANIFEST_YYYYMMDD.md` when drops land.

**Rule:** Catalog is source of truth. Maker encodes your JSON — does not invent parallel weights.

---

## 16. Phase 3 — Tag Maker in (build deputy packets)

When Phase 1 receipt exists AND catalog v1 is dropped (or partial with explicit scope), create:

`foreman/handoffs/outbox/TO_MAKER_MATCHING_ENCODE_CATALOG_V1_YYYYMMDD.md`

Use template in [Section 19](#19-how-to-tag-maker-properly).

Maker then:

1. Refactors `score-paths.ts` to read catalog (or generated constants from your JSON)
2. Aligns `not-match.ts` and `layer0.ts` to your rule tables
3. Fixes false positives from your QA receipt
4. Ships public recommendation card on `/bellows/recommendations`
5. Wires discovery shadow → recommendations if scoped

---

## 17. Phase 4 — Public flip prep

Only after:

- [ ] Shadow QA receipt: verdicts mostly GOOD or TUNE (not BROKEN)
- [ ] Catalog v1 encoded and re-smoked
- [ ] Ben ratifies `SPEAKER_CHARTER_V1`
- [ ] Petra GO if requested
- [ ] Ender pass on card surface (optional but recommended)

Then prepare Tier 1 gate packet for Ben: `APPROVE MATCHING AUTONOMOUS GO-LIVE`

Maker flips `MATCHING_AUTONOMOUS_PUBLIC` only after recorded approval in `foreman/gates/APPROVAL_LOG.md`.

---

## 18. Phase 5 — Deferred (do not start)

| Item | Why deferred |
|------|----------------|
| People roster / candidate pool | No stranger-pays signal; path types only |
| Crucible weight multipliers | Needs verification lane maturity |
| LLM translation layer | Gated; deterministic layer must prove first |
| Layer 5 cohort builder | Doctrine: waits for paying-stranger signal |
| Harvey lane | Project lock |
| Plaid persistence | Separate partnership lane — see `foreman/plaid/` |

---

## 19. How to tag Maker properly

Maker stays on board as **build deputy**. You lead; she implements.

### When to tag Maker

| Trigger | Packet |
|---------|--------|
| False positives listed in QA receipt | `TO_MAKER_MATCHING_TUNE_FROM_QA_*` |
| Catalog v1 dropped | `TO_MAKER_MATCHING_ENCODE_CATALOG_V1_*` |
| Public card UI ready for build | `TO_MAKER_MATCHING_PUBLIC_CARD_UI_*` |
| Ender copy ready | `TO_MAKER_MATCHING_ENDER_WIRE_*` |

### Packet template (copy this)

```markdown
# TO MAKER — <short title>

| Field | Value |
|-------|-------|
| **From** | Heimerdinker / Dink@Betsy (mission lead) |
| **To** | Lady Jessica (Maker@Betsy) |
| **Parent** | TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710 |
| **Lane** | Werkles.com / G only |

## Context
<link QA receipt or catalog file>

## Your scope (bounded)
- [ ] exact files or behaviors
- [ ] do NOT change doctrine without inbox spec update

## Acceptance criteria
- [ ] typecheck pass (G lane)
- [ ] smoke mule still PASS
- [ ] operator shadow page shows expected change

## Out of scope
- Harvey, deploy, push, gates, catalog authorship

## Receipt expected
foreman/receipts/WERKLES_MATCHING_MAKER_<task>_YYYYMMDD.md
```

### What Maker must not do without you

- Invent path weights not in catalog
- Flip public or LLM flags
- Approve human gates
- Take Harvey or Plaid lanes without separate packet

### Maker's standing tag

`foreman/messages/MAKER_MATCHING_BUILD_DEPUTY_TAG_20260710.md` — read on session start.

---

## 20. Smoke mule and golden scenarios

### Built-in smoke scenarios (3)

| # | Scenario | Expect Layer 0 / not-match to… |
|---|----------|--------------------------------|
| 1 | Capital + partner | Proof before people/money; partner may be symptom |
| 2 | Job change | Employment path ranks; not investor path |
| 3 | Training vs partner | Training or intrinsic leverage; suppress blind partner match |

### Additional scenarios for manual QA (add to GOLDEN_EXAMPLES_V1)

| # | Intake sketch | Expected top path | Expected not-match |
|---|---------------|-------------------|---------------------|
| 4 | "help" only | pause | all capital/person paths disqualified |
| 5 | Need loan, no customers, idea only | find_credit_union or verify_proof | raise_capital disqualified |
| 6 | Overwhelmed solo founder wants co-founder | get_training or verify_proof | find_partner disqualified (Rule 6) |
| 7 | Bartender wants new restaurant job | find_better_job | capital paths low |
| 8 | Moving to new city, need kitchen space | relocate + find_equipment | — |

---

## 21. Known gaps and technical debt

| Gap | Severity | Owner |
|-----|----------|-------|
| Keyword heuristics vs real NLP | Medium | Heimerdinker catalog → Maker encode |
| Weights hardcoded in `score-paths.ts` | Medium | Catalog v1 |
| `stage_intro_candidate` always guarded | Low | By design until proof lane exists |
| Discovery shadow not on member rec page | Medium | Maker when tagged |
| `NEXT_ACTION.md` says "no matching work" | High (cockpit lie) | Dink Foreman fix |
| No formal matching lane in `LANES.md` | Medium | Dink Foreman fix |
| Schema audit Layer 0 row still "narrative only" | Low | Update after shadow promoted |
| `data/matching/shadow-runs.jsonl` local only | Medium | Note in deploy receipt — production may differ |
| Speaker Charter V1 unrated | Gate | Ben |
| Signup email (amiriavets unconfirmed) | Parallel | Separate from matching |

---

## 22. Anti-patterns and Speaker warnings

Speaker entry `DRAFT_20260608-not-matching-matching` triggers on:

- "matching algorithm"
- "tinder for founders"
- "build matchmaking engine"
- "fit score"

**Interrupt when:**

- Scope jumps to learned ranker before Layer 0 proves in shadow
- Marketing copy promises auto-matching or instant human response
- Cohort builder starts before paying-stranger signal
- Maker invents weights without inbox catalog
- Public flip before shadow QA receipt

**AEYE_ROLE_REGISTRY anti-absorption:**

- GD is not Speaker
- Maker is not Operator
- Ender is not final copy ratifier
- Dink does not draft member copy without scope

---

## 23. Parallel work (Ben + Maker, do not collide)

Ben is working matching "from another angle" in parallel. **Consume, don't fork:**

| Source | You integrate via |
|--------|-------------------|
| Ben doctrine drops | `company/` or `artifacts/matching-inbox/` |
| Ben golden examples | Append to `GOLDEN_EXAMPLES_V1.md` |
| Maker uncommitted work | Check `git status` — may include Plaid package, smoke scripts, signup lookup — **not matching catalog** |

If Ben's angle conflicts with coded behavior, **Ben wins** — update catalog, tag Maker to encode.

---

## 24. Foreman cockpit updates you own

As mission lead + Foreman duty, update (or file PR for Ben to merge):

### `foreman/NEXT_ACTION.md`

Add matching lane block:

- Active: shadow QA → catalog v1 → encode → public prep
- Remove stale "no matching work" hard stop
- Name Dink mission lead, Maker build deputy

### `foreman/LANES.md`

Add lane stub:

```markdown
## Lane: Werkles Matching Shadow (G)

- Status: APPROVED (shadow only)
- Allowed: shadow smoke, operator review, catalog drops, rule tuning in branch
- Forbidden: public flip, LLM enable, people roster, push/deploy without Ben
- Stop: shadow QA receipt filed + catalog v1 dropped
```

### `foreman/MATCHING_LANE_LEAD_V0.md` (optional pointer)

Short pointer to this packet — avoids duplicating the bible.

---

## 25. Receipt and communication protocol

### Receipts you file

| Receipt | When |
|---------|------|
| `WERKLES_MATCHING_SHADOW_SMOKE_*.json` | After smoke mule |
| `WERKLES_MATCHING_SHADOW_QA_*.md` | After human review |
| `WERKLES_MATCHING_CATALOG_V1_DROP_*.md` | After inbox drops |
| `WERKLES_MATCHING_MISSION_LEAD_STATUS_*.md` | Weekly or at phase boundaries |

### Inbox replies

```text
RECEIVED: TO_HEIMERDINKER_MATCHING_MISSION_LEAD_V1_20260710 — <PASS|PARTIAL|BLOCKED> — receipt: foreman/receipts/...
```

### Maker replies (she files back to you)

```text
RECEIVED: TO_MAKER_MATCHING_<task> — <DONE|PARTIAL|BLOCKED> — receipt: foreman/receipts/WERKLES_MATCHING_MAKER_...
```

---

## Appendix A — Path catalog (code v0)

Current paths in `score-paths.ts` RULES array:

| Kind | Base | Scoring notes |
|------|------|---------------|
| `verify_proof` | 35 | +30 always; top on pause |
| `find_credit_union` | 0 | +42 if capitalSeeking |
| `find_partner` | 0 | +38 if partner + relational leverage; +18 partner only |
| `raise_capital` | 0 | +28 capital + Idea asset |
| `get_training` | 0 | +36 training; +18 if jobSeeking |
| `find_better_job` | 0 | +40 jobSeeking |
| `relocate` | 0 | +34 relocationSignal |
| `find_equipment` | 0 | +32 equipment keywords |
| `find_banker` | 0 | +26 capital + structural constrained |
| `stage_intro_candidate` | 0 | +14 partner + Network asset; heavily guarded |

**Layer 0 penalties:** -25 capital paths if translated need mentions proof; -30 person paths if "not co-ownership".

---

## Appendix B — Not-match rules (code v0)

| Rule | Condition | Outcome |
|------|-----------|---------|
| Unclear ask | need <12 chars, vague words, blob <8 words | **pause** — all capital + person paths disqualified |
| Rule 6 partner symptom | partnerSeeking + intrinsic/amplification leverage OR "not co-ownership" in translation | disqualify find_partner, stage_intro_candidate |
| Premature capital | capitalSeeking + no Customers asset + proof hypothesis | disqualify raise_capital |
| Rule 7 thin proof | capital + partner + layer0 confidence low | **proof_only** — partner, intro, raise_capital disqualified |
| Default intro guard | always | stage_intro_candidate disqualified unless future explicit unlock |
| Many disqualifiers | disqualified.length >= 4 | outcome → proof_only |

---

## Appendix C — Layer 0 translation rules (code v0)

First matching rule in `TRANSLATION_RULES` wins:

1. capitalSeeking && partnerSeeking
2. capitalSeeking && amplification constrained
3. partnerSeeking && intrinsic primary
4. partnerSeeking && !capitalSeeking
5. capitalSeeking
6. jobSeeking
7. trainingSeeking
8. relocationSignal
9. (fallback) generic translation

Confidence: low default; medium if ≥40 words or ≥80 words + 2 constraints.

---

## Appendix D — Signal keyword patterns

From `signals.ts`:

```
PARTNER_WORDS:  partner|co-founder|cofounder|investor|backer|equity
CAPITAL_WORDS:  loan|capital|fund|fundraising|money|credit|financ|bank|lender|invest
JOB_WORDS:      job|hire|hired|employment|shift|bartend|server|waiter|waitress|kitchen
TRAINING_WORDS: train|certif|license|course|class|learn|skill
RELOC_WORDS:    relocat|move|city|state|zip|metro|area
```

Equipment goals checked in scorer: equipment, oven, truck, tool, lease.

---

## Appendix E — Type contracts

Key types in `lib/matching/types.ts`:

- `StructuredSignals` — intake + flags + leverage
- `Layer0Translation` — preflight output
- `NotMatchResult` — outcome + disqualified + warnings
- `ScoredPath` — kind, rank, score, confidence, rationale, evidenceStrength
- `RecommendationCard` — 7-section member card
- `SpeakerFactDelivery` — facts + card + paths
- `SquibbVoiceDelivery` — voice wrapper
- `ShadowMatchingRun` — full persisted run

---

## Appendix F — File index

```
lib/matching/
  feature-flags.ts
  signals.ts
  leverage.ts
  layer0.ts
  not-match.ts
  score-paths.ts
  deliver.ts
  shadow-pipeline.ts
  shadow-storage.ts
  shadow-to-recommendations.ts
  types.ts

app/api/discovery/intake/route.ts
app/api/bellows/intake/route.ts
app/operator/matching/shadow/page.tsx
lib/squibb/recommendation-session-server.ts

data/matching/shadow-runs.jsonl  (runtime, may not be in git)

scripts/foreman/Test-WerklesMatchingShadowSmoke.ps1
scripts/foreman/test-matching-shadow-smoke.Inner.mjs

artifacts/matching-inbox/
  README.md
  MANIFEST_20260709.md
  WERKLES_MATCHING_NOT_MATCHING_SOURCE_DOSSIER_20260708.md

company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md
foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md
foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md
foreman/speaker/SPEAKER_CHARTER_V1_AUTONOMOUS_FACT_DELIVERY_DRAFT.md
foreman/werkles-com/WERKLES_COM_PROJECT_LOCK.md
```

---

## Appendix G — Doctrine and inbox reading order

**Day 1 (2 hours):**

1. This packet
2. `company/WERKLES_MATCH_STACKING_AND_NEED_TRANSLATION_V0.md`
3. `foreman/speaker/entries/DRAFT_20260608-not-matching-matching.md`
4. `foreman/receipts/WERKLES_MATCHING_NOT_MATCHING_ENGINE_20260709.md`

**Day 2 (as needed):**

5. Dossier table of contents + Wizard card spec sections in dossier
6. `foreman/reviews/MATCH_STACK_SCHEMA_AUDIT_V0.md`
7. `foreman/speaker/LEVERAGE_INVENTORY_FRAMEWORK_v1.md`
8. `lib/matching/*.ts` — read layer0, not-match, score-paths first

**Skim don't memorize:** full 4300-line dossier — use as reference index.

---

## Success criteria (mission complete v1)

| Check | Pass |
|-------|------|
| LOCAL HANDS READBACK | Delivered |
| Deploy confirmed | werkles.com shadow page live on branch |
| Smoke mule | 3/3 PASS |
| QA receipt | Filed with false positive list |
| Catalog v1 | Dropped to inbox |
| Maker tagged | Encode packet dispatched |
| Cockpit | NEXT_ACTION + LANES updated |
| RECEIVED | Filed in handoffs/inbox |

---

*Lady Jessica · Maker@Betsy · handing mission lead to Heimerdinker / Dink · Werkles.com G lane · 2026-07-10*
