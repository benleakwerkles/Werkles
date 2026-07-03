# Entity Separation Rules

STATUS: DRAFT - HUMAN REVIEW REQUIRED

Core rule: one Operator Cockpit with links across separated entities. Do not create one blended legal/Drive/accounting blob.

These rules protect legal ownership, accounting clarity, tax records, privacy, vendor accountability, and Ben's sanity.

## Baseline Rules

1. One entity, one legal lane.
2. One entity, one accounting lane.
3. One entity, one bank/payment lane where practical.
4. One vendor account owner per vendor account.
5. One Drive/source location per entity unless a shared location is explicitly approved.
6. Shared access must be permissioned, logged, and revocable.
7. Shared costs must have allocation or reimbursement treatment.
8. Secrets never go in chat, repo files, screenshots, or drafts.
9. Final create/save/share/deploy/billing approval remains human-only.
10. Unknown ownership stays `TBD` until confirmed.

## New Account Decision Tree

Before creating or using any provider account, answer:

- Which entity owns this account?
- Which entity pays for it?
- Which entity receives the benefit?
- Who is the admin?
- Who can approve billing changes?
- Where are credentials stored privately?
- What non-secret account metadata can Codex record?
- Does this account need CPA/legal review before use?

If those answers are unclear, stop at the human gate before creating the account, entering billing, or approving OAuth.

## New Spend Decision Tree

Before charging anything, answer:

- Is this personal, Werkles, Valley Vanguard, Valley Microfutures, Kind Sir, or another entity?
- Is the vendor account billed to the same entity receiving the benefit?
- If Ben pays personally, what reimbursement record is needed?
- If multiple entities benefit, what allocation rule applies?
- Is this a one-time purchase, monthly subscription, usage-based API, or annual commitment?
- What receipt, invoice, or export should be saved?

## Files And Drive

- Keep legal, tax, bank, customer, tenant, payroll, insurance, and vendor records in the correct entity location.
- Use links from the Operator Cockpit instead of duplicating private records across entity folders.
- Do not migrate ownership until Ben explicitly approves and the legal/CPA context is clear.
- Do not turn a shared index into a shared private-record dump.

## Domains And Email

- Domain ownership should match the entity that owns the brand or business use.
- Inboxes should map to entity responsibilities.
- Shared operator aliases are allowed only if they do not blur who owns the account, records, or obligations.

## Vendors And API Keys

- Record vendor names, dashboard URLs, account owner, billing entity, and env var names only.
- Do not record secret values.
- Do not paste tokens into chat.
- Do not assume a browser login and an API token belong to the same provider account, organization, workspace, or billing context.
- If credits are visible in one provider dashboard but API calls fail for billing, verify token ownership and organization/workspace selection privately.

## Contracts And Authority

- Only authorized humans can accept contracts, approve billing, create legal accounts, sign documents, share private records, or deploy services that create costs.
- Codex can prepare forms, navigate dashboards, and explain fields.
- Codex must stop before final approval unless Ben explicitly approves that exact action.

## Naming Convention

Use names that keep entity identity visible:

- `Kind Sir Holdings - [Record Type] - [Date]`
- `Kind Sir Corporate - [Record Type] - [Date]`
- `Kind Sir Residential - [Property/Record Type] - [Date]`
- `Kind Sir Concrete - [Customer/Job/Record Type] - [Date]`
- `Kind Sir Insulation - [Customer/Job/Record Type] - [Date]`
- `Valley Vanguard - [Record Type] - [Date]`
- `Valley Microfutures - [Record Type] - [Date]`
- `Werkles - [Record Type] - [Date]`

## Human Gates Are Not Errands

When provider, dashboard, or account work reaches a human-only gate, Codex must do mechanical prep first, navigate as far as safely possible in a controllable browser/session, and stop only where Ben must personally handle login, OAuth, billing, secret entry, account settings, or final approval.

Ben should not be asked to hunt menus, interpret provider UI, copy long values, or assemble setup instructions when Codex can safely prepare or drive the non-sensitive path.
