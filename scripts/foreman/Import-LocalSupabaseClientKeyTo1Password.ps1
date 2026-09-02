#requires -Version 5.1
<#
.SYNOPSIS
  Search local caches/configs for the Werkles Supabase client key and import it.

.DESCRIPTION
  Looks for modern sb_publishable keys and legacy anon JWTs without printing
  values. A candidate is imported only if exactly one distinct valid key is
  found. Values are passed to the existing stdin setter and are never written to
  repo files.
#>
param(
  [string]$Vault = "Werkles Automation",
  [string]$ItemTitle = "Werkles Vercel Secrets",
  [string]$ReceiptPath
)

$ErrorActionPreference = "Stop"
$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
Set-Location -LiteralPath $RepoRoot

if ([string]::IsNullOrWhiteSpace($ReceiptPath)) {
  $ReceiptPath = Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_LOCAL_SUPABASE_CLIENT_KEY_IMPORT_20260704.json"
}

. (Join-Path $PSScriptRoot "WerklesOnePasswordCredential.ps1")

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

function Test-PublishableCandidate {
  param(
    [string]$SupabaseUrl,
    [string]$Token
  )

  if ($Token -notmatch "^sb_publishable_[A-Za-z0-9_-]+$") {
    return $false
  }

  try {
    $headers = @{
      apikey = $Token
      Authorization = "Bearer $Token"
    }
    $null = Invoke-WebRequest -UseBasicParsing -Uri ($SupabaseUrl.TrimEnd("/") + "/auth/v1/settings") -Headers $headers -TimeoutSec 12 -MaximumRedirection 3
    return $true
  } catch {
    $statusCode = $null
    if ($_.Exception.Response) {
      try { $statusCode = [int]$_.Exception.Response.StatusCode } catch { $statusCode = $null }
    }
    return ($statusCode -in @(200, 204, 400, 401, 403, 404, 405))
  }
}

function Add-Candidate {
  param(
    [hashtable]$Candidates,
    [string]$Token,
    [string]$Type,
    [string]$Source
  )

  if ([string]::IsNullOrWhiteSpace($Token)) {
    return
  }

  if (-not $Candidates.ContainsKey($Token)) {
    $Candidates[$Token] = [ordered]@{
      type = $Type
      sourceCount = 0
      sources = @()
      length = $Token.Length
    }
  }

  $Candidates[$Token].sourceCount += 1
  if ($Candidates[$Token].sources.Count -lt 8 -and -not ($Candidates[$Token].sources -contains $Source)) {
    $Candidates[$Token].sources += $Source
  }
}

function Invoke-StdinSetter {
  param(
    [string]$Value,
    [string]$SourceLabel
  )

  $setter = Join-Path $PSScriptRoot "Set-1PasswordFieldFromStdin.ps1"
  $args = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", $setter,
    "-FieldName", "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "-Vault", $Vault,
    "-ItemTitle", $ItemTitle,
    "-SourceLabel", $SourceLabel,
    "-ReceiptPath", (Join-Path $RepoRoot "foreman\receipts\WERKLES_COM_1PASSWORD_FIELD_SET_LOCAL_SUPABASE_CLIENT_KEY_20260704.json")
  )

  $psi = [System.Diagnostics.ProcessStartInfo]::new()
  $psi.FileName = "powershell.exe"
  $psi.Arguments = ($args | ForEach-Object {
    $text = [string]$_
    if ($text -notmatch '[\s"]') { $text } else { '"' + $text.Replace('"', '\"') + '"' }
  }) -join " "
  $psi.WorkingDirectory = $RepoRoot.Path
  $psi.UseShellExecute = $false
  $psi.RedirectStandardInput = $true
  $psi.RedirectStandardOutput = $true
  $psi.RedirectStandardError = $true
  $psi.CreateNoWindow = $true

  $process = [System.Diagnostics.Process]::Start($psi)
  $process.StandardInput.Write($Value)
  $process.StandardInput.Close()
  $stdout = $process.StandardOutput.ReadToEnd()
  $stderr = $process.StandardError.ReadToEnd()
  $process.WaitForExit()

  if ($process.ExitCode -ne 0) {
    $line = ($stderr -split "`r?`n" | Where-Object { $_.Trim() } | Select-Object -First 1)
    if (-not $line) { $line = "exit $($process.ExitCode)" }
    throw "stdin setter failed: $line"
  }
}

$receipt = [ordered]@{
  schema = "WERKLES_COM_LOCAL_SUPABASE_CLIENT_KEY_IMPORT_V1"
  status = "UNKNOWN"
  timestamp = (Get-Date).ToString("o")
  machine = $env:COMPUTERNAME
  vault = $Vault
  itemTitle = $ItemTitle
  secretValuesPrinted = "NO"
  secretValuesWrittenToRepo = "NO"
  tempSecretFilesWritten = "NO"
  scannedRoots = @()
  rootsMissing = @()
  filesWithRegexHits = 0
  filesRead = 0
  readErrors = 0
  publishableCandidateCount = 0
  anonJwtCandidateCount = 0
  distinctValidCandidateCount = 0
  candidateSummaries = @()
}

$previousToken = $env:OP_SERVICE_ACCOUNT_TOKEN
$previousBiometric = $env:OP_BIOMETRIC_UNLOCK_ENABLED

