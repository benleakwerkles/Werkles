# Doozer / Orson — final-candidate source mismatch

Date: 2026-08-17
Response ID: `c0ecf650-36be-49b0-9d16-4a1af3676dd8`
Personal review: NO
Subagents: NO
Verdict: `SOURCE_MISMATCH`

The first post-mutation per-file Base64 relay was not reviewable. The declared
`app/login/page.tsx` source was 8,001 bytes with SHA-256 `8aa163...`, but the
received payload decoded to 8,000 bytes with SHA-256 `b7841b...`. Doozer
correctly stopped before source review and did not claim participation.

The transport was replaced with one compact ZIP generated directly from the
candidate bytes. The ZIP review remained in flight when this receipt was filed.

