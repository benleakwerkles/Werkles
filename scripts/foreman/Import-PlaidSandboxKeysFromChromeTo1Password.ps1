#requires -Version 5.1
<#
  Import Plaid sandbox client_id + secret from Chrome session or visible dashboard UI.
  Validates pair via sandbox /link/token/create before storing in 1Password.
  Secret values never printed or written to repo.
#>
param(
  [string[]]$ChromeProfiles = @("Default", "Profile 1", "Profile 2"),
  [string]$WindowTitlePattern = "Plaid",
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot
. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_PLAID_SANDBOX_KEY_IMPORT_20260705.json"
}

function Get-ChromeLocalStorageText {
  param([string[]]$Profiles)

  $roots = @(
    (Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"),
    (Join-Path $env:LOCALAPPDATA "Microsoft\Edge\User Data")
  )
  $chunks = New-Object System.Collections.Generic.List[string]
  foreach ($chromeRoot in $roots) {
    if (-not (Test-Path -LiteralPath $chromeRoot)) { continue }
    foreach ($profileName in $Profiles) {
      $levelDb = Join-Path $chromeRoot "$profileName\Local Storage\leveldb"
      if (-not (Test-Path -LiteralPath $levelDb)) { continue }

      foreach ($file in Get-ChildItem -LiteralPath $levelDb -File -ErrorAction SilentlyContinue) {
        if ($file.Length -gt 25MB) { continue }
        try {
          $chunks.Add([Text.Encoding]::UTF8.GetString([IO.File]::ReadAllBytes($file.FullName)))
        } catch {}
      }
    }
  }
  return $chunks
}

function Get-PlaidCandidateSets {
  param([string[]]$Texts)

  $clientIds = New-Object System.Collections.Generic.HashSet[string]
  $secrets = New-Object System.Collections.Generic.HashSet[string]
  $looseClientIds = New-Object System.Collections.Generic.HashSet[string]
  $looseSecrets = New-Object System.Collections.Generic.HashSet[string]

  foreach ($text in $Texts) {
    $isPlaidChunk = $text -match "(?i)dashboard\.plaid\.com|plaid\.com/developers|plaid\.com/signup|plaid\.com/team"
    if (-not $isPlaidChunk) { continue }

    foreach ($match in [regex]::Matches($text, "(?i)client[_\s-]?id[^\r\n]{0,80}?([a-f0-9]{24})")) {
      [void]$clientIds.Add([string]$match.Groups[1].Value)
    }
    foreach ($match in [regex]::Matches($text, "(?i)sandbox[^\r\n]{0,120}?([a-f0-9]{30,64})")) {
      [void]$secrets.Add([string]$match.Groups[1].Value)
    }
    foreach ($match in [regex]::Matches($text, "\b([a-f0-9]{24})\b")) {
      [void]$looseClientIds.Add([string]$match.Groups[1].Value)
    }
    foreach ($match in [regex]::Matches($text, "(?i)sandbox.{0,200}?([a-f0-9]{30,64})")) {
      [void]$looseSecrets.Add([string]$match.Groups[1].Value)
    }
  }

  if ($clientIds.Count -eq 0 -and $looseClientIds.Count -gt 0) {
    $clientIds = $looseClientIds
  }
  if ($secrets.Count -eq 0 -and $looseSecrets.Count -gt 0) {
    $secrets = $looseSecrets
  }

  return [pscustomobject]@{
    client_ids = @($clientIds)
    secrets = @($secrets)
  }
}

function Test-PlaidCredentialPair {
  param(
    [string]$ClientId,
    [string]$Secret
  )

  if ([string]::IsNullOrWhiteSpace($ClientId) -or [string]::IsNullOrWhiteSpace($Secret)) {
    return $false
  }

  try {
    $payload = @{
      client_id = $ClientId
      secret = $Secret
      institution_id = "ins_109508"
      initial_products = @("transactions")
    } | ConvertTo-Json -Depth 4

    $response = Invoke-RestMethod -Method Post -Uri "https://sandbox.plaid.com/sandbox/public_token/create" -ContentType "application/json" -Body $payload -TimeoutSec 15
    return [bool]$response.public_token
  } catch {
    return $false
  }
}

function Find-ValidPlaidPair {
  param(
    [string[]]$ClientIds,
    [string[]]$Secrets
  )

  foreach ($clientId in $ClientIds) {
    foreach ($secret in $Secrets) {
      if ($secret -eq $clientId) { continue }
      if (Test-PlaidCredentialPair -ClientId $clientId -Secret $secret) {
        return [pscustomobject]@{
          client_id = $clientId
          secret = $secret
        }
      }
    }
  }

  return $null
}

function Import-PlaidUiAutomation {
  if ("WerklesVisiblePlaidChromeUi" -as [type]) { return }

  Add-Type -ReferencedAssemblies UIAutomationClient, UIAutomationTypes -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Windows.Automation;

public sealed class WerklesPlaidUiResult
{
    public string[] ClientIds;
    public string[] Secrets;
    public int WindowCount;
}

public static class WerklesVisiblePlaidChromeUi
{
    [DllImport("user32.dll")]
    private static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    private delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    private static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    public static WerklesPlaidUiResult Extract(string titlePattern)
    {
        var result = new WerklesPlaidUiResult();
        var clientIds = new HashSet<string>();
        var secrets = new HashSet<string>();
        var windows = new List<IntPtr>();

        EnumWindows((hWnd, lParam) => {
            var sb = new StringBuilder(512);
            GetWindowText(hWnd, sb, sb.Capacity);
            var title = sb.ToString() ?? "";
            if (title.IndexOf("plaid", StringComparison.OrdinalIgnoreCase) >= 0
                || title.IndexOf("Keys", StringComparison.OrdinalIgnoreCase) >= 0 && title.IndexOf("Developers", StringComparison.OrdinalIgnoreCase) >= 0)
            {
                windows.Add(hWnd);
            }
            return true;
        }, IntPtr.Zero);

        result.WindowCount = windows.Count;
        var clientRe = new Regex(@"\b([a-f0-9]{24})\b", RegexOptions.Compiled);
        var secretRe = new Regex(@"\b([a-f0-9]{30,64})\b", RegexOptions.Compiled);

        foreach (var hwnd in windows)
        {
            var root = AutomationElement.FromHandle(hwnd);
            if (root == null) continue;
            var all = root.FindAll(TreeScope.Descendants, Condition.TrueCondition);
            for (int i = 0; i < all.Count; i++)
            {
                Scan(all[i].Current.Name, clientIds, secrets, clientRe, secretRe);
                try
                {
                    object valuePattern;
                    if (all[i].TryGetCurrentPattern(ValuePattern.Pattern, out valuePattern))
                    {
                        Scan(((ValuePattern)valuePattern).Current.Value, clientIds, secrets, clientRe, secretRe);
                    }
                }
                catch {}
            }
        }

        var ids = new string[clientIds.Count]; clientIds.CopyTo(ids);
        var sec = new string[secrets.Count]; secrets.CopyTo(sec);
        result.ClientIds = ids;
        result.Secrets = sec;
        return result;
    }

    private static void Scan(string text, HashSet<string> clientIds, HashSet<string> secrets, Regex clientRe, Regex secretRe)
    {
        if (String.IsNullOrWhiteSpace(text)) return;
        foreach (Match m in clientRe.Matches(text)) clientIds.Add(m.Groups[1].Value);
        foreach (Match m in secretRe.Matches(text)) secrets.Add(m.Groups[1].Value);
    }
}
"@
}

function Invoke-FieldSetter {
  param(
    [string]$FieldName,
    [string]$Value,
    [string]$SourceLabel
  )

  $setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
  $receipt = Join-Path $RepoRoot "foreman\receipts\WERKLES_PLAID_1PASSWORD_FIELD_SET_20260705.json"
  $output = $Value | powershell -NoProfile -ExecutionPolicy Bypass -File $setter -FieldName $FieldName -Vault $Vault -ItemTitle $ItemTitle -SourceLabel $SourceLabel -ReceiptPath $receipt
  $result = $output | ConvertFrom-Json
  if ($result.status -ne "PASS" -or -not $result.verified_field_has_value) {
    throw "1Password setter failed for $FieldName"
  }
  return $result
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

$receipt = [ordered]@{
  schema = "WERKLES_PLAID_SANDBOX_KEY_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  vault = $Vault
  itemTitle = $ItemTitle
  secret_values_printed = "NO"
  secret_values_written_to_repo = "NO"
  chrome_profiles = $ChromeProfiles
  client_id_candidate_count = 0
  secret_candidate_count = 0
  valid_pair_found = "NO"
  fields_updated = @()
}

try {
  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($storedToken) -and [string]::IsNullOrWhiteSpace($previousToken)) {
    throw "Stored Werkles service-account token is missing."
  }
  $env:OP_SERVICE_ACCOUNT_TOKEN = if ([string]::IsNullOrWhiteSpace($previousToken)) { $storedToken } else { $previousToken }
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

  $texts = @(Get-ChromeLocalStorageText -Profiles $ChromeProfiles)
  $storageCandidates = Get-PlaidCandidateSets -Texts $texts

  Import-PlaidUiAutomation
  $ui = [WerklesVisiblePlaidChromeUi]::Extract($WindowTitlePattern)
  $receipt.plaid_ui_window_count = $ui.WindowCount

  $clientIds = [System.Collections.Generic.HashSet[string]]::new([string[]]@($ui.ClientIds + $storageCandidates.client_ids))
  $secrets = [System.Collections.Generic.HashSet[string]]::new([string[]]@($ui.Secrets + $storageCandidates.secrets))

  $receipt.client_id_candidate_count = $clientIds.Count
  $receipt.secret_candidate_count = $secrets.Count

  $pair = Find-ValidPlaidPair -ClientIds @($clientIds) -Secrets @($secrets)
  if ($null -eq $pair) {
    $receipt.status = "NO_VALID_PAIR"
    throw "No valid Plaid sandbox credential pair found in Chrome/UI session."
  }

  $receipt.valid_pair_found = "YES"
  $null = Invoke-FieldSetter -FieldName "PLAID_CLIENT_ID" -Value $pair.client_id -SourceLabel "PlaidDashboardChromeImport"
  $receipt.fields_updated += "PLAID_CLIENT_ID"
  $null = Invoke-FieldSetter -FieldName "PLAID_SECRET" -Value $pair.secret -SourceLabel "PlaidDashboardChromeImport"
  $receipt.fields_updated += "PLAID_SECRET"
  $null = Invoke-FieldSetter -FieldName "PLAID_ENV" -Value "sandbox" -SourceLabel "PlaidDashboardChromeImport"
  $receipt.fields_updated += "PLAID_ENV"

  $receipt.status = "PASS"
} catch {
  if ($receipt.status -eq "UNKNOWN") {
    $receipt.status = "BLOCKED_OR_FAILED"
  }
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

  $receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

@{
  status = $receipt.status
  valid_pair_found = $receipt.valid_pair_found
  client_id_candidate_count = $receipt.client_id_candidate_count
  secret_candidate_count = $receipt.secret_candidate_count
  fields_updated = $receipt.fields_updated
  secret_values_printed = "NO"
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 4

if ($receipt.status -ne "PASS") { exit 1 }
