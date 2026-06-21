param(
  [ValidateSet("Story", "Squibb", "Hero")]
  [string]$Run = "Story",
  [string]$BaseUrl = $env:PUBLIC_BASE_URL,
  [int]$PollSeconds = 20,
  [int]$MaxWaitMinutes = 22,
  [int]$SubmitPauseSeconds = 65,
  [switch]$DryRun,
  [switch]$Force
)

$ErrorActionPreference = "Stop"
. (Join-Path $PSScriptRoot "ghost-forge-lib.ps1")

$repoRoot = Get-GhostForgeRepoRoot
Import-GhostForgeEnvFile

$mariaContinuity = "SAME PROTAGONIST EVERY SHOT: Maria, late-30s Latina home baker, dark hair in low bun, sage-green apron, flour on hands, documentary heightened realism, warm window light, copper and cream tones, no eye contact with camera, no readable text, no logos"

$globalNegative = "Fantasy, stock handshake sunset, hoodie founder laptop, VC boardroom, three people poster, movie poster, confetti, cute cartoon owl, Duolingo owl, Pixar, eye contact with camera, readable text, logos, watermark"

$photoPrefix = "Documentary photograph. $mariaContinuity. Global negative: $globalNegative"

$squibbPrefix = "Professional character illustration, Squibb brass workshop owl, museum-quality host-grade render, brass feathers workshop suit brass goggles tool belt owl-eye-green eyes, wise scout not cute sticker not cartoon, anti-guru operator foreman, no readable text. Global negative: $globalNegative"

$allShots = @{
  "story-v2-beat01-wrong-need" = @{
    file = "werkles-story-v2-beat01-wrong-need.png"; aspect = "16:9"; run = "Story"; dest = "anyone-narrative-v2"; kind = "photo"
    prompt = "Maria alone at home kitchen counter at dawn, staring at notebook with customer list crossed out, wrong problem visible, dim close framing, beat 1 wrong need."
  }
  "story-v2-beat02-squibb-moment" = @{
    file = "werkles-story-v2-beat02-squibb-moment.png"; aspect = "16:9"; run = "Story"; dest = "anyone-narrative-v2"; kind = "photo"
    prompt = "Maria same kitchen pausing mid-thought, looking at used-equipment listing printout on counter, realization moment beat 2, Squibb story beat without owl in frame."
  }
  "story-v2-beat03-money-reveal" = @{
    file = "werkles-story-v2-beat03-money-reveal.png"; aspect = "16:9"; run = "Story"; dest = "anyone-narrative-v2"; kind = "photo"
    prompt = "Maria seated at community credit union desk across from loan officer, relief not celebration, small loan conversation beat 3 money reveal, same woman same apron."
  }
  "story-v2-beat04-equipment-reveal" = @{
    file = "werkles-story-v2-beat04-equipment-reveal.png"; aspect = "4:3"; run = "Story"; dest = "anyone-narrative-v2"; kind = "photo"
    prompt = "Maria in resale equipment yard touching used commercial oven, price tag area blank, surprised relief beat 4 equipment reveal, same woman same apron."
  }
  "story-v2-beat05-shop-open" = @{
    file = "werkles-story-v2-beat05-shop-open.png"; aspect = "16:9"; run = "Story"; dest = "anyone-narrative-v2"; kind = "photo"
    prompt = "Maria behind small bakery counter serving customer, same woman now in small shop, morning service beat 5 momentum, documentary not victory poster."
  }
  "squibb-v3-bust-cutout" = @{
    file = "werkles-squibb-v3-bust-cutout.png"; aspect = "1:1"; run = "Squibb"; dest = "squibb-classy-v3"; kind = "squibb"
    prompt = "Professional cutout-ready bust three-quarter view, brass owl Squibb, workshop suit tool belt goggles on forehead, neutral cream background, classy product host grade."
  }
  "squibb-v3-scout-point" = @{
    file = "werkles-squibb-v3-scout-point.png"; aspect = "4:3"; run = "Squibb"; dest = "squibb-classy-v3"; kind = "squibb"
    prompt = "Squibb owl at right pointing wing toward empty left column where overlooked option appears, scout moment professional illustration, soft workshop background."
  }
  "squibb-v3-workshop-host" = @{
    file = "werkles-squibb-v3-workshop-host.png"; aspect = "16:9"; run = "Squibb"; dest = "squibb-classy-v3"; kind = "squibb"
    prompt = "Wide professional Squibb at foreman desk with clipboard warm lamp, host-grade Bellows education scene, copper cream foundry office."
  }
  "squibb-v3-profile-silhouette" = @{
    file = "werkles-squibb-v3-profile-silhouette.png"; aspect = "1:1"; run = "Squibb"; dest = "squibb-classy-v3"; kind = "squibb"
    prompt = "Clean profile silhouette bust Squibb for manual cutout reference, even lighting minimal background, tool belt goggles visible professional character sheet."
  }
  "story-v2-hero-wide" = @{
    file = "werkles-story-v2-hero-wide.png"; aspect = "16:9"; run = "Hero"; dest = "anyone-narrative-v2"; kind = "photo"
    prompt = "Wide cinematic establishing shot Maria same baker alone in home kitchen dawn light, visual story hero frame, documentary warmth, beat 0 establishing before wrong need."
  }
}

