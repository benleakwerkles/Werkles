# Heimerdinker M17 stake — Workshop → Werkle next decision

Date: 2026-08-24  
Producer: Heimerdinker@Betsy  
Status: exact artifact awaiting cross-review; not implemented

## Member problem

Workshop and Formation contain useful work, but a member can still arrive at a
page without knowing whether they are improving their private Workshop, testing
a possible partnership, or continuing an existing Werkle.

## Surface

Member navigation directly below the signed-in site header, plus the first
decision block on Workshop, Match Deck, and Formation.

## Feature

Add a compact `Where this work lives` readout that names exactly one current
stage and one next decision:

- `Your Workshop` — private work; next decision: improve it or look for people.
- `Match Deck` — compare possibilities; next decision: keep comparing or start
  a practice Werkle.
- `Possible Werkle` — two perspectives under review; next decision: settle one
  topic or return to the Match Deck.
- `Existing Werkle on this device` — local shared-work practice; next decision:
  continue the saved brief or record a result.

## Natural live copy

Heading: `Where this work lives`

Boundary line: `This tells you which room you are in. It does not mean another
person responded, agreed, paid, or joined a company.`

Controls must use verbs and destinations, for example `Improve My Workshop`,
`Compare Matches`, `Continue This Possible Werkle`, and `Review the Saved Brief`.

## State boundary

The readout may derive only from the current route and validated device-local
artifacts already used by the page. It cannot create or upgrade account state,
partner response, agreement, provider proof, membership, payment, production,
or release status.

## Executable acceptance checks

1. A no-Intake/no-brief member sees `Your Workshop` or a truthful empty state,
   never an existing Werkle.
2. Match Deck exposes `Match Deck` and one next-decision control.
3. Formation with only a candidate query exposes `Possible Werkle` and explicitly
   says the other person has not responded.
4. A valid saved local Operating Brief exposes `Existing Werkle on this device`.
5. Clearing or corrupting the local brief removes the existing-Werkle state.
6. Every route preserves the standard signed-in header and has no horizontal
   overflow at 390px.
7. No readout contains account/provider/release language or claims mutual action.

## Non-claims

This artifact is not implementation, partner activity, account persistence,
provider evidence, release custody, push approval, or deploy approval.

