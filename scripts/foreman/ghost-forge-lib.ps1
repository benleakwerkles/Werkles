function Get-GhostForgeRepoRoot {
  Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
}

if (-not ("System.Net.Http.HttpClient" -as [type])) {
  Add-Type -AssemblyName System.Net.Http
}

function Import-GhostForgeEnvFile {
  param([string]$Path = (Join-Path (Get-GhostForgeRepoRoot) "ghost-forge-worker\.env"))

  if (-not (Test-Path $Path)) {
    return
  }

  Get-Content $Path | ForEach-Object {
    $line = $_.Trim()
    if (-not $line -or $line.StartsWith("#")) {
      return
    }

    $parts = $line -split "=", 2
    if ($parts.Count -ne 2) {
      return
    }

    $name = $parts[0].Trim()
    $value = $parts[1].Trim().Trim('"').Trim("'")
    if ($name -and -not [string]::IsNullOrWhiteSpace($value) -and $value -notmatch '^\$\(') {
      Set-Item -Path "Env:$name" -Value $value -Force
    }
  }
}

function Test-GhostForgeEnvValuePresent {
  param(
    [string]$Value,
    [string[]]$PlaceholderPatterns = @("your-project", "replace", "example", "set-this")
  )

  if ([string]::IsNullOrWhiteSpace($Value)) {
    return $false
  }

  foreach ($pattern in $PlaceholderPatterns) {
    if ($Value -match [regex]::Escape($pattern)) {
      return $false
    }
  }

  return $true
}

function Get-GhostForgeBaseUrl {
  param([string]$BaseUrl = $env:PUBLIC_BASE_URL)

  if (-not $BaseUrl) {
    $BaseUrl = "https://werkles-ghost-forge1.onrender.com"
  }

  return $BaseUrl.TrimEnd("/").TrimEnd(".")
}

function Invoke-GhostForgeApi {
  param(
    [ValidateSet("GET", "POST")]
    [string]$Method,

    [Parameter(Mandatory = $true)]
    [string]$Path,

    [hashtable]$Headers = @{},

    [string]$Body,

    [int]$TimeoutSec = 90
  )

  $base = Get-GhostForgeBaseUrl
  $uri = if ($Path.StartsWith("http")) { $Path } else { "$base$Path" }
  $client = [System.Net.Http.HttpClient]::new()
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)

  try {
    $request = [System.Net.Http.HttpRequestMessage]::new($Method, $uri)
    foreach ($key in $Headers.Keys) {
      if ($key -eq "Content-Type") {
        continue
      }
      $request.Headers.TryAddWithoutValidation($key, [string]$Headers[$key]) | Out-Null
    }

    if ($Method -eq "POST") {
      $contentType = if ($Headers["Content-Type"]) { [string]$Headers["Content-Type"] } else { "application/json" }
      $request.Content = [System.Net.Http.StringContent]::new($Body, [System.Text.Encoding]::UTF8, $contentType)
    }

    $response = $client.SendAsync($request).GetAwaiter().GetResult()
    $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $statusCode = [int]$response.StatusCode
    $json = $null
    if ($text -and $text.TrimStart().StartsWith("{")) {
      try {
        $json = $text | ConvertFrom-Json
      } catch {
        $json = $null
      }
    }

    return [pscustomobject]@{
      StatusCode = $statusCode
      Body       = $text
      Json       = $json
      Ok         = $response.IsSuccessStatusCode
    }
  }
  finally {
    $client.Dispose()
  }
}

function Get-GhostForgeAuthHeaders {
  param(
    [hashtable]$Extra = @{},

    [switch]$Force
  )

  if (-not $env:GHOST_FORGE_API_KEY) {
    throw "GHOST_FORGE_API_KEY is required. Set it in ghost-forge-worker\.env (never paste in chat)."
  }

  $headers = @{
    Authorization  = "Bearer $env:GHOST_FORGE_API_KEY"
    "Content-Type" = "application/json"
  }

  foreach ($key in $Extra.Keys) {
    $headers[$key] = $Extra[$key]
  }

  if ($Force) {
    $headers["X-Ghost-Forge-Skip-Rate-Limit"] = "1"
  }

  return $headers
}

