# GD_PRODUCT_IP_CAPTURE_V1

Status: **INTERNAL PRODUCT IP / DRAFT**  
Classification: Werkles operator infrastructure — not public product yet  
Companion: `GD_INTENT_ROUTER_V1.md` · `GD_INTENT_ROUTER_V1_VISUAL_NARRATIVE_TEST.md`  
Implementation: `foreman/gd-intent-router/` (CLI + registry; no UI)

**This document captures IP only.** No UI implementation. No GD rename. No homepage copy changes.

---

## 1. Problem it solves

**Routing labor disguised as strategy.**

Today the Operator (Ben) must decide *which AI cousin* to involve for each mission — Ender for UX, Skybro for narrative, Computer for research, Petra for verdict, Bean for audit. That decision repeats on every thread, burns cognitive load, and leaks cockpit authority into chat memory.

The GD intent router inverts the question:

| Before | After |
|--------|-------|
| "Who should I ask?" | "What outcome do I need?" |
| Cousin-first thinking | Mission-class-first thinking |
| Manual packet tailoring per seat | Automatic role routing from registry |
| Scattered replies in inbox | Receipt collection + synthesis run |

**Job to be done:** Ben issues an **intent**; the system resolves **roles**, generates **packets**, collects **receipts**, and returns a **recommended action** — without making Ben the copy/paste mule or the routing dispatcher.

**Relationship to existing infra:** Parallel layer on top of crew-dispatch / relay-courier. Does not replace cousin handoffs or human Send gates. Reduces *who* and *what to ask* decisions, not *whether Ben approves*.

---

## 2. Core workflow

```text
intent → mission class → role routing → receipts → synthesis → recommended action
```

### Step-by-step

| Step | Actor | What happens |
|------|-------|----------------|
| **1. Intent** | Operator | Ben states an outcome in plain language or mission-class token (e.g. `HOMEPAGE_VISUAL_NARRATIVE`, `CAPITAL_ALLOCATION`) |
| **2. Mission class** | GD registry | Intent resolves to a registered class in `mission-classes.json` — label, description, read-first files, HG approval level |
| **3. Role routing** | GD router | Class maps to cousin recipients via `cousin-assignment.json` — each cousin gets a **lens**, not a generic prompt |
| **4. Packet generation** | GD CLI | `generate` writes per-cousin packets to outbox + run folder; stops before Send |
| **5. Human Send** | Operator | Ben pastes/sends via existing relay habit — **human gate preserved** |
| **6. Receipts** | Cousins → inbox | Replies include `GD_RECEIPT:` token; `collect` pulls into run manifest |
| **7. Synthesis** | GD CLI | `synthesize` merges cousin inputs into operator-facing packet + recommended next action |
| **8. Operator Brief** | GD CLI | **Definition of done** — `OPERATOR_BRIEF_<MISSION>_<RUN_ID>.md` with 5 human-consumable sections per `HUMAN_CONSUMABLE_OUTPUT_RULE_V1.md` |
| **9. Recommended action** | Operator | Review Operator Brief first — act without opening repo files |

### Proven test path

`HOMEPAGE_VISUAL_NARRATIVE` — full loop completed:

- Auto-routed ENDER / SKYBRO / COMPUTER  
- 3/3 receipts collected  
- Synthesis + render batch order (plan only, no render)  
- Run: `GD_RUN_HOMEPAGE_VISUAL_NARRATIVE_20260606-173334`

### Future hook: HG approval levels

Registry already carries `hgApprovalLevel`:

| Level | Meaning |
|-------|---------|
| `HG_NONE` | Discovery only |
| `HG_RECORD` | Log when Operator accepts |
| `HG_OPERATOR` | Ben approves before implementation |
| `HG_BLOCKING` | Synthesis cannot authorize spend/deploy/merge |

---

## 3. Current proven capabilities

| Capability | Evidence |
|--------------|----------|
| **Mission class registry** | 7 classes in `mission-classes.json` including visual beats, lenses, read-first |
| **Cousin assignment table** | `cousin-assignment.json` — stable lookup |
| **Route preview (no files)** | `npm run gd:route -- <CLASS>` |
| **Auto packet generation** | Per-cousin packets with relay metadata, receipt tokens, outbox copies |
| **Run manifests** | `runs/<RUN_ID>/run-manifest.json` — auditable state |
| **Receipt collection** | Inbox scan by `GD_RECEIPT:` token + run_id |
| **Synthesis packet** | Merged cousin summaries + recommended action + HG notes |
| **Operator Brief** | **Mission complete only when emitted** — 5-section human-consumable output (`HUMAN_CONSUMABLE_OUTPUT_RULE_V1.md`) |
| **Domain extensions** | Visual narrative test added beat registry, render batch order artifact |
| **npm scripts** | `gd:list`, `gd:route`, `gd:generate`, `gd:collect`, `gd:synthesize`, `gd:runs` |
| **Isolation from legacy dispatch** | No changes to `dispatch-policy.json`, autonomous proofs, or relay-courier routing |

**Internal name today:** GD Intent Router (`GD_INTENT_ROUTER_V1`). **GD** = internal foreman routing intelligence, not a user-facing brand yet.

---

## 4. Current limitations

