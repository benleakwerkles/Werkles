param(
  [string[]]$ShotIds = @(
    "icon-v3-mark-w-duochrome",
    "icon-v3-lane-spark-candle",
    "icon-v3-lane-builder-blocks",
    "icon-v3-lane-worker-crucible",
    "icon-v3-lane-operator-hub",
    "icon-v3-lane-connector-arch",
    "icon-v3-lane-backer-foundation",
    "squibb-bellows-bust-host",
    "squibb-bellows-lesson-card",
    "squibb-bellows-workshop-desk",
    "space-d06-bakery-prep-quiet",
    "space-d07-workshop-pegboard"
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
  "corporate diversity poster, movie poster lighting, magical effects, handshake, fist pump, eye contact with camera",
  "presenting gesture, readable text, logos, watermark, melodrama, guru fog, lifestyle flex, cute cartoon mascot",
  "Monopoly game piece, photo realistic object, 3D glossy render, generic clipart, Duolingo owl, Pixar character"
) -join ", "

$globalPrefix = "Documentary photograph, heightened realism, believable small-business space, warm natural window light, subtle copper and warm paper tones, no people unless specified, no text, no logos. Global negative: $globalNegative"

$iconPrefix = "Flat vector app icon, Werkles Operator Marks design system, warm cream background #f6efe5, clean 1.9px stroke weight, round joins, optical padding, readable at 32px, no text, no letters, no watermark. Brand violet #3D16CA and brand teal #02917E duochrome where specified, workshop copper #9F6633 for lane strokes. Global negative: $globalNegative"

$squibbPrefix = "Character illustration, Squibb the workshop owl helper for Bellows education, brass-feathered owl in workshop suit with brass goggles and tool belt, owl-eye-green #5FD178 eyes, warm foundry copper accents, guide-scale host not protagonist, helpful reality-checking foreman energy, anti-guru not cute cartoon, no readable text, no logos. Global negative: $globalNegative"

$shots = @{
  "icon-v3-mark-w-duochrome" = @{
    file = "werkles-icon-v3-mark-w-duochrome.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v3"
    prompt = "Interlocking W lettermark icon, left ribbon brand violet, right ribbon brand teal, flat vector, centered on warm cream square, matches Werkles wordmark duochrome, thick clean shapes, app icon clarity."
  }
  "icon-v3-lane-spark-candle" = @{
    file = "werkles-icon-v3-lane-spark-candle.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v3"
    prompt = "Lane icon Spark - simple candle or ember with base, single copper stroke on cream, flat vector line icon, opportunity metaphor, matches Operator Marks stroke grammar."
  }
  "icon-v3-lane-builder-blocks" = @{
    file = "werkles-icon-v3-lane-builder-blocks.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v3"
    prompt = "Lane icon Builder - three stacked blocks or blueprint cube, copper stroke flat vector on cream, system-building metaphor, clear silhouette at small size."
  }
  "icon-v3-lane-worker-crucible" = @{
    file = "werkles-icon-v3-lane-worker-crucible.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v3"
    prompt = "Lane icon Worker - crucible with tongs or pour spout, copper stroke flat vector on cream, skilled execution metaphor, foundry credible not fantasy."
  }
  "icon-v3-lane-operator-hub" = @{
    file = "werkles-icon-v3-lane-operator-hub.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v3"
    prompt = "Lane icon Operator - control hub with dial and pointer notch, copper stroke flat vector on cream, process control metaphor, circular readable silhouette."
  }
  "icon-v3-lane-connector-arch" = @{
    file = "werkles-icon-v3-lane-connector-arch.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v3"
    prompt = "Lane icon Connector - bridge arch with two pillars, copper stroke flat vector on cream, introduction metaphor, not network nodes clipart."
  }
  "icon-v3-lane-backer-foundation" = @{
    file = "werkles-icon-v3-lane-backer-foundation.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v3"
    prompt = "Lane icon Backer - foundation block or stacked ingot silhouette, copper stroke flat vector on cream, capital backing metaphor without wolf-of-wall energy."
  }
  "squibb-bellows-bust-host" = @{
    file = "werkles-squibb-bellows-bust-host-v1.png"
    aspect = "1:1"
    act = "squibb"
    kind = "squibb"
    dest = "squibb-bellows-v1"
    prompt = "Bust portrait of brass workshop owl Squibb, head shoulders and tool belt, brass goggles pushed up, one wing gesturing welcome, transparent or soft cream background, host scale for Bellows learning page, wise operator foreman not mascot sticker."
  }
  "squibb-bellows-lesson-card" = @{
    file = "werkles-squibb-bellows-lesson-card-v1.png"
    aspect = "4:3"
    act = "squibb"
    kind = "squibb"
    dest = "squibb-bellows-v1"
    prompt = "Squibb owl at left beside a blank lesson card or clipboard on workshop desk, owl pointing with wing toward card, no readable text on card, warm window light, Bellows anti-guru education host scene, documentary illustration style."
  }
  "squibb-bellows-workshop-desk" = @{
    file = "werkles-squibb-bellows-workshop-desk-v1.png"
    aspect = "16:9"
    act = "squibb"
    kind = "squibb"
    dest = "squibb-bellows-v1"
    prompt = "Wide scene of Squibb brass owl seated at workshop desk with papers and coffee mug, reviewing notes, owl-eye-green eyes attentive, copper and warm paper environment, hosts Bellows operator lessons, grounded foundry office not fantasy treehouse."
  }
  "space-d06-bakery-prep-quiet" = @{
    file = "werkles-homepage-narrative-space-d06-bakery-prep-quiet.png"
    aspect = "16:9"
    act = "space"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph small bakery prep area at quietest hour before staff arrive, no people, trays stacked, flour dust, apron on hook, single light on, door slightly open, warm dawn window light, inhabited not abandoned not real-estate staging."
  }
  "space-d07-workshop-pegboard" = @{
    file = "werkles-homepage-narrative-space-d07-workshop-pegboard.png"
    aspect = "16:9"
    act = "space"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph small workshop with tools on pegboard, half-completed project on bench, no people, coffee cup and pencil on bench, natural window light, sign of recent use, warm realism hopeful reality, medium-wide composition."
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

$logPath = Join-Path $repoRoot "foreman\ghost-forge\render-batch-4-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\RENDER_BATCH_4_RESULTS.json"

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

Write-Log "=== RENDER_BATCH_4 - operator marks icons + squibb bellows + space d06/d07 ==="
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

  if ($spec.kind -eq "icon") {
    $brief = "$iconPrefix Werkles render batch 4 $shotId. $($spec.prompt)"
  } elseif ($spec.kind -eq "squibb") {
    $brief = "$squibbPrefix Werkles render batch 4 $shotId. $($spec.prompt)"
  } else {
    $brief = "$globalPrefix Werkles homepage narrative $shotId ($($spec.act)). $($spec.prompt)"
  }

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
      source = "render-batch-4"
      shot_id = $shotId
      act = $spec.act
      kind = $spec.kind
      target_filename = $targetFile
      aspect_ratio = $spec.aspect
      gate = "RENDER_BATCH_4_OPERATOR_GO"
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
  run_id = "RENDER_BATCH_4_" + (Get-Date -Format "yyyyMMdd-HHmmss")
  gate = "RENDER_BATCH_4_OPERATOR_GO"
  operator_phrase = "matching icons + Squibb Bellows + more Space"
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
