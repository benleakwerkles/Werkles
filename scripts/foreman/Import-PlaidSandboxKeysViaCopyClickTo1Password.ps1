#requires -Version 5.1
param(
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

function Test-PlaidCredentialPair {
  param([string]$ClientId, [string]$Secret)
  try {
    $body = @{
      client_id = $ClientId
      secret = $Secret
      institution_id = "ins_109508"
      initial_products = @("transactions")
    } | ConvertTo-Json -Depth 4
    $r = Invoke-RestMethod -Method Post -Uri "https://sandbox.plaid.com/sandbox/public_token/create" -ContentType "application/json" -Body $body -TimeoutSec 12
    return [bool]$r.public_token
  } catch { return $false }
}

function Invoke-FieldSetter {
  param([string]$FieldName, [string]$Value, [string]$SourceLabel)
  $setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
  $out = $Value | powershell -NoProfile -ExecutionPolicy Bypass -File $setter -FieldName $FieldName -Vault $Vault -ItemTitle $ItemTitle -SourceLabel $SourceLabel
  $r = $out | ConvertFrom-Json
  if ($r.status -ne "PASS" -or -not $r.verified_field_has_value) { throw "1Password setter failed for $FieldName" }
}

function Import-PlaidUiHelper {
  if ("WerklesPlaidUiHelper" -as [type]) { return }
  Add-Type -ReferencedAssemblies UIAutomationClient, UIAutomationTypes -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Windows.Automation;

public static class WerklesPlaidUiHelper
{
    [DllImport("user32.dll")] private static extern bool EnumWindows(EnumWindowsProc f, IntPtr l);
    private delegate bool EnumWindowsProc(IntPtr h, IntPtr l);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] private static extern int GetWindowText(IntPtr h, StringBuilder s, int c);
    [DllImport("user32.dll")] private static extern bool SetForegroundWindow(IntPtr h);

    private static AutomationElement GetPlaidRoot()
    {
        IntPtr found = IntPtr.Zero;
        EnumWindows((hwnd, l) => {
            var sb = new StringBuilder(512);
            GetWindowText(hwnd, sb, 512);
            var title = sb.ToString() ?? "";
            if (title.IndexOf("plaid", StringComparison.OrdinalIgnoreCase) >= 0) { found = hwnd; return false; }
            return true;
        }, IntPtr.Zero);
        if (found == IntPtr.Zero) return null;
        SetForegroundWindow(found);
        Thread.Sleep(350);
        return AutomationElement.FromHandle(found);
    }

    public static int ClickNamedControls(string[] needles)
    {
        var root = GetPlaidRoot();
        if (root == null) return 0;
        var all = root.FindAll(TreeScope.Descendants, Condition.TrueCondition);
        int clicks = 0;
        for (int i = 0; i < all.Count; i++)
        {
            var el = all[i];
            var hay = ((el.Current.Name ?? "") + " " + (el.Current.AutomationId ?? "")).ToLowerInvariant();
            bool match = false;
            foreach (var n in needles) { if (hay.Contains(n)) { match = true; break; } }
            if (!match) continue;
            try
            {
                object ip;
                if (el.TryGetCurrentPattern(InvokePattern.Pattern, out ip))
                {
                    ((InvokePattern)ip).Invoke();
                    clicks++;
                    Thread.Sleep(450);
                }
            }
            catch {}
        }
        return clicks;
    }
}
"@
}

$receipt = [ordered]@{
  schema = "WERKLES_PLAID_CLIPBOARD_CLICK_IMPORT_V2"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  secret_values_printed = "NO"
  show_clicks = 0
  copy_clicks = 0
  token_count = 0
  fields_updated = @()
}

$prevToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$prevBio = $env:OP_BIOMETRIC_UNLOCK_ENABLED

