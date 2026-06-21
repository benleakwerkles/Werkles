# Bellows — Red Team Notes

**Status:** CONDITIONAL MASTER ARCHITECTURE — SOURCE PRESERVED, RED-TEAMED, NOT FULLY LOCKED  
**Source:** `foreman/source_material/BELLOWS_MASTER_SOURCE_FROM_BEN.md` (ingested — not rewritten)  
**Purpose:** Separate red-team findings from Ben's preserved language in master architecture docs

These notes **do not** replace Ben's preserved language in master architecture files. They flag what must clear before **FULLY LOCKED**.

---

## Filing clarification (framework vs copy vs pricing)

| Preserve tonight | Do not lock tonight |
|----------------|---------------------|
| Pillars, personas, content types, revenue-stream framework | All Ben-source dollar amounts ($29–$97, $197, $12–$15/mo, sponsorship/podcast bands) |
| Product **names** under each pillar | Public article copy, market stats prose, SEO headline text |
| 90-day **shape** (base vs stretch in open questions) | Premium tier vs Foundry Dues reconciliation |

**Default when doc/template SKUs lock:** **$9.99** per `company/PRICING.md` unless Ben approves otherwise later.

**Copy:** master docs are **NOT FINAL PUBLIC COPY** — do not publish verbatim.

---

## Red-team findings

### Market stats need source verification

All six quantitative claims in product thesis §2 are **UNVERIFIED** in repo. See `BELLOWS_SOURCE_CITATIONS_TODO.md`. No outbound marketing, SEO articles, or deck copy may cite them until verified.

---

### Legal-adjacent templates need counsel review

Curriculum pillars 1, 2, 4, 6, 7 and products including Operating Agreement Starter Template ($97 **draft**), equity/entity checklists, SDE worksheets, SBA prep, due diligence master checklist require **independent counsel review** before Armory delivery. **Prices not locked** — default doc SKU **$9.99** until approved. Werkles locked disclaimer applies: starter language only; not legal advice.

---

### Crypto / alt-asset content is RED ZONE until compliance review

Pillar 8 (Crypto & Alt-Asset Sobriety) and Operator's Portfolio Allocation Guide ($29) touch investment-adjacent territory. **No publish, no product, no affiliate** in this lane until compliance review gate. Educational framing alone is insufficient without sign-off.

---

### Dealbreaker Database is future product requiring moderation / anonymization / legal review

Source format in `BELLOWS_CONTENT_TYPES.md`. Requires:

* anonymization protocol (no identifiable parties)
* moderation workflow
* defamation/libel review
* consent / submission policy if user-generated

**Not in MVP.** Not in 90-day plan minimum viable launch.

---

### Bellows educates; Armory sells/delivers templates/tools

Source uses **The Arsenal** for downloadable PDF/Excel. Werkles repo term: **Armory** (`company/PRICING.md`).

| Layer | Job |
|-------|-----|
| **Bellows** (`/bellows`) | Guru teardowns, deal anatomy editorial, Squibb-guided learning, SEO entry |
| **Armory** | Sell and deliver templates, SOPs, checklists, kits |
| **Beehiiv** | Distribution / email capture for launch — not the product store |

Do not conflate newsletter paywall with Foundry Dues without constitutional review.

---

### Beehiiv is MVP launch vehicle, not permanent dependency

Source distribution strategy centers Beehiiv for Weeks 1–13+. Accept for **90-day MVP** only. Open question: migrate list + archives to Werkles-owned surface post-traction. Avoid platform lock-in assumptions in architecture lock.

---

### 90-day plan needs base / stretch distinction

Source `BELLOWS_MONETIZATION.md` §2 mixes ambition levels in one timeline.

| Tier | Definition (proposed — pending Ben lock) |
|------|------------------------------------------|
| **Base** | 6 anchor articles drafted; Beehiiv live; email capture; 200 subscribers; 3 clean affiliates; **no** paid template until counsel on OA template |
| **Stretch** | Week 9–13 soft-launch Operating Agreement Starter Template; Reddit/LinkedIn distribution at volume; first sponsorship outreach |

Record APPROVE of base vs stretch in `APPROVAL_LOG.md` before execution.

---

### Squibb Guide needs Do / Don't examples

**Partially addressed:** `BELLOWS_SQUIBB_GUIDE.md` §5 adds examples derived from source tone matrix — **pending Ben lock**, not yet FULLY LOCKED.

---

### Anti-personas / audience boundaries needed

Source defines three target personas only. See `BELLOWS_OPEN_QUESTIONS.md` (AP-1 through AP-3). Required before community distribution (especially Reddit) goes live.

---

### Persona-to-product mapping needed

Eight pillars × named products × three personas — no sequencing matrix in source. See `BELLOWS_OPEN_QUESTIONS.md` (P2P-1 through P2P-3).

---

### Publication cadence needed

90-day plan covers launch window only. Ongoing Guru Teardown / newsletter rhythm undefined. See `BELLOWS_OPEN_QUESTIONS.md` (PC-1 through PC-3).

---

## Additional red-team (monetization vs Werkles law)

| Conflict | Note |
|----------|------|
| Premium Bellows Tier $12–$15/mo | May conflict with **no tiered membership** rule in `company/PRICING.md` — resolve before lock |
| Source product prices $29–$97 (**draft**) | Differ from locked Armory anchors — **default $9.99** applies until reconciliation table approved |
| Podcast sponsorships $250–$3k/episode | No podcast product in repo yet — revenue stream is aspirational |

---

## What red-team did **not** do

* Did not rewrite Ben's source language in master architecture files
* Did not remove monetization, personas, or pillars
* Did not publish, deploy, generate articles, or create paid products
* Did not run Ghost Forge or Education Forge

---

## Path to FULLY LOCKED

1. Close citations TODO for all market stats used publicly
2. Counsel sign-off on legal-adjacent SKUs
3. Compliance gate on pillar 8
4. Resolve Premium Tier vs Foundry Dues
5. Lock persona-to-product map + anti-personas + publication cadence
6. Ben human gate in `APPROVAL_LOG.md`
