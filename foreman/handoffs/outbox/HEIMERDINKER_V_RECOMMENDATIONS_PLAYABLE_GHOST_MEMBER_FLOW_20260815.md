# V — Recommendations Playable Ghost-Member Flow

Date: 2026-08-15  
Foreman: Heimerdinker / Dink@Betsy  
Operator direction: make Recommendations visibly interactive, remove confusing
`Example only` language, clarify what the selected option means, and move the
single real member + synthetic ghost-member experience toward a playable loop.

## Product outcome

The member should immediately understand that the option deck is interactive,
that selecting a card changes the recommendation readout, and that the readout
is advisory rather than an automated decision. A real member's honest intake
should drive useful recommendations and then lead into the existing ghost-member
matching surfaces without pretending synthetic people are real.

## G ideas

1. Recompose Page 0 into an obvious interactive option picker: shaded option
   controls, explicit selection affordance, and a visually pronounced selected
   readout with one short explanation of what selection changes.
2. Remove dead/demo-only copy from the normal route and replace it with honest
   empty/intake/ready states that still work for one real member.
3. Trace and tighten the next playable step from Recommendations into the
   owner-bound ghost-member experience, preserving synthetic labels, privacy,
   and human-review boundaries.

## Hard edges

- Betsy/Werkles only; do not touch Doss/PookaKind.
- Preserve the shared dirty tree and existing Page 0 repair.
- No push, deploy, SQL/schema/RLS, provider, secret, billing, or production-data
  mutation.
- No fake people, fake verification, autonomous introductions, or hidden match
  execution. Ghost members remain visibly synthetic/local preview fixtures.
- UI repair may land locally; broader architecture stays packeted when it needs
  a gate or named-seat decision.

## Proof required

Desktop + phone browser interaction, keyboard selection, honest state-copy
contract, route/owner-boundary checks, TypeScript, focused tests, and a receipt
that names the next page in the walkthrough flow.
