#requires -Version 5.1
<#
.SYNOPSIS
  Recover derivable Stripe fields into the Werkles 1Password item.

.DESCRIPTION
  Uses the already-stored STRIPE_SECRET_KEY and monthly Foundry Dues price ID to
  query Stripe. If exactly one active yearly price exists for the same product,
  stores it as STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID. If Stripe exposes a matching
  webhook endpoint signing secret, stores it as STRIPE_WEBHOOK_SECRET. No secret
  values are printed or written to the repo.
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$WebhookUrl = "https://werkles.com/api/webhooks/stripe",
  [switch]$CreateMissingAnnualPrice,
  [switch]$CreateReplacementWebhookEndpoint,
  [switch]$DisableExistingMatchingWebhookEndpoints,
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_STRIPE_DERIVED_FIELDS_TO_1PASSWORD_20260704.json"
}

$OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ([string]::IsNullOrWhiteSpace($storedToken) -and [string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)) {
  throw "Stored Werkles service-account token is missing; refusing desktop 1Password CLI auth."
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED
$env:OP_SERVICE_ACCOUNT_TOKEN = if ([string]::IsNullOrWhiteSpace($previousToken)) { $storedToken } else { $previousToken }
$env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

$fieldNames = @(
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID",
  "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID",
  "CRON_SECRET"
)

function Read-OpField {
  param([string]$FieldName)

  $value = & $OpExe read "op://$Vault/$ItemTitle/$FieldName" 2>$null
  if ($LASTEXITCODE -ne 0) {
    return $null
  }
  return ([string]$value).Trim()
}

function Set-OpItemField {
  param(
    [string]$FieldName,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Refusing to write empty value for $FieldName."
  }

  $item = & $OpExe item get $ItemTitle --vault $Vault --format json --reveal | ConvertFrom-Json
  $matches = @($item.fields | Where-Object { $_.label -eq $FieldName })
  if ($matches.Count -gt 1) {
    throw "Multiple fields labelled $FieldName found in $ItemTitle."
  }

  if ($matches.Count -eq 0) {
    $newField = [pscustomobject]@{
      id = $FieldName
      type = "CONCEALED"
      label = $FieldName
      value = $Value
    }
    $item.fields = @($item.fields) + $newField
  } else {
    $matches[0].type = "CONCEALED"
    $matches[0] | Add-Member -NotePropertyName "value" -NotePropertyValue $Value -Force
  }

  $null = ($item | ConvertTo-Json -Depth 12) | & $OpExe item edit $item.id --vault $Vault --format json 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw "op item edit failed for $FieldName."
  }
}

function New-FormPair {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Key,
    [Parameter(Mandatory = $true)]
    [string]$Value
  )

  [pscustomobject]@{
    Key = $Key
    Value = $Value
  }
}

function New-StripeFormBody {
  param(
    [Parameter(Mandatory = $true)]
    [object[]]$Pairs
  )

  return (($Pairs | ForEach-Object {
        "{0}={1}" -f [uri]::EscapeDataString([string]$_.Key), [uri]::EscapeDataString([string]$_.Value)
      }) -join "&")
}

function Get-StripeProductId {
  param([object]$Price)

  if ($null -eq $Price -or $null -eq $Price.product) {
    return $null
  }

  if ($Price.product -is [string]) {
    return [string]$Price.product
  }

  return [string]$Price.product.id
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_STRIPE_DERIVED_FIELDS_TO_1PASSWORD_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  vault = $Vault
  itemTitle = $ItemTitle
  webhookUrl = $WebhookUrl
  opAuthSource = "WINDOWS_CREDENTIAL_MANAGER_OR_ENV_SERVICE_TOKEN"
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  webpagesCreated = "NO"
  externalMutations = "NO"
  createMissingAnnualPrice = $CreateMissingAnnualPrice.IsPresent
  createReplacementWebhookEndpoint = $CreateReplacementWebhookEndpoint.IsPresent
  disableExistingMatchingWebhookEndpoints = $DisableExistingMatchingWebhookEndpoints.IsPresent
  fieldsUpdated = @()
  fieldsNotUpdated = @()
  stripeObjectsCreated = @()
  stripeObjectsDisabled = @()
}