$ShotIds = @($allShots.Keys | Where-Object { $allShots[$_].run -eq $Run })
if (-not $BaseUrl) { $BaseUrl = Get-GhostForgeBaseUrl } else { $BaseUrl = Get-GhostForgeBaseUrl -BaseUrl $BaseUrl }
if (-not $env:GHOST_FORGE_API_KEY) { Write-Error "Set GHOST_FORGE_API_KEY"; exit 1 }

$logPath = Join-Path $repoRoot "foreman\ghost-forge\sally-final-v2-$Run-run.log"
$manifestPath = Join-Path $repoRoot "foreman\ghost-forge\SALLY_FINAL_V2_${Run}_RESULTS.json"
$headers = Get-GhostForgeAuthHeaders -Force:$Force
$results = @(); $totalEstCost = 0.0; $shotIndex = 0

function Write-Log { param([string]$Message)
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Message
  Add-Content -Path $logPath -Value $line; Write-Host $line
}

Write-Log "=== SALLY_FINAL_V2 $Run - SALLY_FINAL_V2_OPERATOR_GO ==="

foreach ($shotId in $ShotIds) {
  $spec = $allShots[$shotId]
  if ($shotIndex -gt 0 -and $SubmitPauseSeconds -gt 0 -and -not $DryRun) { Start-Sleep -Seconds $SubmitPauseSeconds }
  $shotIndex++
  $destDir = Join-Path $repoRoot ("public\assets\draft\" + $spec.dest)
  New-Item -ItemType Directory -Force -Path $destDir | Out-Null
  $destPath = Join-Path $destDir $spec.file
  $brief = if ($spec.kind -eq "squibb") { "$squibbPrefix $shotId. $($spec.prompt)" } else { "$photoPrefix $shotId. $($spec.prompt)" }
  Write-Log "Submitting $shotId"
  if ($DryRun) { $results += [pscustomobject]@{ shot_id = $shotId; status = "dry_run" }; continue }
  $body = @{ brief = $brief; count = 1; model = "ideogram-ai/ideogram-v3-quality"; metadata = @{ project = "werkles"; source = "sally-final-v2"; shot_id = $shotId; run = $Run; gate = "SALLY_FINAL_V2_OPERATOR_GO" } } | ConvertTo-Json -Depth 6
  try { $createResponse = Invoke-GhostForgeApi -Method POST -Path "/batch/create" -Headers $headers -Body $body -TimeoutSec 180 }
  catch { Write-Log "FAIL $shotId"; $results += [pscustomobject]@{ shot_id = $shotId; status = "create_failed" }; break }
  $gate = Test-GhostForgeCreateResponse -CreateResponse $createResponse -ShotId $shotId -Force:$Force -OnLog { param($m) Write-Log $m }
  if ($gate.stop) { $results += $gate.result; break }
  $create = $gate.create; $batchId = $create.batch_id; $est = [decimal]$create.estimated_cost_usd; $totalEstCost += $est
  $deadline = (Get-Date).AddMinutes($MaxWaitMinutes); $completed = $false
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds $PollSeconds
    try { $poll = Invoke-GhostForgeApi -Method GET -Path "/batches/$batchId" -Headers @{ Authorization = "Bearer $env:GHOST_FORGE_API_KEY" } -TimeoutSec 90; if (-not $poll.Ok) { continue }; $status = $poll.Json }
    catch { continue }
    $output = $status.outputs | Select-Object -First 1
    if ($status.batch.status -eq "completed" -and $output.status -eq "completed") {
      if ($output.source_url) { Save-GhostForgeDownload -Uri $output.source_url -OutFile $destPath -TimeoutSec 180; Write-Log "DONE $shotId" }
      $results += [pscustomobject]@{ shot_id = $shotId; status = "completed"; batch_id = $batchId; path = "public/assets/draft/$($spec.dest)/$($spec.file)" }
      $completed = $true; break
    }
    if ($status.batch.status -eq "failed" -or $output.status -eq "failed") { $results += [pscustomobject]@{ shot_id = $shotId; status = "failed" }; break }
  }
  if (-not $completed -and ($results[-1].status -notin @("failed","create_failed"))) { $results += [pscustomobject]@{ shot_id = $shotId; status = "timeout" }; break }
}

@{ run = $Run; gate = "SALLY_FINAL_V2_OPERATOR_GO"; completed_count = @($results | Where-Object status -eq "completed").Count; shot_count = $ShotIds.Count; total_estimated_cost_usd = $totalEstCost; results = $results } | ConvertTo-Json -Depth 6 | Set-Content $manifestPath -Encoding UTF8
Write-Log "=== V2 $Run complete ==="
exit 0
