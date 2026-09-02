# TO MAKER (Heimerdinker) — Walkthrough UX holes (CBCC v0.3 assimilation)

**From:** Foreman (VPGM assimilation)  
**At:** 2026-08-05  
**Authority:** Cousin red-team findings — Ender (primary), Petra, Thufir  
**Lane:** Product UX copy + route — **Maker implements; Foreman does not**

## Do first (BLOCKER)

### 1. Intros CTA — stop the loop into data-loss intake

**Problem:** `Put your numbers in` → `/bellows/intake` reopens the form that **does not autosave** and already ate Operator data.

**Ender interim fix (pick one):**

**Option A (preferred):**
- Button: `See what to put together`
- Beneath: `Werkles cannot assemble your numbers, and it will not pretend to. This opens the short list of what a capital conversation asks for, so you can write down once and stop guessing at it.`
- Points at static missing-evidence list (no intake round-trip)

**Option B (if must stay on intake):**
- Button: `Add to your intake`
- Beneath: `This reopens the intake you filled in. It saves when you submit, so finish in one sitting.`

### 2. Route — six surfaces vs five-surface story

**Problem:** Path lists `/bellows/recommendations` between intake and workshop; undescribed; may show pre-correction readout.

**Ender ruling:** Pull `/bellows/recommendations` from walkthrough path **unless** one sentence explains what it shows that Intros does not. Document decision in receipt.

### 3. Crucible — strike member-visible "dry-run"

**Replace with (Ender verbatim):**

- Heading: `What proof would look like`
- Body: `None of these checks have run. Werkles is showing you the shape of its proof file so you can see what it will ask for and what it will never claim on your behalf. When a check can run, this page will say who ran it and when — and if it has not run, it will say that just as plainly.`

### 4. De-naming — stop teasing withheld person

**Doors heading:** `Why no door opens today`

**Reason block (replace Strong-evidence de-named reason):**

```
Capital posture fits the pool — Strong evidence

What we saw: Your intake reads as funding pressure, and this pool holds members whose own intakes put them on the funding side rather than competing with you for the same money.

Why it matters: A backer who is not competing for the same money is the useful kind. It is also the kind where unverified funds hurt most — on both sides.
```

**Doors body:**

```
Werkles will not point you at a name it cannot vouch for, and today it cannot vouch for any of them. No identity check, no funds check, on either side. Naming someone here would be a guess dressed up as an introduction. Doors open when checks run — not when the fit looks good enough.
```

### 5. Walkthrough path order

End Operator walk on **Proof/Crucible**, not Dues. Membership reachable but not terminal.

## Also (SERIOUS — same PR if touching Intros)

- Vocabulary: one member-facing name per surface in heading, nav, breadcrumb (Workshop vs Blueprints, Proof vs Crucible)
- Membership body if terminal must stay: Ender verbatim in assimilation receipt
- Form controls: confirm **16px minimum** on intake fields (mobile Safari zoom)

## Do NOT

- Approve or batch ghost faces (Operator gate)
- Change matching engine scores
- Deploy/push/SQL without Operator phrase

## Done when

Receipt: `foreman/handoffs/inbox/FROM_MAKER_WALKTHROUGH_UX_HOLES.md` listing each hole addressed with file paths.

## Source receipts

- `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260805-012239.md`
- `foreman/handoffs/inbox/FROM_PETRA_VPGM_20260805-012208.md`
- `foreman/handoffs/inbox/FROM_COMPUTER_VPGM_20260805-012208.md`
