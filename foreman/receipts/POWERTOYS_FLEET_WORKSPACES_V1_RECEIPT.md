# POWERTOYS_FLEET_WORKSPACES_V1_RECEIPT

RECEIPT_ID: RECEIPT_POWERTOYS_FLEET_WORKSPACES_V1_20260718
TIMESTAMP: 2026-07-18
AGENT: Maker@Betsy
EXECUTION_CONTEXT: LOCAL_SALLY_WINDOWS
MACHINE: Betsy (`DESKTOP-KTBH0LA`)

## What shipped

- Doctrine: `foreman/POWERTOYS_FLEET_WORKSPACES_v1.md`
- Registry: `foreman/soledash/FLEET_WORKSPACES_REGISTRY.json`
- Launch: `scripts/foreman/launch-fleet-workspace.ps1`
- Shortcuts: `scripts/foreman/install-fleet-workspace-shortcuts.ps1`
- Capture helper: `scripts/foreman/capture-local-powertoys-workspaces.ps1`
- Operator packets: Spanzee + Medullina capture outbox

## Betsy packs ready

| Pack | Workspace id |
|------|----------------|
| `betsy_hub` | `{23606CAF-A5C1-43C0-AD4A-6BF460DCED44}` (renamed to Betsy Forge Hub) |
| `betsy_autopaste` | `{27BB1F1B-BC9E-4DBE-9003-0DAB8576BC0B}` |

## Still pending Operator capture

- Spanzee → `spanzee_forge`
- Medullina → `medullina_aux`
- Sally → `sally_mirror`

## Pass / Fail

PASS for Betsy tooling + doctrine. Fleet coverage for Spanzee/Medullina/Sally is capture-gated on those hosts.
