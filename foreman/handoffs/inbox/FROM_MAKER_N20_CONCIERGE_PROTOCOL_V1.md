# FROM MAKER - N20 CONCIERGE PROTOCOL V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: operator protocol handoff. No production deploy, SQL, secrets, billing, merge, legal approval, Stripe action, payment collection, payment test, app code, software build, verification run, Bellows run, or live data mutation is approved by this file.

## Mission

Draft the operator-executable protocol for the first 20 Werkles concierge users.

Use:

- `FROM_MAKER_CONCIERGE_KILL_THRESHOLD_V1.md`
- `FROM_MAKER_FIRST5_DASHBOARD_V1.md`
- `FROM_MAKER_PAYMENT_SIGNAL_REVIEW_V1.md`
- `FROM_MAKER_CUSTOMER_LANGUAGE_BOUNDARY_V1.md`
- `FROM_MAKER_RECOMMENDATION_VIEW_V1.md`
- `FROM_MAKER_DECISION_SUPPORT_VS_MATCHING_MAP_V1.md`

No new research. No software build. No app code.

## Pricing Flag

```text
PRICING IS PENDING OPERATOR DECISION.
```

Default protocol until Ben decides otherwise:

```text
N=20 concierge sessions are free test sessions.
Paid is not tested.
Would Pay and Would Refer are tracked as signals only.
No one is called a customer unless they actually pay Werkles through a separately approved payment path.
```

---

# 0. What This Test Is

Working name:

```text
20-user concierge experiment
```

Core test:

```text
Can Werkles manually move 20 serious people from Layer 0 intake to a visible recommendation they understand, trust enough to act on, and find valuable enough to continue?
```

Primary chain:

```text
Layer 0 -> Need Translation -> One Bottleneck -> One Explained Recommendation -> One Next Action -> Follow-up Outcome
```

What this test does not prove:

- scaled matching
- production software readiness
- legal/compliance approval
- pricing conversion
- paid acquisition
- public launch readiness
- verified trust architecture
- full marketplace liquidity

---

# 1. Participant Language

Use precise terms.

| Stage | Correct term | Do not call them |
|-------|--------------|------------------|
| Identified possible fit | candidate | user, participant, customer |
| Expressed interest / invited | lead | customer |
| Starts intake/session | participant or tester | customer |
| Paid by Werkles to test | paid participant | paying customer |
| Names someone serious | referral signal | customer |
| Referred person responds | referred lead | customer |
| Pays Werkles through approved path | customer | only then customer |

Default N=20 term:

```text
participant
```

Safe reporting:

```text
20 invited candidates
16 started participants
14 completed-intake participants
10 action-taken participants
8 Would Refer signals
0 customers because pricing/payment was not tested
```

Unsafe reporting:

```text
20 users/customers.
```

---

# 2. Stranger / Known Ratio

Purpose:

```text
Avoid proving only that Ben's closest circle is polite.
```

Definitions:

```text
Known = Ben already has a relationship strong enough that the person may be biased by trust, friendship, obligation, or wanting to help.
Warm stranger = introduced by someone, but Ben does not have a meaningful existing relationship.
Stranger = no meaningful prior relationship with Ben; may come from outbound, waitlist, community, or referral.
```

Required N=20 mix:

| Group | Target | Minimum | Maximum |
|-------|--------|---------|---------|
| Known | 6 | 4 | 8 |
| Warm stranger | 6 | 4 | 8 |
| Stranger | 8 | 6 | 12 |

Hard rule:

```text
At least 10 of 20 must be warm strangers or strangers.
At least 6 of 20 must be true strangers.
No more than 8 of 20 may be known to Ben.
```

Why:

- known participants are useful for speed and candor
- strangers test clarity, trust, and language without preloaded Ben trust
- warm strangers test referral trust

Record source per participant:

```text
Known / Warm stranger / Stranger
Source:
Relationship to Ben:
Bias risk: Low / Medium / High
```

---

# 3. Paid / Free Rules

## Default rule

```text
All N=20 sessions are free unless Ben explicitly creates and approves a separate payment test.
```

## Pricing status

```text
Pricing is PENDING OPERATOR DECISION.
```

Do not:

- collect money
- create Stripe products
- run checkout
- ask for payment details
- imply a price is final
- call free participants customers
- treat Would Pay as Paid

Do:

- ask Would Pay after recommendation delivery
- record exact words
- separate Paid / Would Pay / Would Refer
- mark Paid as `not tested` unless an approved payment path exists

## Approved language during N=20

Before session:

```text
This is a free concierge test session. Pricing is not decided yet. We are testing whether the recommendation is clear, useful, and worth acting on.
```

