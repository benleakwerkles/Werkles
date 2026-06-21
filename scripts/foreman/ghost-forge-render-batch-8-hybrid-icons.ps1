param(
  [string[]]$ShotIds = @(
    "tier2-icon-spark-hybrid",
    "tier2-icon-builder-hybrid",
    "tier2-icon-worker-hybrid",
    "tier2-icon-operator-hybrid",
    "tier2-icon-backer-hybrid",
    "tier2-icon-connector-hybrid"
  ),

  [string]$BaseUrl = $env:PUBLIC_BASE_URL,

  [int]$PollSeconds = 20,

  [int]$MaxWaitMinutes = 18,

  [int]$SubmitPauseSeconds = 65,

  [switch]$DryRun,

  [switch]$Force
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "ghost-forge-lib.ps1")

$repoRoot = Get-GhostForgeRepoRoot
Import-GhostForgeEnvFile

$globalNegative = @(
  "Fantasy crest, AI holograms, floating gears, stock-photo smiles, crypto aesthetics, glass skyscraper boardroom",
  "corporate diversity poster, movie poster lighting, magical effects, handshake, fist punch, eye contact with camera",
  "presenting gesture, readable text, logos, watermark, melodrama, guru fog, lifestyle flex, pastel SaaS mascot",
  "Monopoly game piece, brass token clipart, 3D render icon, glossy app icon, cartoon mascot, white background matte, gray checkerboard visible"
) -join ", "

$hybridIconPrefix = "Single real workshop object isolated on fully transparent background, alpha PNG, heightened documentary realism with slight warm mythic capitalism accent on metal only, not fantasy forge, not flat geometry icon, not comic book, not glossy app chrome, recognizable prop at a glance, object centered, square crop, no people, no hands, no text, no logos, no floor plane, no shadow plate. Werkles tier-2 hybrid icon. Global negative: $globalNegative"

$shots = @{
  "tier2-icon-spark-hybrid" = @{
    file = "werkles-tier2-icon-spark-hybrid.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-hybrid-v1"
    prompt = "Flint striker and steel with tiny sparks, opportunity ignition, readable silhouette, warm copper highlight on metal."
  }
  "tier2-icon-builder-hybrid" = @{
    file = "werkles-tier2-icon-builder-hybrid.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-hybrid-v1"
    prompt = "Metal T-square with faint pencil-line edge, builder system metaphor, real patina, readable at small size."
  }
  "tier2-icon-worker-hybrid" = @{
    file = "werkles-tier2-icon-worker-hybrid.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-hybrid-v1"
    prompt = "Crucible tongs and small ingot, skilled execution metaphor, steel and copper warmth, not cartoon."
  }
  "tier2-icon-operator-hybrid" = @{
    file = "werkles-tier2-icon-operator-hybrid.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-hybrid-v1"
    prompt = "Brass keyring with two worn keys beside closed folder edge, process control metaphor, calm back-office read."
  }
  "tier2-icon-backer-hybrid" = @{
    file = "werkles-tier2-icon-backer-hybrid.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-hybrid-v1"
    prompt = "Three small ingots stacked with folder corner, capital backing without wolf energy, sober metal still life."
  }
  "tier2-icon-connector-hybrid" = @{
    file = "werkles-tier2-icon-connector-hybrid.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-hybrid-v1"
    prompt = "Two interlocking brass rings with real wear, connection metaphor, not network-node clipart."
  }
}

if (-not $BaseUrl) {
  $BaseUrl = Get-GhostForgeBaseUrl
} else {
  $BaseUrl = Get-GhostForgeBaseUrl -BaseUrl $BaseUrl
}

if (-not $env:GHOST_FORGE_API_KEY) {
  Write-Error "Set GHOST_FORGE_API_KEY in ghost-forge-worker\.env. Do not paste it in chat."
  exit 1
}

$logPath = Join-Path $repoRoot "foreman\ghost-forge\render-batch-8-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\RENDER_BATCH_8_RESULTS.json"

$headers = Get-GhostForgeAuthHeaders -Force:$Force

$results = @()
$totalEstCost = 0.0
$shotIndex = 0

