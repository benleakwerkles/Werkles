# TINKERPIT_RELAY_SUPPORT_V0 Workspace ID Probe Receipt

Timestamp: 2026-06-24T03:12:00Z
Destination: TinkerDen Intake / Speaker

## Packet

- Input packet: `td_packet_autopaste_ready_mqrhsc3k_ybtxzc`
- Proof packet: `td_packet_autopaste_ready_mqri0xda_kqlm7q`
- Operator selection: `KEEP`
- Recommendation: `PROCEED`

## Proof

- API path: `POST /api/tinkerden/autopaste`
- Workspace target: `Maker@Betsy PowerToys Workspaces`
- Workspace configured: `false`
- Workspace error: `PowerToys WorkspacesLauncher requires a workspace id argument.`
- Focus attempted: `false`
- Focus detail: `PowerToys WorkspacesLauncher requires a workspace id argument.`
- Launcher process count before: `3`
- Launcher process count after: `3`
- Clipboard set: `true`
- Clipboard verified: `true`
- Clipboard preserved proof packet id: `true`

## Result

PASS. TinkerPit reports the missing workspace id and does not launch Workspaces incorrectly.

## Blockers

- PowerToys Workspace target needs a real workspace id/argument before focus can be attempted.
