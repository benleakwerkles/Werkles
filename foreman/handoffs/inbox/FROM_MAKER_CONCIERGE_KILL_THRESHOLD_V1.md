# FROM MAKER - CONCIERGE KILL THRESHOLD V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/spec handoff. No production deploy, SQL, secrets, billing, merge, legal approval, or live data mutation is approved by this file.

## Mission

Before User #1 enters the concierge experiment, define the specific N=20 results that would cause Werkles to continue, pause, pivot, or stop.

This is a pre-registered decision rule. The point is to protect Werkles from founder fog: if the first 20 people do not show the right signal, the machine changes before more people are invited into it.

## Experiment Being Judged

Working name:

```text
20-user concierge experiment
```

What the experiment tests:

```text
Can Werkles manually concierge 20 serious people from intake to a visible recommendation that they understand, trust enough to act on, and find valuable enough to continue?
```

What it does not test yet:

- scaled software automation
- full marketplace liquidity
- final trust/compliance architecture
- production-grade matching
- legal safety for every future lane
- paid acquisition efficiency
- public launch readiness

## Denominator Rules

Use these denominators so the thresholds stay honest.

```text
N=20 invited test participants
```

Track three sub-denominators:

```text
Invited: people Ben/Werkles explicitly invites into the test
Started: invited people who begin intake
Completed: started people who submit enough intake for a recommendation
```

Do not quietly remove inconvenient users from the denominator unless they were spam, duplicate, abusive, or clearly outside the agreed test audience.

## Primary Decision

At N=20, classify the experiment as:

```text
GO
CAUTION
STOP
```

If any hard STOP trigger occurs before N=20, pause immediately. Do not wait for the full sample to make the stop look softer.

---

# GO Thresholds

GO means:

```text
Continue the concierge experiment into the next bounded cohort and start turning the highest-friction concierge steps into product.
```

GO does not mean:

- public launch
- paid acquisition scale
- legal/compliance approval
- production deploy approval
- automating trust decisions
- turning recommendations into financial, legal, or investment advice

## GO requires all hard safety conditions

All must be true:

1. Zero severe trust/safety incidents.
2. Zero cases where a user reasonably thought Werkles was a bank, lender, broker, investment adviser, escrow provider, law firm, or employer.
3. Zero cases where Werkles entered, requested, exposed, or mishandled secrets or sensitive documents outside the approved zero-knowledge posture.
4. Zero unauthorized public exposure of private user information.
5. Zero pressure to make a payment, investment, financing, hiring, legal, or partnership decision through Werkles.

If any of these fail, the experiment cannot be GO.

## GO operating thresholds at N=20

### 1. Intake completion

```text
GO: at least 14 of 20 invited users complete enough intake for a recommendation.
```

Why it matters:

If people will not complete the concierge intake even with human help, the problem may not be software friction. The ask may be too abstract, too invasive, or not urgent enough.

### 2. Recommendation clarity

```text
GO: at least 15 of 20 users can correctly restate:
- what they asked for
- what Werkles heard underneath it
- the recommendation
- the next action
```

Pass condition:

The user can explain the readout back in their own words without Maker/Ben re-teaching it.

### 3. Visible-reason trust

```text
GO: at least 14 of 20 users say the visible reasons made the recommendation more trustworthy.
```

Acceptable evidence:

- 4 or 5 on a 5-point "the reasons made sense" rating
- clear qualitative statement like "I see why it picked this path"
- user challenges one reason but still trusts the readout overall

### 4. Action taken

```text
GO: at least 10 of 20 users take the recommended next action within 7 days.
```

Actions that count:

- sharpen the Workshop
- strengthen the Foundry record
- provide missing proof signals
- accept or request a concierge follow-up
- approve a private knock when eligible
- revise the ask based on the recommendation

Actions that do not count:

- "cool idea" with no movement
- polite praise
- browsing without changing anything
- asking Ben to explain the product again from scratch

