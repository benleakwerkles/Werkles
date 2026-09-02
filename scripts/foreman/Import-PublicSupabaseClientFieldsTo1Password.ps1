#requires -Version 5.1
<#
.SYNOPSIS
  Recover public Supabase client fields from deployed Werkles client bundles.

.DESCRIPTION
  Fetches selected public Werkles pages and their script assets in memory,
  searches for Supabase URL and anon JWT candidates, validates role/ref shape,
  and writes only the public client fields to the Werkles 1Password item. It
  never prints values or writes fetched page contents to disk.
#>
param(
  [string[]]$BaseUrls = @(
    "https://werkles.com",
    "https://werkles1-fkz58wf4t-werkles.vercel.app"
  ),
  [string[]]$PagePaths = @("/", "/login", "/signup", "/membership"),
  [int]$RequestTimeoutSec = 10,
  [int]$MaxAssetCount = 160,
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_PUBLIC_SUPABASE_CLIENT_IMPORT_20260704.json"
}

function ConvertFrom-Base64Url {
  param([string]$Value)

  $padded = $Value.Replace("-", "+").Replace("_", "/")
  switch ($padded.Length % 4) {
    2 { $padded += "==" }
    3 { $padded += "=" }
    1 { return $null }
  }

  try {
    return [Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($padded))
  } catch {
    return $null
  }
}

function Get-JwtPayload {
  param([string]$Token)

  $parts = $Token -split "\."
  if ($parts.Count -ne 3) {
    return $null
  }

  $payloadJson = ConvertFrom-Base64Url -Value $parts[1]
  if ([string]::IsNullOrWhiteSpace($payloadJson)) {
    return $null
  }

  try {
    return $payloadJson | ConvertFrom-Json
  } catch {
    return $null
  }
}

function Get-SupabaseRefFromUrl {
  param([string]$Url)

  if ($Url -match "^https://([a-z0-9-]+)\.supabase\.co/?$") {
    return $Matches[1]
  }

  return $null
}

function Resolve-AssetUrl {
  param(
    [string]$BaseUrl,
    [string]$Asset
  )

  if ($Asset -match "^https?://") {
    return $Asset
  }

  $base = [uri]$BaseUrl
  return ([uri]::new($base, $Asset)).AbsoluteUri
}

function Get-WebText {
  param([string]$Url)

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $Url -MaximumRedirection 5 -TimeoutSec $script:RequestTimeoutSec
    return [string]$response.Content
  } catch {
    return $null
  }
}

function Set-OpItemField {
  param(
    [string]$FieldName,
    [string]$Value
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    throw "Refusing to write empty value for $FieldName."
  }

  $item = & $script:OpExe item get $ItemTitle --vault $Vault --format json --reveal | ConvertFrom-Json
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

  $null = ($item | ConvertTo-Json -Depth 12) | & $script:OpExe item edit $item.id --vault $Vault --format json 2>$null
  if ($LASTEXITCODE -ne 0) {
    throw "op item edit failed for $FieldName."
  }
}

