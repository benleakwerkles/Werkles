# V — member data custody around the tech stack

Date: 2026-08-16  
Foreman: Heimerdinker@Betsy  
Execution context: `CODEX_LOCAL` on Betsy/Windows  
Lane: Werkles.com member-facing UI and local integration structure

## Vision

The member should understand where account, profile, Intake answers, Workshop
files, and verification results live before entering personal information.
Provider names and internal workshop language must not substitute for an honest
custody explanation.

## Actual CBCC inputs pulled

- Ender: `foreman/handoffs/inbox/FROM_ENDER_VPGM_20260816-223710.md`
  - pass the mother test;
  - use ordinary language at first contact;
  - do not claim saving until saving is true.
- Bean: `foreman/handoffs/inbox/FROM_BEAN_INTAKE_DUAL_PURPOSE_ACTUAL_CBCC_v0.1.md`
  - preserve unknowns;
  - distinguish session custody from account custody;
  - do not launder a provider or weak inference into trust.

No outgoing packet is counted as cousin review. No newer current reply exists
from Lady Jessica, Doozer, Skybro, Computer/Thufir, or Petra at V time.

## G scope

1. Add a reusable, frozen, provider-neutral custody map for account, profile,
   current browser answers, Workshop files, and verification results.
2. Put that map on the Profile surface before the form so the member can see
   what saves now, what is browser-only, and what is not connected.

## M scope

- remove first-contact internal terms in the touched Profile support surfaces;
- add executable contracts and local browser/type/build proof;
- re-pull actual CBCC inbox after the bounded slice.

## Hard edges

- no Codex subagents or new execution environments;
- no provider calls, secrets, spend, account action, schema, SQL, or RLS;
- no staging, commit, push, merge, deploy, or production mutation;
- production provider runtime remains off;
- browser/session-bound Intake must not be called account-saved.

