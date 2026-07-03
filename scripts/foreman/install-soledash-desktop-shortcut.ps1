#Requires -Version 5.1
<#
.SYNOPSIS
  Install SoleDash desktop shortcut with AEYE icon (Logo B).
#>
param(
  [string]$RepoRoot = "",
  [string]$Url = "http://localhost:3000/soledash"
)

function Resolve-RepoRoot {
  param([string]$Start)
  if ($Start -and (Test-Path (Join-Path $Start "soledash.cmd"))) {
    return (Resolve-Path $Start).Path
  }
  $dir = $PSScriptRoot
  while ($dir) {
    if (Test-Path (Join-Path $dir "soledash.cmd")) {
      return $dir
    }
    $parent = Split-Path $dir -Parent
    if ($parent -eq $dir) { break }
    $dir = $parent
  }
  throw "Could not find Werkles repo root (soledash.cmd)"
}

function Convert-PngToIco {
  param(
    [string]$PngPath,
    [string]$IcoPath
  )
  Add-Type -AssemblyName System.Drawing
  $bitmap = [System.Drawing.Bitmap]::FromFile($PngPath)
  try {
    $handle = $bitmap.GetHicon()
    $icon = [System.Drawing.Icon]::FromHandle($handle)
    $fileStream = [System.IO.File]::Open($IcoPath, [System.IO.FileMode]::Create)
    try {
      $icon.Save($fileStream)
    } finally {
      $fileStream.Close()
    }
  } finally {
    $bitmap.Dispose()
  }
}

$RepoRoot = Resolve-RepoRoot -Start $RepoRoot
$IconPng = Join-Path $RepoRoot "public\assets\soledash\branding\soledash-icon-512.png"
if (-not (Test-Path $IconPng)) {
  throw "Icon missing: $IconPng"
}

$IconIco = Join-Path $RepoRoot "public\assets\soledash\branding\soledash-icon.ico"
if (-not (Test-Path $IconIco)) {
  Convert-PngToIco -PngPath $IconPng -IcoPath $IconIco
}

$Desktop = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $Desktop "SoleDash.lnk"

$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
$Shortcut.TargetPath = $Url
$Shortcut.WorkingDirectory = $RepoRoot
$Shortcut.WindowStyle = 1
$Shortcut.Description = "AEYE SoleDash - operator decision surface"
$Shortcut.IconLocation = "$IconIco,0"
$Shortcut.Save()

Write-Output (@{
  ok = $true
  shortcut = $ShortcutPath
  icon = $IconIco
  url = $Url
  hint = "Double-click SoleDash on Desktop. In Edge install as app for standalone window and taskbar pin."
} | ConvertTo-Json -Compress)