$script:OpExe = Get-WerklesOpBinary
$storedToken = Get-WerklesOnePasswordServiceToken
if ([string]::IsNullOrWhiteSpace($storedToken) -and [string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)) {
  throw "Stored Werkles service-account token is missing; refusing desktop 1Password CLI auth."
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED
$env:OP_SERVICE_ACCOUNT_TOKEN = if ([string]::IsNullOrWhiteSpace($previousToken)) { $storedToken } else { $previousToken }
$env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

$receipt = [ordered]@{
  schema = "WERKLES_COM_PUBLIC_SUPABASE_CLIENT_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  baseUrls = $BaseUrls
  pagePaths = $PagePaths
  requestTimeoutSec = $RequestTimeoutSec
  maxAssetCount = $MaxAssetCount
  vault = $Vault
  itemTitle = $ItemTitle
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  fetchedContentWrittenToRepo = "NO"
  externalMutations = "NO"
  fetchedPageCount = 0
  fetchedAssetCount = 0
  publicServiceRoleTokenObserved = "NO"
  fieldsUpdated = @()
  fieldsNotUpdated = @()
  errors = @()
}

try {
  $contents = New-Object System.Collections.Generic.List[string]
  $pageUrls = New-Object System.Collections.Generic.List[string]
  foreach ($base in $BaseUrls) {
    foreach ($path in $PagePaths) {
      $url = Resolve-AssetUrl -BaseUrl ($base.TrimEnd("/") + "/") -Asset $path
      if (-not $pageUrls.Contains($url)) {
        [void]$pageUrls.Add($url)
      }
    }
  }

  $assetUrls = New-Object System.Collections.Generic.HashSet[string]
  foreach ($pageUrl in $pageUrls) {
    $content = Get-WebText -Url $pageUrl
    if ([string]::IsNullOrWhiteSpace($content)) {
      $receipt.errors += "FETCH_PAGE_FAILED:$pageUrl"
      continue
    }

    $receipt.fetchedPageCount += 1
    [void]$contents.Add($content)

    foreach ($match in [regex]::Matches($content, "<script[^>]+src=[`"']([^`"']+)[`"']")) {
      $asset = [string]$match.Groups[1].Value
      if ($asset -match "/_next/") {
        [void]$assetUrls.Add((Resolve-AssetUrl -BaseUrl $pageUrl -Asset $asset))
      }
    }
  }

  foreach ($assetUrl in $assetUrls) {
    if ($receipt.fetchedAssetCount -ge $MaxAssetCount) {
      $receipt.errors += "ASSET_CAP_REACHED:$MaxAssetCount"
      break
    }

    $assetContent = Get-WebText -Url $assetUrl
    if ([string]::IsNullOrWhiteSpace($assetContent)) {
      continue
    }

    $receipt.fetchedAssetCount += 1
    [void]$contents.Add($assetContent)
  }

  $allText = [string]::Join("`n", $contents)
  $urlCandidates = @([regex]::Matches($allText, "https://[a-z0-9-]+\.supabase\.co/?") | ForEach-Object { [string]$_.Value.TrimEnd("/") } | Sort-Object -Unique)
  $jwtCandidates = @([regex]::Matches($allText, "eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}") | ForEach-Object { [string]$_.Value } | Sort-Object -Unique)
  $publishableCandidates = @([regex]::Matches($allText, "sb_publishable_[A-Za-z0-9_-]+") | ForEach-Object { [string]$_.Value } | Sort-Object -Unique)

  $decodedJwtCandidates = foreach ($token in $jwtCandidates) {
    $payload = Get-JwtPayload -Token $token
    if ($null -eq $payload) {
      continue
    }

    $role = [string]$payload.role
    if ($role -notin @("anon", "service_role")) {
      continue
    }

    [pscustomobject]@{
      token = $token
      role = $role
      ref = [string]$payload.ref
      iss = [string]$payload.iss
      aud = [string]$payload.aud
      length = $token.Length
    }
  }

  $anonCandidates = @($decodedJwtCandidates | Where-Object { $_.role -eq "anon" })
  $publishableAnonCandidates = @($publishableCandidates | ForEach-Object {
      [pscustomobject]@{
        token = [string]$_
        role = "publishable"
        ref = ""
        iss = ""
        aud = ""
        length = ([string]$_).Length
      }
    })
  $serviceRoleCandidates = @($decodedJwtCandidates | Where-Object { $_.role -eq "service_role" })
  $receipt.urlCandidateCount = $urlCandidates.Count
  $receipt.anonCandidateCount = $anonCandidates.Count + $publishableAnonCandidates.Count
  $receipt.publishableAnonCandidateCount = $publishableAnonCandidates.Count
  $receipt.publicServiceRoleCandidateCount = $serviceRoleCandidates.Count
  if ($serviceRoleCandidates.Count -gt 0) {
    $receipt.publicServiceRoleTokenObserved = "YES"
  }

  $selectedUrl = $null
  $selectedAnon = $null

  if ($urlCandidates.Count -eq 1) {
    $selectedUrl = [string]$urlCandidates[0]
  }

  if (($anonCandidates.Count + $publishableAnonCandidates.Count) -eq 1 -and $publishableAnonCandidates.Count -eq 1) {
    $selectedAnon = $publishableAnonCandidates[0]
  } elseif ($anonCandidates.Count -eq 1 -and $publishableAnonCandidates.Count -eq 0) {
    $selectedAnon = $anonCandidates[0]
  } elseif ($urlCandidates.Count -eq 1) {
    $urlRef = Get-SupabaseRefFromUrl -Url $urlCandidates[0]
    $matchingAnon = @($anonCandidates | Where-Object { $_.ref -eq $urlRef })
    if ($matchingAnon.Count -eq 1) {
      $selectedAnon = $matchingAnon[0]
    }
  }

  $receipt.selectedUrlPresent = -not [string]::IsNullOrWhiteSpace($selectedUrl)
  $receipt.selectedAnonPresent = $null -ne $selectedAnon
  $receipt.selectedUrlRefMatchesAnonRef = if ($selectedUrl -and $selectedAnon) { (Get-SupabaseRefFromUrl -Url $selectedUrl) -eq $selectedAnon.ref } else { $false }

  if ($selectedUrl) {
    Set-OpItemField -FieldName "NEXT_PUBLIC_SUPABASE_URL" -Value $selectedUrl
    $receipt.fieldsUpdated += "NEXT_PUBLIC_SUPABASE_URL"
  } else {
    $receipt.fieldsNotUpdated += "NEXT_PUBLIC_SUPABASE_URL"
  }

  if ($selectedAnon -and ($selectedAnon.role -in @("anon", "publishable"))) {
    Set-OpItemField -FieldName "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Value ([string]$selectedAnon.token)
    $receipt.fieldsUpdated += "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  } else {
    $receipt.fieldsNotUpdated += "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  }

  $receipt.fieldsNotUpdated += "SUPABASE_SERVICE_ROLE_KEY"
  $receipt.status = if ($receipt.fieldsUpdated.Count -gt 0) { "PARTIAL_PASS_PUBLIC_CLIENT_FIELDS_IMPORTED" } else { "BLOCKED_NO_PUBLIC_SUPABASE_CLIENT_FIELDS_FOUND" }
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
  fetched_page_count = $receipt.fetchedPageCount
  fetched_asset_count = $receipt.fetchedAssetCount
  url_candidate_count = $receipt.urlCandidateCount
  anon_candidate_count = $receipt.anonCandidateCount
  public_service_role_candidate_count = $receipt.publicServiceRoleCandidateCount
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  fetched_content_written_to_repo = $receipt.fetchedContentWrittenToRepo
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 5
