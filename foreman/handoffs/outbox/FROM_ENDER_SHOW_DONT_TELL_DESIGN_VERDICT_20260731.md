> **PROVENANCE CORRECTION (2026-07-31, foreman):** Produced by a Cursor
> in-session subagent wrongly given the Ender name — NOT the actual Ender
> seat (Claude/Cowork). Findings were mechanically verified and landed; the
> real Ender retains re-review authority. See
> `FROM_FOREMAN_SUBAGENT_IMPERSONATION_CORRECTION_20260731.md`.

**Execution context: `LOCAL_SALLY_WINDOWS`.** Read-only review, no files edited. Repo `C:\Users\Ben Leak\github\Werkles`, branch `maker/site-g-20260703`, commit `fd23e01`, working tree dirty (expected — this slice is uncommitted). Server on `:3000` confirmed live (PID 49232); I pulled the rendered HTML for `/spark` and `/privacy` and both served CSS bundles, so every claim below is against **what production actually ships**, not source intent. The Cursor browser tab wouldn't attach, so layout findings are computed from the served CSS rather than eyeballed — I've shown the arithmetic where it matters.

---

# 1. Spark mock surfaces — FIX (four changes, two blocking)

**Do they read as product surfaces?** Card 01 does. Cards 02–04 are currently bullets wearing a border, which is the thing Ben rejected.

**1a. BLOCKING — the checkmark contradicts the content.** `.membership-floor__surface li::before { content: "✓" }` hits every `<li>` in the grid. On `/membership` that's right: the rows are reached states ("Partner found", "Proof reviewed"). On Spark it produces:

- `✓ Trade: mobile detailing` / `✓ Where: Norfolk, 23503` / `✓ Lane: Operator` — a teal check on a profile field asserts the trade and location were verified. That is the exact claim Locke spent today removing.
- `✓ Pricing your first 90 days — in progress` and `✓ When a partner beats a loan — next` — a completed-check on an item explicitly labelled unfinished. This is the one that kills it: it doesn't read as a product surface, it reads as a *broken* product surface.
- `✓ Never the raw balance. Never a guess.` — a check on a disclaimer sentence.

Only 2 of the 11 rows earn the mark (Identity — verified; Funds — yes).

Fix, `app/spark/page.tsx` — add a class to the lists on cards 02 and 03:

```tsx
<ul className="spark-mock-rows" aria-label="Profile preview">
```
```tsx
<ul className="spark-mock-rows" aria-label="Lesson preview">
```

On card 04, delete the third `<li>` and re-place it as a paragraph after the `</ul>` (`.membership-floor__surface > p` already zeroes the margin, so this needs no CSS):

```tsx
<p>Never the raw balance. Never a guess.</p>
```

Fix, `app/globals.css` — append beside `.spark-mock-note`:

```css
/* The membership ✓ means "state reached." Spark's profile fields and lesson
   list are not reached states — a check there asserts verification, and on
   "in progress" / "next" it reads as a bug. */
.spark-mock-rows li::before {
  content: none;
}
```

**1b. BLOCKING — four cards in a three-column grid.** `.membership-floor__grid` is `repeat(3, minmax(0,1fr))` and `.narrative-act-page` has no max-width, so at 1440px the Spark floor is ~1360px wide: cards 01–03 sit at ~444px each and card 04 — the proof receipt, the most load-bearing mock — orphans alone on row two with ~900px of dead space beside it. Card 04 also inherits the default violet top rule (only `nth-child(2)` and `(3)` are recoloured), so it lands directly beneath card 01's violet and doubles the stumble.

```css
@media (min-width: 821px) {
  .spark-floor {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

**The `min-width` wrapper is not optional.** An unqualified `.spark-floor { grid-template-columns: ... }` sits later in the file than the `@media (max-width: 820px)` stack rule at identical specificity `(0,1,0)`, and would silently un-stack the phone layout. 2×2 also repairs the accent rhythm — violet/teal on top, copper/violet below, so the two violets go diagonal. Don't go 4-across: that's 325px per card, and the intake bubbles are the widest content in the group.

**1c. BLOCKING — the intake exchange has lost its two-voice contrast.** This is the answer to "is the Squibb reframe convincing." On the merits, yes — "$40k for a second van and ceramic-coating gear" → "one lender sized to the step and one bay lease" is a genuinely smaller, closer answer, which is the whole thesis of the page. And it's convincing *because* it isn't pretending to be a screenshot: "Squibb:" is an inline speaker prefix, not chrome-and-avatar mock furniture. Two bubble shapes carry the exchange. Keep the concept.

But the styling doesn't reach the page. `.spark-mock-intake__you` sets `color: var(--werkles-ink-on-paper)` at specificity `(0,1,0)`. The paper-ink guard already in the bundle —

```css
main:not(.foundry-cockpit) p:not(.eyebrow) { color: var(--werkles-ink-muted-on-paper) }
```

— is `(0,2,2)` and wins on specificity regardless of source order. Both bubbles therefore render `#44362c`. The member's words and Squibb's reply are the same colour, so the only thing separating the two voices is the tint and the left rule. Match the guard's specificity:

