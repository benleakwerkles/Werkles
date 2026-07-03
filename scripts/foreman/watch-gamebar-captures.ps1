# Watches Xbox Game Bar Captures and copies new clips into the repo.
$src = Join-Path $env:USERPROFILE "Videos\Captures"
$dest = Join-Path $PSScriptRoot "..\..\foreman\receipts\browser-capture\gamebar-import"
New-Item -ItemType Directory -Force -Path $dest | Out-Null
$seen = @{}
Get-ChildItem $dest -Filter *.mp4 -ErrorAction SilentlyContinue | ForEach-Object { $seen[$_.Name] = $true }
Write-Output "WATCHING $src -> $dest"
while ($true) {
  Get-ChildItem $src -Filter *.mp4 -ErrorAction SilentlyContinue | ForEach-Object {
    if (-not $seen.ContainsKey($_.Name)) {
      $target = Join-Path $dest $_.Name
      Copy-Item -LiteralPath $_.FullName -Destination $target -Force
      $seen[$_.Name] = $true
      Write-Output "IMPORTED $($_.Name)"
    }
  }
  Start-Sleep -Seconds 3
}
