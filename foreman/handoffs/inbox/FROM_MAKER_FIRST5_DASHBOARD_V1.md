# FROM MAKER - FIRST 5 SESSION DASHBOARD V1

Execution context: `CURSOR_CLOUD_CONTAINER`.

Status: design/spec handoff. No production deploy, SQL, secrets, billing, merge, legal approval, verification run, payment test, or live data mutation is approved by this file.

## Mission

Create a one-page operator dashboard showing exactly what Ben needs to track during Users 1-5 of the concierge experiment.

This dashboard uses `FROM_MAKER_CONCIERGE_KILL_THRESHOLD_V1.md` as the source threshold logic, but it does not decide the full experiment early unless a hard STOP trigger appears. Users 1-5 are an early warning panel.

## Operating Rule

```text
First 5 = inspect the steel early.
N=20 = final threshold call.
Hard STOP = pause immediately.
```

Do not soften the dashboard with anecdotes. Record the counts.

---

# One-Page Dashboard

```text
CONCIERGE FIRST 5 DASHBOARD
Date range: ________        Operator: Ben        Cohort: Users 1-5

Purpose:
Can Ben manually move five serious users from intake -> recommendation -> understood next action
without safety confusion, fake trust, or custom-consulting sprawl?
```

## 1. Session Tracker

| User | Started? | Completed intake? | Rec delivered? | Clarity pass? | Trust pass? | Action by 7d? | WTP signal? | Warning flag? | Notes |
|------|----------|-------------------|----------------|---------------|-------------|---------------|-------------|---------------|-------|
| U01 | Y/N | Y/N | Y/N | Y/N | Y/N | Y/N | None/Soft/Strong | None/Caution/Stop | |
| U02 | Y/N | Y/N | Y/N | Y/N | Y/N | Y/N | None/Soft/Strong | None/Caution/Stop | |
| U03 | Y/N | Y/N | Y/N | Y/N | Y/N | Y/N | None/Soft/Strong | None/Caution/Stop | |
| U04 | Y/N | Y/N | Y/N | Y/N | Y/N | Y/N | None/Soft/Strong | None/Caution/Stop | |
| U05 | Y/N | Y/N | Y/N | Y/N | Y/N | Y/N | None/Soft/Strong | None/Caution/Stop | |

## 2. Core Metrics

| Metric | Count | First-5 read | N=20 logic it predicts |
|--------|-------|--------------|------------------------|
| Completion rate | __ / 5 | GO: 4-5; CAUTION: 2-3; STOP-risk: 0-1 | intake completion |
| Clarity score | __ / 5 | GO: 4-5; CAUTION: 3; STOP-risk: 0-2 | recommendation clarity |
| Trust score | __ / 5 | GO: 4-5; CAUTION: 3; STOP-risk: 0-2 | visible-reason trust |
| Action rate | __ / 5 | GO: 3-5; CAUTION: 2; STOP-risk: 0-1 | action taken within 7 days |
| Willingness to pay | __ / 5 | GO: 2+ strong; CAUTION: 1 soft/strong; STOP-risk: 0 with no pull | strong value / WTP signal |
| Warning indicators | __ stop / __ caution | GO: 0 stop; CAUTION: any caution pattern; STOP: any hard stop | safety/boundary risk |

## 3. Metric Definitions

### Completion rate

Count a user as complete only if they submit enough Layer 0 intake for Ben to produce a recommendation.

Completion pass:

```text
The user gives situation, goal, why-now, assets, blocker, constraints, and contact/timing.
```

Do not count:

- vague interest only
- "sounds cool"
- partial intake that leaves Ben guessing
- Ben filling missing facts from memory instead of intake

### Clarity score

Count a clarity pass if the user can restate all four in their own words:

1. what they asked for
2. what Werkles heard underneath it
3. the recommendation
4. the next action

Fast check question:

```text
In your own words, what do you think Werkles is recommending and why?
```

Pass:

```text
They can explain the readout without Ben re-teaching it.
```

Fail:

```text
They confuse the recommendation, miss the next action, or think Werkles is making a guarantee.
```

### Trust score

Count a trust pass if visible reasons made the recommendation more believable.

Fast check question:

```text
Did the visible reasons make this feel more trustworthy, less trustworthy, or unchanged?
```

Pass:

- "more trustworthy"
- 4 or 5 on a 5-point reason-trust rating
- user challenges one reason but still trusts the overall readout

Fail:

- "generic"
- "I do not see why"
- "this feels like AI smoke"
- user thinks Werkles verified something it did not verify

### Action rate

Count an action pass only if the user takes the recommended next action within 7 days.

Actions that count:

- sharpens the Workshop
- provides missing proof signals
- accepts a concierge follow-up
- revises the ask based on the recommendation
- requests/approves an eligible private knock
- uses the recommendation in a real conversation

Actions that do not count:

- polite praise
- "I'll think about it"
- browsing only
- asking Ben to explain the same thing again

### Willingness to pay

This is not a charge. Do not collect money in this test unless a separate approved payment gate exists.

