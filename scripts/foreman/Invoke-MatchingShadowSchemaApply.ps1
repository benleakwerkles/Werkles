#requires -Version 5.1
<#
.SYNOPSIS
  Matching schema apply orchestrator — zero Operator paste.

.DESCRIPTION
  Tries, in order:
  1. Supabase CLI (linked project, Management API token on disk)
  2. Apply-MatchingShadowMigration.ps1 (Chrome dashboard session + op)
  Emits machine-readable JSON only. Never prints secrets.
#>
param(
  [string]$MigrationFile = (Join-Path $PSScriptRoot "..\..\supabase\migrations\00004_matching_shadow_persistence.sql")
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

function Write-Result {
  param([hashtable]$Payload, [int]$ExitCode = 0)
  $Payload | ConvertTo-Json -Compress
  exit $ExitCode
}

if (-not (Test-Path -LiteralPath $MigrationFile)) {
  Write-Result @{ ok = $false; schema = "WERKLES_MATCHING_SCHEMA_APPLY_ORCHESTRATOR_V1"; error = "migration_file_missing" } 1
}

$verifyScript = @'
const { createClient } = require("@supabase/supabase-js");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.log(JSON.stringify({ ok: false, error: "missing_supabase_env" }));
  process.exit(1);
}
const client = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
(async () => {
  const tables = ["discovery_intakes", "matching_shadow_runs"];
  const out = {};
  for (const table of tables) {
    const { error } = await client.from(table).select("intake_id").limit(1);
    out[table] = error ? error.code || error.message : "ok";
  }
  const ready = tables.every((t) => out[t] === "ok");
  console.log(JSON.stringify({ ok: ready, tables: out }));
})();
'@

function Test-TablesViaServiceRole {
  $tierARefs = Join-Path $RepoRoot "foreman\gates\werkles-vercel-tier-a.env.oprefs"
  if (-not (Test-Path -LiteralPath $tierARefs)) { return $null }
  $op = (Get-Command op -ErrorAction SilentlyContinue).Source
  if (-not $op) { return $null }
  $raw = & $op run --env-file="$tierARefs" -- node -e $verifyScript 2>&1 | Out-String
  try { return $raw.Trim() | ConvertFrom-Json } catch { return $null }
}

$before = Test-TablesViaServiceRole
if ($before -and $before.ok) {
  Write-Result @{
    ok = $true
    schema = "WERKLES_MATCHING_SCHEMA_APPLY_ORCHESTRATOR_V1"
    status = "already_applied"
    tables = $before.tables
  }
}

$accessTokenPath = Join-Path $env:USERPROFILE ".supabase\access-token"
$hasCliToken = (Test-Path -LiteralPath $accessTokenPath) -or (-not [string]::IsNullOrWhiteSpace($env:SUPABASE_ACCESS_TOKEN))

if ($hasCliToken) {
  $cliOut = & npx --yes supabase@2.109.1 db query --file "$MigrationFile" --linked -o json 2>&1 | Out-String
  $after = Test-TablesViaServiceRole
  if ($after -and $after.ok) {
    Write-Result @{
      ok = $true
      schema = "WERKLES_MATCHING_SCHEMA_APPLY_ORCHESTRATOR_V1"
      status = "applied_via_cli"
      path = "supabase_db_query_linked"
      tables = $after.tables
    }
  }
}

try {
  $mgmtOut = & (Join-Path $PSScriptRoot "Apply-MatchingShadowMigration.ps1") 2>&1 | Out-String
  $mgmtJson = $mgmtOut.Trim() | ConvertFrom-Json
  if ($mgmtJson.ok) {
    Write-Result @{
      ok = $true
      schema = "WERKLES_MATCHING_SCHEMA_APPLY_ORCHESTRATOR_V1"
      status = $mgmtJson.status
      path = "management_api"
      tables = $mgmtJson.tables
    }
  }
} catch {
  $mgmtJson = @{ ok = $false; error = $_.Exception.Message }
}

Write-Result @{
  ok = $false
  schema = "WERKLES_MATCHING_SCHEMA_APPLY_ORCHESTRATOR_V1"
  status = "blocked"
  before = $before
  management = $mgmtJson
  next_actions = @(
    "Run Enter-WerklesOnePasswordAutomationSession.ps1 -Verify OR install automation token via Store-WerklesOnePasswordAutomationToken.ps1",
    "Run npx supabase login (OAuth only — no paste); then npx supabase link --project-ref <from-1password-url>",
    "Re-run .\\scripts\\foreman\\Invoke-MatchingShadowSchemaApply.ps1"
  )
} 1
