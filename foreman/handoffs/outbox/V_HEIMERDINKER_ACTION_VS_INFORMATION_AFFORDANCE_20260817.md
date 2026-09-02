# V — Action versus information affordance

Date: 2026-08-17  
Foreman: Heimerdinker@Betsy  
Lane: Werkles member-facing UX, local review/build only

## Operator finding

Rounded information bubbles are valuable and should remain, but they resemble
rounded buttons closely enough that a human user tries clicking them to discover
whether they leave the page. The repair should be small and almost unnoticeable
while making actions painfully obvious.

## Vision

Establish one quiet, site-wide interaction grammar:

- real actions receive one consistent physical/action cue;
- information-only bubbles never receive that cue;
- labels, color, hover, pointer, keyboard focus, and touch behavior agree;
- the repair preserves the existing rounded bubble language.

## Hard edges

- No removal of information bubbles.
- No blanket gradients, noisy animation, fake depth, or button-shaped static cards.
- Do not communicate action through color alone.
- Native semantics remain authoritative: links/buttons are interactive; information
  containers must not gain click handlers, tabindex, pointer cursors, or action copy.
- Mobile, reduced-motion, forced-colors, contrast, and focus must survive.
- Local-only repair after actual CBCC synthesis. No push/deploy, providers, secrets,
  SQL, spend, or new execution environment.

## Requested reviewers

- Ender: human first-glance and expectation audit.
- Lady Jessica: minimal design-system token/pattern and implementation seal.

