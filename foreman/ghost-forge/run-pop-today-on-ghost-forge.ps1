param(
  [string]$BaseUrl = $env:PUBLIC_BASE_URL,
  [int]$PollSeconds = 20,
  [int]$MaxWaitMinutes = 30,
  [int]$SubmitPauseSeconds = 10,
  [switch]$Force
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$batchPath = Join-Path $PSScriptRoot "GHOST_FORGE_POP_TODAY_BATCH_20260629.json"
$resultsPath = Join-Path $PSScriptRoot "GHOST_FORGE_POP_TODAY_LIVE_RESULTS_20260629.json"
$logPath = Join-Path $PSScriptRoot "ghost-forge-pop-today-live-run.log"
$assetDir = Join-Path $repoRoot "public\assets\draft\oddly-godly-pop-today"
$devLib = "C:\Dev\Werkles\scripts\foreman\ghost-forge-lib.ps1"
$devEnv = "C:\Dev\Werkles\ghost-forge-worker\.env"

if (-not (Test-Path $devLib)) {
  throw "Ghost Forge lib not found at $devLib"
}

. $devLib
Import-GhostForgeEnvFile -Path $devEnv

if (-not $BaseUrl) {
  $BaseUrl = Get-GhostForgeBaseUrl
} else {
  $BaseUrl = Get-GhostForgeBaseUrl -BaseUrl $BaseUrl
}

if (-not $env:GHOST_FORGE_API_KEY) {
  throw "GHOST_FORGE_API_KEY is required in C:\Dev\Werkles\ghost-forge-worker\.env or the current environment. Do not paste it in chat."
}

New-Item -ItemType Directory -Force -Path $assetDir | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $resultsPath -Parent) | Out-Null

$batch = Get-Content -Raw $batchPath | ConvertFrom-Json
$assets = @($batch.batch.assets)
$headers = Get-GhostForgeAuthHeaders -Force:$Force
$runId = "GHOST_FORGE_POP_TODAY_" + (Get-Date -Format "yyyyMMdd-HHmmss")
$startedAt = (Get-Date).ToUniversalTime().ToString("o")
$deadline = (Get-Date).AddMinutes($MaxWaitMinutes)
$results = @()
$pending = @{}
$totalEstCost = [decimal]0