### 5. Strong value signal

```text
GO: at least 8 of 20 users show strong pull.
```

Strong pull means at least one:

- says they would be disappointed if Werkles stopped the concierge test
- asks for another recommendation
- refers one specific serious person
- asks what it costs or how to keep access
- uses the recommendation in a real conversation outside Werkles
- returns unprompted with better data

### 6. Concierge labor is bounded

```text
GO: median concierge time per completed recommendation is 30 minutes or less, and no more than 3 cases exceed 60 minutes.
```

This includes:

- intake review
- recommendation synthesis
- reason writing
- next-action follow-up
- safety/trust boundary cleanup

It excludes:

- one-time tool setup
- writing this threshold doc
- building future automation

### 7. Recommendation pattern is learnable

```text
GO: at least 12 of 20 recommendations fit repeatable patterns.
```

Repeatable patterns include:

- Operator first
- sharpen Workshop
- strengthen proof before knock
- Connector next
- pause for trust gap
- Backer not yet
- narrow turf
- switch lane

If every recommendation is bespoke art, Werkles may have a consulting service, not a product workflow.

## GO summary line

```text
GO if the first 20 show: safe boundaries, completed intake, understood recommendations, visible-reason trust, real next action, strong pull from at least 8, bounded concierge labor, and repeatable recommendation patterns.
```

---

# CAUTION Thresholds

CAUTION means:

```text
Pause expansion. Do not invite the next cohort until the weak joint is fixed and retested.
```

CAUTION is not failure. It means the concierge concept has signal, but the current form is not sturdy enough.

## CAUTION triggers

Any one of these puts the experiment in CAUTION unless a STOP trigger is present.

### 1. Intake is too heavy but not dead

```text
CAUTION: 8 to 13 of 20 invited users complete enough intake for a recommendation.
```

Likely pivot:

- simplify intake
- split intake into First Weld plus deeper follow-up
- move sensitive/proof questions later
- make the user's first payoff visible sooner

### 2. Recommendation is understood by some, not most

```text
CAUTION: 10 to 14 of 20 users can correctly restate the recommendation and next action.
```

Likely pivot:

- tighten Recommendation View copy
- move "Recommendation" and "Next Action" above deeper reasoning
- reduce jargon
- add a one-line verdict

### 3. Visible reasons are interesting but not trusted enough

```text
CAUTION: 9 to 13 of 20 users say the visible reasons made the recommendation more trustworthy.
```

Likely pivot:

- make reasons more concrete
- show what was rejected
- name missing evidence more plainly
- remove fake precision
- separate proof signals from interpretation

### 4. People like it but do not act

```text
CAUTION: 5 to 9 of 20 users take the recommended next action within 7 days.
```

Likely pivot:

- next action is too vague
- trust gate is too high
- value is not urgent
- CTA does not match the recommendation
- user needs concierge follow-up, not more UI

### 5. Pull is narrow

```text
CAUTION: 4 to 7 of 20 users show strong pull.
```

Likely pivot:

- narrow the audience
- pick one lane pair first
- test only Builder -> Operator
- test only local service businesses
- test only people with an active project and a near-term decision

### 6. Concierge labor is too high but reducible

```text
CAUTION: median concierge time is 31 to 60 minutes per completed recommendation, or 4 to 6 cases exceed 60 minutes.
```

Likely pivot:

- create recommendation templates
- use structured intake
- pre-write common "why not alternatives" blocks
- turn visible reasons into a checklist
- avoid custom prose unless trust/safety requires it

### 7. Pattern is visible but not stable

```text
CAUTION: 7 to 11 of 20 recommendations fit repeatable patterns.
```

Likely pivot:

- reduce lane breadth
- define fewer recommendation types
- use explicit rule cards before using model judgment
- run a second smaller cohort inside the strongest pattern

### 8. Minor trust confusion appears

