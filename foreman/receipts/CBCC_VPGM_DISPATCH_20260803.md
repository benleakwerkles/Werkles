# CBCC VPGM Dispatch — CBCC_GHOST_MATCH_REDTEAM v0.1

**Execution context:** LOCAL_SALLY_WINDOWS
**Issued:** 2026-08-03 07:41 UTC
**Foreman:** Lady Jessica / Maker
**Operator instruction:** "You, as foreman, are responsible for pushing PGM prompts to them."

## What was wrong

Foreman built the owner-bound matching slice alone, then wrote outbox packets and
treated a file sitting in a folder as a dispatch. It was not. Two of those packets
(Ender, Bean) had been in `foreman/handoffs/outbox/` since 2026-08-02 with no
delivery attempt, and the existing paste blocks pointed cousins at a file path on
Sally that no external Aeye can open.

## What was issued

Mission file: `foreman/crew-dispatch/missions/CBCC_GHOST_MATCH_REDTEAM_20260803.json`
Issuer: `foreman/crew-dispatch/crew-vpgm-command.mjs` (new — the prior issuer only
emitted `ROLE_AWARENESS_SYNC`).

Every paste block is **self-contained**: slice description, the verbatim member-facing
strings, the scoring model, the admitted gaps, the per-seat V/P/G/M assignment, and the
exact relay-metadata block to return. A cousin needs nothing but the paste.

| Tab | Seat | Assignment | Paste chars |
|-----|------|-----------|-------------|
| 1 | Petra (ChatGPT) | GO/NO-GO, spend sequence, gate check on Foreman's own moves | 6491 |
| 2 | Skybro (Gemini) | Preview persistence options and the gate each one triggers | 6211 |
| 3 | Ender (Claude) | UX red team: fit score, reason phrasing, blocker stacking, empty state | 6951 |
| 4 | Bean (DeepSeek) | Hostile trust audit: cookie boundary, score-as-verification, auth bypass flag | 7139 |
| 5 | Computer (Perplexity) | Cited research on synthetic-profile disclosure norms | 6170 |

All five pass dispatch policy verification: `status: OK`, class
`AUTO_LOAD_HUMAN_SEND` — stop before Send.

Petra's packet explicitly asks her to rule on three moves Foreman made without asking:
editing `.env.local`, archiving 67 entries out of `foreman/speaker/entries`, and leaving
the repo uncommitted. Foreman does not get to grade those.

## Courier bugs found and fixed while delivering

1. `scripts/foreman/relay-courier-lib.mjs` — `resolvePasteForCousin` resolved
   `packetFile` (a bare filename) against the repo root, so packet verification always
   returned "Packet file not found". Now prefers `packetPath`, falls back to the outbox.
   This was broken for the role-sync path too.
2. `foreman/crew-dispatch/crew-edge-courier.ps1` — `Open-AeyeCrewBay` passed
   `--user-data-dir=$profile` unquoted. The repo path contains a space, so Edge received
   a truncated path, silently used the default profile, and the bay was never detectable.
   `-EnsureEdge` therefore never worked on this machine. Now quoted, and the profile
   directory is created up front.

## State

Edge dispatch bay launched (`foreman/.edge-aeye-crew-profile`, 58 entries, running).
Courier reports `LOADED_AWAITING_HUMAN_SEND` for ENDER on tab 3.

**Unverified:** the bay is a brand-new Edge profile with no provider sessions. The paste
was almost certainly delivered onto a Claude login screen rather than a composer.
Foreman is not claiming this reached Ender.

## Chrome CDP courier (replaces the focus-stealing path)

Operator question: why Edge? Answer: no good reason. The courier was hardcoded to Edge
(`crew-tabs.config.json`, `crew-edge-courier.ps1`, `Find-EdgeExecutable`) and it works by
focusing a window and firing `SendKeys` Ctrl+V — which steals the cursor on every
delivery regardless of browser, and cannot prove the text arrived.

New: `scripts/foreman/chrome-cdp-courier.mjs`

- Chrome on a dedicated profile (`foreman/.chrome-aeye-crew-profile`) with CDP on 9335.
- Inserts text via CDP `Input.insertText`. No OS focus required, no clipboard, no
  keystrokes into whatever window the Operator is actually using.
- Reads the composer back and requires both the head and tail of the paste to be present
  before reporting success. Writes a screenshot to `foreman/receipts/courier-proof/`.
- Never presses Enter. Never clicks Send.

First run: PETRA verified `LOADED_AWAITING_HUMAN_SEND`, 6491 chars sent, 6601 in
composer, screenshot `foreman/receipts/courier-proof/PETRA_composer_loaded.png`.

Sign-in state in the courier window: ChatGPT, Gemini, Perplexity have live composers but
are **anonymous sessions** — they would answer as generic models, not as the seats with
their accumulated context. Claude and DeepSeek sit on sign-in walls. Login is a human
gate; Foreman stops here rather than spending the remaining pastes on personality-less
sessions.

Edge is retired, not merely bypassed. `foreman/crew-dispatch/CREW_RELAY_AUTOMATION.md`
carries a deprecation banner, and `relay-courier.mjs deliver` emits a stderr notice
pointing at the Chrome courier. `verify` and `status` on the old courier stay in use —
they are the dispatch-policy gate, not a delivery mechanism. The stray Edge bay window
from the failed attempt is closed.

Delivered and verified: ENDER, loaded into the existing **Werkles/Nerdkle** Claude
project (so the seat answers with its own accumulated context, not as a fresh model),
screenshot `foreman/receipts/courier-proof/ENDER_composer_loaded.png`, unsent.

Courier robustness fixes found by running it for real:

- Two concurrent CDP connections: one connection calling `browser.close()` tore down the
  other's page. Delivery is now a single connection handling seats in parallel, and the
  courier never issues a browser-close against the Operator's Chrome.
- The wait loop held one page handle across a login, so a redirect or a tab put to sleep
  by Chrome's memory saver killed the run. The tab is now re-resolved on every poll.

## Do not edit until replies are processed

`foreman/NEXT_ACTION.md` and `foreman/CURRENT_STATE.md` are hashed into all five packets
(`nextActionHash` `086ce991…`). Editing either file makes every cousin reply fail intake
as `STALE_DO_NOT_APPLY`. Cockpit updates wait for the inbox.

## Return path

Replies save to `foreman/handoffs/inbox/FROM_{COUSIN}_CBCC_GHOST_MATCH_REDTEAM_v0.1.md`,
then `node foreman/crew-dispatch/crew-response-intake.mjs validate`.
