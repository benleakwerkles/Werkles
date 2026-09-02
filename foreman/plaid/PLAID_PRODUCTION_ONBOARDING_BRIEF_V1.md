# Werkles × Plaid — production onboarding brief V1

Status: `CURRENT_USE_CASE__SUBMISSION_DRAFT`
Date: 2026-08-21
Company label: Werkles
Founder/contact: Ben Leak, ben.leak@werkles.com
Site: https://werkles.com

> The legal entity type and registered business address must be copied from company registration before this brief or Plaid's onboarding form is submitted. Do not infer them from historical files.

## What Werkles does

Werkles helps people turn a business they want to build into practical next moves, useful learning, and promising working relationships. It matches people first on the work they want to do, complementary abilities, goals, interests, temperament, and stated boundaries.

Werkles is not a lender, broker-dealer, investment adviser, payment facilitator, or marketplace that ranks people by wealth.

## The narrow Plaid use case

Plaid is intended for an optional check inside Werkles's Backer lane, after two people already have a reason to talk. A member may choose to create a dated snapshot showing that a specific financial eligibility threshold was met at that point in time.

Plaid evidence must never:

- improve matching rank because one person has more money;
- expose balances, net worth, account numbers, transactions, or excess above a threshold;
- become a general badge that implies judgment, skill, character, or investment quality; or
- start automatically merely because a member selected the Backer lane.

The preferred stored result is deliberately narrow: verified, not verified, inconclusive, expired, disputed, or revoked; the reviewed scope; observation and expiration time; consent basis; and an opaque provider reference or digest.

The ordinary member-facing signal contains no amount, threshold, band, balance, or comparison. It says only `Funds verified · [date]` while a successful result is fresh. Failed, expired, disputed, and revoked results create no public badge.

A specific minimum or amount may be disclosed only in a separate private one-to-one exchange. Both named members must agree to that disclosure, the checked member must authorize the exact value or minimum being shown, and the result must be freshly reverified. Werkles may charge a small disclosed verification fee for that new check. The private disclosure must not change matching rank or create a permanent wealth label.

## Data boundary

- The member initiates Plaid Link for the named check and sees a plain-language consent notice first.
- Plaid handles bank credentials and the raw account/report evidence needed for the evaluation.
- Werkles does not retain raw balances, transactions, account or routing numbers, institution credentials, or raw Asset Reports.
- The target workflow removes the Plaid Item and report from Werkles's application access after evaluation and retains only the scoped, expiring result.
- Plaid may retain information under its own terms, legal duties, and retention rules. Werkles must not claim control over Plaid's independent retention.
- The ordinary fresh-date signal contains no amount. A specific minimum or amount remains private unless both named members deliberately open a one-to-one disclosure for a named Werkles conversation.
- Revocation stops display and reliance immediately; expiry must remove the result from matching and decision use.

## Current implementation truth

- A local/sandbox Link-token path exists.
- The application does not currently exchange and persist production Items, save financial evidence, issue durable receipts, or process the required production webhooks.
- Production Plaid behavior remains fail-closed until consent, account custody, receipt lifecycle, revocation, deletion, access control, logging, and incident-response controls are implemented and verified.
- Obtaining production dashboard access or credentials does not itself enable Plaid in the Werkles product.

## Products to confirm with Plaid

Werkles currently expects Link plus either Assets or Balance. We want Plaid's guidance on the minimum product that can support a user-initiated, one-shot threshold result without retaining a reusable connection or full report.

## Questions for Plaid

1. For a one-shot, member-initiated verification followed by Item/report removal from Werkles's access, should Werkles use Assets, Balance, or another Plaid product?
2. May Werkles display only `Funds verified · [date]` on an ordinary member profile, then disclose a specific reverified minimum or amount only inside a mutually approved one-to-one exchange?
3. Which Link consent, Plaid End User Privacy Policy, and downstream disclosure language is required for this workflow?
4. Which events or webhooks are required to prove Item removal, consent expiry, errors, and late provider events?
5. What production review, OAuth, redirect URI, data-retention, and security evidence does Plaid require before this use case may be enabled?
6. Which Pay-as-you-go fees apply to the selected one-shot product and to Item/report removal?

## Safe founder summary

“Werkles introduces people because their goals, working styles, and abilities may fit. Plaid does not decide who is a better match. An ordinary profile may say only that funds were verified on a date—never an amount or wealth band. If two members later agree to discuss real numbers, the checked member can privately disclose a freshly reverified minimum or amount to that one person. We do not rank balances, and Werkles deletes its raw financial evidence after deriving the result.”
