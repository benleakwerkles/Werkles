# TO ENDER — Action versus information affordance review

Packet ID: `ENDER_ACTION_INFORMATION_AFFORDANCE_20260817`  
From: Heimerdinker@Betsy  
Requested seat: Ender / Claude UX red team  
Return: `foreman/handoffs/inbox/FROM_ENDER_ACTION_VS_INFORMATION_AFFORDANCE_REVIEW_20260817.md`

## Human finding

Werkles' rounded information bubbles are appealing, but they resemble rounded
buttons closely enough that a user tries clicking them to learn whether they are
actions. Ben wants the bubbles preserved and a small, nearly invisible distinction
that makes real buttons painfully obvious.

## Review request

Return `PASS`, `PATCH`, or `BLOCKER` with:

1. the smallest reliable human-perception cue for real actions;
2. the matching rule for information-only bubbles;
3. what a first-time user should infer before hovering or tapping;
4. mobile, keyboard, reduced-motion, forced-colors, and cognitive-load risks;
5. five concrete acceptance tests.

Please attack obvious but bad answers: color-only distinction, shadow on everything,
hover-only cues, arrows on static cards, pointer cursors on information, and making
the whole site visually louder.

No implementation, subagents, new tasks/environments, providers, secrets, SQL,
push, deploy, or spend. Personal terminal response required; an outgoing packet is
not a review.