```text
CAUTION: 1 to 3 users show mild confusion about what Werkles does, but the confusion is corrected before any harmful action.
```

Examples:

- user thinks Werkles "finds investors" until corrected
- user thinks proof signals are guarantees until corrected
- user thinks a recommendation is an endorsement until corrected

Required fix:

- update copy
- update onboarding
- update recommendation trust note
- retest the corrected language before expanding

## CAUTION summary line

```text
CAUTION if there is real interest but the intake, clarity, trust, action, labor, or audience shape is not yet strong enough for the next cohort.
```

---

# STOP Thresholds

STOP means:

```text
Do not continue the concierge experiment in its current form. Either stop the concept or pivot to a smaller, safer, sharper test before inviting more users.
```

STOP is not "the company is dead." STOP means this experiment failed its kill criteria.

## Hard STOP triggers

Any one of these stops the current experiment immediately.

### 1. Severe trust/safety incident

```text
STOP: any severe trust/safety incident.
```

Examples:

- private user information exposed to the wrong person
- sensitive documents mishandled
- user pressured toward a financial/legal/hiring/partnership decision
- user reasonably believes Werkles verified or endorsed someone when it did not
- user reasonably believes Werkles is brokering, lending, advising, escrowing, or selling an investment opportunity
- harassment, coercion, or unsafe intro behavior that Werkles failed to catch or respond to

### 2. Boundary confusion is not isolated

```text
STOP: 4 or more of 20 users misunderstand Werkles as a broker, lender, bank, investment adviser, escrow provider, law firm, employer, or guarantor.
```

Reason:

If 20 percent of a hand-held cohort misunderstands the boundary, public scale would be unsafe.

### 3. Intake fails

```text
STOP: 7 or fewer of 20 invited users complete enough intake for a recommendation.
```

Interpretation:

The concierge promise may be too unclear, too burdensome, too sensitive, or too low-urgency for the target audience.

### 4. Recommendation clarity fails

```text
STOP: 9 or fewer of 20 users can correctly restate the recommendation and next action.
```

Interpretation:

If people do not understand the readout with concierge help, the Recommendation View is not carrying its weight.

### 5. Visible reasons fail

```text
STOP: 8 or fewer of 20 users say the visible reasons made the recommendation more trustworthy.
```

Interpretation:

Visible reasons are the core trust mechanic. If they do not create trust, Werkles loses its central differentiation.

### 6. No action

```text
STOP: 4 or fewer of 20 users take the recommended next action within 7 days.
```

Interpretation:

The recommendation may be interesting but not useful enough to change behavior.

### 7. No strong pull

```text
STOP: 3 or fewer of 20 users show strong pull.
```

Interpretation:

Polite interest is not enough. If fewer than 20 percent pull on the service, the current wedge is weak.

### 8. Concierge labor does not scale even manually

```text
STOP: median concierge time exceeds 60 minutes per completed recommendation with no obvious repeatable template.
```

Interpretation:

The work may be custom consulting. That can be valuable, but it is not yet a product-shaped concierge workflow.

### 9. Pattern does not emerge

```text
STOP: 6 or fewer of 20 recommendations fit repeatable patterns.
```

Interpretation:

If the first 20 do not reveal repeatable recommendation types, do not build automation yet.

### 10. Wrong-user signal dominates

```text
STOP: 10 or more of 20 users are outside the intended serious-builder audience after intake.
```

Examples:

- tourists
- pure passive-income seekers
- people looking for guaranteed returns
- people asking for financing without operating substance
- people trying to use Werkles as a public promotion channel
- people seeking legal/financial advice from Werkles

Interpretation:

The positioning or sourcing is attracting the wrong room.

## STOP summary line

```text
STOP if safety fails, boundaries confuse users, intake does not complete, recommendations are not understood, visible reasons do not build trust, users do not act, pull is weak, labor is custom-consulting heavy, no repeatable pattern emerges, or the test attracts the wrong room.
```

---

# Pivot Map

