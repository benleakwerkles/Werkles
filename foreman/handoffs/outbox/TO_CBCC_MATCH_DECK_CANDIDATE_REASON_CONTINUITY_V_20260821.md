# Vision — Match Deck Candidate-Reason Continuity

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
Requested review: Ender, Bean, Petra, Doozer

## Problem

The matching engine computes distinct reasons and cautions for every ranked candidate, but `buildGhostInteractionMember` discards them. The interactive Match Deck therefore shows role, offers, seeks, and generic proof gaps without answering the page's central promise: why this particular person is here for this particular member.

## Candidate

- Carry at most three bounded reason label/detail pairs and three cautions from the owner-bound match result into each synthetic interaction profile.
- Show the strongest reason on each chooser button so the three options are distinguishable before selection.
- Show a compact `Why this profile is here` and `What could make this wrong` readout on the selected profile.
- Keep raw numeric scores, rule internals, and fake confidence percentages out of the member UI.
- Preserve synthetic, unverified, no-contact, and no-introduction boundaries.

## Review questions

1. Does this make each candidate meaningfully distinct without overstating fit?
2. Can any reason be mistaken for verification, endorsement, safety, or predicted success?
3. Are cautions specific enough to challenge the ranking rather than merely repeat legal copy?
4. Does the mobile chooser stay readable with one added reason line?

## Hard edges

No ranking-weight change, score disclosure, real member, introduction, contact, profile mutation, account write, provider, schema, secret, payment, commit, push, or deploy.