| Limitation | Detail |
|------------|--------|
| **CLI only** | GimpDash integrated at `/#gimpdash` on Foreman Control Panel (port 4317) |
| **Manual Send** | Packets stop before Send; Ben still pastes to cousin tabs |
| **Receipt quality** | Depends on cousins following `GD_RECEIPT:` contract; no auto-validation beyond token match |
| **Synthesis depth** | Template merge + summaries; not full LLM re-synthesis in v1 |
| **Registry maintenance** | New mission classes require JSON edits + doctrine update |
| **No auto-cousin dispatch** | Does not invoke Playwright relay or AUTO_SEND paths |
| **Single-tenant** | Built for Werkles Operator (Ben), not multi-user SaaS |
| **Windows path bug** | Fixed in v1 (`loadRunManifest`); other edge cases may exist |
| **No production actions** | By design — no deploy, merge, render, or spend authorization |
| **Test receipts** | Visual narrative test used structured test receipts; live cousin replies need real Send round |

---

## 5. Possible future user-facing names

**Do not rename yet.** Options for IP inventory and later gate review:

| Name | Read | Fit | Risk |
|------|------|-----|------|
| **Werkles Company Builder** | Outcome-forward — building a company, not chatting with bots | Strong product story; matches lane/formation metaphor | Long; may collide with "Builder" lane role |
| **Builder Dash** | Short dashboard energy | Easy to say | "Dash" feels SaaS-generic; "Builder" overload with lane |
| **Foundry Console** | Workshop control room — on-brand with Werkles foundry spine | Aligns with design system / imagery | "Console" implies shipped UI before trust earned |
| **Company Builder Console** | Explicit operator control surface | Clear for B2B | Long; double "builder"; bro-adjacent if shortened wrong |

**Internal working name until gate:** GD Intent Router or **Foundry Router** (internal only, not public).

**Naming principle:** Lead with **outcome** (company, formation, verdict) not **machinery** (router, dispatch, AI crew).

---

## 6. Guide / persona options

Who "speaks" the router to the Operator when this becomes UI:

| Persona | Role | Pros | Cons |
|---------|------|------|------|
| **Squibb owl** | Host / guide at guide scale | Already in canon (`MASCOT_RULES.md`); Bellows + Crucible foreman; warm, reality-checking | Mascot not landed as asset yet; must stay guide-scale not protagonist |
| **Skybro-style advisor** | Narrative / strategy voice | Strong on arc and beachhead; cousin already exists | "Skybro" is internal cousin name — too bro-forward for user-facing unless heavily reframed |
| **Neutral Foundry voice** | System narrator — "the foundry floor" | No persona baggage; premium workshop tone | Less memorable; needs copy discipline |
| **GD (faceless orchestrator)** | Pure infrastructure | Honest about v1; no mascot dependency | Cold; doesn't help trust on first use |

**Recommendation for later gate:** Squibb as **guide** ("here's who I'm asking and why") — not as the cousins, not as Skynet orchestrator. Skybro *lens* can inform narrative classes without Skybro *branding* the console.

---

## 7. Things to avoid

| Avoid | Why |
|-------|-----|
| **Skynet-forward branding** | "Autonomous AI crew", "self-directing agents", "the machine decides" — violates HUMAN_GATES doctrine and erodes trust |
| **Bro-heavy naming** | Skybro, Bro, Crew Bro — internal cousin humor does not export to premium B2B |
| **Joke names before trust** | Pun product names, meme mascots, ironic AI labels — Werkles earns workshop credibility first |
| **Cousin names in UI** | Ender/Petra/Bean are internal seats; users care about outcomes (UX, verdict, audit) |
| **Auto-send marketing** | Never promise "AI talks to AI for you" while human Send remains the gate |
| **Fantasy orchestration UI** | Glowing agent graphs, command center war rooms — conflicts with documentary/workshop brand |
| **Renaming GD prematurely** | Internal docs stay GD until Operator gate approves public name |

---

## IP summary (one paragraph)

The GD intent router is Werkles **operator infrastructure IP**: a mission-class registry and routing layer that converts Operator **intent** into cousin **role assignments**, **packets**, **receipts**, and **synthesis**, preserving human gates while eliminating cousin-selection burden. Proven via CLI and `HOMEPAGE_VISUAL_NARRATIVE` end-to-end test. Not yet a user-facing product; candidate public names include Company Builder / Foundry Console family. Squibb-as-guide is the strongest persona fit; Skynet and bro branding are explicit anti-patterns.

---

## File map (implementation reference)

| Path | Purpose |
|------|---------|
| `foreman/gd-intent-router/GD_INTENT_ROUTER_V1.md` | Operator doctrine |
| `foreman/gd-intent-router/mission-classes.json` | Registry |
| `foreman/gd-intent-router/cousin-assignment.json` | Routing table |
| `foreman/gd-intent-router/gd-intent-router.mjs` | CLI |
| `foreman/gd-intent-router/runs/` | Run artifacts |
| `foreman/gd-intent-router/GD_INTENT_ROUTER_V1_VISUAL_NARRATIVE_TEST.md` | Proof run |

## Gates (this mission)

- No UI · no GD rename · no homepage copy · no production actions
