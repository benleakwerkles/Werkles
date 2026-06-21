param(
  [ValidateSet("Narrative", "Squibb", "Reveals")]
  [string]$Run = "Narrative",

  [string]$BaseUrl = $env:PUBLIC_BASE_URL,

  [int]$PollSeconds = 20,

  [int]$MaxWaitMinutes = 20,

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
  "corporate diversity poster, movie poster lighting, magical effects, handshake sunset cliché, fist pump, eye contact with camera",
  "presenting gesture, readable text, logos, watermark, melodrama, guru fog, lifestyle flex, cute cartoon mascot, hoodie founder laptop",
  "Monopoly game piece, Duolingo owl, Pixar character, VC pitch deck, confetti win, three people high-fiving poster"
) -join ", "

$photoPrefix = "Documentary photograph, heightened realism, believable Main Street small-business world, warm natural window light, subtle copper and warm paper tones, ordinary varied people mid-work not posed, no readable text, no logos. Global negative: $globalNegative"

$squibbPrefix = "Character illustration, Squibb the brass workshop owl, professional host-grade quality, brass-feathered owl in fitted workshop suit with brass goggles and tool belt, owl-eye-green eyes, warm foundry copper accents, wise operator scout not cute sticker, anti-guru not cartoon, museum-quality character render, no readable text, no logos. Global negative: $globalNegative"

$allShots = @{
  "arc-lost-baker-thinking" = @{
    file = "werkles-anyone-arc-lost-baker-thinking.png"
    aspect = "16:9"
    run = "Narrative"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Home baker in small home kitchen at dawn, hands on flour-dusted counter, thoughtful not sad, unnamed need visible in posture, dim close industrial-real, documentary mid-life woman scaling from home kitchen, no eye contact with camera."
  }
  "arc-searching-electrician-notice" = @{
    file = "werkles-anyone-arc-searching-electrician.png"
    aspect = "16:9"
    run = "Narrative"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Electrician in work shirt studying permit papers on truck tailgate, noticing something off the obvious path, job site edge, documentary realism, mid-life tradesman opening own shop, purposeful not performing."
  }
  "arc-discovery-credit-union" = @{
    file = "werkles-anyone-arc-discovery-credit-union.png"
    aspect = "16:9"
    run = "Narrative"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Local credit union or community bank desk, loan officer leaning forward listening to small business owner across desk, accessible finance not Wall Street, warm interior light, relief of door opening, documentary photograph, no logos readable."
  }
  "arc-discovery-used-oven" = @{
    file = "werkles-anyone-arc-discovery-used-oven.png"
    aspect = "4:3"
    run = "Narrative"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Used commercial oven in resale equipment yard or bakery supply corner, price tag area blank, good condition, closer and cheaper than assumed reveal moment, documentary object photograph, warm realistic light."
  }
  "arc-momentum-bakery-running" = @{
    file = "werkles-anyone-arc-momentum-bakery-line.png"
    aspect = "16:9"
    run = "Narrative"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Same baker energy now behind small commercial bakery counter, line moving, same person further along than they started, real business running, documentary not celebration, morning service rhythm."
  }
  "squibb-classy-bust-neutral" = @{
    file = "werkles-squibb-classy-bust-neutral-v2.png"
    aspect = "1:1"
    run = "Squibb"
    dest = "squibb-classy-v2"
    prefix = "squibb"
    prompt = "Professional bust portrait three-quarter view, brass owl Squibb, workshop suit and tool belt, goggles on forehead, calm alert expression, soft cream gradient background, host-grade illustration suitable for product UI, classy not mascot sticker."
  }
  "squibb-classy-scout-point" = @{
    file = "werkles-squibb-classy-scout-point-v2.png"
    aspect = "4:3"
    run = "Squibb"
    dest = "squibb-classy-v2"
    prefix = "squibb"
    prompt = "Squibb owl at right edge pointing with wing toward empty space on left where overlooked option would appear, scout noticing not lecturing, transparent or soft workshop background, professional illustration, dismissible guide energy."
  }
  "squibb-classy-workshop-host" = @{
    file = "werkles-squibb-classy-workshop-host-v2.png"
    aspect = "16:9"
    run = "Squibb"
    dest = "squibb-classy-v2"
    prefix = "squibb"
    prompt = "Wide professional scene Squibb seated at workshop foreman desk with clipboard and warm lamp, reviewing notes as education host, copper and cream environment, Bellows operator lessons, grounded foundry office, classy professional not fantasy treehouse."
  }
  "squibb-classy-owl-profile" = @{
    file = "werkles-squibb-classy-profile-v2.png"
    aspect = "1:1"
    run = "Squibb"
    dest = "squibb-classy-v2"
    prefix = "squibb"
    prompt = "Clean profile silhouette bust of brass owl Squibb for cutout use, even lighting, minimal background, tool belt and goggles visible, professional character design sheet quality, no text."
  }
  "reveal-people-kitchen-table" = @{
    file = "werkles-anyone-reveal-people-kitchen-table.png"
    aspect = "16:9"
    run = "Reveals"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Kitchen table scene, relative and founder reviewing simple business sketch, warm plain real co-sign moment, family member as resource not stock poster, documentary photograph, evening window light."
  }
  "reveal-space-small-bay" = @{
    file = "werkles-anyone-reveal-space-small-bay.png"
    aspect = "16:9"
    run = "Reveals"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Small commercial bay or garage workspace available for rent, clean enough to start, within reach not luxury, open roll-up door, documentary real estate without staging agent vibe."
  }
  "reveal-formation-lender-handshake" = @{
    file = "werkles-anyone-reveal-formation-lender.png"
    aspect = "16:9"
    run = "Reveals"
    dest = "anyone-narrative-v1"
    prefix = "photo"
    prompt = "Formation moment at community lender desk, folders and ID visible as objects not readable text, small business owner and lender in sober agreement posture, safe to act not alone, documentary not stock handshake sunset."
  }
}