try {
  $stripeSecret = Read-OpField -FieldName "STRIPE_SECRET_KEY"
  $monthlyPriceId = Read-OpField -FieldName "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID"
  $receipt.sourceStripeSecretPresent = -not [string]::IsNullOrWhiteSpace($stripeSecret)
  $receipt.sourceMonthlyPricePresent = -not [string]::IsNullOrWhiteSpace($monthlyPriceId)

  if ([string]::IsNullOrWhiteSpace($stripeSecret)) {
    throw "Required local Stripe source field STRIPE_SECRET_KEY is missing."
  }

  $headers = @{ Authorization = "Bearer $stripeSecret" }
  $monthlyPriceIdLooksValid = -not [string]::IsNullOrWhiteSpace($monthlyPriceId) -and $monthlyPriceId.StartsWith("price_")
  $receipt.sourceMonthlyPriceShapeValid = $monthlyPriceIdLooksValid

  $prices = Invoke-RestMethod -Method Get -Uri "https://api.stripe.com/v1/prices?active=true&limit=100&expand[]=data.product" -Headers $headers
  $receipt.activePriceCount = @($prices.data).Count

  $foundryPrices = @($prices.data | Where-Object {
      $_.recurring -and
      $_.currency -eq "usd" -and
      $_.product -and
      $_.product.name -match "Foundry Dues"
    })

  if ($foundryPrices.Count -eq 0 -and $monthlyPriceIdLooksValid) {
    $monthly = Invoke-RestMethod -Method Get -Uri "https://api.stripe.com/v1/prices/$monthlyPriceId" -Headers $headers
    $receipt.monthlyPriceRetrieved = $true
    $productId = [string]$monthly.product
    $pricesForProduct = Invoke-RestMethod -Method Get -Uri "https://api.stripe.com/v1/prices?product=$productId&active=true&limit=100" -Headers $headers
    $foundryPrices = @($pricesForProduct.data | Where-Object { $_.recurring })
  }

  $monthlyCandidates = @($foundryPrices | Where-Object { $_.recurring.interval -eq "month" -and $_.unit_amount -eq 999 })
  $annual = @($foundryPrices | Where-Object { $_.recurring.interval -eq "year" -and $_.unit_amount -eq 9900 })
  $receipt.monthlyPriceCandidateCount = $monthlyCandidates.Count
  $receipt.annualPriceCandidateCount = $annual.Count

  if ($monthlyCandidates.Count -eq 1 -and -not [string]::IsNullOrWhiteSpace([string]$monthlyCandidates[0].id)) {
    Set-OpItemField -FieldName "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID" -Value ([string]$monthlyCandidates[0].id)
    $receipt.fieldsUpdated += "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID"
  } else {
    $receipt.fieldsNotUpdated += "STRIPE_FOUNDRY_DUES_MONTHLY_PRICE_ID"
  }

  if ($annual.Count -eq 1 -and -not [string]::IsNullOrWhiteSpace([string]$annual[0].id)) {
    Set-OpItemField -FieldName "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID" -Value ([string]$annual[0].id)
    $receipt.fieldsUpdated += "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID"
  } elseif ($annual.Count -eq 0 -and $CreateMissingAnnualPrice) {
    $sourceMonthly = $null
    if ($monthlyCandidates.Count -eq 1) {
      $sourceMonthly = $monthlyCandidates[0]
    } elseif ($monthlyPriceIdLooksValid) {
      $sourceMonthly = Invoke-RestMethod -Method Get -Uri "https://api.stripe.com/v1/prices/$monthlyPriceId" -Headers $headers
    }

    $productIdForAnnual = Get-StripeProductId -Price $sourceMonthly
    if ([string]::IsNullOrWhiteSpace($productIdForAnnual)) {
      throw "Cannot create annual Stripe price because the monthly product id could not be determined."
    }

    $annualBody = New-StripeFormBody @(
      (New-FormPair -Key "product" -Value $productIdForAnnual),
      (New-FormPair -Key "unit_amount" -Value "9900"),
      (New-FormPair -Key "currency" -Value "usd"),
      (New-FormPair -Key "recurring[interval]" -Value "year"),
      (New-FormPair -Key "nickname" -Value "Foundry Dues - Annual - The Long Run"),
      (New-FormPair -Key "metadata[werkles_env_var]" -Value "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID"),
      (New-FormPair -Key "metadata[pricing_source]" -Value "company/PRICING.md"),
      (New-FormPair -Key "metadata[pricing_version]" -Value "v0.1"),
      (New-FormPair -Key "metadata[operator_approved]" -Value "2026-05-24")
    )

    $createdAnnual = Invoke-RestMethod -Method Post -Uri "https://api.stripe.com/v1/prices" -Headers $headers -ContentType "application/x-www-form-urlencoded" -Body $annualBody
    if ([string]::IsNullOrWhiteSpace([string]$createdAnnual.id) -or -not ([string]$createdAnnual.id).StartsWith("price_")) {
      throw "Stripe annual price creation returned an invalid id."
    }

    Set-OpItemField -FieldName "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID" -Value ([string]$createdAnnual.id)
    $receipt.fieldsUpdated += "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID"
    $receipt.externalMutations = "YES"
    $receipt.stripeObjectsCreated += [ordered]@{
      type = "price"
      id = [string]$createdAnnual.id
      field = "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID"
      mode = if ($createdAnnual.livemode) { "live" } else { "test" }
    }
  } else {
    $receipt.fieldsNotUpdated += "STRIPE_FOUNDRY_DUES_ANNUAL_PRICE_ID"
  }

  $webhookList = Invoke-RestMethod -Method Get -Uri "https://api.stripe.com/v1/webhook_endpoints?limit=100" -Headers $headers
  $matchingWebhooks = @($webhookList.data | Where-Object { $_.url -eq $WebhookUrl })
  $receipt.webhookEndpointCandidateCount = $matchingWebhooks.Count

  $webhookSecret = $null
  foreach ($endpoint in $matchingWebhooks) {
    $endpointId = [string]$endpoint.id
    if ([string]::IsNullOrWhiteSpace($endpointId)) { continue }
    $retrievedEndpoint = Invoke-RestMethod -Method Get -Uri "https://api.stripe.com/v1/webhook_endpoints/$endpointId" -Headers $headers
    if ($retrievedEndpoint.PSObject.Properties.Name -contains "secret" -and -not [string]::IsNullOrWhiteSpace([string]$retrievedEndpoint.secret)) {
      $webhookSecret = [string]$retrievedEndpoint.secret
      break
    }
  }

  $receipt.webhookSecretExposedByStripeApi = -not [string]::IsNullOrWhiteSpace($webhookSecret)
  if (-not [string]::IsNullOrWhiteSpace($webhookSecret)) {
    Set-OpItemField -FieldName "STRIPE_WEBHOOK_SECRET" -Value $webhookSecret
    $receipt.fieldsUpdated += "STRIPE_WEBHOOK_SECRET"
  } elseif ($CreateReplacementWebhookEndpoint) {
    $webhookPairs = @(
      (New-FormPair -Key "url" -Value $WebhookUrl),
      (New-FormPair -Key "enabled_events[]" -Value "checkout.session.completed"),
      (New-FormPair -Key "enabled_events[]" -Value "customer.subscription.updated"),
      (New-FormPair -Key "enabled_events[]" -Value "customer.subscription.deleted"),
      (New-FormPair -Key "description" -Value "Werkles test webhook endpoint managed by automation"),
      (New-FormPair -Key "metadata[werkles_env_var]" -Value "STRIPE_WEBHOOK_SECRET"),
      (New-FormPair -Key "metadata[source]" -Value "Import-StripeDerivedFieldsTo1Password.ps1")
    )
    $webhookBody = New-StripeFormBody -Pairs $webhookPairs
    $createdWebhook = Invoke-RestMethod -Method Post -Uri "https://api.stripe.com/v1/webhook_endpoints" -Headers $headers -ContentType "application/x-www-form-urlencoded" -Body $webhookBody

    $createdWebhookSecret = [string]$createdWebhook.secret
    if ([string]::IsNullOrWhiteSpace($createdWebhookSecret) -or -not $createdWebhookSecret.StartsWith("whsec_")) {
      throw "Stripe replacement webhook endpoint did not return a signing secret."
    }

    Set-OpItemField -FieldName "STRIPE_WEBHOOK_SECRET" -Value $createdWebhookSecret
    $receipt.fieldsUpdated += "STRIPE_WEBHOOK_SECRET"
    $receipt.externalMutations = "YES"
    $receipt.createdWebhookSecretCaptured = "YES"
    $receipt.stripeObjectsCreated += [ordered]@{
      type = "webhook_endpoint"
      id = [string]$createdWebhook.id
      url = $WebhookUrl
      field = "STRIPE_WEBHOOK_SECRET"
      mode = if ($createdWebhook.livemode) { "live" } else { "test" }
    }

    if ($DisableExistingMatchingWebhookEndpoints) {
      foreach ($endpoint in $matchingWebhooks) {
        $endpointId = [string]$endpoint.id
        if ([string]::IsNullOrWhiteSpace($endpointId) -or $endpointId -eq [string]$createdWebhook.id) {
          continue
        }

        $disableBody = New-StripeFormBody @(
          (New-FormPair -Key "disabled" -Value "true")
        )
        $disabledEndpoint = Invoke-RestMethod -Method Post -Uri "https://api.stripe.com/v1/webhook_endpoints/$endpointId" -Headers $headers -ContentType "application/x-www-form-urlencoded" -Body $disableBody
        $receipt.stripeObjectsDisabled += [ordered]@{
          type = "webhook_endpoint"
          id = $endpointId
          url = [string]$disabledEndpoint.url
          mode = if ($disabledEndpoint.livemode) { "live" } else { "test" }
        }
      }
    }
  } else {
    $receipt.fieldsNotUpdated += "STRIPE_WEBHOOK_SECRET"
  }

  $verifyItem = & $OpExe item get $ItemTitle --vault $Vault --format json --reveal | ConvertFrom-Json
  $hasValue = @{}
  foreach ($name in $fieldNames) {
    $field = @($verifyItem.fields | Where-Object { $_.label -eq $name })
    $hasValue[$name] = (($field.Count -eq 1) -and -not [string]::IsNullOrWhiteSpace([string]$field[0].value))
  }

  $receipt.verifiedFieldsWithValues = @($fieldNames | Where-Object { $hasValue[$_] })
  $receipt.verifiedFieldsMissingValues = @($fieldNames | Where-Object { -not $hasValue[$_] })
  $receipt.verifiedFieldsWithValuesCount = $receipt.verifiedFieldsWithValues.Count
  $receipt.verifiedFieldsMissingValuesCount = $receipt.verifiedFieldsMissingValues.Count
  $receipt.status = if ($receipt.fieldsUpdated.Count -gt 0) { "PARTIAL_PASS_UPDATED_DERIVED_STRIPE_FIELDS" } else { "BLOCKED_NO_DERIVED_FIELDS_AVAILABLE" }
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  if ($null -eq $previousToken) {
    Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue
  } else {
    $env:OP_SERVICE_ACCOUNT_TOKEN = $previousToken
  }

  if ($null -eq $previousBiometric) {
    Remove-Item Env:\OP_BIOMETRIC_UNLOCK_ENABLED -ErrorAction SilentlyContinue
  } else {
    $env:OP_BIOMETRIC_UNLOCK_ENABLED = $previousBiometric
  }

  $receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

[pscustomobject]@{
  status = $receipt.status
  fields_updated = $receipt.fieldsUpdated
  fields_not_updated = $receipt.fieldsNotUpdated
  verified_fields_with_values_count = $receipt.verifiedFieldsWithValuesCount
  verified_fields_missing_values_count = $receipt.verifiedFieldsMissingValuesCount
  verified_fields_missing_values = $receipt.verifiedFieldsMissingValues
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  external_mutations = $receipt.externalMutations
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
