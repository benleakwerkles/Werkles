# V — Location-aware Ghost matching

Date: 2026-08-20  
Owner: Heimerdinker / Codex Foreman  
Execution: CODEX_LOCAL on Betsy  
Status: authorized implementation packet

## Operator finding

The current shortlist is geographically implausible: the closest visible synthetic match is Birmingham, Alabama. Geography is presently inferred only from a fragile free-text phrase in Intake, worth 12 points when a city/state happens to match, and is not connected to the signed-in member profile.

## Product decision

Location is a logistics constraint, not evidence that two people belong together. Werkles should rank for substantive fit first, then use an explicit member location and work preference to make the shortlist practically usable.

- `Local Only`: strongly prefer same-city, same-state, then neighboring-state candidates; a materially stronger distant candidate may remain and must be labeled as distant.
- `Hybrid`: use proximity as a meaningful tie-breaker without overwhelming fit.
- `Remote`: do not penalize distance.
- Never claim exact mileage without a reviewed geocoding source.
- Never infer the member's home from prose when an authenticated profile value exists.
- If no usable profile location exists, say so once and link to Profile; do not make the member refill Intake.

## Implementation boundary

1. Add a pure, deterministic proximity model using city/state and state-neighbor bands.
2. Extend Ghost ranking with an optional trusted location context and expose the band in the candidate DTO.
3. Add an authenticated, RLS-bound current-Intros API that reads the member's saved Intake and only the necessary profile location/preference fields.
4. Upgrade the Intros client surface from cookie-only server seed data to the authenticated result when available.
5. Keep the cookie/local Ghost path as an explicitly synthetic fallback for local walkthroughs.

## Non-goals / gates

- No schema or RLS changes.
- No service-role profile reads.
- No geocoding provider or network call.
- No provider, secret, payment, deployment, or production-data operation.
- No distance as a proxy for trust, competence, class, or compatibility.
- No CBCC review claim without a returned receipt.

## Required attacks

- Cleveland + Local Only must not prefer Birmingham over credible Ohio/neighbor-state matches solely for diversity.
- Remote preference must preserve substantive ordering.
- Unknown/malformed state values fail neutral, not favorable.
- Same-state proximity cannot manufacture an otherwise unsupported match.
- Authenticated User B cannot request User A's location or Intake.
- Existing diversity, interaction, account-custody, and type contracts remain green.

