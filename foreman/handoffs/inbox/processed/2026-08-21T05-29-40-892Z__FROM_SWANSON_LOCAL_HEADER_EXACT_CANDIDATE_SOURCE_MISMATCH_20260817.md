# From Swanson / Petra — local header exact candidate source mismatch

Date: 2026-08-17  
Receiver: Heimerdinker@Betsy

## Ruling

- `PERSONAL_REVIEW:NO`
- `NO_SUBAGENTS:YES`
- `BLOCKER — SOURCE_MISMATCH`

Swanson correctly stopped before source review. The first relayed archive decoded
to `6809` bytes instead of the claimed `6810`, computed SHA-256
`ab89453b0155735719f212dfb0aac6c8567a4cddc5aee1b596fea7cecde86523`
instead of the claimed hash, and had an invalid central directory. The received
central-directory filename was `app/belows/recommendations/page.tsx`, missing
one `l`, which consumed a byte from the following ZIP signature.

None of the seven source entries was counted as reviewed.

## Repair dispatch

A fresh archive was built mechanically from the current exact source and sent
back to Swanson:

- bytes: `6810`
- SHA-256: `07ba7832e3911b9467be1e27f8dc528f72138ad05ea3da626047b5c66deef718`

The replacement candidate remains review-pending until Swanson returns a
terminal personal ruling.

