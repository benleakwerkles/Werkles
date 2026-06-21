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