function Get-GhostForgeRateLimitDiagnostics {
  param([hashtable]$Headers = (Get-GhostForgeAuthHeaders))

  $response = Invoke-GhostForgeApi -Method GET -Path "/diagnostics/rate-limit" -Headers $Headers -TimeoutSec 30
  if (-not $response.Ok) {
    return $null
  }

  return $response.Json
}

function Write-GhostForgeRateLimitOperatorNote {
  param(
    [object]$CreateResponse,
    [switch]$Force
  )

  $retryMin = $null
  $retrySec = $null

  if ($CreateResponse.Json) {
    $retryMin = $CreateResponse.Json.retry_after_minutes
    $retrySec = $CreateResponse.Json.retry_after_seconds
  }

  if (-not $retryMin -and $CreateResponse.Body) {
    try {
      $parsed = $CreateResponse.Body | ConvertFrom-Json
      $retryMin = $parsed.retry_after_minutes
      $retrySec = $parsed.retry_after_seconds
    } catch {
      $parsed = $null
    }
  }

  if ($retryMin) {
    Write-Host "HOURLY CAP (429) - not an error. Retry in ~$retryMin min (${retrySec}s), or lift on Render: GHOST_FORGE_SKIP_RATE_LIMIT=1 then redeploy/restart."
  } else {
    Write-Host "HOURLY CAP (429) - not an error. Check GET /diagnostics/rate-limit or restart Render worker to clear in-memory window."
  }

  if ($Force) {
    Write-Host "Force was set but worker still returned 429. Enable GHOST_FORGE_SKIP_RATE_LIMIT=1 on Render, redeploy, then re-run with -Force."
  } else {
    Write-Host "To lift when ready: Render env GHOST_FORGE_SKIP_RATE_LIMIT=1 + restart. Scripts: -Force after lift. Page work on localhost needs no wait."
  }
}

function Test-GhostForgeCreateResponse {
  param(
    [Parameter(Mandatory = $true)]
    [pscustomobject]$CreateResponse,

    [Parameter(Mandatory = $true)]
    [string]$ShotId,

    [scriptblock]$OnLog,

    [switch]$Force
  )

  if ($CreateResponse.StatusCode -eq 402) {
    & $OnLog "STOP $ShotId - 402 budget exceeded"
    return [pscustomobject]@{ stop = $true; result = [pscustomobject]@{ shot_id = $ShotId; status = "402_budget" } }
  }

  if ($CreateResponse.StatusCode -eq 429) {
    Write-GhostForgeRateLimitOperatorNote -CreateResponse $CreateResponse -Force:$Force
    & $OnLog "RATE_LIMIT $ShotId - hourly cap (429). Fail-fast - operator decides when to retry."
    return [pscustomobject]@{
      stop = $true
      result = [pscustomobject]@{
        shot_id = $ShotId
        status = "429_rate_limit"
        http = 429
      }
    }
  }

  if (-not $CreateResponse.Ok) {
    & $OnLog "FAIL $ShotId - batch/create $($CreateResponse.StatusCode): $($CreateResponse.Body)"
    return [pscustomobject]@{
      stop = $true
      result = [pscustomobject]@{
        shot_id = $ShotId
        status = "create_failed"
        http = $CreateResponse.StatusCode
      }
    }
  }

  $create = $CreateResponse.Json
  if (-not $create.ok) {
    & $OnLog "FAIL $ShotId - ok=false"
    return [pscustomobject]@{
      stop = $true
      result = [pscustomobject]@{ shot_id = $ShotId; status = "create_rejected" }
    }
  }

  return [pscustomobject]@{ stop = $false; create = $create }
}

function Save-GhostForgeDownload {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Uri,

    [Parameter(Mandatory = $true)]
    [string]$OutFile,

    [int]$TimeoutSec = 120
  )

  $client = [System.Net.Http.HttpClient]::new()
  $client.Timeout = [TimeSpan]::FromSeconds($TimeoutSec)

  try {
    $bytes = $client.GetByteArrayAsync($Uri).GetAwaiter().GetResult()
    $dir = Split-Path $OutFile -Parent
    if ($dir) {
      New-Item -ItemType Directory -Force -Path $dir | Out-Null
    }
    [System.IO.File]::WriteAllBytes($OutFile, $bytes)
  }
  finally {
    $client.Dispose()
  }
}
