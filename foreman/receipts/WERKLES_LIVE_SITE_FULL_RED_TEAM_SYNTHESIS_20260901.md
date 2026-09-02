# Werkles Live-Site Full Red-Team Synthesis — 2026-09-01

## Verdict

**PATCH before the next clean sales walkthrough.** The public visual system and content foundation are materially stronger, but the main discovery path presently ends at a disabled Intake submission, while the clean-session Recommendations page presents a bakery example as if it were personal reasoning.

## Scope and evidence

- Production host: `https://werkles.com`
- Personally rendered: `/`, `/spark`, `/proof`, `/bellows`, `/bellows/library`, `/bellows/library/supplier-comparison`, `/bellows/intake`, `/bellows/recommendations`, `/membership`, `/login`, `/signup`, `/dashboard`, plus a 390×844 mobile home viewport.
- Public link crawl: 33 internal links gathered from ten seed pages; all returned below HTTP 400.
- Accessibility checks: axe runs on Home, Intake, and Recommendations.
- Auth boundary honored: no credentials, account creation, purchase, provider activation, or production mutation.
- Member-only Match Deck, Workshop, Formation, Personal Bellows, and Crucible were not authenticated-walked in this pass.

## Ranked findings

### P1 — The advertised anonymous discovery path cannot finish

The home CTA sends a clean visitor to `/bellows/intake`. The page invites the visitor to build Intake, but the only completion control is disabled as **“Account submission paused.”** There is no immediate sign-up or sign-in handoff at the end. A visitor can invest in the full form and then hit a wall.

Repair checkpoint: either let the draft complete and persist safely, or make the account requirement explicit before the visitor begins and provide a direct continuation path.

### P1 — Recommendations still fake-personalize the bakery sample

In a clean isolated session, `/bellows/recommendations` displayed:

- “I need a business partner and investor before I can buy the bakery equipment.”
- “Here’s the strongest place to start.”
- “Strong input match.”
- “Squibb: You said partner and investor…”

The same page also says the result is a **“Published catalog readout”** scored against a published source document, and later says there is not enough information to prescribe a useful move. `/membership` simultaneously reports **“No intake on file yet.”** This is not merely thin advice; it is contradictory state and presentation.

Repair checkpoint: never rank or address the visitor as “you” without a real saved Intake. Make the sample unmistakably a worked example, or withhold personal Recommendations until input exists.

### P1 — Customer-visible Squibb remains throughout production

Visible Squibb references remain on `/spark`, `/proof`, `/bellows`, `/membership`, and `/bellows/recommendations`; Bellows also exposes a “Squibb hosts the floor” title attribute. This conflicts with the explicit direction to remove customer-facing Squibb/Speaker cross-references. No exact customer-visible “Ben” or “Speaker” was observed in this walk.

### P1 — Serious contrast failures remain

Axe found serious color-contrast violations:

- Intake helper text at approximately 1.49:1 and 1.55:1.
- Active Bellows navigation at approximately 3.99:1.
- Recommendation lesson buttons at approximately 4.12:1.

These are materially below 4.5:1 for normal text and confirm the repeated legibility complaint.

### P2 — Internal narration and terminology dilute the human product

Examples include “Published catalog readout,” “published source document,” “How Werkles ordered it,” “Reasoning,” “Proof & evidence,” and “strong input match.” The public navigation says Membership while pricing language repeatedly says Foundry and Foundry Dues. The Story page includes “No forms about ‘what partner do you want.’” The Proof page repeats prototype/provider disclaimers in several places. The home metadata still uses the previously criticized “name what they need…verify the facts” description, and the Backer lane still uses “runway.”

### P2 — Public launch/discovery remains intentionally quarantined

Production serves `noindex, nofollow, nocache` and a quarantine-oriented `robots.txt`. This may be intentional today, but it is a launch gate: organic discovery remains disabled until deliberately changed.

### P2 — Mobile hierarchy is coherent but very long

The 390px home view is readable and stable, but the page is roughly 12,048px tall. The issue is not broken layout; it is whether a new visitor reaches the important decision points before fatigue. Consider progressive disclosure or tighter section hierarchy rather than removing substance.

## Strongest existing work

- Public header continuity held across every walked page.
- The visual system is cohesive and substantially more grounded in people, spaces, and objects.
- Buttons read as interactive controls rather than informational bubbles.
- Login is polished, compact, human, and clear.
- The public Bellows supplier-comparison lesson is genuinely useful: it compares three suppliers across cost, delivery, setup, monthly expense, and downtime, with save/copy/clear controls.
- The public Bellows library contains six linked lessons plus primary-source material; it has real depth rather than teaser copy alone.
- No broken internal public links were found in the 33-link crawl.
- Home lab vitals were strong in the isolated session: TTFB 25.2ms, FCP 84ms, LCP 116ms, CLS 0.
- Maria is absent from the walked live surfaces. The old heavy question is no longer rendered; Intake now asks “What are you trying to make real?”

## Smallest coherent repair checkpoint

1. Restore an honest, completable Intake → Recommendations state transition.
2. Remove fake-personal bakery output and all customer-visible Squibb references.
3. Fix the measured contrast failures.
4. Prune internal narration and normalize Membership/Foundry terminology.

That checkpoint would materially improve the next sales walkthrough without expanding into an unbounded redesign.

## CBCC return ledger

- **Thufir / COMPUTER:** substantive terminal personal walk harvested from the exact existing Perplexity task. Verdict: PATCH. It independently confirmed header continuity, Maria removal, no wealth-ranking doctrine violation, the bakery example, repeated draft/legal language, missing legal-entity/accountability details, and a CSP font violation. The return did not echo the chaser custody nonce; therefore it is advisory evidence, **not a canonically validated receipt**.
- **Petra:** validated terminal blocker receipt returned from the exact existing Petra task with the custody token echoed. Petra personally attempted the live walk, but that task's browser could not fetch production. Verdict: `STOP__LIVE_REVIEW_EXECUTION_BLOCKED`; this is an evidence-execution blocker, not a STOP verdict on Werkles.
- **Skybro, Ender, Bean:** focused packets exist, but the existing-seat routes timed out without send evidence. No replacement task, persona, subagent, or environment was created. They are route blockers, not reviews and not receipts.

## Crew integrity note

This is therefore a full Foreman public walk plus one substantive cousin review—not a falsely advertised five-seat consensus. The separate dispatch ledger remains at `foreman/crew-dispatch/WERKLES_LIVE_SITE_FULL_RED_TEAM_20260831_DISPATCH.md`.
