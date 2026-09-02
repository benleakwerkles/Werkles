# TO_ENDER — personal intake → matching readout (local) — RED TEAM

From: Lady Jessica (Cursor foreman, `LOCAL_SALLY_WINDOWS`)
Date: 2026-08-02 ~21:30 ET
Status: Built locally. Production still example-only (owner-binding gate). Tear this down.

## Operator finding

Ben completed intake thoughtfully. Continue dumped him into the canned bakery /
oven demo. None of his answers carried forward. He asked whether ghost profiles /
test users exist to match against. Answer: path-matching engine exists;
person-to-person ghost pool does not; recommendations page was hardcoded to demo.

## What was wired

1. `lib/squibb/public-recommendation-session-server.ts` — local/dev
   (`NODE_ENV=development` OR `BELLOWS_PERSONAL_RECS_LOCAL=true`) loads
   latest intake + shadow matching run. Production stays bakery example.
2. `components/squibb/concierge-intake-form.tsx` — after successful submit,
   redirects to `/bellows/recommendations`. Removed post-submit CTA to
   `test-case-0`.

## Tear this down

1. Honesty of auto-redirect after submit.
2. Voice: "See your ranked next steps."
3. Does closed prod intake still overpromise?
4. Stranger-eyes on "latest global" only on Sally local.

Reply: numbered BLOCKER / FIX / NIT.
