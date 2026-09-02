# Autonomous Matching Preview Truth Refresh — VPG9 — Lady Jessica

Status: `COMPLETED — GET-ONLY PREVIEW/PRODUCTION TRUTH REFRESH`
Date: `2026-07-17`
Seat / machine: `LadyJessica@Betsy` / `Betsy`
Repository: `C:\Users\Ben Leak\github\Werkles`
Branch / HEAD at run: `maker/site-g-20260703` / `674f3db`
Execution context: `LOCAL_SALLY_WINDOWS`

## Packets pulled

- `TO_LADY_JESSICA_AUTONOMOUS_MATCHING_PREVIEW_TRUTH_VPG9` (handoff: `foreman/handoffs/outbox/TO_LADY_JESSICA_AUTONOMOUS_MATCHING_PREVIEW_TRUTH_VPG9_20260716.md`)

## Boundary

- Methods: Vercel `inspect` / `ls`, GET `/bellows/recommendations`, GET `/operator/matching/shadow`, inert POST `/api/bellows/recommendations/packet` (empty JSON body).
- Booleans only; response bodies not printed or persisted.
- Vercel protection bypass loaded from Windows Credential Manager target `Werkles/Vercel/ProtectionBypass` via `Get-WerklesOnePasswordAutomationSecret`; bypass value not printed.
- No intake, save, SQL, deploy, alias, flag, or environment mutation.

## Deployments identified (Ready)

| Surface | Deployment id | URL |
|---|---|---|
| Production (`werkles.com`) | `dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi` | `https://werkles.com` (immutable: `https://werkles1-fz503royl-werkles.vercel.app`) |
| Preview (`maker/site-g-20260703` branch alias) | `dpl_HiuHsFYoqa4ngF5TUBumoA8opUrg` | `https://werkles1-ohrptj8on-werkles.vercel.app` (alias: `https://werkles1-git-maker-site-g-20260703-werkles.vercel.app`) |

Prior Ready Preview on same branch (still Ready, older): `dpl_GDz3JHVc1uT43E3mK9Hf5WggNwtU` / `https://werkles1-e0mx3mn0y-werkles.vercel.app`.

## Two G ideas executed

1. **Protected GET-only Preview readback** — Ready Preview on `maker/site-g-20260703` fetched with bypass header; status and VPG8 marker booleans recorded only.
2. **Production comparison + boundary checks** — Same marker booleans on `https://werkles.com`, plus shadow route denial and save-route `403` canary.

## Marker comparison (Preview vs Production)

| Marker | Preview | Production |
|---|---:|---:|
| HTTP status 200 | true | true |
| `Autonomous Matching example` | true | true |
| `this public beta will not connect it` | true | true |
| `Rules score` | true | true |
| `Saving is unavailable during this beta` | true | true |
| Disabled recommendation action buttons (count) | 3 | 3 |
| Visible `Confidence` label (UI; scripts stripped) | false | false |
| `latest_intake` / packet path markers | false | false |

## Additional production checks

| Check | Result |
|---|---|
| GET `/operator/matching/shadow` | `404` (expected) |
| POST `/api/bellows/recommendations/packet` `{}` | `403` (expected); body not printed |

## Conclusion

**VPG8 containment is LIVE on Production** on deployment `dpl_9NXXaqFksPFxfgqzUPYsCjka5yPi` (post go-live receipt). Preview on `maker/site-g-20260703` (`dpl_HiuHsFYoqa4ngF5TUBumoA8opUrg`) matches Production on all recorded VPG8 marker booleans in this refresh.

Availability-only rollback (pre-VPG8 boundary): `dpl_9u8Gn4F7r8qS38ZGkpn3uevNFqRi` / `https://werkles1-3z6a4fvfa-werkles.vercel.app`.

`COMPLETED — PREVIEW/PRODUCTION VPG8 MARKERS ALIGNED; PRODUCTION CONTAINMENT LIVE`
