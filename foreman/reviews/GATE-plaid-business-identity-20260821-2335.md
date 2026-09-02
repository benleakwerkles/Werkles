# Gate — Plaid business identity

## Resolution — 2026-08-22

The Operator supplied the authoritative Delaware entity facts and explicitly
directed the Foreman to enter them. The original business-identity gate is
resolved.

Plaid accepted and advanced past:

- United States; 1954 Castleway Lane NE; Atlanta, GA 30345;
- `Private Company`; legal entity `WERKLES, INC.`; DBA `Werkles`;
- the EIN extracted directly from the local IRS letter
  `C:\Users\Ben Leak\Downloads\WerklesEIN.pdf` (not copied into this receipt);
- incorporation year 2026 and state DE;
- fewer than 1,000 employees; US-only Plaid data access/storage;
- no planned sale of consumer data and no known breach in the past year;
- multi-category marketplace;
- public app name `Werkles`, website `https://werkles.com`, and support contact;
- United States launch geography;
- minimal requested products `Auth` and `Balance`, each described as supporting
  a user-initiated, point-in-time minimum-funds check with no payment initiation,
  no wealth ranking, a dated pass/fail receipt, and deletion of raw values.

The browser is now handed off on Plaid's regulated ownership screen. Ben Leak's
name, company email, US country code, US citizenship, and attester name are
prepared. The form still requires facts that were not inferred or exposed in
the receipt: phone number, date of birth, whether Ben owns 25% or more, whether
any other beneficial owner exists, and the legal accuracy certification.

No final submission, plan selection, billing action, or spend occurred.

Date: 2026-08-21 23:35 ET
Gate: Tier 1 — provider/legal representation
Confidence: HIGH that the form cannot be truthfully completed from current evidence

## Decision in front of the Operator

Plaid requires business-identity answers that match company registration. The authenticated form is open at `https://dashboard.plaid.com/onboarding/business-type`.

## Prepared field set

| Plaid field | Prepared answer | Evidence state |
| --- | --- | --- |
| Country | United States | Operator/company context supports it |
| Address | 1954 Castleway Lane NE | Supplied directly by Operator |
| City | Missing | Must not infer |
| State | Missing | Must not infer |
| ZIP | Missing | Must not infer |
| Business type | `Private Company` only if Werkles is already a registered for-profit corporation | Plaid category; current repo says `Werkles, Inc (pending)` |

Plaid does not ask C corporation versus S corporation on this screen. S corporation is a federal tax election, not the Plaid category. Current IRS rules limit S corporations to eligible shareholders, 100 or fewer shareholders, and one class of stock. SBA guidance says C corporations have an advantage when raising capital through stock. This is not a substitute for company-specific legal and tax advice.

## Unknowns

- Full city, state, and ZIP matching company registration.
- Whether Werkles has actually completed incorporation.
- State of incorporation and authoritative company record.
- Whether the supplied street is the registered/principal business address on that record.

## Blast radius

Incorrect answers may create a mismatch in Plaid's business verification and establish a false provider/compliance representation.

## Files changed

- `foreman/handoffs/outbox/HEIMERDINKER_V_PLAID_BUSINESS_IDENTITY_EXACT_ANSWERS_20260821.md`
- This gate packet and matching HTML dashboard.

## Systems affected

- Plaid production-access onboarding only. No Plaid field has been entered or submitted.

## Budget/spend

- None.

## Lane status

- Mechanical preparation complete.
- Provider entry paused at sensitive-data/legal-representation gate.

## Known risks

- Choosing the desired future entity instead of the entity that exists today.
- Confusing Plaid's broad `Private Company` category with a C/S tax election.
- Sending a residential or incomplete address that does not match registration.

## What remains blocked

Entering any field and advancing requires the missing registration facts plus action-time approval to transmit the full address and business category to Plaid.

## Operator phrases

- Approve after completing the facts: `APPROVE PLAID BUSINESS IDENTITY ENTRY: <city>, <state> <ZIP>; WERKLES IS CURRENTLY A REGISTERED FOR-PROFIT CORPORATION; USE PRIVATE COMPANY.`
- Patch: `PATCH PLAID BUSINESS IDENTITY: ...`
- Reject/pause: `PAUSE PLAID BUSINESS IDENTITY.`
