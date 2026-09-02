# TO DOOZER — Identity / Preview Truth Repair

From: Heimerdinker@Betsy, Werkles Foreman  
Campaign: `WERKLES_COMPLETION_CAMPAIGN`  
Slice: `WERKLES_COMPLETION_SLICE_01_IDENTITY_PERSISTENCE`

## Reviewed decision

Computer correctly traced the current localhost failure:

`missing Supabase client config → dev-preview-token → shared
member_dev-preview-user → stale bakery/session data displayed in an
authenticated-looking Recommendations flow`.

Computer proposed a global discriminated auth return type. Foreman proved
`getClientAccessToken()` has thirteen consumers. Petra returned `PATCH`: reject
the global rewrite and repair the Recommendations consumption boundary first.

## Your Handeye assignment

Personally inspect the exact current bytes and implement the smallest source-only
candidate that does all of the following:

1. `dev-preview-token` renders a clearly labeled local-preview Recommendations
   state and cannot claim account saving.
2. Preview Recommendations do not hydrate shared historical
   `member_dev-preview-user` Intake data. In particular, a stale bakery fixture
   cannot appear merely because a preview cookie exists.
3. `null` remains anonymous/sign-in-required.
4. A real Supabase bearer token continues to use
   `/api/bellows/recommendations/current`; do not change that contract.
5. Do not change `getClientAccessToken(): Promise<string | null>` globally.
6. Do not apply or edit Supabase schema/RLS, provider configuration, `.env`, login
   mechanics, or production data.

Expected primary inspection area:

- `components/squibb/account-aware-recommendation-surface.tsx`
- `lib/squibb/public-recommendation-session-server.ts`
- `lib/squibb/bellows-owner-session.ts`
- focused tests under `scripts/foreman/`

You may narrow the file set further after reading the bytes. Any expansion must be
explained as a concrete dependency, not convenience.

## Acceptance proof

- preview never renders `Saved to your Werkles account.`;
- preview visibly says `Local walkthrough — not your member account.`;
- anonymous visibly invites sign-in and never fetches account Recommendations;
- real bearer path remains unchanged;
- stale preview bakery data cannot cross into a fresh preview or account-looking
  surface;
- two preview sessions do not silently share personal-looking history;
- focused tests, TypeScript, and existing Intake/Recommendations continuity tests
  pass;
- receipt names exact files, before/after behavior, collision checks, rollback,
  and all remaining gates.

## Rotation after your candidate

Return the candidate to Heimerdinker. Heimerdinker routes exact changed bytes to:

1. Lady Jessica — visible state and visual-system integration;
2. Ender — human walkthrough and comprehension;
3. Bean — hostile owner/cookie/trust attack;
4. Computer — contract verification;
5. Petra — `WERKLES_IDENTITY_SPINE_SEAL_V1` acceptance.

Return to:

`foreman/handoffs/inbox/FROM_DOOZER_IDENTITY_PREVIEW_TRUTH_REPAIR_20260822.md`

`ACK`, `SENT`, and green unit tests alone are not completion.

No new task, subagent, environment, provider call, credentials, env edit,
SQL/schema/RLS, production mutation, push, merge, or deploy.

