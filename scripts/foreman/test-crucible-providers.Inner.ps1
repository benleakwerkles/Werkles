#requires -Version 5.1
<#
  Crucible provider API smoke — names-only output, no secrets printed.
#>
$ErrorActionPreference = "Stop"

$stripeSecret = [Environment]::GetEnvironmentVariable("STRIPE_SECRET_KEY", "Process")
$plaidClientId = [Environment]::GetEnvironmentVariable("PLAID_CLIENT_ID", "Process")
$plaidSecret = [Environment]::GetEnvironmentVariable("PLAID_SECRET", "Process")
$plaidEnv = ([Environment]::GetEnvironmentVariable("PLAID_ENV", "Process") | ForEach-Object { if ($_) { $_ } else { "sandbox" } }).ToLower()

$plaidBase = switch ($plaidEnv) {
  "production" { "https://production.plaid.com" }
  "development" { "https://development.plaid.com" }
  default { "https://sandbox.plaid.com" }
}

$result = [ordered]@{
  ok = $true
  checks = @()
  secret_values_printed = "NO"
}

function Add-Check {
  param(
    [string]$Name,
    [scriptblock]$Action
  )

  try {
    $detail = & $Action
    $row = [ordered]@{
      name = $Name
      status = "PASS"
    }
    if ($detail) {
      foreach ($key in $detail.Keys) {
        $row[$key] = $detail[$key]
      }
    }
    $result.checks += ,$row
  } catch {
    $result.ok = $false
    $result.checks += [ordered]@{
      name = $Name
      status = "FAIL"
      error = $_.Exception.Message
    }
  }
}

Add-Check "stripe_secret_shape" {
  if ($stripeSecret -notmatch "^(sk|rk)_(test|live)_") {
    throw "STRIPE_SECRET_KEY missing or invalid shape"
  }
  @{ mode = if ($stripeSecret.StartsWith("sk_live_") -or $stripeSecret.StartsWith("rk_live_")) { "live" } else { "test" } }
}

Add-Check "stripe_identity_session" {
  $body = @{
    type = "document"
    "metadata[user_id]" = "crucible_mule_smoke"
    return_url = "https://werkles.com/dashboard/crucible?check=identity&return=1"
  }
  $response = Invoke-RestMethod -Method Post -Uri "https://api.stripe.com/v1/identity/verification_sessions" -Headers @{
    Authorization = "Bearer $stripeSecret"
  } -Body $body
  @{
    session_id = $response.id
    has_url = [bool]$response.url
    status = $response.status
  }
}

Add-Check "plaid_link_token" {
  if ([string]::IsNullOrWhiteSpace($plaidClientId) -or [string]::IsNullOrWhiteSpace($plaidSecret)) {
    throw "PLAID_CLIENT_ID or PLAID_SECRET missing"
  }
  $payload = @{
    client_id = $plaidClientId
    secret = $plaidSecret
    user = @{ client_user_id = "crucible_mule_smoke" }
    client_name = "Werkles"
    products = @("assets")
    country_codes = @("US")
    language = "en"
  } | ConvertTo-Json -Depth 6
  $response = Invoke-RestMethod -Method Post -Uri "$plaidBase/link/token/create" -ContentType "application/json" -Body $payload
  if (-not $response.link_token) {
    throw "plaid link_token missing"
  }
  @{ link_token_present = $true; plaid_env = $plaidEnv }
}

$result | ConvertTo-Json -Depth 6
if (-not $result.ok) { exit 1 }
