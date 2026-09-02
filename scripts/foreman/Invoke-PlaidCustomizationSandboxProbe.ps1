$ErrorActionPreference = "Stop"

$probe = Join-Path $PSScriptRoot "plaid-customization-sandbox-probe.mjs"
& node $probe
exit $LASTEXITCODE
