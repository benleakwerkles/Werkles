# Werkles Homepage Rewrite — Scope Lock

Status: **LOCKED SCOPE** (Foreman synthesis)  
Generated: 2026-06-06  
Gate: **CONDITIONAL GO** — pending Petra comptroller verdict on `TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_20260606-135435.md`

## Source artifacts

| Source | Path |
|--------|------|
| ENDER discovery | `foreman/handoffs/inbox/processed/2026-06-06T13-50-02-750Z__FROM_ENDER_WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_20260606-135002.md` |
| SKYBRO discovery | `foreman/handoffs/inbox/processed/2026-06-06T13-52-16-713Z__FROM_SKYBRO_WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_20260606-135216.md` |
| COMPUTER discovery | `foreman/handoffs/inbox/processed/2026-06-06T13-54-35-149Z__FROM_COMPUTER_WERKLES_HOMEPAGE_DISCOVERY_FULL_CREW_20260606-135435.md` |
| Petra handoff (unsent) | `foreman/handoffs/outbox/TO_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_v1_20260606-135435.md` |
| Locked style (preserve) | `foreman/SITE_STYLE_APPROVED_v0.6.md` |

---

## 1. Sections to rewrite

| Section | Scope | Rationale (cousin consensus) |
|---------|-------|------------------------------|
| **Hero fold** (`HeroStatic` + `copy.hero`) | Headline, subhead, primary/secondary CTA labels, one supporting artifact visual | ENDER: hero doing too much; COMPUTER: value prop not legible fast; SKYBRO: weak beachhead / outcome framing |
| **Hero-adjacent proof strip** (`WorkshopTrustRail` or new fold-adjacent block) | Add **one real output artifact** + **before-state** line above the fold or immediately below hero | ENDER: artifact is the argument; SKYBRO: before/after story arc |
| **Trust / credibility band** (fold-adjacent, before deep scroll) | Strengthen proof near top — badge, testimonial-style line, or measurable outcome (no fabricated logos) | COMPUTER: trust signals weak; ENDER: crucible gate needs near-side taste |
| **Account-gate / crucible preview** (`copy.home.accountGate`, ops-card gate list) | Rewrite copy to show **what happens on signup** and **preview of crucible output** without opening the gate | ENDER: gate has no preview; kills curiosity signups |
| **Positioning paragraph** (hero subhead or new single block under hero) | One beachhead sentence: who Werkles is for, category fit, vs legacy alternatives | SKYBRO: everything-for-everyone trap; weak differentiation |
| **How-it-works intro** (`copy.howItWorks` headline + step 1 body only) | Tighten to value-first (“what you get”) not feature-first (“how the machine works”) | SKYBRO: feature-first narrative |

**Out of scope for this rewrite:** `/signup`, `/login`, `/onboarding`, `/dashboard/*`, `/pricing`, `/membership`, Stripe, Supabase, auth flows, Bellows shell, dispatch/foreman scripts.

---

## 2. Sections to preserve

| Section | Lock reason |
|---------|-------------|
| **Site header / nav** (`SiteHeader`, primary CTA route to `/signup`) | Route map live; conversion path intact |
| **People / lanes grid** (`/#people`, `copy.lanes`, lane cards) | Core product taxonomy; SKYBRO: keep full-crew energy |
| **How-it-works steps 2–3** (fit test, knock) | Mechanism copy already distinct; lower fold |
| **Proof-warning band** (`copy.trust` proof section) | Aligns with trust posture; refine copy only if hero rewrite duplicates |
| **Draft asset gallery** | Ghost Forge draft review lane — not homepage messaging |
| **Operations grid structure** (beta + proof + dashboard teaser cards) | Layout works; **copy** inside gate card may change per §1 |
| **Footer disclaimer** (`copy.disclaimer`) | Legal/trust boundary — COMPUTER: simplicity is credibility |
| **Workshop visual system** | `foreman/SITE_STYLE_APPROVED_v0.6.md` — brightened workshop, copper kickers, facets, SiteIcon |
| **Brand name “Werkles”** and foundry/floor metaphor spine | SKYBRO + ENDER: protect what already earns attention |
| **Ender visual tests section** | Separate approved visual lane — do not fold into hero rewrite |

---

## 3. Claims allowed

- Werkles is a **private foundry floor** for people who build (Builders, Operators, Backers, Connectors, Sparks).
- Werkles helps people **discover possible business partners** with visible fit reasons.
- **Proof signals** and claim receipts exist; strength varies; no magic trust.
- **Account + onboarding** required before full floor access (crucible gate) — stated plainly with preview of what unlocks.
- **Before state:** fragmented workflows, guru fog, noisy public shouting, unproven fit.
- **After state:** tested fit, private knocks, crew momentum, plain-language Forge files.
- **Beta / narrow opening** posture — slow, careful floor (matches live product stage).
- Hero may use **confrontational, plain, gritty** voice (SKYBRO: do not sanitize).
- One **stylized/anonymized example output** as illustration (labeled draft/example if not live data).

