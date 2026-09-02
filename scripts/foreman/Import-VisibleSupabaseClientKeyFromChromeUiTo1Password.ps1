#requires -Version 5.1
<#
.SYNOPSIS
  Import the visible Supabase public client key from Chrome into 1Password.

.DESCRIPTION
  Reads text exposed by the open Chrome/Supabase window through Windows UI
  Automation, extracts only public-client-key-shaped candidates in memory,
  validates the selected candidate against the Werkles Supabase URL, and pipes
  it into the service-account-backed 1Password setter. Secret values are never
  printed or written to the repository.
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$WindowTitlePattern = "Supabase",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_VISIBLE_SUPABASE_CLIENT_KEY_IMPORT_20260705.json"
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

function Get-CurrentSupabaseUrl {
  param(
    [string]$VaultName,
    [string]$Title
  )

  $op = Get-WerklesOpBinary
  $item = & $op item get $Title --vault $VaultName --format json --reveal | ConvertFrom-Json
  $field = @($item.fields | Where-Object { $_.label -eq "NEXT_PUBLIC_SUPABASE_URL" })
  if ($field.Count -ne 1 -or [string]::IsNullOrWhiteSpace([string]$field[0].value)) {
    throw "NEXT_PUBLIC_SUPABASE_URL is missing from 1Password."
  }

  return ([string]$field[0].value).TrimEnd("/")
}

function Get-SupabaseRefFromUrl {
  param([string]$Url)

  if ($Url -match "^https://([a-z0-9-]+)\.supabase\.co/?$") {
    return $Matches[1]
  }

  return $null
}

function Test-SupabaseClientKeyForProject {
  param(
    [string]$Url,
    [string]$Value
  )

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Method Get -Uri "$Url/auth/v1/settings" -Headers @{ apikey = $Value } -TimeoutSec 15
    return ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400)
  } catch {
    return $false
  }
}

