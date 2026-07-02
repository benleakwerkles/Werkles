param(
  [string[]]$ShotIds = @(
    "icon-v2b-spark-matchbook",
    "icon-v2b-builder-chalkline",
    "icon-v2b-worker-glove",
    "icon-v2b-operator-clipboard",
    "icon-v2b-backer-envelopes",
    "icon-v2b-connector-cards"
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
  "Monopoly game piece, brass token clipart, 3D render icon, glossy app icon, cartoon mascot"
) -join ", "

$iconPrefix = "Documentary square photograph of a single real workshop object at rest on a worn wooden workbench or desk, warm natural window light, heightened realism, shallow depth of field, copper and warm paper tones in environment, object centered and placed by use not styling, no people, no hands, no text, no logos. Lane prop icon for Werkles. Global negative: $globalNegative"

$shots = @{
  "icon-v2b-spark-matchbook" = @{
    file = "werkles-icon-v2b-lane-spark-matchbook.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2-b"
    prompt = "Small paper matchbook half-open beside an unlit short candle stub on a worn workbench, opportunity barely lit metaphor, craft workshop not fantasy forge, warm dawn-side light, slight wood grain and bench wear visible."
  }
  "icon-v2b-builder-chalkline" = @{
    file = "werkles-icon-v2b-lane-builder-chalkline.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2-b"
    prompt = "Metal speed square resting on a chalk line reel with a faint blue chalk dust trail on plywood, builder layout metaphor, real tool patina, warm window light, square crop centered on the tools."
  }
  "icon-v2b-worker-glove" = @{
    file = "werkles-icon-v2b-lane-worker-glove.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2-b"
    prompt = "Single worn leather work glove folded flat on a workbench beside a small wrench, skilled hands metaphor without showing hands, foundry-adjacent workshop not fantasy, warm copper highlights, placed by recent use."
  }
  "icon-v2b-operator-clipboard" = @{
    file = "werkles-icon-v2b-lane-operator-clipboard.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2-b"
    prompt = "Aluminum clipboard with blank metal clip on a small office desk next to a closed folder, process control and checklist metaphor, calm back-office realism, soft window light, no readable paper."
  }
  "icon-v2b-backer-envelopes" = @{
    file = "werkles-icon-v2b-lane-backer-envelopes.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2-b"
    prompt = "Small stack of plain manila cash envelopes banded with a rubber band beside a sober metal petty-cash box with blank label area, capital backing metaphor without wolf-of-wall energy, warm realistic paper and metal, documentary still life, no readable text."
  }
  "icon-v2b-connector-cards" = @{
    file = "werkles-icon-v2b-lane-connector-cards.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2-b"
    prompt = "Two blank-backed business cards overlapping edge-over-edge on a cafe table surface beside a face-down phone, introduction and connection metaphor, real card stock wear, warm natural light, not network nodes clipart."
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

$logPath = Join-Path $repoRoot "foreman\ghost-forge\render-batch-5-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\RENDER_BATCH_5_RESULTS.json"

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

Write-Log "=== RENDER_BATCH_5 - documentary icon alternates v2-b (6 shots) ==="
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

  $brief = "$iconPrefix Werkles render batch 5 $shotId. $($spec.prompt)"

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
      source = "render-batch-5"
      shot_id = $shotId
      act = $spec.act
      kind = $spec.kind
      target_filename = $targetFile
      aspect_ratio = $spec.aspect
      gate = "RENDER_BATCH_5_OPERATOR_GO"
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
  run_id = "RENDER_BATCH_5_" + (Get-Date -Format "yyyyMMdd-HHmmss")
  gate = "RENDER_BATCH_5_OPERATOR_GO"
  operator_phrase = "documentary icon alternates v2-b — six new lane props"
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
