# Bean patch review — Backer equality + Plaid snapshot

CUSTODY_TOKEN: CUSTODY-BEAN-BACKER-EQUALITY-PATCH-1C660E42  
Source review: `FROM_BEAN_BACKER_EQUALITY_PLAID_SNAPSHOT_REVIEW_20260819.md`

Personally verify that the proposed contract now closes your `PATCH_BEFORE_BUILD`. No subagents, new task, secondary model, or code.

Revised exact boundary:

1. `capitalPosture` is a closed two-state value: `can_back | not_qualified`.
2. It may be used only as an opportunity-specific eligibility filter before ranking.
3. It may never affect score, sort, weight, tie-break, visibility, queue priority, badge treatment, or access to entrepreneurs.
4. No numeric Plaid-derived balance, net worth, excess-above-threshold, wealth band, funds amount, or similar value may be stored, displayed, or imported into matching.
5. Member copy may say only: `Met the opportunity-specific threshold on [date]. All qualifying Backers are equal in matching. Plaid creates no tier.` It may not say Plaid-verified Backer, Qualified Backer, Can back this deal, or Credential: Backer.
6. Current sandbox Link completion remains no proof, no saved connection, and no eligibility state.

Regression target:

> Given otherwise identical Backers, eligibility never changes their relative order. Static proof rejects forbidden numeric wealth fields and rejects `capitalPosture` in scoring, sorting, weighting, tie-breaking, badges, or visibility logic.

Return `PASS_TO_BUILD`, `PATCH_BEFORE_BUILD`, or `BLOCK`; the one remaining strongest attack if any; and `PERSONAL_REVIEW:YES`, `SUBAGENTS_OR_DOWNWARD_DELEGATION:NONE`. No provider action, legal approval, privacy-policy ratification, SQL, secrets, push, deploy, or publication.
