# V — Match Ranking and Privacy Boundary

Date: 2026-08-21  
Foreman: Heimerdinker@Betsy  
Execution: `CODEX_LOCAL` on Betsy / local preview only

## Vision

As the Match Deck grows, Werkles must answer four questions in plain language:

1. Why is one person above another?
2. Which deliberate member actions may change that order?
3. What does Werkles remember for matching?
4. Which signals are forbidden because they would turn useful personalization
   into surveillance, wealth ranking, or sensitive-trait inference?

The member must be able to inspect and correct the basis for a match. A rank is
a current ordering of useful possibilities, not a compatibility percentage,
quality grade, promise, or verdict about either person.

## Controlling prior CBCC receipts

- Bean's Backer Equality review: financial proof may gate one specific capital
  conversation but may never affect score, sort, tie-break, visibility, queue
  priority, badge treatment, or member access.
- Ender/Doozer matching readiness review: member notice, explanation,
  correction, rejection, appeal, feedback, and data rights are product
  requirements; do not infer protected traits.
- Computer/Thufir location review: explicit geography may break a genuine
  near-tie, but cannot manufacture a match or override materially stronger fit.
- Petra/Ender matching synthesis: strongest honest fit remains first; useful
  variety may operate only among already eligible, genuinely relevant people.

These are actual historical receipts. They are controlling evidence, not fresh
responses to this packet.

## Candidate policy

### What may order the deck now

- the member's latest deliberately submitted Intake;
- whether a candidate can address a named blocker;
- whether the member and candidate offer useful things to each other;
- relevant lived/work overlap and a credential or training gap;
- openness to partnership when partnership was explicitly requested;
- explicit city, state, and work-style preference only among comparable fits;
- limited variety among already strong candidates so repeats do not crowd out
  materially different kinds of help.

### What may change the order now

- resubmitting or correcting Intake answers;
- deliberately changing city, state, or work-style preference.

Practice questions, card clicks, scroll depth, hover time, time on page, and
outside browsing do not change the order. Future explicit controls such as
`not a fit`, `hide`, or `show me more like this` may change it only after the
member is told what will be saved and can review, correct, or delete it.

### Forbidden ranking inputs

- bank balance, net worth, account size, or excess above a qualifying threshold;
- financial eligibility as a proxy for status, wisdom, access, or quality;
- inferred protected or sensitive traits;
- private messages, calls, or documents not deliberately supplied for matching;
- passive behavioral profiling;
- browsing outside Werkles;
- inferred precise location or IP-derived matching;
- purchased third-party behavioral dossiers;
- ad-network data.

## Build slice

1. Carry current-order position through the Match Deck DTO and show it without
   publishing an opaque numeric score.
2. Add an on-page `How this order works` explanation covering what moves a
   person, what changes the deck, and what Werkles does not watch.
3. Add a matching-boundary section to Privacy and link the Match Deck to it.
4. Add regression coverage for rank transport and the prohibited-signal copy.

## Hard edges

No schema, tracking vendor, analytics pipeline, provider call, financial data,
production data, secrets, legal approval, push, deploy, or publication. Do not
claim future feedback controls exist. Do not claim fresh CBCC participation
without a returned and validated receipt.

## Stop condition

Stop after the bounded local implementation, focused regressions, TypeScript,
and a browser walk, or at the first true human gate.