$ShotIds = @($allShots.Keys | Where-Object { $allShots[$_].run -eq $Run })

if (-not $BaseUrl) {
  $BaseUrl = Get-GhostForgeBaseUrl
} else {
  $BaseUrl = Get-GhostForgeBaseUrl -BaseUrl $BaseUrl
}

if (-not $env:GHOST_FORGE_API_KEY) {
  Write-Error "Set GHOST_FORGE_API_KEY in ghost-forge-worker\.env."
  exit 1
}

$logPath = Join-Path $repoRoot "foreman\ghost-forge\sally-final-$Run-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\SALLY_FINAL_${Run}_RESULTS.json"

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

Write-Log "=== SALLY_FINAL $Run - SALLY_FINAL_ANYONE_OPERATOR_GO ==="
Write-Log "Shots: $($ShotIds -join ', ')"

foreach ($shotId in $ShotIds) {
  $spec = $allShots[$shotId]

  if ($shotIndex -gt 0 -and $SubmitPauseSeconds -gt 0 -and -not $DryRun) {
    Write-Log "Pause ${SubmitPauseSeconds}s (rate limit spacing)"
    Start-Sleep -Seconds $SubmitPauseSeconds
  }
  $shotIndex++

  $targetFile = $spec.file
  $destDir = Join-Path $repoRoot ("public\assets\draft\" + $spec.dest)
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  $destPath = Join-Path $destDir $targetFile

  if ($spec.prefix -eq "squibb") {
    $brief = "$squibbPrefix Sally final $Run $shotId. $($spec.prompt)"
  } else {
    $brief = "$photoPrefix Sally final anyone arc $shotId. $($spec.prompt)"
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
      source = "sally-final-anyone"
      shot_id = $shotId
      run = $Run
      target_filename = $targetFile
      aspect_ratio = $spec.aspect
      gate = "SALLY_FINAL_ANYONE_OPERATOR_GO"
    }
  } | ConvertTo-Json -Depth 6

  try {
    $createResponse = Invoke-GhostForgeApi -Method POST -Path "/batch/create" -Headers $headers -Body $body -TimeoutSec 180
  } catch {
    Write-Log "FAIL $shotId - $($_.Exception.Message)"
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
      if (-not $poll.Ok) { continue }
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
        }
      } else {
        $results += [pscustomobject]@{ shot_id = $shotId; status = "completed_no_url"; batch_id = $batchId }
      }
      $completed = $true
      break
    }

    if ($batchStatus -eq "failed" -or $output.status -eq "failed") {
      $results += [pscustomobject]@{ shot_id = $shotId; status = "failed"; batch_id = $batchId }
      break
    }
  }

  if (-not $completed -and ($results.Count -eq 0 -or $results[-1].status -notin @("failed", "create_failed"))) {
    Write-Log "TIMEOUT $shotId"
    $results += [pscustomobject]@{ shot_id = $shotId; status = "timeout"; batch_id = $batchId }
    break
  }
}

$completedCount = @($results | Where-Object { $_.status -eq "completed" }).Count
$manifest = @{
  run_id = "SALLY_FINAL_${Run}_" + (Get-Date -Format "yyyyMMdd-HHmmss")
  gate = "SALLY_FINAL_ANYONE_OPERATOR_GO"
  run = $Run
  completed_at = (Get-Date).ToUniversalTime().ToString("o")
  shot_count = $ShotIds.Count
  completed_count = $completedCount
  total_estimated_cost_usd = $totalEstCost
  results = $results
}
$manifest | ConvertTo-Json -Depth 6 | Set-Content -Path $manifestPath -Encoding UTF8
Write-Log "=== Done $completedCount/$($ShotIds.Count) est `$$totalEstCost ==="
$results | Format-Table -AutoSize
exit 0
