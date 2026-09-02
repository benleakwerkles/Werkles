# TO LADY JESSICA — Action versus information affordance review

Packet ID: `LJ_ACTION_INFORMATION_AFFORDANCE_20260817`  
From: Heimerdinker@Betsy  
Requested seat: Lady Jessica / Maker@Betsy  
Return: `foreman/handoffs/inbox/FROM_LADY_JESSICA_ACTION_VS_INFORMATION_AFFORDANCE_REVIEW_20260817.md`

## Human finding

Werkles' rounded information bubbles are appealing, but they resemble rounded
buttons closely enough that a user tries clicking them to learn whether they are
actions. Ben wants the bubbles preserved and a small, nearly invisible distinction
that makes real buttons painfully obvious.

## Design-system review request

Return `PASS`, `PATCH`, or `BLOCKER` with:

1. one exact, reusable action signature (shape/detail/edge/icon or equivalent);
2. one protected information-bubble signature;
3. proposed tokens/selectors that do not depend on accidental markup;
4. precedence rules for primary, secondary, text-link, disabled, and static bubbles;
5. regression and rendered-browser acceptance tests.

Prefer one minimal invariant over a per-page restyle. Protect the existing rounded
visual language. Do not use color alone, blanket shadows, hover-only behavior,
animation as meaning, fake buttons, or decorative arrows that imply navigation.

No implementation, push/deploy, providers, secrets, SQL, spend, subagents, or new
environment. Personal terminal response required; the packet itself is not a review.

