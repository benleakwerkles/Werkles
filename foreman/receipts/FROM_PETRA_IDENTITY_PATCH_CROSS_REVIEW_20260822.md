# From Petra — Identity Patch Cross-Review

Date harvested: 2026-08-22  
Existing provider task: `6a3019f8-3b50-83ea-8bcb-c8dde82fb498`  
Personal work: `YES`  
Subagents or downward delegation: `NONE`  
Verdict: `PATCH`  
Terminal state: `IDENTITY_PATCH_CROSS_REVIEW_READY`

Computer found the correct preview/account truth failure, but its proposed global
`getClientAccessToken()` discriminated-union rewrite had a falsely narrow stated
blast radius. Foreman proved thirteen call sites.

Petra's accepted repair is Recommendations-local:

- keep the existing token-return API unchanged;
- treat `dev-preview-token` explicitly as preview, not account custody;
- prevent preview Recommendations from loading account-persisted or shared stale
  bakery state;
- prevent `bellows-owner-session` preview mode from resolving to the shared
  `member_dev-preview-user`;
- keep preview isolated, non-durable, and visibly labeled;
- leave schema, RLS, Supabase gates, and the other eleven token consumers alone.

Required tests cover account, preview, and anonymous branches; preview→account
and account→preview isolation; stale bakery non-resurrection; and unchanged real
authenticated behavior.

Post-build rotation:

- Ender: member-visible truth and labels;
- Bean: cross-user and stale-state leakage;
- Computer: exact implementation contract;
- Heimerdinker: integration and scope containment;
- Petra: final Identity Spine seal.