```css
main:not(.foundry-cockpit) p.spark-mock-intake__you {
  color: var(--werkles-ink-on-paper);
}
```

**1d. Does membership-floor language clash with the narrative-act panels? No — and I can say why concretely.** `.panel` has no rule at all in either served bundle; only `.proof-doctrine .panel` and `.gd-console .panel` are scoped. So `className="narrative-act-body panel"` resolves to just `.narrative-act-body { margin: 0 22px 20px; padding: 16px 18px }` — an unframed, transparent block. The mocks sit directly on the page gradient, not card-in-card. The reuse works.

One consequence worth a glance: `.narrative-act-hero` is the only framed object on the page and carries no shadow, while each mock surface carries `box-shadow: 0 16px 34px rgba(44,35,29,.09)`. The four mocks therefore out-rank the hero visually. On `/membership` they sit inside an `ops-card` that earns that lift. Optional, not blocking:

```css
.spark-floor .membership-floor__surface {
  box-shadow: 0 8px 18px rgba(44, 35, 29, 0.07);
}
```

**1e. 390px — SHIP.** `@media (max-width: 820px) { .membership-floor__grid, .membership-verifiers__list { grid-template-columns: 1fr } }` stacks it. The math: 44px section margin + 36px section padding leaves 310px of grid; card padding `clamp(1rem, 2vw, 1.3rem)` resolves to the 1rem floor (2vw = 7.8px), leaving 278px of content; `h3` sits at its 1.15rem floor; `min-width: 0` is set on the surface so the long intake strings can't blow the track. No overflow. The only hazard is the one in 1b.

**Optional polish on card 03** — the state words are doing the work and should look like state. Reuses the existing micro-label instead of inventing one:

```tsx
<li>What a lease actually costs <span className="membership-verifiers__purpose">done</span></li>
<li>Pricing your first 90 days <span className="membership-verifiers__purpose">in progress</span></li>
<li>When a partner beats a loan <span className="membership-verifiers__purpose">next</span></li>
```
```css
.spark-mock-rows li {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 0.75rem;
}
```

---

# 2. Privacy page — FIX (four changes, two blocking)

**2a. BLOCKING — the provider table isn't a table. Wrong class; none of the card styling landed.** On `/membership` the pattern is two classes: `membership-verifiers` on the `<section className="ops-card membership-verifiers">`, and `membership-verifiers__list` on the `<ul>`. Every bit of grid and card styling lives on `__list`:

```6785:6799:app/globals.css
.membership-verifiers__list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  margin: 1.1rem 0 0;
}

.membership-verifiers__list li {
  display: grid;
  gap: 0.25rem;
  padding: 1rem;
  border: 1px solid var(--werkles-copper-frame-soft);
  border-radius: var(--radius);
  background: var(--werkles-workshop-paper-elevated);
}
```

`/privacy` puts the *container* class on the `<ul>` and never uses `__list`. So the six providers render as one undifferentiated column: no cards, no borders, no columns, indented 40px by the UA `padding-inline-start`, on a bare `--werkles-cockpit-panel` wash with no padding or radius. (The rule sets `border-color` with no `border-width`/`border-style`, so no border draws either.) It is the least scannable block on the page — and it's the one Ben specifically asked for.

```tsx
<ul className="membership-verifiers__list privacy-holders" aria-label="Data holders by name">
```

Then go 2-up, because six providers × three columns inside a 760px `main` is only 229px per card:

```css
@media (min-width: 821px) {
  .privacy-holders {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

Same `min-width` guard, same reason as 1b.

**2b. BLOCKING — the sentences render in tracked-out uppercase.** `membership-verifiers__purpose` is `.78rem / weight 900 / letter-spacing .08em / uppercase / teal` — a micro-label built for the one-word values it carries on `/membership` ("Identity", "Funds", "Phone"). `/privacy` feeds it *"Your email, your password (stored only as a one-way hash — unreadable even to us), and your profile."* Six full sentences in 12px teal all-caps with letterspacing. This is the worst readability defect in the slice, and it's especially costly because the writing underneath it is good.

Restore the one-word role and demote the sentence to body text. Add a `role` field to each entry — `Supabase: "Account"`, `Vercel: "Hosting"`, `Stripe: "Payments"`, `Stripe Identity: "Identity"`, `Plaid: "Funds"`, `Twilio: "Phone"` — then:

```tsx
<li key={holder.name}>
  <span className="membership-verifiers__name">{holder.name}</span>
  <span className="membership-verifiers__purpose">{holder.role}</span>
  <span className="privacy-holders__holds">Holds: {holder.holds}</span>
  <span className="privacy-holders__sees">Werkles sees: {holder.werklesSees}</span>
  <span className="membership-verifiers__status">{holder.status}</span>
