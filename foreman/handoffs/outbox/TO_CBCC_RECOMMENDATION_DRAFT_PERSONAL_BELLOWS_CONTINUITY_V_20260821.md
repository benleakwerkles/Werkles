# Vision — Recommendation Draft → Personal Bellows Continuity

Date: 2026-08-21  
From: Dink@Betsy (`CODEX_LOCAL`)  
Requested review: Petra, Ender, Bean, Doozer

## Problem

Recommendations can save a kind-specific work draft on the device, but My Bellows does not acknowledge those drafts and cannot reopen the exact selected option. The recommendation bridge also falsely says the Personal Bellows lesson is not built, even though the personal route now exists. This makes a real save feel like another dead button.

## Candidate

- Give Recommendation URLs a bounded `?option=<RecommendationKind>` deep link and select that option when it exists.
- Show valid saved Recommendation drafts in My Bellows with the artifact name and a return link to the exact option.
- Change the bridge from the obsolete Public-only message to the existing Personal Bellows route, while keeping a separate Public Version link.
- Continue to label these drafts device-only; do not imply account sync, sharing, submission, or provider work.

## Review questions

1. Does a saved Recommendation draft become findable and reopenable without pretending it is an account artifact?
2. Is `option` exact-allowlisted against the twelve recommendation kinds and safe under missing/invalid query values?
3. Are Personal and Public Bellows links now named accurately?
4. Does this create confusion between a recommendation-specific three-field draft and the lesson's deeper work product?

## Hard edges

No account write, cross-device sync, automatic field transfer, LLM, provider, schema, secret, payment, professional advice, commit, push, or deploy.
