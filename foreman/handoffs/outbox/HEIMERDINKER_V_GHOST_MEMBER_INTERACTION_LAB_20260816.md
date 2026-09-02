# V packet — Ghost Member interaction lab

Date: 2026-08-16
Owner: Heimerdinker / Codex local hands on Betsy
Status: authorized local implementation; actual CBCC post-build receipt pending

## User problem

The Ghost Fleet can rank synthetic candidates, but a member cannot yet interact with those candidates. The walkthrough therefore stops at a readout instead of becoming a playable product loop.

## Existing actual-CBCC guidance controlling this slice

- Ender: pass the mother test, use plain language, show cause and effect, and never claim data was saved when it was not.
- Bean: preserve unknowns, keep account/session custody separate, and fail closed instead of inventing trust.

## Build boundary

Add a deterministic interaction lab to the existing Intros page. It may use only the synthetic Ghost Members already selected by the owner-bound ranking readout. The lab may expose offers, seeks, proof gaps, and four fixed questions. It must not call a model, provider, API, network, or storage surface; accept free text; create an intro; contact anyone; or save a transcript.

## Proof required

- only ranked synthetic members enter the lab;
- all output is deterministic and visibly synthetic;
- no raw intake, score, token, credential, provider, or contact data appears;
- no fetch or browser storage exists in the client component;
- keyboard, mobile, contrast, and 44px target checks pass;
- current member walkthrough routes remain healthy.

