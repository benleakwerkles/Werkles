# Werkles data minimization and deletion policy — operator-direction draft

Status: `DRAFT_FOR_OPERATOR_AND_LEGAL_REVIEW`

Date: 2026-08-19

Purpose: translate the Operator's direction into one product, engineering, and provider-diligence rule. This draft is not a claim that every control is already implemented. Production verification stays disabled until the controls below are enforced and tested.

## The rule

Werkles keeps only information it needs to run the member's account, remember the work the member intentionally gives Werkles, and display a narrow, dated verification result. Specialized processors receive sensitive source evidence directly. Werkles does not build a warehouse of bank data, identity documents, account numbers, balances, card numbers, driver's-license numbers, selfies, social credentials, or raw provider payloads.

Using a processor does not remove Werkles's responsibility. Werkles must choose the processor, disclose the purpose, restrict its use by contract and configuration, honor deletion and revocation requests, and verify that the integration does not send or retain more than the stated purpose requires.

## What Werkles may retain

### Active account minimum

- Opaque internal member ID.
- Name chosen for the account.
- Verified phone number, or another approved account-authentication identifier while the current authentication system still requires it.
- Authentication, consent, security, membership, and billing-status metadata needed to operate the account and prevent abuse. Never a readable password or payment-card number.
- Business profile, intake answers, Workshop content, preferences, and matching feedback the member intentionally gives Werkles so Werkles can remember the member and improve its recommendations.

Phone verification proves control of the phone number at that moment. It does not by itself prove the person's legal identity. Bot screening and CAPTCHA do not prove identity either.

### Narrow verification result

When a member expressly asks for a check, Werkles may retain only a purpose-bound result such as:

- opaque member ID;
- claim type and exact reviewed scope;
- satisfied, not satisfied, inconclusive, disputed, revoked, or expired;
- observation and expiration timestamps;
- consent basis;
- processor event/evidence reference or digest that cannot reveal the source data; and
- lifecycle metadata needed to prevent replay, honor disputes, and revoke the result.

For a Plaid-backed Backer check, the ordinary profile or match view may say only `Funds verified · [date]` while the result is fresh. It must not expose a threshold, balance, excess over a threshold, net worth, account ranking, account number, institution credentials, or wealth band. Failed, expired, disputed, and revoked results create no public badge. Money is a later eligibility fact, not a matching score.

A specific minimum or amount requires a separate private one-to-one disclosure. Both named members must agree to open that exchange, the checked member must authorize the exact value or minimum shown, and the check must be freshly rerun. The disclosure expires, cannot affect matching rank, and cannot become a permanent profile label.

## What Werkles must not retain

- Bank username, password, MFA answer, account number, routing number, balance, transaction history, or raw Asset/Balance report.
- Plaid public tokens, access tokens, Item credentials, or reusable bank connections after the narrow check is complete. If a provider temporarily requires a server-side credential to complete the check, it must be encrypted, inaccessible to clients, purpose-bound, and revoked and deleted immediately after completion.
- Identity-document image, selfie, driver's-license number, passport number, or raw identity-provider response.
- Payment-card number or security code.
- Social-network password, OAuth access token, or imported social graph unless a separate, explicit product purpose is approved.
- Raw address, phone evidence, or provider payload beyond the minimum account/contact field the member chose to keep.
- Secret or sensitive values in logs, analytics, client storage, error messages, support tickets, or model prompts.

## Processor boundary

Public privacy copy should describe categories first: authentication provider, payment processor, identity-verification processor, bank-data processor, communications processor, hosting provider, and abuse-prevention provider. Name a processor when doing so helps a member understand who receives the data or when law, consent, or the provider questionnaire asks for it. Do not volunteer competitors or unrelated vendors.

Every processor integration must define:

1. the exact purpose;
2. the minimum fields sent and returned;
3. who may access them;
4. the retention and deletion command;
5. how consent is recorded;
6. how revocation, disputes, and late events are handled;
7. how Werkles verifies deletion or disconnection; and
8. the processor's unavoidable legal-retention exception.

## Deletion schedule

### Immediate deletion

- Raw bank, identity, license, address, social, payment, and provider payload data: do not persist in Werkles systems; discard from memory as soon as the narrow result is produced. A processor may retain information under its own terms, legal duties, and disclosed retention rules; Werkles must not claim that it controls the processor's independent retention.
- Temporary provider tokens or connections: revoke and delete immediately after the check completes, fails terminally, or the member exits, unless a reviewed product purpose explicitly requires a shorter-lived continuation.
- Logs containing prohibited data: redact immediately and treat the exposure as a security incident.

### Time-bounded result

- A Plaid-backed threshold result expires no later than 30 days after observation and sooner when the purpose requires it.
- Expired results cease to authorize or influence any decision immediately. Delete or irreversibly de-identify the result within 24 hours after expiration unless an open dispute, security investigation, or legal obligation requires a documented hold.
- A member may revoke a share or request deletion sooner. Revocation stops display and reliance immediately, then triggers processor disconnection and deletion work.

### Account closure

- Remove member-controlled account, profile, intake, Workshop, matching, phone, and consent data from active systems within 24 hours of a verified closure request, except for narrowly documented legal, fraud, payment, or dispute records.
- Backups must age out within 30 days and must not be restored into active use after a deletion request.
- Send applicable deletion or disconnection requests to processors immediately and record the request and outcome. Do not promise processor deletion that Werkles cannot verify; disclose any processor or legal retention that survives the request.

### Legal and security exceptions

Retain only the minimum record required by law, payment accounting, fraud prevention, security investigation, or an active dispute. Record the reason, owner, start date, and expiration of the hold. A hold cannot silently become permanent storage.

## Consent

- No verification starts automatically.
- Before launch, show the purpose, processor category or name, data requested, result Werkles will receive, retention period, who can see the result, and how to revoke it.
- Record affirmative consent before the provider request. Provider-hosted consent supplements rather than replaces Werkles's own purpose notice.
- A Link success, phone-code delivery, CAPTCHA completion, or session creation is not proof that the underlying claim succeeded.

## Bot and account defense

Picture CAPTCHA is not the identity system and should not be the only bot defense. Prefer layered controls: rate limits, abuse and device signals, breached-password protection, email or phone possession, WebAuthn/passkeys where available, and step-up checks for risky actions. Any CAPTCHA must offer an accessible alternative and collect the minimum telemetry necessary.

## Plaid production gate

Production Plaid access remains off until Werkles can prove all of the following:

- consumer and critical-system MFA/access controls are operational;
- the privacy policy is published in the live application;
- consent is recorded before Link;
- raw Plaid data and tokens cannot enter general storage or logs;
- the narrow receipt, expiry, dispute, revocation, and deletion paths are implemented;
- processor disconnection/deletion is verified;
- authenticated owner binding and replay protection are tested;
- retention controls and backup expiry are enforced; and
- the final legal/privacy review is approved and recorded.

## Current questionnaire posture

The Plaid questionnaire should answer current operational facts truthfully. A decided policy is not the same as an implemented program. Therefore:

- say that the policy exists and will be published at go-live;
- say yes to TLS 1.2+ where directly verified;
- say yes to consumer consent because Plaid access is user-initiated and must remain so;
- say no to controls that are not yet operational, with the production-off boundary stated clearly;
- say no to at-rest Plaid encryption because Werkles currently retrieves and stores no production Plaid consumer data, not because unencrypted storage is acceptable; and
- say no to a fully enforced retention program until automated enforcement, processor verification, backups, and periodic legal review are proven.
