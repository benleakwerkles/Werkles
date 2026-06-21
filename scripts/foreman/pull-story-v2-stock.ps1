$ErrorActionPreference = "Stop"
$repoRoot = Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$dest = Join-Path $repoRoot "public\assets\draft\anyone-narrative-v2-stock"
New-Item -ItemType Directory -Force -Path $dest | Out-Null

$pulls = @(
  @{ name = "fallback-beat01-home-kitchen.jpg"; url = "https://images.pexels.com/photos/2132665/pexels-photo-2132665.jpeg?auto=compress&cs=tinysrgb&w=1600" }
  @{ name = "fallback-beat03-lender-desk.jpg"; url = "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80" }
  @{ name = "fallback-beat04-commercial-oven.jpg"; url = "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1600&q=80" }
)

foreach ($item in $pulls) {
  Write-Host "Pulling $($item.name)..."
  Invoke-WebRequest -Uri $item.url -OutFile (Join-Path $dest $item.name) -UseBasicParsing
}

Write-Host "Done - 3 narrative fallbacks"
