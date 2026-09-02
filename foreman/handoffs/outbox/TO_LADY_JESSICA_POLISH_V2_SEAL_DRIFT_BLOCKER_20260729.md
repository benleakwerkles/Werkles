# TO LADY JESSICA — Polish v2 seal drift blocker

From: **Heimerdinker / Dink @ Betsy**  
Date: 2026-07-29 ~15:31 ET  
Command context: Ben issued `PGM` after appointing Lady Jessica as the Werkles.com foreman and packet lead.

## RECEIVED

Pulled:

- `TO_FLOCK_WERKLES_FOREMAN_APPOINTMENT_20260729.md`
- `LADY_JESSICA_V_FUNNEL_AND_WEIGHT_20260729.md`
- `TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_20260726.md`
- `TO_HEIMERDINKER_MAKER_POLISH_V2_PUSH_FILE_HASHES_20260726.sha256`
- current `VPG_SHORTHAND.md`, `ACTIVE_AGENT.md`, `NEXT_ACTION.md`, and Lady Jessica lane state

Selected G ideas:

1. stranger-eyes sweep of the closed `/bellows/intake` room
2. public-route image-weight audit and in-place compression for referenced images over 1 MB

## BLOCKER: POLISH_V2_SEAL_DRIFT_6_FILES

The push packet says: **hash mismatch = STOP and report.**

Preflight result:

- 32 of 38 sealed files: `MATCH`
- 6 of 38 sealed files: `MISMATCH`
- the six mismatched paths are clean against local `HEAD` `861080c`, not dirty polish-v2 versions
- all six were rewritten together at `2026-07-29 15:28:34 ET`, after the funnel packet was authored
- current remote production branch is `ab7db85` (`Add Lady Jessica product icons`)

| File | Sealed SHA-256 | Current SHA-256 |
|---|---|---|
| `app/layout.tsx` | `37b4b803877dd2044edde751d4aa275026ba3cedcc0698f1d3386609a95b7e9a` | `22b21549e21d5e19a61767676419a9bbd93ec4f1d2d3c7f6f9dcf1a2c8fb2e16` |
| `app/bellows/page.tsx` | `05383af2aa686c88c765008b0de5ee74957139e1da29a3e6c86cdbf7ff5e5cac` | `4a654f8482363cd393eff07fabe683aa84766702b9fae03a532ed7e15f9d8ed2` |
| `app/dashboard/profile/page.tsx` | `63b17dd8d53a212a758564a53cbc9c8babaed769b45e2db8a74a2c5d455e2d68` | `f6fefd6fcd193132e8f1f661189acb4308281b946addac31d9c7392d0638cfc4` |
| `app/membership/page.tsx` | `a62261c7de81b9a5ebfb7e43c829bb7ec4a7fabeba19d4afec2a9f56d16ed9e9` | `e6e85ab08c3bcb26063b145c78c0b4f309f23724fcb39998e8b5d45981a04fec` |
| `app/proof/page.tsx` | `91ea9cfd3c5d298b6251c35fac2f843ce58fdb1497ca619c323c06a8c7887ca0` | `810a56f2813a65a7de1371671360307391632bede5973ed1de0ac7a9c054c1f3` |
| `components/narrative/narrative-act-page-layout.tsx` | `1af8f5f5e60fcc90709e8b1c2382d114bd1c11c7ec34f83370bb3df1e26e0188` | `0959f320f08a2c18a6ef7f826a8924900e30206c484cf8d985c88187737d5382` |

## Required foreman repair

Reconcile the six missing polish-v2 changes on top of current production
`ab7db85`, preserving the live Lady Jessica icon slice, then issue a fresh
complete file list and SHA-256 manifest. The other 32 sealed files remain
untouched and still match.

Heimerdinker will resume the intake + page-weight G immediately after the
fresh seal appears.

## Preserved hard stops

- no product files mutated after the mismatch
- no images compressed
- intake remains closed
- no push, deploy, merge, env, secret, SQL, payment, or production-data action

