# Operator Assist V0

Local helper for two explicit operator actions:

1. Workspace Snapshot Builder
   - Captures a screenshot.
   - Sends it to Gemini or OpenAI vision when a key is present.
   - Generates workspace/FancyZones notes.
   - Saves a receipt under `out/receipts/`.

2. AI Assisted Auto-Paste
   - Takes a prompt plus `Aeye@Machine` destination.
   - Generates a compact packet.
   - Copies it to the clipboard.
   - Saves a receipt under `out/receipts/`.

## Setup

```powershell
cd C:\Users\Ben Leak\Desktop\github\Werkles\tools\operator_assist
npm install
Copy-Item .env.example .env
```

Add `GEMINI_API_KEY` or `OPENAI_API_KEY` to `.env` if you want vision analysis. Without a key, snapshot still captures the screen and writes a clean blocked receipt.

## SETUP HUMAN GATE

Ben must add `GEMINI_API_KEY` or `OPENAI_API_KEY` to local `.env`.
Do not commit `.env`.

## One-Click Launchers

Double-click:

- `launchers\Operator Assist Snapshot.cmd`
- `launchers\Operator Assist Packet.cmd`

Snapshot creates `.env` from `.env.example` if needed. If no key is present, it opens `.env` and this README so the setup gate is visible.

## No-Mule Completion Rule

Completion must return an executable artifact, shortcut, button, or receipt. Returning instructions for Ben to type is not a valid completion state for GREEN local tasks.

## Maintainer CLI

These commands exist for development and receipt checks, but operator completion should prefer the launchers above:

```powershell
npm run snapshot
npm run packet -- Dink@Betsy "mission text"
```

## Boundaries

- No secrets are committed.
- No auto-send.
- No auto-paste without the explicit `npm run packet` command.
- Clipboard write is local only.
- Receipts are saved under `tools/operator_assist/out/`.
