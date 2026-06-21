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