</li>
```
```css
.privacy-holders__holds,
.privacy-holders__sees {
  font-size: 0.88rem;
  color: var(--werkles-ink-muted-on-paper);
}
```

Now each entry scans Name → Role → Holds → Werkles sees → Status, in the same grammar as `/membership`, and "Identity / Funds / Phone" line up across both pages.

**2c. The numbered flow steps read as walkthrough, not legalese — the writing is fine, the container and the counter are not.** *"A Stripe Identity window opens. You photograph your ID and take a selfie there — inside Stripe's window, not ours"* is exactly the register Ben asked for. Two things fight it.

*Column width.* `.privacy-flows` uses the 3-column `.membership-floor__grid`, but `main` is capped at `maxWidth: 760px`. With `* { box-sizing: border-box }` that's 716px of content → 229px columns → minus ~42px card padding and the 2rem counter indent → roughly 155px of text at .88rem, about 20 characters per line. The walkthrough shreds into a ribbon. The 820px media query can't help: it's viewport-based and the viewport is wide, while the *container* is the constraint.

```css
.privacy-flows {
  grid-template-columns: 1fr;
}
```

Safe unqualified — it matches what the media query already does, so there's no phone-layout trap here. A walkthrough is read top-to-bottom anyway. (If you'd rather keep three across so a reader sees at a glance that all three checks have the same shape, the alternative is letting this section break the 760px cap — more CSS, and I'd ship the stack first.)

*The counter is misaligned.* `.membership-floor__surface li` matches `ol > li` too, so each step also picks up `padding: .55rem 0`, `border-top: 1px solid var(--werkles-copper-frame-soft)`, `font-size: .88rem`, `font-weight: 750`. That produces a hairline rule above every step including one directly beneath the `h3`; text pushed 8.8px down while the counter circle stays pinned at `top: .05rem`, so every number floats about 8px above the sentence it labels; and body sentences set at weight 750. Replace the current `.privacy-flow-steps li` block:

```css
.privacy-flow-steps li {
  counter-increment: flow-step;
  position: relative;
  padding: 0 0 0 2rem;
  border-top: 0;
  color: var(--werkles-ink-muted-on-paper);
  font-size: inherit;
  font-weight: 700;
}
```

**2d. The anti-bot section is not pulling its weight.** It's the only block in the rebuilt page that got no surface — a lone paragraph between a provider table and three walkthroughs — and it mostly recaps them (opt-in, named providers, badges). It also deflates itself inside a single paragraph: *"the rule is absolute … No check, no badge, no exceptions"* is immediately followed by *"Today, verification is in preview."* Both are true and Locke's correction must stay, but run together they make the absolutism read as walked back mid-sentence. The final clause is also garbled — "no badge on Werkles means a live check has run" parses as *"no badge means a check ran."*

Same claims, three scannable beats:

```tsx
<section style={sectionStyle}>
  <h2>How you know other members are real</h2>
  <p>
    Werkles is not a feed you scroll past bots on. The same checks that protect your
    information protect you from everyone else — and the rule applies to us too.
  </p>
  <p>
    <strong>The rule.</strong> A &ldquo;verified&rdquo; badge appears only when a real
    check ran through one of the providers named above, and you can always see which
    checks ran before you rely on anyone. No check, no badge, no exceptions.
  </p>
  <p>
    <strong>Today.</strong> Verification is in preview. No badge anywhere on Werkles
    yet reflects a live check — when that changes, this page changes first.
  </p>
