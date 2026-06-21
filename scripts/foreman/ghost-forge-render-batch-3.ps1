param(
  [string[]]$ShotIds = @(
    "icon-v2-spark-flint",
    "icon-v2-builder-tsquare",
    "icon-v2-worker-tongs",
    "icon-v2-operator-keyring",
    "icon-v2-backer-ingot",
    "icon-v2-connector-rings",
    "space-d04-reception-quiet",
    "space-d05-van-dawn",
    "space-d02-materials-staged",
    "forge-a06-builder-operator-plan",
    "forge-a07-connector-intro-table"
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

$globalPrefix = "Documentary photograph, heightened realism, believable small-business space, warm natural window light, subtle copper and warm paper tones, anonymous adults, protagonist energy without performance, no text, no logos. Global negative: $globalNegative"

$iconPrefix = "Documentary square photograph of a single real workshop object at rest on a worn wooden workbench or desk, warm natural window light, heightened realism, shallow depth of field, copper and warm paper tones in environment, object centered and placed by use not styling, no people, no hands, no text, no logos. Lane prop icon for Werkles. Global negative: $globalNegative"

$shots = @{
  "icon-v2-spark-flint" = @{
    file = "werkles-icon-v2-lane-spark-flint-strike.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2"
    prompt = "Flint striker and steel on a worn workbench with a few tiny real sparks catching, opportunity ignition metaphor, craft workshop not fantasy forge, warm dawn-side light, slight wood grain and bench wear visible."
  }
  "icon-v2-builder-tsquare" = @{
    file = "werkles-icon-v2-lane-builder-tsquare.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2"
    prompt = "Metal T-square resting on the edge of marked paper with pencil lines but no readable words, builder system metaphor, real tool patina, warm window light, square crop centered on the tool."
  }
  "icon-v2-worker-tongs" = @{
    file = "werkles-icon-v2-lane-worker-tongs.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2"
    prompt = "Crucible tongs resting open on a workbench beside a small metal ingot, skilled execution metaphor, foundry-adjacent workshop not fantasy, warm copper highlights on steel, placed by recent use."
  }
  "icon-v2-operator-keyring" = @{
    file = "werkles-icon-v2-lane-operator-keyring.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2"
    prompt = "Brass keyring with two or three worn keys on a small office desk next to a closed folder, process control and access metaphor, calm back-office realism, soft window light."
  }
  "icon-v2-backer-ingot" = @{
    file = "werkles-icon-v2-lane-backer-ingot-stack.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2"
    prompt = "Small stack of three metal ingots on a desk beside a sober manila folder edge, capital backing metaphor without wolf-of-wall energy, warm realistic metal, documentary still life."
  }
  "icon-v2-connector-rings" = @{
    file = "werkles-icon-v2-lane-connector-rings.png"
    aspect = "1:1"
    act = "icon"
    kind = "icon"
    dest = "icons-v2"
    prompt = "Two interlocking brass rings or linked carabiners on a cafe table surface beside a face-down phone, introduction and connection metaphor, real metal wear, warm natural light, not network nodes clipart."
  }
  "space-d04-reception-quiet" = @{
    file = "werkles-homepage-narrative-space-d04-reception-quiet.png"
    aspect = "16:9"
    act = "space"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph of a small business reception desk with no people in frame. Open appointment book with a pen resting in the gutter, half-empty coffee cup, a coat on the back of the chair, single desk lamp on. Soft morning window light. Sign of recent or imminent inhabitation - not abandonment, not real-estate staging. Medium shot, warm realism."
  }
  "space-d05-van-dawn" = @{
    file = "werkles-homepage-narrative-space-d05-van-dawn.png"
    aspect = "16:9"
    act = "space"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph of the back of a work van at dawn in a quiet alley or driveway, rear doors open, tools racked inside, one tool slightly out of its slot as if just used. No people. Cool dawn light warming on one side, real van wear, working life not brand wrap advertising. Wide-to-medium composition."
  }
  "space-d02-materials-staged" = @{
    file = "werkles-homepage-narrative-space-d02-materials-staged.png"
    aspect = "16:9"
    act = "space"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph of a small commercial space mid-construction from a different angle than a standard wide room shot - emphasis on staged materials: pallet of tile, lumber stack, coil of conduit, ladder, sawhorse with tape measure. Drywall up unpainted, no people, dust on floor, power tool resting. Late-afternoon light through open doorway. Space becoming itself, hopeful reality."
  }
  "forge-a06-builder-operator-plan" = @{
    file = "werkles-homepage-narrative-forge-a06-builder-operator-plan.png"
    aspect = "16:9"
    act = "forge"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph of two adults on a job site edge or small back room - one in work clothes holding a sample part or tool, one with a folder or checklist, both studying a marked-up plan on a table. Focused on the paper, not the camera. No handshake, no presenting gesture, no eye contact with camera. Builder and operator lanes meeting, warm window light, real materials."
  }
  "forge-a07-connector-intro-table" = @{
    file = "werkles-homepage-narrative-forge-a07-connector-intro-table.png"
    aspect = "16:9"
    act = "forge"
    kind = "narrative"
    dest = "homepage-narrative-v2"
    prompt = "Documentary photograph of three adults at a small cafe table - one person angled between two others as if making an introduction, handwritten note card or napkin sketch between them but no readable text. All attention on each other and the table, not the camera. No handshake, no networking-event grin, no eye contact with camera. Connector lane energy, warm natural light, coffee cups at frame edge."
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

$logPath = Join-Path $repoRoot "foreman\ghost-forge\render-batch-3-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\RENDER_BATCH_3_RESULTS.json"

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

Write-Log "=== RENDER_BATCH_3 - narrative icons v2 + space d04/d05 + forge a06/a07 ==="
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
    $brief = "$iconPrefix Werkles render batch 3 $shotId. $($spec.prompt)"
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
      source = "render-batch-3"
      shot_id = $shotId
      act = $spec.act
      kind = $spec.kind
      target_filename = $targetFile
      aspect_ratio = $spec.aspect
      gate = "RENDER_BATCH_3_OPERATOR_GO"
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
  run_id = "RENDER_BATCH_3_" + (Get-Date -Format "yyyyMMdd-HHmmss")
  gate = "RENDER_BATCH_3_OPERATOR_GO"
  operator_phrase = "restart Ghost Forge icons narrative human direction + more Spaces + Act Three"
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