try {
  $op = Get-WerklesOpBinary
  $storedToken = Get-WerklesOnePasswordServiceToken
  if ([string]::IsNullOrWhiteSpace($previousToken)) {
    if ([string]::IsNullOrWhiteSpace($storedToken)) {
      throw "Stored Werkles service-account token is missing."
    }
    $env:OP_SERVICE_ACCOUNT_TOKEN = $storedToken
  }
  $env:OP_BIOMETRIC_UNLOCK_ENABLED = "false"

  $item = & $op item get $ItemTitle --vault $Vault --format json --reveal | ConvertFrom-Json
  $urlField = @($item.fields | Where-Object { $_.label -eq "NEXT_PUBLIC_SUPABASE_URL" } | Select-Object -First 1)
  $supabaseUrl = [string]$urlField.value
  if ($supabaseUrl -notmatch "^https://([a-z0-9-]+)\.supabase\.co/?$") {
    throw "Werkles Supabase URL is missing or invalid."
  }
  $projectRef = $Matches[1]

  $roots = @(
    (Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"),
    (Join-Path $env:LOCALAPPDATA "Microsoft\Edge\User Data"),
    (Join-Path $env:APPDATA "Cursor"),
    (Join-Path $env:APPDATA "Code"),
    (Join-Path $env:USERPROFILE ".vercel"),
    (Join-Path $env:APPDATA "vercel"),
    (Join-Path $env:LOCALAPPDATA "Vercel"),
    (Join-Path $env:USERPROFILE ".config"),
    (Join-Path $env:USERPROFILE ".codex"),
    (Join-Path $env:USERPROFILE ".cursor"),
    (Join-Path $env:USERPROFILE "Downloads")
  )

  $existingRoots = foreach ($root in $roots) {
    if (Test-Path -LiteralPath $root) {
      $receipt.scannedRoots += $root
      $root
    } else {
      $receipt.rootsMissing += $root
    }
  }

  $allCandidates = @{}
  $regex = "sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}"
  $skipPathRegex = "\\(Cache|Code Cache|GPUCache|ShaderCache|GrShaderCache|DawnCache|blob_storage|Crashpad|Service Worker\\CacheStorage)\\"

  foreach ($root in $existingRoots) {
    $files = @()
    try {
      $files = Get-ChildItem -LiteralPath $root -File -Recurse -Force -ErrorAction SilentlyContinue |
        Where-Object {
          $_.Length -le 25000000 -and
          $_.FullName -notmatch $skipPathRegex -and
          $_.Name -notmatch "\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|7z|gz|tar|exe|dll|pdb|mp4|mov|mp3|wav)$"
        }
    } catch {
      $receipt.readErrors += 1
      continue
    }

    foreach ($file in $files) {
      $receipt.filesRead += 1
      try {
        $text = [System.IO.File]::ReadAllText($file.FullName)
      } catch {
        $receipt.readErrors += 1
        continue
      }

      $matches = @([regex]::Matches($text, $regex))
      if ($matches.Count -eq 0) {
        continue
      }

      $receipt.filesWithRegexHits += 1
      foreach ($match in $matches) {
        $token = [string]$match.Value
        if ($token -match "^sb_publishable_") {
          $receipt.publishableCandidateCount += 1
          if (Test-PublishableCandidate -SupabaseUrl $supabaseUrl -Token $token) {
            Add-Candidate -Candidates $allCandidates -Token $token -Type "sb_publishable" -Source $file.FullName
          }
          continue
        }

        $payload = Get-JwtPayload -Token $token
        if ($null -eq $payload) {
          continue
        }
        if ([string]$payload.role -eq "anon" -and [string]$payload.ref -eq $projectRef) {
          $receipt.anonJwtCandidateCount += 1
          Add-Candidate -Candidates $allCandidates -Token $token -Type "legacy_anon_jwt" -Source $file.FullName
        }
      }
    }
  }

  $receipt.distinctValidCandidateCount = $allCandidates.Count
  foreach ($key in $allCandidates.Keys) {
    $candidate = $allCandidates[$key]
    $receipt.candidateSummaries += [ordered]@{
      type = $candidate.type
      sourceCount = $candidate.sourceCount
      sources = $candidate.sources
      length = $candidate.length
    }
  }

  if ($allCandidates.Count -eq 1) {
    $token = [string]@($allCandidates.Keys)[0]
    Invoke-StdinSetter -Value $token -SourceLabel "LocalSupabaseClientKeyScanner"
    $receipt.status = "PASS_IMPORTED_ONE_VALID_CLIENT_KEY"
  } elseif ($allCandidates.Count -eq 0) {
    $receipt.status = "BLOCKED_NO_VALID_CLIENT_KEY_FOUND"
  } else {
    $receipt.status = "BLOCKED_MULTIPLE_DISTINCT_CLIENT_KEYS_FOUND"
  }
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
  files_read = $receipt.filesRead
  files_with_regex_hits = $receipt.filesWithRegexHits
  publishable_candidate_count = $receipt.publishableCandidateCount
  anon_jwt_candidate_count = $receipt.anonJwtCandidateCount
  distinct_valid_candidate_count = $receipt.distinctValidCandidateCount
  candidate_summaries = $receipt.candidateSummaries
  secret_values_printed = $receipt.secretValuesPrinted
  secret_values_written_to_repo = $receipt.secretValuesWrittenToRepo
  temp_secret_files_written = $receipt.tempSecretFilesWritten
  receipt = $ReceiptPath
} | ConvertTo-Json -Depth 6