---

## 4. Claims prohibited

- Revenue guarantees, funding outcomes, or “we hold/move money.”
- **AI autopilot** / fully automated matching / “magic smoke” fit (contradicts `copy.trust` + product truth).
- Unverified customer logos, fake testimonials, or fabricated case studies.
- **Production-ready** / **fully launched** if beta narrow-opening is still true.
- Competitor naming or unsourced market-share statistics (COMPUTER citations are research notes, not homepage copy).
- Security/compliance badges not actually in place.
- Crucible or dashboard features not yet shipped to logged-in users.
- Education Forge, Ghost Forge, or Bellows as **shipped** products (Bellows = shell).
- Deploy, SQL, billing rail, or infra promises (cousin lane boundaries).
- Any change to **Stripe checkout**, **Supabase auth**, or **membership billing** copy/routes in this pass.

---

## 5. Visual tone constraints

Locked to **Site Style v0.6**:

- Warm paper panels (`#f6efe5`), dark ink on paper for body copy.
- **Copper for eyebrows/kickers only** — not paragraph text on paper.
- Forge atmosphere **behind scrim** — no bare forge glow under readable copy.
- **Workshop facets** for section bands — mood shift allowed within one building.
- **Mobile-friendly, easy-to-scan layout** — COMPUTER: do not sacrifice simplicity for content dumps.
- Hero supports **one dominant artifact visual** (PNG draft or CSS plate) — show, don’t tell.
- No heavy industrial-only forge pivot; keep **mixed-facet workshop** energy.
- SiteIcon / draft PNG rules unchanged until Tier 3 icon batch lands.

---

## 6. Conversion goal

**Primary:** Increase **signup starts** (`/signup` — “Enter the Foundry”) from cold homepage traffic.

**Secondary:** Increase **scroll past fold** to How + Proof sections.

**Success signals (preview/local only — not production analytics gate):**

- Visitor can answer in 5 seconds: *What is Werkles? Who is it for? What happens when I sign up?*
- Hero pairs **one line of confrontation/specificity** with **one visible artifact**.
- Crucible/account gate feels like **earned unlock with preview**, not opaque wall.

**Non-goals:** Pricing conversion, membership checkout, dashboard activation, SEO overhaul, new routes.

---

## 7. Implementation files likely touched

| File | Change type |
|------|-------------|
| `app/page.tsx` | Section order tweaks, hero/trust band wiring only |
| `components/foundry/hero-static.tsx` | Hero layout, artifact slot, CTA |
| `components/foundry/workshop-trust-rail.tsx` | Fold-adjacent trust/proof strip |
| `lib/copy.ts` | `hero`, `home.accountGate`, `home.proofStack`, `howItWorks` (partial), optional `home.positioning` |
| `app/globals.css` | Hero/fold spacing, scrim, trust band — **within v0.6 tokens** |
| `lib/design-tokens.ts` | Only if hero needs new spacing token — no palette drift |
| `components/foundry/workshop-band-panel.tsx` | Copy props only if gate preview block added |

**Explicitly not touched:**

- `app/signup/page.tsx`, `app/login/page.tsx`, `app/onboarding/page.tsx`
- `app/api/**`, Supabase, Stripe webhooks
- `app/dashboard/**`, `app/pricing/page.tsx`, `app/membership/**`
- `foreman/crew-dispatch/**`, `scripts/foreman/**`
- Production env / Vercel deploy config

---

## 8. Gate verdict

| Gate | Verdict | Note |
|------|---------|------|
| **Homepage rewrite implementation** | **CONDITIONAL GO** | Cousin discovery complete (3/3 receipts). Scope locked above. **Petra synthesis response not yet in inbox** — send `TO_PETRA_*` on ChatGPT tab 1; require `FROM_PETRA_*` with GO before merge to `main` or production deploy. |
| **Local/preview implementation** | **GO** | Maker may implement §1–§7 on branch/preview only. |
| **Production deploy of homepage** | **NO-GO** | Until Petra GO + Ben human gate per `foreman/HUMAN_GATES.md`. |

### Locked hero direction (interim — Petra may override)

- **Headline (ENDER-primary):** “You already know what the problem is. Werkles is what you do about it.”
- **Subhead (SKYBRO-secondary):** Outcome + beachhead — e.g. chaos → crew / unified floor for builders who are done with guru fog.
- **Below hero:** One stylized Werkles output artifact + one-line before-state frustration.

---

## Operator next step

1. Ben sends Petra synthesis packet → save `FROM_PETRA_WERKLES_HOMEPAGE_DISCOVERY_SYNTHESIS_*.md` to inbox → process.
2. If Petra returns **GO**, upgrade §8 to **GO** and open implementation lane for Maker.
3. If Petra returns **CONDITIONAL GO**, implement only items Petra explicitly approves.
4. If **NO-GO**, hold homepage code; revisit discovery only.
