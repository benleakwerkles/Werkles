# TO_ENDER — homepage "How it works" show-don't-tell pass — RED TEAM REQUEST

From: Lady Jessica (Cursor foreman, `LOCAL_SALLY_WINDOWS`)
Date: 2026-08-02 ~18:20 ET
Status: DRAFT — built, rendered locally, NOT pushed. Awaiting your teardown, then Ben's call.
Screenshot: `HOWITWORKS_MOCKS_RENDER_20260802.png` (same folder — Ben, attach it with this packet).

## Operator directive (verbatim, 2026-08-02)

> The landing page should have more actionable buttons — "How it Works" should
> have links to "Stating what you need" not just words. This is more "Show not
> tell" that I complained about in my initial review. I'd rather have a link
> here and a mock of what that screen looks like — even if it's not to scale —
> so this home page isn't just "READ READ READ" [...] People like to see things
> and click, they don't like to read.

## What was built

The homepage `#how` section ("Name it. Verify it. Move.") kept its three step
cards but each card now carries:

1. A **stylized mini-screen mock** (`aria-hidden`, same visual language as the
   hero's "Example Werkles output" plate: parchment gradient, copper frame,
   teal proof accents).
2. A **real CTA link** styled as a pill button.

Card by card:

| Step | Mock content | CTA | Destination |
|---|---|---|---|
| State the need. | Fake input: "I need more customers for my home bakery" + caret + violet "Name it" pill | Try stating a need → | `/bellows/intake` |
| Translate the bottleneck. | "You said: customers" (struck through) above teal chip "Real gap: a $4,200 oven", labeled WERKLES ANSWERS | See a real translation → | `/spark` (four-act story) |
| Check proof. Then act. | Checklist rows: Identity ✓ verified · License ✓ current · Funds ✓ threshold met, labeled SELLER CHECKS | See how proof looks → | `/proof` |

Above the grid: "Stylized previews — tap any step to see the real thing."

## New code (complete, for your review without repo access)

JSX data (`app/page.tsx`):

```tsx
const howStepDemos = [
  { href: "/bellows/intake", cta: "Try stating a need",
    mock: <div className="how-mock" aria-hidden="true">
      <p className="how-mock__label">You type</p>
      <div className="how-mock__field">I need more customers for my home bakery<span className="how-mock__caret" /></div>
      <span className="how-mock__send">Name it</span>
    </div> },
  { href: "/spark", cta: "See a real translation",
    mock: <div className="how-mock" aria-hidden="true">
      <p className="how-mock__label">Werkles answers</p>
      <div className="how-mock__swap">
        <span className="how-mock__said">You said: customers</span>
        <span className="how-mock__real">Real gap: a $4,200 oven</span>
      </div>
    </div> },
  { href: "/proof", cta: "See how proof looks",
    mock: <div className="how-mock" aria-hidden="true">
      <p className="how-mock__label">Seller checks</p>
      <ul className="how-mock__checks">
        <li><span>Identity</span><em>verified</em></li>
        <li><span>License</span><em>current</em></li>
        <li><span>Funds</span><em>threshold met</em></li>
      </ul>
    </div> }
];
```

Each card renders: icon → h3 → one-line body → mock → CTA link. Styles mirror
`.hero-artifact__plate` (border `rgba(159,102,51,.28)`, parchment gradient,
teal `--werkles-teal-deep` accents, violet `--werkles-violet-deep` send pill).

## What I want torn apart (defect-first, no politeness)

1. **Honesty check:** `/bellows/intake` exists and renders, but public intake
   SUBMISSION is closed. Is "Try stating a need" a promise the page can't
   keep? Alternative destinations: `/signup` (free account first) or keep and
   soften the verb. UX-law call, yours.
2. **Oven fatigue:** the $4,200 oven now appears in the hero artifact, the
   Squibb beat, Maria beat 4, AND the translate mock — four ovens on one page.
   Keep the through-line or vary the example?
3. **Destination fit:** does `/spark` deliver "a real translation," or does the
   four-act story feel like bait-and-switch after that CTA?
4. **Reading load:** the point was LESS reading. Each card still carries its
   original body sentence plus label plus CTA. Cut the body lines?
5. **A11y:** mocks are `aria-hidden`; screen-reader users get title + body +
   CTA only. Acceptable, or does the "WERKLES ANSWERS" translation need a
   text equivalent?
6. **Voice:** "tap any step" on desktop; "Stylized previews" jargon; CTA verb
   choices. Brand-voice pass per `WERKLES_BRAND_VOICE.md`.
7. Anything else a stranger's eyes catch in the screenshot.

## Reply format

Numbered findings, each: severity (BLOCKER / FIX / NIT) + recommended fix in
one line. I'll apply, re-render, and route the result to Ben with your
findings attached.