function Write-Log {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

Write-Log "=== RENDER_BATCH_8 - tier-2 hybrid transparent icons (6 shots) ==="
Write-Log "Shots queued: $($ShotIds -join ', ')"

foreach ($shotId in $ShotIds) {
  if (-not $shots.ContainsKey($shotId)) {
    Write-Log "SKIP unknown shot: $shotId"
    continue
  }

  if ($shotIndex -gt 0 -and $SubmitPauseSeconds -gt 0 -and -not $DryRun) {
    Write-Log "Pause ${SubmitPauseSeconds}s before next submit (hourly cap spacing)"
    Start-Sleep -Seconds $SubmitPauseSeconds
  }
  $shotIndex++

  $spec = $shots[$shotId]
  $targetFile = $spec.file
  $destDir = Join-Path $repoRoot ("public\assets\draft\" + $spec.dest)
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  $destPath = Join-Path $destDir $targetFile

  $brief = "$hybridIconPrefix Werkles render batch 8 $shotId. $($spec.prompt)"

  Write-Log "Submitting $shotId -> $($spec.dest)/$targetFile"

  if ($DryRun) {
    $results += [pscustomobject]@{ shot_id = $shotId; status = "dry_run"; path = $destPath }
    continue
  }

  $body = @{
    brief = $brief
    count = 1
    model = "ideogram-ai/ideogram-v3-quality"
    metadata = @{
      project = "werkles"
      source = "render-batch-6"
      shot_id = $shotId
      act = $spec.act
      kind = $spec.kind
      target_filename = $targetFile
      aspect_ratio = $spec.aspect
      gate = "RENDER_BATCH_8_OPERATOR_GO"
    }
  } | ConvertTo-Json -Depth 6

  try {
    $createResponse = Invoke-GhostForgeApi -Method POST -Path "/batch/create" -Headers $headers -Body $body -TimeoutSec 180
  } catch {
    Write-Log "FAIL $shotId - batch/create exception: $($_.Exception.Message)"
    $results += [pscustomobject]@{ shot_id = $shotId; status = "create_failed"; error = $_.Exception.Message }
    break
  }

  $gate = Test-GhostForgeCreateResponse -CreateResponse $createResponse -ShotId $shotId -Force:$Force -OnLog { param($m) Write-Log $m }
  if ($gate.stop) {
    $results += $gate.result
    break
  }

  $create = $gate.create

  $batchId = $create.batch_id
  $est = [decimal]$create.estimated_cost_usd
  $totalEstCost += $est
  Write-Log "Queued batch $batchId est `$$est"

  $deadline = (Get-Date).AddMinutes($MaxWaitMinutes)
  $completed = $false

  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds $PollSeconds
    try {
      $poll = Invoke-GhostForgeApi -Method GET -Path "/batches/$batchId" -Headers @{ Authorization = "Bearer $env:GHOST_FORGE_API_KEY" } -TimeoutSec 90
      if (-not $poll.Ok) {
        Write-Log "Poll $batchId - HTTP $($poll.StatusCode)"
        continue
      }
      $status = $poll.Json
    } catch {
      Write-Log "Poll $batchId - $($_.Exception.Message)"
      continue
    }

    $batchStatus = $status.batch.status
    $output = $status.outputs | Select-Object -First 1
    Write-Log "Poll $shotId - batch=$batchStatus output=$($output.status)"

    if ($batchStatus -eq "completed" -and $output.status -eq "completed") {
      if ($output.source_url) {
        Save-GhostForgeDownload -Uri $output.source_url -OutFile $destPath -TimeoutSec 180
        Write-Log "DONE $shotId -> $destPath"
        $results += [pscustomobject]@{
          shot_id = $shotId
          status = "completed"
          batch_id = $batchId
          path = "public/assets/draft/$($spec.dest)/$targetFile"
          estimated_cost_usd = $est
          storage_path = $output.storage_path
        }
      } else {
        Write-Log "DONE $shotId - no source_url; storage $($output.storage_path)"
        $results += [pscustomobject]@{
          shot_id = $shotId
          status = "completed_no_url"
          batch_id = $batchId
          storage_path = $output.storage_path
        }
      }
      $completed = $true
      break
    }

    if ($batchStatus -eq "failed" -or $output.status -eq "failed") {
      Write-Log "FAIL $shotId - batch failed"
      $results += [pscustomobject]@{ shot_id = $shotId; status = "failed"; batch_id = $batchId }
      break
    }
  }

  if (-not $completed -and ($results.Count -eq 0 -or $results[-1].status -ne "failed")) {
    Write-Log "TIMEOUT $shotId - batch $batchId"
    $results += [pscustomobject]@{ shot_id = $shotId; status = "timeout"; batch_id = $batchId }
    break
  }
}

$completedCount = @($results | Where-Object { $_.status -eq "completed" }).Count

$manifest = @{
  run_id = "RENDER_BATCH_8_" + (Get-Date -Format "yyyyMMdd-HHmmss")
  gate = "RENDER_BATCH_8_OPERATOR_GO"
  operator_phrase = "tier-2 hybrid transparent prop icons"
  completed_at = (Get-Date).ToUniversalTime().ToString("o")
  shot_count = $ShotIds.Count
  completed_count = $completedCount
  total_estimated_cost_usd = $totalEstCost
  results = $results
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Log "=== Batch complete - $completedCount/$($ShotIds.Count) - est total `$$totalEstCost - manifest $manifestPath ==="
$results | Format-Table -AutoSize
exit 0
