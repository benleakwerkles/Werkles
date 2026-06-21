param(
  [string[]]$ShotIds = @(
    "icon-lane-spark-ember",
    "icon-lane-builder-square",
    "icon-lane-worker-glove",
    "icon-lane-operator-dial",
    "icon-lane-backer-dog",
    "icon-lane-connector-bridge",
    "space-d03-tool-at-rest",
    "forge-a04-three-at-plan",
    "forge-a05-nearly-finished-pair"
  ),

  [string]$BaseUrl = $env:PUBLIC_BASE_URL,

  [int]$PollSeconds = 20,

  [int]$MaxWaitMinutes = 18,

  [switch]$DryRun,

  # After Render GHOST_FORGE_SKIP_RATE_LIMIT=1 — do not auto-sleep on 429
  [switch]$Force
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "ghost-forge-lib.ps1")

$repoRoot = Get-GhostForgeRepoRoot
Import-GhostForgeEnvFile

$globalNegative = @(
  "Fantasy crest, AI holograms, floating gears, stock-photo smiles, crypto aesthetics, glass skyscraper boardroom",
  "corporate diversity poster, movie poster lighting, magical effects, handshake, fist pump, eye contact with camera",
  "presenting gesture, readable text, logos, watermark, melodrama, guru fog, lifestyle flex, pastel SaaS mascot"
) -join ", "

$globalPrefix = "Documentary photograph, heightened realism, believable small-business space, warm natural window light, subtle copper and warm paper tones, anonymous adults, protagonist energy without performance, no text, no logos. Global negative: $globalNegative"

$iconPrefix = "Werkles lane token icon, Monopoly-style brass game piece on warm cream, workshop foundry tone, copper and brass fill, soft shadow, centered, no text, no letters, no watermark. Global negative: $globalNegative"

$shots = @{
  "icon-lane-spark-ember" = @{
    file = "werkles-icon-lane-spark-ember-v1.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v1"
    prompt = "Single solid brass ember or glowing coal game token, thick silhouette, Monopoly piece scale, warm copper highlights, cream background or transparent, app icon clarity at small size."
  }
  "icon-lane-builder-square" = @{
    file = "werkles-icon-lane-builder-framing-square-v1.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v1"
    prompt = "Single brass framing square tool as a game token, right angle silhouette, Monopoly piece weight, copper and steel, cream background, no grid blueprint lines, readable at 32px."
  }
  "icon-lane-worker-glove" = @{
    file = "werkles-icon-lane-worker-glove-v1.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v1"
    prompt = "Single brass work glove as a game token, thick filled silhouette, thumb bump visible, craft execution metaphor, copper tone, cream background, not a boxing glove."
  }
  "icon-lane-operator-dial" = @{
    file = "werkles-icon-lane-operator-dial-v1.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v1"
    prompt = "Single brass control dial or valve wheel game token, circular silhouette with one clear pointer notch, process control metaphor, copper, cream background."
  }
  "icon-lane-backer-dog" = @{
    file = "werkles-icon-lane-backer-dog-token-v1.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v1"
    prompt = "Single brass Monopoly-style dog game token, capital backing metaphor, thick silhouette, copper metal, cream background, not cartoon mascot."
  }
  "icon-lane-connector-bridge" = @{
    file = "werkles-icon-lane-connector-bridge-v1.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v1"
    prompt = "Single brass bridge arch game token, two pillars and span, introduction metaphor, thick filled silhouette, copper, cream background, not network nodes clipart."
  }
  "space-d03-tool-at-rest" = @{
    file = "werkles-homepage-narrative-space-d03-tool-at-rest.png"
    aspect = "16:9"
    act = "space"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Tight documentary photograph of a single object at rest in a working environment, with no people in frame. A wrench laid down on a workbench next to a partially completed project. A single apron folded on a prep counter beside a small notebook with handwritten marks but no readable words. Soft natural window light. Composition close-to-medium, object dominant, environment readable. Warm realism, hopeful reality - object placed by use not styling."
  }
  "forge-a04-three-at-plan" = @{
    file = "werkles-homepage-narrative-forge-a04-three-at-plan.png"
    aspect = "16:9"
    act = "forge"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph of three adults around a small table in a real small-business back room or cafe corner, reviewing a marked-up plan or notebook together. All focused on the paper, not the camera. No handshake, no presenting gesture, no eye contact with camera. Warm window light, real clothing, coffee cups at edge of frame. Medium shot - lanes meeting, competence assembling, not celebration."
  }
  "forge-a05-nearly-finished-pair" = @{
    file = "werkles-homepage-narrative-forge-a05-nearly-finished-pair.png"
    aspect = "16:9"
    act = "forge"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph of two people installing the last fixture in a nearly finished small commercial space - paint mostly done, counter in place, one light fixture or shelf still being mounted. Both focused on the task, not the camera. No handshake. Late-afternoon natural light. Real tools, real materials, medium-wide room visible. Warm realism - space almost open, shared attention on final details."
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

$logPath = Join-Path $repoRoot "foreman\ghost-forge\render-batch-2-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\RENDER_BATCH_2_RESULTS.json"

$headers = Get-GhostForgeAuthHeaders -Force:$Force

$results = @()
$totalEstCost = 0.0

function Write-Log {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

Write-Log "=== RENDER_BATCH_2 - icons + space d03 + forge a04/a05 ==="
Write-Log "Shots queued: $($ShotIds -join ', ')"

foreach ($shotId in $ShotIds) {
  if (-not $shots.ContainsKey($shotId)) {
    Write-Log "SKIP unknown shot: $shotId"
    continue
  }

  $spec = $shots[$shotId]
  $targetFile = $spec.file
  $destDir = Join-Path $repoRoot ("public\assets\draft\" + $spec.dest)
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  $destPath = Join-Path $destDir $targetFile

  if ($spec.kind -eq "icon") {
    $brief = "$iconPrefix Werkles render batch 2 $shotId. $($spec.prompt)"
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
      source = "render-batch-2"
      shot_id = $shotId
      act = $spec.act
      kind = $spec.kind
      target_filename = $targetFile
      aspect_ratio = $spec.aspect
      gate = "RENDER_BATCH_2_OPERATOR_GO"
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

$manifest = @{
  run_id = "RENDER_BATCH_2_" + (Get-Date -Format "yyyyMMdd-HHmmss")
  gate = "RENDER_BATCH_2_OPERATOR_GO"
  operator_phrase = "next Render batch - icons, Spaces, Arc 3 Werkles"
  completed_at = (Get-Date).ToUniversalTime().ToString("o")
  shot_count = $ShotIds.Count
  total_estimated_cost_usd = $totalEstCost
  results = $results
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Log "=== Batch complete - est total `$$totalEstCost - manifest $manifestPath ==="
$results | Format-Table -AutoSize
exit 0