Track WTP as signal only.

| Signal | Definition | Counts as |
|--------|------------|-----------|
| None | no price/access question; no return request; no referral | no WTP |
| Soft | asks "how would this work?" or "what would this cost?" without urgency | soft WTP |
| Strong | asks how to keep access, asks to pay, asks for another recommendation, refers a serious person, or says they would be disappointed if it stopped | strong WTP |

Fast check question:

```text
If Werkles kept doing this, would you want another round, and what would make it worth paying for?
```

Do not lead the witness. Record exact words if possible.

---

# Warning Indicators

## Hard STOP - pause immediately

Any one of these stops the first-5 run before waiting for User 5:

```text
1 severe trust/safety incident
1 private data exposure
1 user reasonably believes Werkles is a broker/lender/bank/investment adviser/escrow/law firm/employer
1 user thinks Werkles verified or vouched for someone when it did not
1 user is pressured toward payment, investment, financing, hiring, legal, or partnership action
1 secret/sensitive document handling mistake outside zero-knowledge posture
```

If hard STOP appears:

```text
Decision: STOP FIRST-5 RUN
Action: rewrite boundary / safety language before inviting more users
```

## CAUTION - fix before Users 6-10

Any of these creates a caution flag:

- 2 or more users fail completion
- 2 or more users fail clarity
- 2 or more users say visible reasons did not help trust
- 3 or more users take no action after recommendation
- 0 users show any WTP or strong pull
- 2 or more users are wrong-room users
- Ben needs more than 60 minutes for 2 or more recommendations
- Ben cannot pick one bottleneck/path for 2 or more users
- user says the output is obvious, generic, guru-ish, or "I already knew that"

If CAUTION appears:

```text
Decision: finish Users 1-5 if safe, then patch before Users 6-10
```

## GO-green early signs

Strong first-5 signal looks like:

- 4-5 complete intake
- 4-5 clarity pass
- 4-5 trust pass
- 3-5 take action within 7 days
- 2+ strong WTP/pull signals
- 0 hard STOP
- 0-1 caution flags
- median Ben time per recommendation at or below 30 minutes
- at least 3 recommendations fit repeatable patterns

This does not approve scale. It means the first five did not disprove the concierge path.

---

# Ben's Per-User Mini Form

Fill this after each user.

```text
USER: U__
Date intake started:
Date recommendation sent:

COMPLETION
[ ] Completed enough intake
Missing:

CLARITY
User restated recommendation? Y/N
Exact restatement:

TRUST
Did visible reasons increase trust? More / Same / Less
Exact words:

ACTION
Recommended next action:
Action taken within 7 days? Y/N/Partial
What happened:

WILLINGNESS TO PAY / PULL
None / Soft / Strong
Exact words:

WARNINGS
[ ] boundary confusion
[ ] trust/safety issue
[ ] wrong-room user
[ ] generic/obvious output
[ ] no single bottleneck
[ ] Ben time above 60 min
[ ] other:

Ben minutes:
Pattern type:
Next touch:
```

---

# First-5 Summary Block

Fill this after U05 or immediately after any hard STOP.

```text
Users invited: __ / 5
Users started: __ / 5
Users completed intake: __ / 5

Completion rate: __ / 5
Clarity score: __ / 5
Trust score: __ / 5
Action rate by 7 days: __ / 5
Willingness-to-pay / pull:
  None: __
  Soft: __
  Strong: __

Hard STOP indicators: __
Caution indicators: __
Wrong-room users: __ / 5
Recommendations over 60 Ben minutes: __ / 5
Repeatable pattern count: __ / 5

First-5 read:
[ ] GREEN - continue to Users 6-10 without changing the core flow
[ ] CAUTION - patch intake/recommendation/trust/action before Users 6-10
[ ] STOP - pause experiment; boundary/safety/value failure

Primary reason:
Patch before next user:
```

---

# One-Page Interpretation

## Green

```text
4+ completion, 4+ clarity, 4+ trust, 3+ action, 2+ strong pull, zero hard STOP.
```

Meaning:

```text
The first five support continuing the N=20 test.
```

## Caution

```text
Any core metric lands in the middle, or warning indicators repeat.
```

Meaning:

```text
The concierge promise may be real, but the current flow has a weak joint. Patch before Users 6-10.
```

## Stop

```text
Any hard STOP, or broad failure across completion/clarity/trust/action.
```

Meaning:

```text
Do not keep feeding humans into the current version. Rewrite the unsafe or unclear part first.
```

---

# Maker Recommendation

For Users 1-5, Ben should track only the things that prove or disprove the concierge spine:

```text
Did they finish?
Did they understand?
Did visible reasons increase trust?
Did they act?
Did they show pull or willingness to pay?
Did any safety/boundary warning appear?
```

If the first five produce praise but no action, mark CAUTION.

If they understand and act but nobody shows pull or WTP, mark CAUTION.

If any user misunderstands Werkles as handling money, guaranteeing people, brokering deals, or giving legal/financial/investment advice, mark STOP and rewrite before continuing.