After recommendation:

```text
Pricing is pending operator decision, so this is not a checkout. If Werkles kept doing this, would you pay for another recommendation or ongoing access? If yes, what would feel fair?
```

## If someone asks to pay

Record:

```text
Would Pay: Strong
Exact words:
Requested price/package:
```

Respond:

```text
Pricing is pending operator decision. We are not taking payment in this test unless Ben separately opens an approved payment path.
```

---

# 4. Exact Intake Questions

Use these exact questions for every participant.

## Intake Question 1 - Situation

```text
In a sentence or two, where are you right now?
```

Capture:

- current situation
- business/project/life context
- immediate terrain

## Intake Question 2 - Goal

```text
What are you trying to move toward in the next 3 to 6 months?
```

Capture:

- stated goal
- timeline
- desired movement

## Intake Question 3 - Why Now

```text
Why now? What changed or is pushing you?
```

Capture:

- urgency
- trigger
- pressure
- opportunity window

## Intake Question 4 - Assets

```text
What do you already have to work with?
```

Prompt if needed:

```text
Skills, time, money, network, tools, customers, a place, an idea, a crew, licenses, equipment, proof, or anything else that matters.
```

## Intake Question 5 - Stated Blocker

```text
What feels like the biggest thing in your way?
```

Important:

```text
Capture this, but do not trust it as the whole truth. The test is whether Werkles can translate the stated blocker into the real bottleneck.
```

## Intake Question 6 - Tried Already

```text
What have you already tried, and what happened?
```

Capture:

- failed attempts
- partial wins
- patterns
- repeated stalls

## Intake Question 7 - Hard Constraints

```text
What cannot change?
```

Prompt if needed:

```text
Location, time, money floor or ceiling, family obligations, job constraints, licenses, legal limits, equipment, partner constraints, or anything else fixed.
```

## Intake Question 8 - One Thing

```text
If a stranger could hand you one thing right now, what would it be?
```

Capture:

- perceived need
- hidden demand
- mismatch with stated blocker

## Intake Question 9 - Lane

```text
Which best describes you today: Builder, Operator, Backer, Connector, Spark, or not sure yet?
```

Important:

```text
Not sure yet is allowed. Do not force lane certainty.
```

## Intake Question 10 - Contact / Timing

```text
How do we reach you, and how soon do you want a first answer?
```

Capture:

- preferred contact
- expected response timing
- follow-up permission

## Optional Question 11 - Anything Else

```text
Anything else you want us to know?
```

Use only after the ten required questions.

---

# 5. Session Structure

## Session length

Target:

```text
30 minutes participant-facing
30 minutes or less Ben synthesis time
```

Hard tracking:

```text
Ben minutes per completed recommendation
```

## Session phases

### Phase 1 - Open boundary, 2 minutes

Say:

```text
This is a free Werkles concierge test session. Pricing is pending operator decision. We are testing whether we can turn your situation into one useful, explained next action. Werkles is not a bank, lender, broker, investment adviser, escrow provider, law firm, employer, or guarantor. We do not verify people in this session, and we do not move money.
```

Record:

```text
Boundary understood? Y/N
Any confusion?
```

If confusion persists:

```text
STOP session. Record boundary confusion.
```

### Phase 2 - Intake, 15 to 20 minutes

Ask the exact ten intake questions.

Do not:

- coach toward the answer Ben wants
- sell the product
- ask for sensitive documents
- ask for secrets
- request payment information
- promise intros

### Phase 3 - Speaker capture, 5 minutes

Use the Speaker capture template below.

Goal:

```text
Preserve the participant's own words before Werkles translates them.
```

### Phase 4 - Ben synthesis, target 15 to 30 minutes

Ben fills:

- Layer 0 restatement
- Need Translation
- bottleneck candidates
- primary bottleneck
- confidence
- visible reasons
- recommendation
- why not alternatives
- next action
- what would change the recommendation
- not-claiming line

### Phase 5 - Recommendation delivery, 10 minutes

Deliver one Recommendation View / card:

1. What You Asked For
2. What We Heard Underneath It
3. Visible Reasons
4. Recommendation
5. Why Not The Alternatives
6. What Would Change This Recommendation
7. Next Action

### Phase 6 - Scorecard questions, 5 minutes

Ask:

```text
In your own words, what do you think Werkles is recommending and why?
```

Ask:

```text
Did the visible reasons make this feel more trustworthy, less trustworthy, or unchanged?
```

Ask:

```text
If Werkles kept doing this, would you pay for another recommendation or ongoing access? If yes, what would feel fair?
```

