# Heimerdinker V — Harvey legacy-evidence bridge

Date: 2026-08-21
Author: Heimerdinker@Betsy / Codex Foreman
Execution context: `CODEX_LOCAL` on `LOCAL_SALLY_WINDOWS`

## Vision

Complete the Swanson + Dragon disposition instead of stopping at containment. Preserve the old TinkerDen and ThinkIt files for forensic compatibility, keep their UI read-only and out of ordinary navigation, and surface the genuinely useful evidence summary inside the current Harvey/Nerdkle home.

## Useful evidence to carry forward

- archived command-packet count;
- archived command-receipt count;
- receiver-handoff counts split into posted, pending, returned-unposted, template-blocked, and synthetic;
- latest archived ThinkIt return, when one exists;
- explicit source and limitation labels so none of this is mistaken for current Harvey transport or current cousin activity.

## Hard edges

- Do not delete or rewrite historical files.
- Do not restore packet composition, dispatch, polling, posting, approval, or copy-command controls.
- Do not claim old receiver hashes satisfy current Harvey custody.
- Do not call legacy APIs from the new surface; use read-only repository readers.
- No provider calls, credentials, secrets, SQL, schema, push, deploy, or production mutation.

## Proof required

- TypeScript and production build pass.
- Rendered Nerdkle page shows the evidence bridge and limitations.
- Legacy routes remain read-only and hidden from ordinary navigation.
- Receipt names the Operator-relayed Swanson + Dragon review as the controlling review evidence.