function Write-RunLog {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

function Get-PrimaryDeliveryName {
  param([object]$Asset)
  $names = @()
  if ($Asset.delivery_names) {
    $Asset.delivery_names.PSObject.Properties | ForEach-Object {
      if ($_.Value) {
        $names += [string]$_.Value
      }
    }
  }
  if ($names.Count -gt 0) {
    return $names[0]
  }
  return $Asset.asset_id
}

function Save-Manifest {
  $completedCount = @($results | Where-Object { $_.status -eq "completed" }).Count
  $manifest = [ordered]@{
    run_id = $runId
    packet_id = $batch.packet_id
    gate = "GHOST_FORGE_POP_TODAY_OPERATOR_GO"
    operator_phrase = "Go now, please."
    started_at = $startedAt
    updated_at = (Get-Date).ToUniversalTime().ToString("o")
    base_url = $BaseUrl
    source_file = $batch.source_file
    external_run_executed = $true
    shot_count = $assets.Count
    submitted_count = @($results | Where-Object { $_.batch_id }).Count
    completed_count = $completedCount
    total_estimated_cost_usd = $totalEstCost
    asset_output_dir = "public/assets/draft/oddly-godly-pop-today"
    results = $results
  }
  $manifest | ConvertTo-Json -Depth 10 | Set-Content -Path $resultsPath -Encoding UTF8
}

function Add-Or-ReplaceResult {
  param([pscustomobject]$Result)
  $script:results = @($script:results | Where-Object { $_.asset_id -ne $Result.asset_id })
  $script:results += $Result
  Save-Manifest
}

Write-RunLog "=== $runId starting: submitting $($assets.Count) Oddly Godly POP Today assets ==="
Write-RunLog "Render worker: $BaseUrl"

$health = Invoke-GhostForgeApi -Method GET -Path "/health" -TimeoutSec 30
if (-not $health.Ok -or -not $health.Json.ok) {
  throw "Ghost Forge health check failed: HTTP $($health.StatusCode)"
}
Write-RunLog "Health OK: $($health.Json.service)"

$index = 0
foreach ($asset in $assets) {
  if ($index -gt 0 -and $SubmitPauseSeconds -gt 0) {
    Write-RunLog "Pause ${SubmitPauseSeconds}s before next submit"
    Start-Sleep -Seconds $SubmitPauseSeconds
  }
  $index++

  $deliveryName = Get-PrimaryDeliveryName -Asset $asset
  $targetFile = "$deliveryName.png"
  $destPath = Join-Path $assetDir $targetFile
  $brief = @(
    $batch.house_style.executable_prompt_prefix,
    "Asset ID: $($asset.asset_id).",
    "Shopping list reference: $($asset.shopping_list_ref).",
    "Asset kind: $($asset.asset_kind).",
    "Target use: $($asset.target_use).",
    "Target resolution: $($asset.target_resolution).",
    "Delivery stem: $deliveryName.",
    "Prompt: $($asset.prompt)",
    "Negative and hard rules: $($asset.negative_prompt)"
  ) -join " "

  Write-RunLog "Submitting $($asset.asset_id) -> $targetFile"

  $body = @{
    brief = $brief
    count = 1
    model = "ideogram-ai/ideogram-v3-quality"
    metadata = @{
      project = "werkles"
      source = "ghost-forge-pop-today"
      packet_id = $batch.packet_id
      asset_id = $asset.asset_id
      shot_id = $asset.asset_id
      asset_kind = $asset.asset_kind
      target_filename = $targetFile
      target_path = "public/assets/draft/oddly-godly-pop-today/$targetFile"
      gate = "GHOST_FORGE_POP_TODAY_OPERATOR_GO"
    }
  } | ConvertTo-Json -Depth 8

  try {
    $createResponse = Invoke-GhostForgeApi -Method POST -Path "/batch/create" -Headers $headers -Body $body -TimeoutSec 180
  } catch {
    Write-RunLog "FAIL $($asset.asset_id) - batch/create exception: $($_.Exception.Message)"
    Add-Or-ReplaceResult ([pscustomobject]@{
      asset_id = $asset.asset_id
      status = "create_failed"
      error = $_.Exception.Message
      target_path = "public/assets/draft/oddly-godly-pop-today/$targetFile"
    })
    break
  }

  $gate = Test-GhostForgeCreateResponse -CreateResponse $createResponse -ShotId $asset.asset_id -Force:$Force -OnLog { param($m) Write-RunLog $m }
  if ($gate.stop) {
    Add-Or-ReplaceResult ([pscustomobject]@{
      asset_id = $asset.asset_id
      status = $gate.result.status
      http = $gate.result.http
      target_path = "public/assets/draft/oddly-godly-pop-today/$targetFile"
    })
    break
  }

  $create = $gate.create
  $batchId = $create.batch_id
  $est = [decimal]$create.estimated_cost_usd
  $totalEstCost += $est

  $pending[$batchId] = [pscustomobject]@{
    asset = $asset
    batch_id = $batchId
    submitted_at = (Get-Date)
    target_file = $targetFile
    dest_path = $destPath
    estimated_cost_usd = $est
  }

  Add-Or-ReplaceResult ([pscustomobject]@{
    asset_id = $asset.asset_id
    status = "queued"
    batch_id = $batchId
    target_path = "public/assets/draft/oddly-godly-pop-today/$targetFile"
    estimated_cost_usd = $est
  })
  Write-RunLog "Queued $($asset.asset_id) batch $batchId est `$$est"
}

while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
  Start-Sleep -Seconds $PollSeconds

  foreach ($batchId in @($pending.Keys)) {
    $item = $pending[$batchId]
    $asset = $item.asset

    try {
      $poll = Invoke-GhostForgeApi -Method GET -Path "/batches/$batchId" -Headers @{ Authorization = "Bearer $env:GHOST_FORGE_API_KEY" } -TimeoutSec 90
    } catch {
      Write-RunLog "Poll $($asset.asset_id) - $($_.Exception.Message)"
      continue
    }

    if (-not $poll.Ok) {
      Write-RunLog "Poll $($asset.asset_id) - HTTP $($poll.StatusCode)"
      continue
    }

    $status = $poll.Json
    $batchStatus = $status.batch.status
    $output = $status.outputs | Select-Object -First 1
    $outputStatus = if ($output) { $output.status } else { "missing_output" }
    Write-RunLog "Poll $($asset.asset_id) - batch=$batchStatus output=$outputStatus"

    if ($batchStatus -eq "completed" -and $outputStatus -eq "completed") {
      if ($output.source_url) {
        Save-GhostForgeDownload -Uri $output.source_url -OutFile $item.dest_path -TimeoutSec 180
        Write-RunLog "DONE $($asset.asset_id) -> $($item.dest_path)"
        Add-Or-ReplaceResult ([pscustomobject]@{
          asset_id = $asset.asset_id
          status = "completed"
          batch_id = $batchId
          path = "public/assets/draft/oddly-godly-pop-today/$($item.target_file)"
          estimated_cost_usd = $item.estimated_cost_usd
          storage_path = $output.storage_path
          source_url_present = $true
        })
      } else {
        Write-RunLog "DONE $($asset.asset_id) - no source_url; storage $($output.storage_path)"
        Add-Or-ReplaceResult ([pscustomobject]@{
          asset_id = $asset.asset_id
          status = "completed_no_url"
          batch_id = $batchId
          estimated_cost_usd = $item.estimated_cost_usd
          storage_path = $output.storage_path
          source_url_present = $false
        })
      }
      $pending.Remove($batchId)
      continue
    }

    if ($batchStatus -eq "failed" -or $outputStatus -eq "failed") {
      Write-RunLog "FAIL $($asset.asset_id) - batch failed"
      Add-Or-ReplaceResult ([pscustomobject]@{
        asset_id = $asset.asset_id
        status = "failed"
        batch_id = $batchId
        target_path = "public/assets/draft/oddly-godly-pop-today/$($item.target_file)"
      })
      $pending.Remove($batchId)
    }
  }
}

if ($pending.Count -gt 0) {
  foreach ($batchId in @($pending.Keys)) {
    $item = $pending[$batchId]
    Add-Or-ReplaceResult ([pscustomobject]@{
      asset_id = $item.asset.asset_id
      status = "timeout"
      batch_id = $batchId
      target_path = "public/assets/draft/oddly-godly-pop-today/$($item.target_file)"
      estimated_cost_usd = $item.estimated_cost_usd
    })
    Write-RunLog "TIMEOUT $($item.asset.asset_id) - batch $batchId"
  }
}

Save-Manifest
Write-RunLog "=== $runId complete: $(@($results | Where-Object { $_.status -eq 'completed' }).Count)/$($assets.Count) downloaded; manifest $resultsPath ==="
$results | Format-Table -AutoSize