Ask:

```text
Is there one specific serious person you would send this to? If yes, who are they in relation to you, and why them?
```

Close:

```text
Your next action is: <one action>. I will follow up in 7 days to see whether you took it and what happened.
```

---

# 6. Speaker Capture Template

Purpose:

```text
Speaker captures how the participant naturally describes their situation before Werkles edits it into product language.
```

Fill this during or immediately after intake.

```text
PARTICIPANT ID: U__
Date:
Source: Known / Warm stranger / Stranger

SPEAKER - RAW VOICE
Exact phrases they used:
-
-
-

SPEAKER - STATED ASK
What they think they are asking for:

SPEAKER - EMOTIONAL PRESSURE
What sounds urgent, scary, exciting, stuck, or expensive:

SPEAKER - WORDS TO REUSE
Words/phrases that should appear in the recommendation because they are theirs:

SPEAKER - WORDS TO AVOID
Words/frames that made them confused, defensive, or misled:

SPEAKER - AUDIENCE
If this person had to explain the need to someone else, who should hear it?

SPEAKER - BOUNDARY CHECK
Did they imply Werkles is finding investors, brokering, guaranteeing, advising, verifying, or handling money?
Y/N:
If yes, exact phrase:
Correction given:
```

Speaker does not verify claims. Speaker does not create customer language. Speaker preserves the voice and clarifies the ask.

---

# 7. Operator Worksheet

Use one worksheet per participant.

```text
PARTICIPANT ID: U__
Source: Known / Warm stranger / Stranger
Started intake: Y/N
Completed intake: Y/N
Recommendation delivered: Y/N

A. LAYER 0 RESTATEMENT
Situation:
What they have:
What they want:
Hard constraints:
What they think blocks them:

B. NEED TRANSLATION
Stated need:
Translated need(s): partner / capital / customer / skill / license / intro / validation / clarity / other
Mismatch noticed:

C. BOTTLENECK
Plausible blockers:
Primary bottleneck:
Why this one:
Confidence: HIGH / MEDIUM / LOW

D. VISIBLE REASONS
Reason 1:
Reason 2:
Reason 3:
Weak or self-reported signal:

E. RECOMMENDATION
Best next path:
Supporting person/resource/tool, if needed:
What this is not claiming:

F. WHY NOT ALTERNATIVES
Alternative 1:
Why not first:
Alternative 2:
Why not first:

G. WHAT WOULD CHANGE THIS
New fact that would change the recommendation:
Missing evidence:

H. NEXT ACTION
One action:
Expected timing:
7-day follow-up date:

I. BEN TIME
Intake minutes:
Synthesis minutes:
Delivery minutes:
Follow-up minutes:
Total concierge minutes:
Pattern type:
```

---

# 8. Recommendation Delivery Template

Use this exact shape.

```text
RECOMMENDATION - U__
Date:

WHAT YOU ASKED FOR
<plain reflection of their literal ask>

WHAT WE HEARD UNDERNEATH IT
<translated need / real bottleneck hypothesis>

VISIBLE REASONS
1. <reason tied to intake>
2. <reason tied to intake>
3. <reason tied to intake>

RECOMMENDATION
Best next path: <one concrete move>
Supporting, if needed: <person/resource/tool that directly unblocks it>

WHY NOT THE ALTERNATIVES
<alternative> - <why not first, for them, now>
<alternative> - <why not first, for them, now>

WHAT WOULD CHANGE THIS RECOMMENDATION
<new info/proof/constraint that would change the answer>

NEXT ACTION
<one concrete, low-friction action>

WHAT WERKLES IS NOT CLAIMING
Werkles is not verifying people in this session, guaranteeing outcomes, giving legal/financial/investment advice, brokering deals, lending money, holding money, or vouching for anyone. This recommendation is based on what you told us and the visible reasons above.
```

---

# 9. Hard Metrics

Track for every participant:

| Metric | Per-user field | N=20 target |
|--------|----------------|-------------|
| Completion | completed enough intake for recommendation | 14+/20 GO |
| Clarity | can restate ask/heard/recommendation/next action | 15+/20 GO |
| Trust | visible reasons increased trust | 14+/20 GO |
| Action | took next action within 7 days | 10+/20 GO |
| Would Pay total | Soft + Strong Would Pay | 10+/20 GO |
| Strong Would Pay | strong payment intent | 5+/20 GO |
| Would Refer specific | names one specific serious referral candidate | 8+/20 GO |
| Referral follow-through | usable intro/path within 7 days | 4+/20 GO |
| Paid | actual payment to Werkles | Not tested unless approved |
| Ben time | concierge minutes per completed rec | median <= 30 min GO |
| Over-60 cases | recs over 60 Ben minutes | 0-3 GO |
| Repeatable pattern | recommendation fits pattern | 12+/20 GO |
| Boundary confusion | user misunderstands role | 0 severe; no pattern |
| Wrong-room user | outside target audience | 0-4 GO |

