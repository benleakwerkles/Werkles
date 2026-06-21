param(
  [string[]]$ShotIds = @(
    "spark-c01-kitchen-table",
    "space-d01-before-opening",
    "spark-c02-before-the-day",
    "space-d02-half-built",
    "forge-a03-half-built-pair",
    "foundry-b01-shop-floor",
    "foundry-b02-finished-product"
  ),

  [string]$BaseUrl = $env:PUBLIC_BASE_URL,

  [int]$PollSeconds = 20,

  [int]$MaxWaitMinutes = 18,

  [switch]$DryRun,

  [switch]$Force
)

$ErrorActionPreference = "Stop"

. (Join-Path $PSScriptRoot "ghost-forge-lib.ps1")

$repoRoot = Get-GhostForgeRepoRoot
Import-GhostForgeEnvFile

$globalNegative = @(
  "Fantasy, AI holograms, floating gears, stock-photo smiles, crypto aesthetics, glass skyscraper boardroom",
  "corporate diversity poster, movie poster lighting, magical effects, handshake, fist pump, eye contact with camera",
  "presenting gesture, readable text, logos, watermark, melodrama, guru fog, lifestyle flex"
) -join ", "

$globalPrefix = "Documentary photograph, heightened realism, believable small-business space, warm natural window light, subtle copper and warm paper tones, anonymous adults, protagonist energy without performance, no text, no logos. Global negative: $globalNegative"

