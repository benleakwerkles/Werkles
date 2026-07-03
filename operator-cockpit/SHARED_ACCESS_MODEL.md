# Shared Access Model

STATUS: DRAFT - HUMAN REVIEW REQUIRED

Core rule: one Operator Cockpit with links across separated entities. Do not create one blended legal/Drive/accounting blob.

Shared access is allowed only when it preserves separate ownership, separate accounting, separate legal authority, and separate provider credentials.

## Access Principles

- Least privilege first.
- Entity ownership stays with the correct entity.
- Shared views are not shared ownership.
- Shared vendors need an explicit billing and allocation rule.
- Secrets are never stored in this repo.
- Final approval remains human-only for account creation, OAuth, billing, payment, deploy, legal, CPA, and permission changes.

## Access Roles

### Ben / Operator

Ben can view the whole Operator Cockpit and decide what needs legal, CPA, or account review. Ben should not be forced to manually hunt dashboards when Codex can navigate to non-sensitive setup pages.

### Entity Owners / Partners

TBD by entity. Ownership, partner rights, and signing authority must come from formation documents, agreements, counsel, CPA, or confirmed business records.

### CPA / Bookkeeper

Should receive entity-specific access, reports, exports, or folders. Avoid giving blanket cross-entity access unless explicitly approved.

### Legal Counsel

Should receive entity-specific legal documents, formation records, contracts, and questions. Avoid blending privileged materials across unrelated entities.

### AI Assistants / Operator Tools

AI tools may use repo cockpit files, non-secret summaries, and approved public/non-sensitive references. They must not receive secrets, private credentials, payment information, OAuth approvals, account settings, or final approval authority.

### Vendors

Vendor access should be tied to the entity paying for and legally using the vendor service.

## What Can Be Shared By Permission

- Operator cockpit index links.
- Non-secret project summaries.
- Shared templates.
- Read-only reports.
- Vendor research notes.
- Public brand references.
- Approved documentation drafts.
- Cross-entity cost allocation notes that do not expose private banking or tax data.

## What Must Not Be Shared Casually

- Bank logins, card numbers, payment methods, and billing approvals.
- API keys, service-role keys, OAuth client secrets, recovery codes, and tokens.
- Tax returns, payroll records, 1099s, W-2s, K-1s, and private CPA files.
- Legal formation documents, operating agreements, partner agreements, privileged legal advice, and unsigned deal terms.
- Tenant records, customer private data, trade logs, brokerage records, and insurance claims.
- Admin access to Google Workspace, Drive ownership, provider dashboards, hosting accounts, or database consoles.

## Google Workspace / Drive Model

- Each entity should have a separate confirmed Drive location before files are migrated or ownership changes.
- Shared folders should be shortcuts or permissioned views, not accidental ownership transfers.
- A central operator index may link out to entity folders when approved.
- Do not move files, change permissions, or create accounts from this cockpit.

## Vendor Account Model

- Every vendor should have a mapped legal/billing owner.
- Every payment method should belong to the correct entity or be reimbursed through a documented process.
- Every API token should be mapped to the provider account, organization, workspace, project, and billing owner that issued it.
- If a provider dashboard shows credit but API calls return billing errors, verify account, organization, workspace, and token ownership without exposing token values.

## Shared Cost Handling

Shared costs need one of these before they become routine:

- A direct bill to the correct entity.
- A reimbursement log entry.
- An intercompany allocation rule.
- CPA-approved treatment.
- Legal agreement if services are recurring or material.