If the result is CAUTION or STOP, choose the pivot based on the failure mode.

## Intake failure

Pivot to:

```text
First Weld only
```

Test a smaller intake:

- lane
- arena
- turf
- what you bring
- what you need
- timeline

Do not ask for deeper proof until after the first recommendation payoff.

## Clarity failure

Pivot to:

```text
Recommendation Card V1
```

Make one compact card:

- ask
- heard underneath
- recommendation
- next action

Move alternatives and change triggers below the fold.

## Trust-reason failure

Pivot to:

```text
Visible Reasons Lab
```

Test three reason formats:

1. plain language reasons
2. proof-signal checklist
3. "why not alternatives" first

## Action failure

Pivot to:

```text
Concierge follow-up test
```

Test whether a human follow-up within 24 hours turns understanding into action.

## Pull failure

Pivot to:

```text
Narrower beachhead
```

Pick one:

- Builder needs Operator
- local service business
- food/retail operator
- first paid intro workflow
- proof-before-Backer workflow

## Labor failure

Pivot to:

```text
Template-first concierge
```

No custom prose until after a template attempt. Track where the template breaks.

## Safety/boundary failure

Pivot to:

```text
Trust boundary rewrite before any more users
```

Do not run another cohort until the confusing language is removed and reviewed.

---

# N=20 Scorecard

Use this scorecard at the end of the first 20.

```text
Invited users: __ / 20
Started intake: __ / 20
Completed recommendation-ready intake: __ / 20

Users who correctly restated recommendation + next action: __ / 20
Users who trusted visible reasons more after reading them: __ / 20
Users who took recommended next action within 7 days: __ / 20
Users showing strong pull: __ / 20

Median concierge minutes per completed recommendation: __
Cases above 60 concierge minutes: __
Recommendations fitting repeatable patterns: __ / 20

Severe trust/safety incidents: __
Boundary-confusion cases: __ / 20
Wrong-room users after intake: __ / 20

Decision: GO / CAUTION / STOP
Primary reason:
Required pivot or next cohort constraint:
```

---

# One-Screen Threshold Table

| Metric | GO | CAUTION | STOP |
|--------|----|---------|------|
| Severe trust/safety incidents | 0 | n/a | 1 or more |
| Boundary confusion | 0 severe; no pattern | 1-3 mild corrected cases | 4+ users confused, or any severe case |
| Intake completion | 14+/20 | 8-13/20 | 7 or fewer/20 |
| Recommendation clarity | 15+/20 | 10-14/20 | 9 or fewer/20 |
| Visible-reason trust | 14+/20 | 9-13/20 | 8 or fewer/20 |
| Next action taken | 10+/20 | 5-9/20 | 4 or fewer/20 |
| Strong pull | 8+/20 | 4-7/20 | 3 or fewer/20 |
| Median concierge time | 30 min or less | 31-60 min | 60+ min with no template path |
| Cases over 60 min | 0-3 | 4-6 | 7+ |
| Repeatable patterns | 12+/20 | 7-11/20 | 6 or fewer/20 |
| Wrong-room users | 0-4/20 | 5-9/20 | 10+/20 |

---

# Maker Recommendation

Use these thresholds before User #1:

```text
GO only if the first 20 produce safe, understood, trusted, acted-on recommendations with visible pull and bounded labor.
CAUTION if the signal is real but one joint is weak enough to fix before the next cohort.
STOP if safety, clarity, trust, action, pull, labor, repeatability, or audience fit fails at the thresholds above.
```

The hardest kill rule:

```text
If users do not act on recommendations, Werkles does not yet have a concierge product. It has interesting analysis.
```

The second hardest kill rule:

```text
If visible reasons do not increase trust, Werkles loses the center of the product.
```

The safety rule:

```text
If users misunderstand Werkles as handling money, giving investment/legal advice, guaranteeing people, or brokering deals, stop and rewrite before inviting more humans into the room.
```