$shots = @{
  "spark-c01-kitchen-table" = @{
    file = "werkles-homepage-narrative-spark-c01-kitchen-table.png"
    aspect = "16:9"
    act = "spark"
    prompt = "Documentary photograph of a person alone at a small kitchen or dining table in early morning or late evening light, working on something specific. A notebook is open with visible handwritten marks and crossed-out lines, or a laptop is open to a single spreadsheet or document. The subject is mid-thought -  pen mid-mark, finger pausing on a screen, eyes on the work. The household is visible at the edges of the frame: a coffee mug, a child's drawing on the fridge in the background, a chair pushed back, a bowl in the sink. The subject is not looking at the camera. Single source of natural light -  window light at dawn, or a single lamp at night. Real clothing, real room, no styling. Composition from a three-quarter angle, slightly distant -  the subject is small enough in the frame that the household around them reads. Warm realism, hopeful reality -  quiet, focused, not melancholy."
  }
  "space-d01-before-opening" = @{
    file = "werkles-homepage-narrative-space-d01-before-opening.png"
    aspect = "16:9"
    act = "space"
    prompt = "Documentary photograph of a small working commercial space at the quietest hour -  early morning before staff arrive, or last light after closing. No people in frame. The space is clean and ordered, but clearly in active use: a bakery prep counter with trays stacked, a small clinic treatment room with the chair angled toward the door, a workshop with tools hanging on pegs and a half-completed project on the bench. At least one specific sign of recent or imminent inhabitation is visible: an apron on a hook, a coffee cup on the counter, a single light left on, a door slightly open, a clipboard with a pen resting on it. The space has the texture of real use -  slight wear, real materials, no styling. Natural light: window light, single overhead lamp in otherwise dim space, dawn through a doorway. Composition: medium-wide, the room as much as any single object, with a strong vanishing point or strong directional light. Warm realism, hopeful reality -  a room waiting to be filled."
  }
  "spark-c02-before-the-day" = @{
    file = "werkles-homepage-narrative-spark-c02-before-the-day.png"
    aspect = "16:9"
    act = "spark"
    prompt = "Documentary photograph of a working professional alone in their workplace before the day begins. A nurse practitioner in a treatment room with the overhead light just turned on, looking at a clipboard or scheduling screen. A baker in a small kitchen with ovens cold, looking at a notebook or a tray that hasn't been used yet. An electrician at the open back of a work van in early morning light, going through tools or consulting a list. The subject is alone, focused on something specific. They are not looking at the camera. The space is clearly working -  real equipment, signs of recent and upcoming use, no styling -  but it is quiet, not yet in operation. Natural light: window light, the first overhead lamp, dawn through an open door. Real clothing for the work. Composition: medium shot, the subject in the foreground, the space they work in clearly visible behind. Warm realism, hopeful reality -  the quiet of a room with potential still in it."
  }
  "space-d02-half-built" = @{
    file = "werkles-homepage-narrative-space-d02-half-built.png"
    aspect = "16:9"
    act = "space"
    prompt = "Documentary photograph of a small commercial space mid-construction. Drywall up but unpainted, fixtures not yet installed, the bones of the future business visible: where the counter will go, where the lighting will hang, where the front door will be. Construction materials are staged in the space -  a pallet of tile, a stack of lumber, a coil of electrical conduit, a sawhorse with a tape measure on it. No people in frame, but the work-in-progress is clearly active: a ladder, a partially completed section of wall, dust on the floor, a power tool resting on a sawhorse. Late-afternoon natural light coming through unfinished windows or open doorways, slightly warm. The composition reads the room as a whole -  a wide-to-medium shot with strong architectural lines pulling the eye toward what the space is becoming. Warm realism, hopeful reality -  a space in the act of becoming itself."
  }
  "forge-a03-half-built-pair" = @{
    file = "werkles-homepage-narrative-forge-a03-half-built-pair.png"
    aspect = "16:9"
    act = "forge"
    prompt = "Documentary photograph of two people in a small commercial space mid-construction -  drywall up, fixtures not installed, construction materials visible. One person holds or points to a marked-up plan or notebook; the other examines the space or a tool. Both are focused on the work, not the camera. No handshake, no presenting gesture, no eye contact with camera. Late-afternoon natural light through unfinished windows. Real clothing, real materials, dust and work-in-progress visible. Medium-wide composition -  the room and the shared attention on what it is becoming. Warm realism, hopeful reality -  competence assembling, not celebration."
  }
  "foundry-b01-shop-floor" = @{
    file = "werkles-homepage-narrative-foundry-b01-shop-floor.png"
    aspect = "16:9"
    act = "foundry"
    prompt = "Documentary photograph of a working shop floor -  trades in motion or paused mid-task, real tools, real materials, slight wear. Wide environmental shot. People if present are working, not posing -  no eye contact with camera, attention on task. Natural workshop light, warm realism. No celebration, no handshake. Beachhead: light commercial trades or small manufacturing -  credible, not corporate."
  }
  "foundry-b02-finished-product" = @{
    file = "werkles-homepage-narrative-foundry-b02-finished-product.png"
    aspect = "16:9"
    act = "foundry"
    prompt = "Documentary close-out photograph -  finished product on bench or table, hands optionally at edge of frame adjusting or inspecting, not presenting to camera. Proof artifact energy: now it ships. Warm natural light, real workshop texture. No stock victory, no lifestyle flex. Work remains focal; maker may be at edge of frame, not posed."
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

$destDir = Join-Path $repoRoot "public\assets\draft\homepage-narrative-v1"
$logPath = Join-Path $repoRoot "foreman\ghost-forge\homepage-narrative-v1-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\HOMEPAGE_NARRATIVE_V1_RESULTS.json"

New-Item -ItemType Directory -Force -Path $destDir | Out-Null

$headers = Get-GhostForgeAuthHeaders -Force:$Force

$results = @()
$totalEstCost = 0.0

function Write-Log {
  param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logPath -Value $line
  Write-Host $line
}

Write-Log "=== RESUME_GATE_05_LIMITED_RENDER -  homepage narrative batch ==="
Write-Log "Shots queued: $($ShotIds -join ', ')"

foreach ($shotId in $ShotIds) {
  if (-not $shots.ContainsKey($shotId)) {
    Write-Log "SKIP unknown shot: $shotId"
    continue
  }

  $spec = $shots[$shotId]
  $targetFile = $spec.file
  $destPath = Join-Path $destDir $targetFile
  $brief = "$globalPrefix Werkles homepage narrative $shotId ($($spec.act)). $($spec.prompt)"

  Write-Log "Submitting $shotId -> $targetFile"

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
      source = "homepage-narrative-v1"
      shot_id = $shotId
      act = $spec.act
      target_filename = $targetFile
      aspect_ratio = $spec.aspect
      gate = "RESUME_GATE_05_LIMITED_RENDER"
    }
  } | ConvertTo-Json -Depth 6

  try {
    $createResponse = Invoke-GhostForgeApi -Method POST -Path "/batch/create" -Headers $headers -Body $body -TimeoutSec 180
  } catch {
    Write-Log "FAIL $shotId -  batch/create exception: $($_.Exception.Message)"
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
        Write-Log "Poll $batchId -  HTTP $($poll.StatusCode)"
        continue
      }
      $status = $poll.Json
    } catch {
      Write-Log "Poll $batchId -  $($_.Exception.Message)"
      continue
    }

    $batchStatus = $status.batch.status
    $output = $status.outputs | Select-Object -First 1
    Write-Log "Poll $shotId -  batch=$batchStatus output=$($output.status)"

    if ($batchStatus -eq "completed" -and $output.status -eq "completed") {
      if ($output.source_url) {
        Save-GhostForgeDownload -Uri $output.source_url -OutFile $destPath -TimeoutSec 180
        Write-Log "DONE $shotId -> $destPath"
        $results += [pscustomobject]@{
          shot_id = $shotId
          status = "completed"
          batch_id = $batchId
          path = "public/assets/draft/homepage-narrative-v1/$targetFile"
          estimated_cost_usd = $est
          storage_path = $output.storage_path
        }
      } else {
        Write-Log "DONE $shotId -  no source_url; storage $($output.storage_path)"
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
      Write-Log "FAIL $shotId -  batch failed"
      $results += [pscustomobject]@{ shot_id = $shotId; status = "failed"; batch_id = $batchId }
      break
    }
  }

  if (-not $completed -and ($results[-1].status -ne "failed")) {
    Write-Log "TIMEOUT $shotId -  batch $batchId"
    $results += [pscustomobject]@{ shot_id = $shotId; status = "timeout"; batch_id = $batchId }
    break
  }
}

$manifest = @{
  run_id = "HOMEPAGE_NARRATIVE_V1_" + (Get-Date -Format "yyyyMMdd-HHmmss")
  gate = "RESUME_GATE_05_LIMITED_RENDER"
  completed_at = (Get-Date).ToUniversalTime().ToString("o")
  total_estimated_cost_usd = $totalEstCost
  results = $results
}

$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8

Write-Log "=== Batch complete -  est total `$$totalEstCost -  manifest $manifestPath ==="
$results | Format-Table -AutoSize
exit 0