Paid rule:

```text
Pricing is PENDING OPERATOR DECISION.
Paid is marked NOT TESTED unless a separate approved payment path exists.
```

---

# 10. Kill Thresholds

## Hard STOP at any time

Stop before N=20 if any occur:

- severe trust/safety incident
- private data exposure
- user reasonably thinks Werkles is a broker, lender, bank, investment adviser, escrow provider, law firm, employer, or guarantor
- user thinks Werkles verified or vouched for someone when it did not
- user is pressured toward payment, investment, financing, hiring, legal, or partnership action
- secret or sensitive document handling mistake outside zero-knowledge posture

## GO at N=20

GO requires:

```text
0 hard safety failures
14+ completion
15+ clarity
14+ trust
10+ action
10+ Would Pay total
5+ Strong Would Pay
8+ Would Refer specific
4+ referral follow-through
median Ben time <= 30 minutes
no more than 3 over-60-minute cases
12+ repeatable recommendation patterns
0-4 wrong-room users
```

Paid:

```text
If not tested, Paid is not a kill metric.
If approved/tested, GO = 4+ of 20 pay.
```

## CAUTION at N=20

CAUTION if any land in these ranges and no hard STOP exists:

```text
8-13 completion
10-14 clarity
9-13 trust
5-9 action
5-9 Would Pay total
2-4 Strong Would Pay
4-7 Would Refer specific
2-3 referral follow-through
31-60 minute median Ben time
4-6 over-60-minute cases
7-11 repeatable patterns
5-9 wrong-room users
1-3 mild corrected boundary-confusion cases
```

## STOP-risk at N=20

STOP-risk if:

```text
7 or fewer completion
9 or fewer clarity
8 or fewer trust
4 or fewer action
0-4 Would Pay total
0-1 Strong Would Pay
0-3 Would Refer specific
0-1 referral follow-through
median Ben time > 60 minutes with no obvious template path
7+ over-60-minute cases
6 or fewer repeatable patterns
10+ wrong-room users
4+ boundary-confusion cases
```

---

# 11. External Referee Role

Purpose:

```text
Prevent Ben from over-crediting vague praise, under-counting failures, or upgrading participants into customers.
```

Referee profile:

- not Ben
- not the participant
- can read with confidentiality
- understands Werkles is not a bank/lender/broker/adviser/law firm/employer/guarantor
- willing to say NO
- not financially rewarded for GO

Referee does not:

- approve launch
- approve pricing
- approve legal/compliance
- approve payment collection
- approve intros
- verify users
- make product decisions for Ben

Referee does:

1. Review anonymized records after Users 5, 10, 15, and 20.
2. Check whether completion/clarity/trust/action/Would Pay/Would Refer were counted honestly.
3. Flag fake traction language.
4. Flag boundary confusion.
5. Select 3 recommendation cards at random and score:
   - clear ask reflection
   - clear need translation
   - visible reasons
   - one next action
   - no false verification/vouching
6. Write a short referee note:

```text
REFEREE NOTE - U01-U05 / U06-U10 / U11-U15 / U16-U20
Counts look honest? Y/N
Fake traction language spotted?
Boundary issues?
Recommendation cards understandable?
Main concern:
```

Minimum referee intervention:

```text
If referee flags a hard safety/boundary problem, pause before next participant.
```

---

# 12. Post-Session Follow-Up

Follow up at:

```text
24 hours after recommendation
7 days after recommendation
```

## 24-hour follow-up

Purpose:

- catch confusion
- correct boundary misunderstandings
- confirm next action is understood

Message:

```text
Quick check: can you tell me in your own words what you think the recommendation is and what next action you are taking? Also, did any part of the recommendation feel unclear or overstated?
```

Record:

```text
Clarity pass: Y/N
Boundary confusion: Y/N
Correction needed:
```

## 7-day follow-up

Purpose:

- measure action
- measure outcome
- measure Would Pay / Would Refer

Message:

```text
Seven-day check: did you take the next action? What happened? Did the recommendation still feel right after a week? If Werkles kept doing this, would you pay for another recommendation or ongoing access? Is there one specific serious person you would send this to?
```

Record:

```text
Action taken: Y/N/Partial
Result:
Still felt right: Y/N/Mixed
Would Pay: None / Soft / Strong
Would Refer: None / Vague / Specific / Followed through
Referral candidate type:
```

## Do not do during follow-up

- pressure payment
- ask for card details
- imply limited-time offer
- create urgency
- promise intros
- verify claims
- ask for sensitive documents

---

# 13. N=20 Review Process

Do this only after:

```text
20 invited candidates have been accounted for
all delivered recommendations have had 7-day follow-up opportunity
hard STOP incidents have been reviewed
external referee has reviewed the final packet
```

## Step 1 - Freeze the dataset

Create the N=20 review packet:

```text
N20_REVIEW_PACKET
participant rows U01-U20
all score fields
all recommendation cards
all follow-up results
all warning flags
referee notes
Ben time log
stranger/known ratio
```

Do not change counts after the review begins unless correcting a factual error. Log corrections.

## Step 2 - Verify denominators

Report:

```text
Invited candidates: __ / 20
Started participants: __ / 20
Completed-intake participants: __ / 20
Recommendation-delivered participants: __ / 20
7-day follow-up completed: __ / recommendation-delivered
Known: __
Warm stranger: __
Stranger: __
```

Check ratio rule:

```text
At least 10 warm strangers/strangers?
At least 6 true strangers?
No more than 8 known?
```

## Step 3 - Score hard metrics

Fill:

```text
Completion: __ / 20
Clarity: __ / 20
Trust: __ / 20
Action: __ / 20
Would Pay total: __ / 20
Strong Would Pay: __ / 20
Would Refer specific: __ / 20
Referral follow-through: __ / 20
Paid: NOT TESTED / __ of __ offered payment path
Median Ben minutes:
Over-60 cases:
Repeatable patterns: __ / 20
Wrong-room users: __ / 20
Boundary confusion: __ / 20
Hard STOP incidents:
```

## Step 4 - Classify

Choose exactly one:

```text
GO
CAUTION
STOP
```

GO:

```text
Continue into the next bounded cohort and start turning highest-friction concierge steps into product.
```

CAUTION:

```text
Pause expansion. Patch the weak joint. Retest the corrected part before another broad cohort.
```

STOP:

```text
Do not continue this concierge experiment in current form. Pivot to a smaller, safer, sharper test.
```

## Step 5 - Name the failure or proof

Pick primary evidence:

```text
Completion
Clarity
Trust
Action
Would Pay
Would Refer
Paid, if tested
Labor
Repeatability
Audience quality
Safety/boundary
```

Write one paragraph:

```text
The N=20 result is <GO/CAUTION/STOP> because <specific counts>. The strongest evidence is <metric>. The weakest joint is <metric>. The next move is <one action>.
```

## Step 6 - Preserve language boundary

Final report must use:

```text
candidates
participants
testers
leads
referral signals
referred leads
customers only if paid through approved path
```

Never write:

```text
20 customers
20 users proved demand
referrals are customers
Would Pay equals revenue
Paid participant equals customer
```

---

# 14. Operator Quick Checklist

Before U01:

```text
[ ] Pricing marked PENDING OPERATOR DECISION
[ ] Session is free unless separate payment gate exists
[ ] Intake questions ready
[ ] Speaker capture template ready
[ ] Operator worksheet ready
[ ] Recommendation template ready
[ ] Scorecard ready
[ ] Stranger/known source field ready
[ ] External referee selected
[ ] Hard STOP rules visible
```

During each user:

```text
[ ] Boundary read
[ ] Exact intake questions asked
[ ] Speaker raw words captured
[ ] One bottleneck named
[ ] One recommendation delivered
[ ] One next action assigned
[ ] Clarity checked
[ ] Trust checked
[ ] Would Pay checked
[ ] Would Refer checked
[ ] 24-hour follow-up scheduled
[ ] 7-day follow-up scheduled
```

After U05 / U10 / U15 / U20:

```text
[ ] Metrics counted
[ ] Warning flags reviewed
[ ] Referee note collected
[ ] Continue / patch / stop decision recorded
```

---

# Maker Recommendation

Run N=20 as a manual concierge protocol, not a product launch.

The test is successful only if participants:

```text
complete intake
understand the recommendation
trust the visible reasons
take the next action
show Would Pay / Would Refer signals
fit repeatable recommendation patterns
do not misunderstand Werkles' boundaries
```

Pricing remains:

```text
PENDING OPERATOR DECISION
```

Until Ben explicitly decides a payment test, record:

```text
Paid: not tested.
Would Pay: measured.
Would Refer: measured.
Customers: zero, unless actual approved payment occurs.
```
