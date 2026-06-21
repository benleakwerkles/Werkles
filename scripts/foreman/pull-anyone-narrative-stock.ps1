# Sally final — three free-image batches (Unsplash/Pexels style, like stock-preview)
$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dest = Join-Path $repoRoot "public\assets\draft\anyone-narrative-stock"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$pulls = @(
  @{ name = "stock-people-kitchen-table.jpg"; url = "https://images.pexels.com/photos/4260125/pexels-photo-4260125.jpeg?auto=compress&cs=tinysrgb&w=1600" }
  @{ name = "stock-money-credit-desk.jpg"; url = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80" }
  @{ name = "stock-space-small-bay.jpg"; url = "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=1600&q=80" }
  @{ name = "stock-equipment-commercial-oven.jpg"; url = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80" }
  @{ name = "stock-momentum-baker.jpg"; url = "https://images.pexels.com/photos/2132665/pexels-photo-2132665.jpeg?auto=compress&cs=tinysrgb&w=1600" }
  @{ name = "stock-hero-electrician.jpg"; url = "https://images.pexels.com/photos/4480505/pexels-photo-4480505.jpeg?auto=compress&cs=tinysrgb&w=1600" }
  @{ name = "stock-hero-workshop.jpg"; url = "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1600&q=80" }
)

foreach ($item in $pulls) {
  $out = Join-Path $dest $item.name
  Write-Host "Pulling $($item.name)..."
  Invoke-WebRequest -Uri $item.url -OutFile $out -UseBasicParsing
}

$attrib = @"
# Anyone narrative stock — Sally final free batches (2026-06-10)

Batch A (People + Money): stock-people-kitchen-table.jpg (Pexels), stock-money-credit-desk.jpg (Unsplash)
Batch B (Space + Equipment): stock-space-small-bay.jpg (Unsplash), stock-equipment-commercial-oven.jpg (Unsplash)
Batch C (Momentum + Hero): stock-momentum-baker.jpg (Pexels), stock-hero-electrician.jpg (Pexels), stock-hero-workshop.jpg (Unsplash)

Preview placeholders until Ghost Forge anyone-narrative-v1 lands. Replace with renders when complete.
"@

Set-Content -Path (Join-Path $dest "ATTRIBUTION.md") -Value $attrib -Encoding UTF8
Write-Host "Done - $($pulls.Count) images in $dest"
