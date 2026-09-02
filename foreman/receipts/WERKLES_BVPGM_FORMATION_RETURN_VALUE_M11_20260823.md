# Werkles BVPGM — Formation Return Value M11 Receipt

Date: 2026-08-23  
Foreman: Heimerdinker@Betsy  
Scope: local candidate only; no push, deploy, provider action, schema/RLS, secrets, spend, or production mutation.

## V — Broad direction and crew notification

- Vision packet: `foreman/handoffs/outbox/WERKLES_BVPGM_FORMATION_TO_RETURNING_MEMBER_VALUE_M11_V_20260823.md`
- Pre-build mission: `foreman/crew-dispatch/missions/WERKLES_BVPGM_FORMATION_TO_RETURNING_MEMBER_VALUE_M11_20260823.json`
- Post-build exact-candidate mission: `foreman/crew-dispatch/missions/WERKLES_BVPGM_M11_ACCEPTED_WORK_RETURN_POSTBUILD_20260823.json`
- Post-build six-file content digest: `1c87778a4efb9c38f36cdbf85d73a2b04e7bcf3f`

Notification truth:

- COMPUTER / Thufir: pre-build and post-build packets were mechanically posted to the exact Perplexity desktop task with `cursorKeyboardClipboardTouched: NO`. Both sends are `POSTED_NOT_CUSTODY`, not release approval.
- COMPUTER pre-build receipt returned `COMPUTER_M11_PATCH`, high confidence, with an echoed custody challenge but identity still pending. It was read and used.
- COMPUTER post-build packet submission: `VPGM:COMPUTER:59f04561b809`; packet SHA-256 `59f04561b8092b881876274785aec374745a983c1b68ced4a189b8821c8d84d0`. The correlated receipt returned `COMPUTER_M11_POSTBUILD_PATCH`, high confidence, with identity still pending.
- ENDER: desktop proof did not return and was terminated after a bounded wait. No notification or review is claimed.
- BEAN, SKYBRO, PETRA: exact packets exist, but the configured Edge relay was not running. Delivery failed closed; no notification or review is claimed.
- LADY JESSICA: notification packet exists. No callable, background-safe route was proved; no delivery, custody, review, or release sign-off is claimed.

## PG — Build and red-team findings used

Thufir's pre-build receipt required two bounded repairs that matched Operator direction:

1. Reuse only current Formation wording both people accepted. Never import private predictions, parked questions, objections, or untouched generated suggestions.
2. Replace insider/legal-weight labels and generic advice with plain language plus a small set of public primary sources. Werkles must orient the conversation without selecting an entity, ownership split, tax treatment, financing instrument, or contract term.

## M — Implemented return loop

- Personal Bellows now exposes a collapsible `What you have settled together` readout from the validated device-local Werkle Operating Brief.
- The Partnership Alignment Memo shows the same accepted rows as read-only context. It does not prefill or save the member's private answers.
- Formation member labels now read `What each of you is putting in`, `Money questions for an adviser`, and `Who owns the work`.
- Personal Bellows adds `Read together before deciding more` links from a bounded deterministic source manifest:
  - U.S. Small Business Administration market research, business planning, and business-structure material;
  - Internal Revenue Service business-structure overview;
  - Federal Trade Commission small-business scam guidance.
- External sources are not ranked, personalized, fetched at runtime, sponsored, or presented as Werkles professional advice.
- The readout states when its public-source links were last checked and explicitly says a link is not an endorsement or decision.

Primary-source destinations were opened and verified on 2026-08-23 before implementation.

## Verification

- `npm run typecheck`: PASS.
- `npx --yes tsx scripts/foreman/werkle-formation-contract-smoke.ts`: PASS.
- `npx --yes tsx scripts/foreman/werkle-operating-brief-contract-smoke.ts`: PASS.
- `node scripts/foreman/bvpgm-m11-formation-return-browser-smoke.mjs`: PASS.
  - accepted wording returns through Personal Bellows;
  - the private memo remains empty;
  - source links render;
  - browser console/page errors: none.
- `npm run build`: PASS; 100 routes compiled.
- Local HTTP route spine: 10/10 PASS.
- Source-bound release audit: `SOURCE_BOUNDARY_CLOSED__LOCAL_REGRESSION_PASS__INDEPENDENT_REVIEW_OWED`.
  - final candidate: 284 files;
  - changed dependency leaks: 0;
  - final candidate digest: `8174569f5c306bc65fdd4f27f0375778d8c899d4054a5b3cb8c804f61b9df800`.
- Legacy `bellows-device-draft-shelf-browser-smoke.mjs`: baseline stale-copy failure (`Pick up a Bellows draft.`), before reaching this M11 slice. It is not claimed as product proof and is not used to overrule the focused passing walk.

## Remaining gates

- Actual Bean, Ender, Skybro, Petra, and Lady Jessica post-build receipts remain owed. Thufir's post-build receipt is advisory and not release custody.
- Formation and returned artifacts are still device-local practice, not durable two-member account custody.
- Heimerdinker has not issued release sign-off. Ben's approval is not requested.