try {
  $t = Get-WerklesOnePasswordServiceToken
  if ($t) { $env:OP_SERVICE_ACCOUNT_TOKEN = $t }
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

  Import-PlaidUiHelper
  $receipt.show_clicks = [WerklesPlaidUiHelper]::ClickNamedControls(@("show", "reveal", "view"))
  Start-Sleep -Milliseconds 500

  $tokens = New-Object System.Collections.Generic.HashSet[string]
  for ($round = 0; $round -lt 3; $round++) {
    $clicked = [WerklesPlaidUiHelper]::ClickNamedControls(@("copy"))
    $receipt.copy_clicks += $clicked
    Start-Sleep -Milliseconds 500
    $clip = ((Get-Clipboard -Format Text -ErrorAction SilentlyContinue) -join "`n").Trim()
    foreach ($part in ($clip -split "[\r\n,\s]+")) {
      $part = $part.Trim().Trim('"')
      if ($part -match '^[A-Za-z0-9_-]{20,80}$') { [void]$tokens.Add($part) }
    }
    if ($tokens.Count -ge 2) { break }
  }

  $values = @($tokens)
  $receipt.token_count = $values.Count
  if ($values.Count -lt 2) { throw "Could not harvest Plaid keys from Copy clicks. show=$($receipt.show_clicks) copy=$($receipt.copy_clicks) tokens=$($values.Count)" }

  $short = @($values | Where-Object { $_.Length -le 32 } | Sort-Object Length)
  $long = @($values | Where-Object { $_.Length -gt 32 } | Sort-Object Length -Descending)
  if ($short.Count -eq 0) { $short = @($values | Sort-Object Length | Select-Object -First 3) }
  if ($long.Count -eq 0) { $long = @($values | Sort-Object Length -Descending | Select-Object -First 3) }

  $pair = $null
  foreach ($c in $short) {
    foreach ($s in $long) {
      if ($c -eq $s) { continue }
      if (Test-PlaidCredentialPair -ClientId $c -Secret $s) { $pair = @{ client_id = $c; secret = $s }; break }
    }
    if ($pair) { break }
  }
  if (-not $pair) {
    foreach ($c in $values) {
      foreach ($s in $values) {
        if ($c -eq $s) { continue }
        if (Test-PlaidCredentialPair -ClientId $c -Secret $s) { $pair = @{ client_id = $c; secret = $s }; break }
      }
      if ($pair) { break }
    }
  }
  if (-not $pair) { throw "Harvested tokens did not validate against Plaid sandbox API." }

  $null = Invoke-FieldSetter -FieldName "PLAID_CLIENT_ID" -Value $pair.client_id -SourceLabel "PlaidCopyClickV2"
  $receipt.fields_updated += "PLAID_CLIENT_ID"
  $null = Invoke-FieldSetter -FieldName "PLAID_SECRET" -Value $pair.secret -SourceLabel "PlaidCopyClickV2"
  $receipt.fields_updated += "PLAID_SECRET"
  $null = Invoke-FieldSetter -FieldName "PLAID_ENV" -Value "sandbox" -SourceLabel "PlaidCopyClickV2"
  $receipt.fields_updated += "PLAID_ENV"
  $receipt.status = "PASS"
} catch {
  $receipt.status = "BLOCKED_OR_FAILED"
  $receipt.error = $_.Exception.Message
} finally {
  if ($null -eq $prevToken) { Remove-Item Env:\OP_SERVICE_ACCOUNT_TOKEN -ErrorAction SilentlyContinue } else { $env:OP_SERVICE_ACCOUNT_TOKEN = $prevToken }
  if ($null -eq $prevBio) { Remove-Item Env:\OP_BIOMETRIC_UNLOCK_ENABLED -ErrorAction SilentlyContinue } else { $env:OP_BIOMETRIC_UNLOCK_ENABLED = $prevBio }
  $receipt | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath $ReceiptPath -Encoding UTF8
}

@{
  status = $receipt.status
  show_clicks = $receipt.show_clicks
  copy_clicks = $receipt.copy_clicks
  token_count = $receipt.token_count
  fields_updated = $receipt.fields_updated
  secret_values_printed = "NO"
} | ConvertTo-Json -Depth 4

if ($receipt.status -ne "PASS") { exit 1 }
