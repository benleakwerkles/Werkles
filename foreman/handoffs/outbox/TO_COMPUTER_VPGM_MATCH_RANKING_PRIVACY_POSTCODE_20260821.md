# TO COMPUTER / THUFIR — Post-code ranking/privacy seal

Return `PASS`, `PATCH`, or `BLOCK` on this exact local candidate summary.

## Candidate bytes and behavior

- `lib/ghost-fleet/match.ts` now defines versioned
  `ghost-ranking-input/v1` and maps every rich `GhostMember` into a frozen
  `GhostRankingProfile` before scoring. That profile contains only id, display
  name, city/state, lane/role, skills, offers, seeks, explicit partnership
  openness, stated need, stuck decision, proof gaps, and intro eligibility. It
  contains no capital posture, provider evidence, financial amount, operational
  metadata, browsing behavior, IP, timezone, locale, or analytics data.
- Every displayed candidate receives `rank` only after scoring and useful-variety
  selection, so `Current order #N` matches the visible deck order.
- Every positive engine-produced reason is passed to `Why this profile is here`;
  the previous three-reason truncation is removed. No numeric score or
  probability is shown.
- The Match Deck says location/work style can break a close call, deliberate
  Intake/location corrections change the deck, practice questions and card
  clicks do not, and bank balance/net worth/passive behavior/outside browsing/
  inferred private traits/hidden precise location are not used.
- `/privacy#matching-boundary` lists the explicit inputs used and the forbidden
  signals, and says any future explicit feedback control must disclose storage
  and permit correction/deletion before launch.
- Four focused matching contracts and TypeScript pass. A signed-in local browser
  walk rendered ranks 1–6, the full explainer, the privacy boundary, and zero
  console warnings/errors.

Attack explanation drift, proxy laundering, misleading current/future claims,
and whether the narrow scoring profile is a meaningful code boundary. This is
review only. No provider/schema/push/deploy action.