</section>
```

---

# 3. The anthem line — FIX (placement, plus one word)

The no-ceiling sentence is the substance Ben asked for and ships. The quote half is misplaced, and one word is wrong.

**Placement.** A controlled surprise has to be *set apart* to be controlled. Right now the quote is the back half of a body paragraph, wedged between a list of trades ("Bakers, bookkeepers, accountants, DJs…") and three industry photos, in the same DM Sans body weight and the same muted ink as everything around it. It doesn't land as a surprise — it trails off, unattributed, in Werkles' own first-person voice. That is precisely the register that reads as borrowed grandeur, and precisely the note Ben has rejected before. Mid-page it's cheesy. As the *last* line on the page, after four sections of plain, specific, checkable copy, it's earned.

**"behemoth" is the wrong word.** It's negative-coded — bloated, lumbering — and it abstracts away Ben's own canon, which is concrete and admiring: Microsofts and Amazons and Nvidias. Naming real companies on a marketing page invites a comparison you don't want to make, so go concrete-but-neutral.

In the "Built for every trade" section, reduce the paragraph to the claim:

```tsx
<p>
  And no ceiling: the corner bakery and the next household name start from the same
  first step.
</p>
```

Then move the anthem to the end of the final section, after the CTA row, as the last thing on the page:

```tsx
<p className="spark-anthem">
  We are the music makers, and we are the dreamers of dreams.
</p>
```
```css
/* The paper-ink guard earlier in this file is (0,2,2) on `main p`; match that
   specificity or the anthem silently renders as muted body copy. */
main:not(.foundry-cockpit) p.spark-anthem {
  margin: 1.4rem 0 0;
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(1.05rem, 2vw, 1.3rem);
  color: var(--werkles-violet-deep);
}
```

Fraunces plus violet-deep marks it as a different voice without a pull-quote frame or italics, using the heading face already in the system rather than inventing anything. One line, at the end, after the work is done. That's competence with one controlled surprise.

---

# 4. Visual-grammar drift — FIX (three, all one-liners)

**4a. Two different violets, 3px apart, in the same card.** `--werkles-violet` is `#3d16ca`; the brand literal `#4520c9` is a *separate* colour used on buttons and the footer rule. Card 01 on `/spark` now shows both: `.membership-floor__surface` draws its top rule in `var(--werkles-violet)` (`#3d16ca`) while the new `.spark-mock-intake__squibb` draws its left rule in hardcoded `#4520c9`, about 20px away. Also `rgba(69,32,201,.07)` is the same literal spelled in decimal. Use the token:

```css
.spark-mock-intake__squibb {
  background: color-mix(in srgb, var(--werkles-violet) 7%, transparent);
  border-left: 3px solid var(--werkles-violet);
}
```

**4b. A second numbered-circle dialect.** The site already has one — `.profile-stage__num`: 24px, `background: #4520c9`, `color: #ffffff`. The new `.privacy-flow-steps li::before` invents a near-duplicate at 21.6px with `background: #2a0e8c` and `color: #fdf8ee`. Two numbered-step components that look almost but not quite the same is worse than either alone. Align to the token layer at minimum:

```css
.privacy-flow-steps li::before {
  /* …unchanged… */
  width: 1.5rem;
  height: 1.5rem;
  background: var(--werkles-violet);
  color: #ffffff;
}
```

**4c. Pure white on warm paper.** `.spark-mock-intake__you` uses `background: #fff`. Nothing else in the warm-paper system does — the elevated surface is `#fffaf2` and the base is `#f6efe5`. A pure-white chip on warm paper reads as a foreign object pasted in, which is exactly the "fake screenshot" failure mode this slice is trying to avoid. Recess it instead, which also makes it read as an input field the member typed into:

```css
.spark-mock-intake__you {
  background: var(--werkles-workshop-paper);
  border-radius: var(--radius);
}
```

The `border-radius: 10px` on both bubbles is also off-system (`--radius` is 8px everywhere else) — folded into the fix above; do the same on `__squibb`.

**Cleared, not drift:** buttons are fine. `box-shadow: none !important` is enforced globally on `.button, .button-dark, .button-ghost, .button-light, .header-cta, [class*=button]:where(a,button), button`, so the legacy shadow declarations in the `@layer legacy` bundle never render. Fraunces on headings and DM Sans on body are intact across both new sections.

---

## Ship order

Blocking: **1a, 1b, 1c, 2a, 2b.** Those five are what stand between this and production — three of them (1a, 2a, 2b) mean the rebuilt surfaces aren't currently delivering the thing Ben asked for, and one (1a) re-asserts a verification claim Locke just removed. **2c, 2d, 3, 4** should go in the same pass; they're all one-to-three-line changes. Nothing here requires a rethink of the concept — the four Spark mocks and the privacy walkthroughs are the right answer to Ben's reviews, they're just not reaching the browser intact.

One note outside the design scope, flagged rather than fixed: the `role="list"`/`role="listitem"` on the Spark grid is on `<article>` cards, and `/membership` doesn't do it. Harmless, but the two pages should agree.

— Ender, design judgment, Aeye CareBot Cousin Brigade
