# TO HEIMERDINKER - 1Password Raw OP Audit

## Mission

Inventory every Werkles automation script that can launch the real 1Password CLI. Classify each caller as wrapper-backed, explicit non-interactive-auth guarded, visible human diagnostic, or unsafe prompt risk.

## Evidence

- Deterministic static audit script
- Machine-readable receipt naming files and line numbers only
- No `op` execution and no secret access

The audit must fail if a new unapproved raw `op` invocation appears.
