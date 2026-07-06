#requires -Version 5.1
$ErrorActionPreference = "Stop"
$WebhookUrl = [Environment]::GetEnvironmentVariable("WERKLES_STRIPE_WEBHOOK_URL", "Process")
if ([string]::IsNullOrWhiteSpace($WebhookUrl)) {
  $WebhookUrl = "https://werkles.com/api/webhooks/stripe"
}
$stripeSecret = [Environment]::GetEnvironmentVariable("STRIPE_SECRET_KEY", "Process")

$identityEvents = @(
  "identity.verification_session.verified",
  "identity.verification_session.processing",
  "identity.verification_session.requires_input",
  "identity.verification_session.canceled"
)

$membershipEvents = @(
  "checkout.session.completed",
  "customer.subscription.updated",
  "customer.subscription.deleted"
)

if ($stripeSecret -notmatch "^(sk|rk)_(test|live)_") {
  @{ ok = $false; error = "STRIPE_SECRET_KEY missing" } | ConvertTo-Json -Compress | Write-Output
  exit 1
}

$listResponse = Invoke-RestMethod -Method Get -Uri "https://api.stripe.com/v1/webhook_endpoints?limit=100" -Headers @{
  Authorization = "Bearer $stripeSecret"
}

$endpoints = @($listResponse.data | Where-Object { $_.url -eq $WebhookUrl -and -not $_.disabled })
if ($endpoints.Count -eq 0) {
  @{ ok = $false; error = "no_active_webhook_for_url" } | ConvertTo-Json -Compress | Write-Output
  exit 1
}

$target = $endpoints[0]
$merged = [System.Collections.Generic.HashSet[string]]::new([string[]]@($target.enabled_events))
foreach ($eventName in ($membershipEvents + $identityEvents)) {
  [void]$merged.Add($eventName)
}

$bodyParts = @()
foreach ($eventName in $merged) {
  $bodyParts += ("enabled_events[]={0}" -f [uri]::EscapeDataString($eventName))
}
$body = $bodyParts -join "&"

$updateResponse = Invoke-RestMethod -Method Post -Uri "https://api.stripe.com/v1/webhook_endpoints/$($target.id)" -Headers @{
  Authorization = "Bearer $stripeSecret"
} -ContentType "application/x-www-form-urlencoded" -Body $body

@{
  ok = $true
  webhook_id = $updateResponse.id
  url = $updateResponse.url
  enabled_event_count = @($updateResponse.enabled_events).Count
  identity_events_added = @($identityEvents | Where-Object { $updateResponse.enabled_events -contains $_ })
} | ConvertTo-Json -Depth 4
