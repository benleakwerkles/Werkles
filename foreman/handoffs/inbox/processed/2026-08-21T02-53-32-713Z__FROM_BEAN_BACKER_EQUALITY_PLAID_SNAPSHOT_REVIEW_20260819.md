PERSONAL_REVIEW: YES
SUBAGENTS_OR_DOWNWARD_DELEGATION: NONE
CUSTODY_TOKEN: CUSTODY-BEAN-BACKER-EQUALITY-7F4D1A26

# Bean Review — Backer Equality + Plaid Snapshot

## Verdict

`PATCH_BEFORE_BUILD`

The doctrine is correct and the build direction is mostly safe, but the slice is not yet protected against two subtle failures: `can_back` drifting from eligibility gate into rank signal, and copy drifting from threshold language into prestige language. Both would violate the operator law even with a binary flag.

## Three strongest attacks

### 1. `capitalPosture === "can_back"` is binary, but binary still leaks if it enters scoring

The proposal says Ghost matching uses only binary `capitalPosture === "can_back"` and imports no balance/net-worth/funds-proof values. That is necessary but not sufficient.

If the boolean appears anywhere in a scoring, sorting, or tiebreak path, then a qualifying Backer receives exposure beyond a non-qualifying Backer even when the non-qualifying Backer is only outside the Backer lane due to an inapplicable opportunity. The operator law forbids Plaid increasing exposure. A Boolean in a weighted score is still exposure inflation.

The only acceptable placement is an eligibility predicate before ranking:

- if `member.capitalPosture !== "can_back"`, exclude from the opportunity-required Backer pool;
- never `score += member.capitalPosture === "can_back" ? 1 : 0`;
- never use it as a tiebreak.

### 2. Copy can silently become a wealth badge

Funds/Crucible and Intros copy must not read as:

- Plaid-verified Backer
- Qualified Backer
- Can back this deal
- Credential: Backer

Those phrases carry prestige. The operator-approved language is time-bound and threshold-bound:

> Met the opportunity-specific threshold on [date]. All qualifying Backers are equal in matching. Plaid creates no tier.

If any profile card, matching screen, or intro packet renders `capitalPosture` as a visible badge, it violates the no-public-wealth-badge rule even if the underlying value is boolean.

### 3. The slice does not explicitly ban numeric Plaid fields from the local profile

The regression proof only covers Ghost matching. A developer could store `plaidBalance`, `netWorth`, `excessAboveThreshold`, or `wealthBand` in a profile, audit log, or session object for “future reference” while Ghost still imports none of them.

That is a latent leak. The policy contract must state that the only stored outcome is a two-state boolean, and no numeric Plaid-derived field may exist anywhere in the Werkles member/backer schema.

## Smallest exact repair

Add a hard boundary:

- `capitalPosture` must be a two-state enum: `can_back` or `not_qualified`.
- It may appear only in an eligibility filter before ranking.
- It may not appear in any scoring, sorting, weighting, or tiebreak logic.
- No numeric Plaid field may be stored or displayed; the only artifact is the boolean eligibility state.

## One exact regression assertion

Given two Backers with identical interests, temperament, personality, goals, working style, and complementary needs, both satisfying `capitalPosture === "can_back"`, Ghost matching returns identical rank when any hidden numeric fields are stripped; static scan rejects all imports/schema fields matching `balance`, `netWorth`, `excessAboveThreshold`, `wealthBand`, `fundsProof`, or `amount` in the matching path, and `capitalPosture` appears only in an eligibility predicate.

No provider action, legal approval, privacy-policy ratification, SQL, secrets, push, deploy, or publication is recommended here.
