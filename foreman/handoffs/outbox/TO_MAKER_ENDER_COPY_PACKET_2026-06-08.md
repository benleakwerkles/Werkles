# To Maker: Ender-Directed Site Copy Packet

## Status
Draft copy packet from Dink / Lowkey / Bulldozer for Alvin Maker.

Ben asked for copy based on Ender's art direction. Ender directs intent, imagery, and flow. Dink renders draft words. Ben has final authority over final copy, creative direction, and all BLD-family decisions.

This is implementation-ready draft copy, not final approved public copy.

## Source Inputs
- `FROM_ENDER - Art Direction v1`, received as pasted text on 2026-06-08.
- `company/WERKLES_BRAND_VOICE.md`
- `company/WERKLES_UX_LAW.md`
- Current surfaced copy in `lib/copy.ts`, `app/page.tsx`, `app/proof/page.tsx`, `app/dashboard/crucible/page.tsx`, `app/dashboard/billing/page.tsx`, `app/membership/page.tsx`, `app/membership/success/page.tsx`, `index.html`, and `app.js`.

`WERKLES_FOUNDATION` was referenced by Ender but was not found as a repo file in this workspace scan. This packet follows the Foundation constraints quoted inside Ender's direction: see reality, surface options, preserve sovereignty, avoid static identity language, frame matching as potential, and treat trust as the floor that lets people act.

## Write Lane For This Slice
Ben's current instruction says Maker will implement the copy once written.

This packet records a bounded copy implementation slice for Maker. Maker may edit copy-bearing files needed for this slice, including:

- `lib/copy.ts`
- `app/page.tsx`
- `app/proof/page.tsx`
- `app/dashboard/crucible/page.tsx`
- `app/dashboard/billing/page.tsx`
- `app/membership/page.tsx`
- `app/membership/success/page.tsx`
- `index.html`
- `app.js`

Stay within copy and minor copy-structure changes. Do not push, deploy, run paid calls, enter secrets, connect providers, apply SQL, mutate production data, or promote draft copy to approved public status.

## Narrative Spine
The story is not "we match you with a partner."

The story is:

Someone is building alone. They can feel a gap but cannot name it. Werkles helps them see what the work is actually asking for: a partner, a place, equipment, capital, a bank, or enough proof to move safely. Squibb helps surface the option, but the founder chooses. Trust clears the runway. The proof is not that they found a thing. The proof is that they became able to move.

Felt arc:

Stuck and alone -> seen -> shown the real missing piece -> able to act safely -> changed.

## Voice Rules
Use:

- Plain, warm, operator-grade language.
- Short sentences.
- Earned hope.
- Specific concrete nouns.
- "Potential" instead of "fit" or "compatibility."
- "Runway" or "proof" instead of "trust score" where the UI allows.

Avoid visible copy using:

- "dossier"
- "compatibility"
- "fit" as the matching frame
- "guaranteed trust"
- "payment processed" as the success moment
- hype, startup gloss, or hero claims that sound like magic
- cold "preview shell" language on emotional surfaces

Safety copy can still say "preview," "placeholder," "disabled," "provider pending," and "counsel review required" where accuracy requires it.

## Global Copy
Use these as shared copy constants where practical.

Site name:

```text
Werkles
```

Short brand line:

```text
Find what your build is really missing.
```

Long positioning line:

```text
Werkles helps Main Street builders find the partner, place, proof, money, or next opening they did not know to ask for.
```

Membership disclaimer:

```text
Foundry Dues unlock Werkles workflows. They do not guarantee trust, verification, funding, legal clearance, or partner outcomes.
```

Proof disclaimer:

```text
Proof and Crucible surfaces are preview placeholders until counsel and providers approve live checks.
```

Login preview:

```text
Sign-in is a preview surface. OAuth and production login require a human gate, and no secrets belong in this build.
```

Default Squibb hint:

```text
Squibb: I can help surface the next useful option. You make the call.
```

Nav label suggestions:

- `Pricing` -> `Dues`
- `Membership` -> `Foundry`
- `Proof` -> `Proof`
- `Crucible` -> `Crucible`
- `Billing` -> `Billing`
- `Login` -> `Sign in`
- `Match prototype` -> `Workbench`

## Home Page Copy
This page should follow Ender's four acts: Spark, Reveal, Forge, Foundry.

### Act I: Spark / Hero
Image direction for Maker to preserve in layout notes only: one founder alone with the unfinished work. No product UI. No team shot.

Eyebrow:

```text
For the founder who can feel the gap
```

H1:

```text
Something is missing. It may not be what you think.
```

Body:

```text
Werkles helps you look at the work in front of you, name the real gap, and move toward the people, place, proof, or capital that can change what comes next.
```

Primary CTA:

```text
Find the missing piece
```

Keep the hero to one CTA if the layout allows. If a secondary link is required for routing, use:

```text
See how proof works
```

### Act II: Reveal / Discovery
Section eyebrow:

```text
The reveal
```

H2:

```text
You came looking for one answer. Werkles helps name the one underneath.
```

Body:

```text
Maybe it is not another hire. Maybe it is a licensed partner, a small bay, a truck, a bank that understands the deal, or enough clean proof for the right person to say yes. Squibb helps surface the option. The choice stays yours.
```

Optional supporting line:

```text
The category matters less than seeing it clearly enough to act.
```

CTA:

```text
See what can move
```

If Maker builds reveal cards, use thought-to-reveal pairs like these:

```text
I thought I needed a cofounder.
The work may be asking for a licensed operator and a place to start.
```

```text
I thought I needed more hours.
The work may be asking for capital and a clean way to show it can come back.
```

```text
I thought I needed better leads.
The work may be asking for proof that lets a cautious partner take the first meeting.
```

### Act III: Forge / Trust
Section eyebrow:

```text
Proof before pressure
```

H2:

```text
Trust clears the runway.
```

Body:

```text
Once the missing piece has a name, the next risk is acting on it with real people. Werkles keeps the first steps guarded. Identity, funds, work history, licenses, and references are treated as runway, not a verdict on a person.
```

CTA:

```text
Check the runway
```

Secondary CTA, if needed:

```text
Join the Foundry
```

### Act IV: Foundry / Evidence And Invitation
Section eyebrow:

```text
The Foundry
```

H2:

```text
People leave different than they arrived.
```

Body:

```text
The proof is a shop opening, a route getting bought, a crew taking equity, a practice seeing patients, a bakery line finally running. Not because the founder was fixed. Because the missing piece became visible, and the next move became safe enough to make.
```

CTA:

```text
Join the Foundry
```

Membership price line:

```text
Foundry Dues start at {price}/mo. Checkout stays disabled until the billing gate clears.
```

## Proof Page Copy
Page eyebrow:

```text
Trust work
```

Page title:

```text
Proof before pressure
```

Intro:

```text
Proof is what lets a real intro move without asking either side to take the whole thing on faith.
```

Keep the legal/provider disclaimer visible:

```text
Proof and Crucible surfaces are preview placeholders until counsel and providers approve live checks.
```

Check copy:

Identity:

```text
Confirm the person is who they say they are before an intro carries weight.
```

Funds / capital:

```text
Confirm capital claims before money becomes part of the plan.
```

Work history:

```text
Ground roles, years, and operating experience in something checkable.
```

Licenses:

```text
Check trade licenses before regulated work enters the conversation.
```

References:

```text
Gather human signals before diligence starts.
```

Background / FCRA:

```text
Placeholder only. Counsel review is required before any live background-check flow.
```

Primary CTA:

```text
Enter the Crucible
```

Secondary CTA:

```text
Join the Foundry
```

Squibb hint:

```text
Squibb: Proof clears the path. It does not make the decision for you.
```

## Crucible Page Copy
Page eyebrow:

```text
Runway clearing
```

Page title:

```text
Crucible
```

Principle:

```text
The Crucible clears the way to act. It does not promise trust, clearance, or outcomes.
```

Intro line:

```text
Squibb walks the checks forward so a real intro can start with less guessing.
```

State copy:

Locked:

```text
Title: Runway not open yet
Summary: Join Foundry to start the verification path. No live checks run in this preview.
Member note: Membership opens the workflow, not a guarantee about any person.
CTA: Open Foundry Dues
```

Membership required:

```text
Title: Foundry Dues needed
Summary: Foundry Dues unlock the Crucible workflow.
Member note: Dues do not guarantee verification, clearance, funding, or partner outcomes.
CTA: View Foundry Dues
```

Workflow available:

```text
Title: Runway check available
Summary: Preview the path for identity, capital, history, licenses, and references.
Member note: This local flow is simulated until counsel and providers approve live checks.
CTA: Continue runway check
```

Provider pending:

```text
Title: Provider connection pending
Summary: Identity and background vendors are not connected in this environment.
Member note: This stays quiet and explicit until provider accounts and counsel review clear.
CTA: Provider unavailable
```

Unavailable:

```text
Title: Not offered in this preview
Summary: This verification path is not available in the current local build.
Member note: No dead ends. Return to Proof or Foundry Dues.
CTA: Back to Proof
```

Counsel review:

```text
Title: Counsel review required
Summary: Background-check copy and flows remain placeholders until legal review.
Member note: Do not imply clearance, credit approval, or trust guarantees from this surface.
CTA: Read Proof checklist
```

Squibb hint:

```text
Squibb: I can clear the path. I cannot make the call for you.
```

## Membership / Foundry Page Copy
Page eyebrow:

```text
Foundry access
```

Page title:

```text
Join the Foundry
```

Intro:

```text
Foundry Dues open the Werkles workflows: discovery, proof, guarded intros, and the operating surfaces that help the next move take shape.
```

Disclaimer:

```text
Foundry Dues do not guarantee verification, background clearance, funding, legal approval, partner quality, or business outcomes.
```

What membership unlocks:

```text
- Discovery workbench for surfacing the real missing piece
- Crucible preview for proof and runway checks
- Guarded intro desk and proof checklist
- Billing dashboard preview while payment gates remain closed
```

Disabled checkout label:

```text
Start Foundry Dues checkout
```

Squibb hint:

```text
Squibb: Dues open the workshop. The work still has to prove itself.
```

## Billing Page Copy
Page eyebrow:

```text
Dues and invoices
```

Page title:

```text
Billing
```

Summary:

```text
A plain record of Foundry Dues and invoices, kept human because real money deserves plain language.
```

Disabled reason:

```text
Stripe checkout and the billing portal stay disabled until Ben clears the billing gate.
```

Actions:

```text
Start Foundry Dues checkout
Open dues portal
Download invoices
```

Squibb hint:

```text
Squibb: No surprises here. Dues, invoices, and gates stay visible.
```

## Success Page Copy
Page eyebrow:

```text
Threshold
```

Page title:

```text
Welcome to the Foundry
```

Panel copy:

```text
Preview mode did not process a payment. In production, this is the moment your Foundry workflow opens: discovery, proof, and guarded intros can start moving.
```

Primary CTA:

```text
Enter the Crucible
```

Secondary CTAs:

```text
Open billing
Read Proof
Back home
```

Squibb hint, reserved for this earned moment:

```text
Squibb: Blathering blatherskites. You are through the gate. Now let's see what is actually missing.
```

## Static Workbench / Prototype Copy
These strings target `index.html` and visible strings in `app.js`.

Brand subline:

```text
Find what the work is missing
```

Top nav:

```text
Discover
Intros
Proof
```

Sign-in button can stay:

```text
Sign in
```

Trust score visible label:

```text
Runway
```

Profile panel eyebrow:

```text
What is on the table
```

Profile panel title:

```text
What are you working with?
```

Form label replacements:

```text
Your lane
Primary arena
City
Radius
Capital you can put to work
Capital the move may need
Skills on the table
What could change
```

Main workspace eyebrow/title:

```text
Discovery
Potential worth exploring
```

Metric label replacement:

```text
capital partners
intro queue
```

Right rail:

```text
Need Map
Potential signals
Runway
Intro Queue
```

Right rail note:

```text
Werkles is a local discovery and introductions prototype. Deals, lending, securities, ownership documents, and regulated checks still need real legal and financial review.
```

Empty intro state:

```text
No intros queued yet. Start in Discover, save the people with real potential, then request an intro when the next conversation has earned it.
```

No search results:

```text
Nothing surfaced for that search yet.
```

View copy in `app.js`:

Discover:

```text
eyebrow: Discovery
title: Potential worth exploring
brief:
```

Intros:

```text
eyebrow: Intro Desk
title: Conversations with a reason
brief: Use this view to pressure-test whether a requested intro has enough potential, capital clarity, and proof to be worth the next conversation.
```

Proof:

```text
eyebrow: Proof Work
title: Runway before pressure
brief: These are local prototype readiness checks. Anything involving legal, lending, securities, ownership, identity vendors, or production data still needs the proper human gate.
```

Replace visible matching reasons that say "fit":

```text
old: Worker / builder fits trade operator
new: Your lane may unlock their next move
```

```text
old: partial capital fit
new: partial capital path
```

```text
old: candidate can fund your ask
new: candidate may cover your capital gap
```

Use "potential" in UI labels and explanatory copy. Internal variable names may remain unchanged if changing them would create unnecessary risk.

## Squibb Rules For Maker
Squibb is the discovery Aeye here.

Use him when he is doing work:

- Reveal: he helps surface what the founder did not know to ask for.
- Crucible: he clears checks and hands results back.
- Success: he welcomes at the threshold.
- Dashboard/workbench: he points to the next useful option.

Do not make Squibb:

- the chooser
- an autopilot
- a mascot blocking the work
- a source of legal, financial, or trust guarantees

Default line:

```text
Squibb: I can help surface the next useful option. You make the call.
```

## Human Gates
Still stop for:

- Final creative direction approval.
- Promotion of draft copy to approved or published status.
- Any deploy, push, release, or public launch.
- Stripe, billing, OAuth, account, provider, credential, or secret work.
- Counsel/legal approval for live proof/background/check flows.
- SQL, schema, RLS, or production data mutation.

## Verification For Maker
After implementing copy locally:

```powershell
npm run typecheck
npm run build
```

If touching the static prototype, also run:

```powershell
node --check app.js
```

Then create a result handoff under `foreman/handoffs/` with:

- files changed
- copy surfaces updated
- checks performed
- any human gate encountered
- next suggested slice

## Next Action
Maker should implement this copy locally, staying within the bounded copy implementation slice above, then report back in a result handoff. Ben should not have to relay any of this manually.