function Test-ClientCandidate {
  param(
    [string]$Value,
    [string]$SupabaseUrl,
    [string]$ExpectedRef
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  if ($Value -match "^sb_publishable_[A-Za-z0-9_-]+$") {
    return (Test-SupabaseClientKeyForProject -Url $SupabaseUrl -Value $Value)
  }

  if ($Value -notmatch "^eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$") {
    return $false
  }

  $payload = Get-JwtPayload -Token $Value
  if ($null -eq $payload) {
    return $false
  }

  return ([string]$payload.role -eq "anon" -and [string]$payload.ref -eq $ExpectedRef)
}

function Invoke-StdinSetter {
  param([string]$Value)

  $setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
  $receipt = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_VISIBLE_SUPABASE_UI_20260705.json"
  $output = $Value | powershell -NoProfile -ExecutionPolicy Bypass -File $setter -FieldName "NEXT_PUBLIC_SUPABASE_ANON_KEY" -Vault $Vault -ItemTitle $ItemTitle -SourceLabel "VisibleSupabaseChromeUi" -ReceiptPath $receipt
  $result = $output | ConvertFrom-Json
  if ($result.status -ne "PASS" -or -not $result.verified_field_has_value) {
    throw "1Password setter did not verify the imported field."
  }

  return $result
}

function Import-UiAutomationExtractor {
  if ("WerklesVisibleSupabaseChromeUi" -as [type]) {
    return
  }

  Add-Type -ReferencedAssemblies UIAutomationClient, UIAutomationTypes -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using System.Windows.Automation;

public sealed class WerklesUiCandidateResult
{
    public string[] Candidates;
    public int DescendantCount;
    public int TextReadCount;
    public int ValuePatternCount;
}

public static class WerklesVisibleSupabaseChromeUi
{
    public static WerklesUiCandidateResult Extract(IntPtr hwnd)
    {
        var result = new WerklesUiCandidateResult();
        var candidates = new HashSet<string>();
        var root = AutomationElement.FromHandle(hwnd);
        if (root == null)
        {
            result.Candidates = new string[0];
            return result;
        }

        var all = root.FindAll(TreeScope.Descendants, Condition.TrueCondition);
        result.DescendantCount = all.Count;

        var publishable = new Regex("sb_publishable_[A-Za-z0-9_-]+", RegexOptions.Compiled);
        var jwt = new Regex("eyJ[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}", RegexOptions.Compiled);

        for (int i = 0; i < all.Count; i++)
        {
            var element = all[i];
            ScanText(element.Current.Name, candidates, publishable, jwt, result);

            try
            {
                object valuePattern;
                if (element.TryGetCurrentPattern(ValuePattern.Pattern, out valuePattern))
                {
                    result.ValuePatternCount++;
                    ScanText(((ValuePattern)valuePattern).Current.Value, candidates, publishable, jwt, result);
                }
            }
            catch {}
        }

        var values = new string[candidates.Count];
        candidates.CopyTo(values);
        result.Candidates = values;
        return result;
    }

    private static void ScanText(string text, HashSet<string> candidates, Regex publishable, Regex jwt, WerklesUiCandidateResult result)
    {
        if (String.IsNullOrWhiteSpace(text)) return;
        result.TextReadCount++;
        foreach (Match match in publishable.Matches(text)) candidates.Add(match.Value);
        foreach (Match match in jwt.Matches(text)) candidates.Add(match.Value);
    }
}
"@
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

$receipt = [ordered]@{
  schema = "WERKLES_COM_VISIBLE_SUPABASE_CLIENT_KEY_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  vault = $Vault
  itemTitle = $ItemTitle
  windowTitlePattern = $WindowTitlePattern
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  desktopOnePasswordPromptTriggered = "NO"
  chromeWindowFound = "NO"
  candidateCount = 0
  validCandidateCount = 0
  fieldUpdated = "NO"
}

try {
  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken) -and [string]::IsNullOrWhiteSpace($previousToken)) {
    throw "Stored Werkles service-account token is missing; refusing desktop 1Password CLI auth."
  }

  $env:OP_SERVICE_ACCOUNT_TOKEN = if ([string]::IsNullOrWhiteSpace($previousToken)) { $storedToken } else { $previousToken }
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

  $supabaseUrl = Get-CurrentSupabaseUrl -VaultName $Vault -Title $ItemTitle
  $expectedRef = Get-SupabaseRefFromUrl -Url $supabaseUrl
  if ([string]::IsNullOrWhiteSpace($expectedRef)) {
    throw "Could not derive Supabase project ref from URL."
  }

  $chromeWindows = @(Get-Process chrome -ErrorAction SilentlyContinue | Where-Object {
      $_.MainWindowHandle -ne 0 -and $_.MainWindowTitle -match $WindowTitlePattern
    } | Sort-Object MainWindowTitle)
  $receipt.chromeWindowMatches = $chromeWindows.Count
  if ($chromeWindows.Count -lt 1) {
    throw "No visible Chrome window matched $WindowTitlePattern."
  }

  $target = $chromeWindows[0]
  $receipt.chromeWindowFound = "YES"
  $receipt.chromeProcessId = $target.Id
  $receipt.chromeWindowTitle = $target.MainWindowTitle

  Import-UiAutomationExtractor
  $scan = [WerklesVisibleSupabaseChromeUi]::Extract($target.MainWindowHandle)
  $receipt.descendantCount = $scan.DescendantCount
  $receipt.textReadCount = $scan.TextReadCount
  $receipt.valuePatternCount = $scan.ValuePatternCount

  $candidates = @($scan.Candidates | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique)
  $receipt.candidateCount = $candidates.Count
  $receipt.publishableCandidateCount = @($candidates | Where-Object { $_ -like "sb_publishable_*" }).Count
  $receipt.jwtCandidateCount = @($candidates | Where-Object { $_ -like "eyJ*" }).Count

  $validCandidates = @($candidates | Where-Object { Test-ClientCandidate -Value $_ -SupabaseUrl $supabaseUrl -ExpectedRef $expectedRef } | Select-Object -Unique)
  $receipt.validCandidateCount = $validCandidates.Count

  if ($validCandidates.Count -ne 1) {
    throw "Expected exactly one valid Supabase public client key candidate; found $($validCandidates.Count)."
  }

  $setterResult = Invoke-StdinSetter -Value $validCandidates[0]
  $receipt.fieldUpdated = "YES"
  $receipt.setterStatus = $setterResult.status
  $receipt.setterVerifiedFieldHasValue = $setterResult.verified_field_has_value

  $validation = powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "Test-WerklesVercelSecretItem.ps1") -Vault $Vault -ItemTitle $ItemTitle | ConvertFrom-Json
  $receipt.validationStatus = $validation.status
  $receipt.validFieldCount = $validation.valid_field_count
  $receipt.emptyOrMissingFieldCount = $validation.empty_or_missing_field_count
  $receipt.dirtyFieldCount = $validation.dirty_field_count

  $receipt.status = if ($validation.status -eq "PASS_ALL_FIELDS_VALID" -and $validation.valid_field_count -eq 8) { "PASS" } else { "BLOCKED_OR_FAILED" }
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
  chrome_window_found = $receipt.chromeWindowFound
  candidate_count = $receipt.candidateCount
  valid_candidate_count = $receipt.validCandidateCount
  field_updated = $receipt.fieldUpdated
  validation_status = $receipt.validationStatus
  valid_field_count = $receipt.validFieldCount
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  desktop_1password_prompt_triggered = $receipt.desktopOnePasswordPromptTriggered
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 4
