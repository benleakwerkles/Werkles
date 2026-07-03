# Medulla Command Surface V0

Packet ID: `DINK_BETSY_TINKERDEN_MEDULLA_COMMAND_SURFACE_V0_2026_06_27`

## File List

- `MEDULLA_COMMAND_SURFACE_V0.md`
- `command_surface_schema.json`
- `receipt_event_schema.json`
- `README.md`

## How This Surface Is Used

1. Operator intent becomes a command object.
2. The command object is validated against `command_surface_schema.json`.
3. The command enters a gate state.
4. If approved, the command can be written to the command inbox.
5. The command remains incomplete until a receipt event returns.
6. The receipt event is validated against `receipt_event_schema.json`.
7. The command closes only after the receipt is linked to `command_id` and shows `ACK`, `BLOCKER`, or `ARTIFACT`.

## Example Command Object

```json
{
  "command_id": "cmd_medulla_surface_0001",
  "operator_intent": "Create a file-backed command surface artifact for Dink@Betsy.",
  "target_surface": "tinkarden/medulla_command_surface",
  "command_type": "BUILD",
  "risk_level": "MOSQUITO",
  "gate_required": false,
  "current_state": "WRITTEN",
  "created_at": "2026-06-27T00:00:00.000Z",
  "updated_at": "2026-06-27T00:00:00.000Z",
  "receipt_required": true,
  "parent_command_id": null,
  "source_packet_id": "DINK_BETSY_TINKERDEN_MEDULLA_COMMAND_SURFACE_V0_2026_06_27"
}
```

## Example Receipt Object

```json
{
  "receipt_id": "receipt_medulla_surface_0001",
  "command_id": "cmd_medulla_surface_0001",
  "packet_id": "DINK_BETSY_TINKERDEN_MEDULLA_COMMAND_SURFACE_V0_2026_06_27",
  "owner": "Dink@Betsy",
  "stream": "TINKERDEN / MEDULLA COMMAND SURFACE",
  "status": "ARTIFACT",
  "artifact_path": "tinkarden/medulla_command_surface/MEDULLA_COMMAND_SURFACE_V0.md",
  "blocker": null,
  "timestamp": "2026-06-27T00:00:00.000Z",
  "proof_type": "ARTIFACT_PATH",
  "notes": "Schema and README artifacts returned."
}
```

## Explicitly Not Included In V0

- Feral UI.
- Full TinkerDen cockpit UI.
- Nerdkle / NMCLR proof body.
- Book or manuscript work.
- Petra@Sally receipt ops.
- Swanson routing.
- Autonomous execution.
- Force Live behavior.
- Payment, secrets, external account, or production actions.
- Any rule that treats `SENT` as a receipt.

## Next Valid Owner After Artifact Return

Thufir@Sally is the next valid owner for validation after this artifact returns.
