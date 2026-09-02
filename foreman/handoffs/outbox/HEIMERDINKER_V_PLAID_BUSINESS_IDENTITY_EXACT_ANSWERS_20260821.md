# V — Plaid business-identity exact answers

Date: 2026-08-21
Foreman: Heimerdinker@Betsy
Lane: Plaid production onboarding / business identity
Environment: authenticated Plaid dashboard plus local canonical Werkles repository

## Operator direction

Continue the Plaid production-access questionnaire. Operator supplied the street address `1954 Castleway Lane NE` and asked whether the investor-oriented corporation should be an S corporation.

## Facts already established

- Plaid says all answers must match company registration.
- The live first step requires country, full address, city, state, ZIP, and one Plaid business category.
- Plaid categories include `Private Company`; the form does not ask C corporation versus S corporation on this step.
- Current repo evidence says `Werkles, Inc (pending)` and is not proof of completed formation.
- The Operator has not yet supplied city, state, ZIP, or evidence that formation is complete.
- IRS rules restrict S corporations to eligible shareholders, 100 or fewer shareholders, and one class of stock.
- SBA says C corporations have an advantage in raising capital by selling stock and may fit businesses that need to raise money.

## Requested CBCC review

### Computer / Thufir

Return only current primary-source conclusions:

1. Does Plaid's `Private Company` category correspond to a privately held for-profit corporation regardless of C/S tax election?
2. What source can establish Werkles' actual registered entity type and registered/principal address?
3. Identify any exact registration fact that remains missing. Do not guess an address or formation status.

### Petra

Classify whether selecting `Private Company` is truthful now, given `Werkles, Inc (pending)`, or only after formation evidence exists. Distinguish desired future structure from current legal identity.

### Lady Jessica

Review the proposed mechanical answer set and return `READY_TO_ENTER`, `PATCH`, or `BLOCKED`:

- Country: United States
- Address: 1954 Castleway Lane NE
- City/state/ZIP: missing
- Plaid business type: Private Company, only if current registration proves Werkles is incorporated

## Hard edges

- No invented legal facts.
- No claim that an S election is a state-law entity type.
- No secret entry, key creation, billing, final submission, or production activation.
- No address is typed into Plaid until the browser's action-time sensitive-data confirmation is satisfied.
- No `Next` click until the Operator reviews the completed field set.

## Stop condition

Return one exact field set supported by current company-registration evidence, or a short blocker naming only the missing facts and the authoritative record needed.
