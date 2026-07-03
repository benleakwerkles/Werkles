#Requires -Version 5.1
<#
.SYNOPSIS
  LOCAL HANDS + permission swatter health check for Aeye Windows.
#>
$ErrorActionPreference = 'Continue'

Write-Host '=== LOCAL HANDS READBACK (permission swatter) ==='
Write-Host "Machine: $([System.Environment]::MachineName)"
Write-Host "User:    $env:USERNAME"

$repoCandidates = @('C:\Dev\Werkles', 'C:\Users\benle\Desktop\github\Werkles')
foreach ($p in $repoCandidates) {
  if (Test-Path $p) {
    $branch = git -C $p branch --show-current 2>$null
    $commit = git -C $p rev-parse --short HEAD 2>$null
    Write-Host "Repo:    $p"
    Write-Host "Branch:  $branch @ $commit"
  }
}

Write-Host ''
Write-Host '=== Port 3000 owner ==='
$conn = Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($conn) {
  $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($conn.OwningProcess)").CommandLine
  Write-Host $cmd
} else {
  Write-Host 'not listening'
}

Write-Host ''
Write-Host '=== Swatter files ==='
$paths = @(
  (Join-Path $PSScriptRoot '..\..\foreman\PERMISSION_SWATTER_V1.md'),
  (Join-Path $PSScriptRoot '..\..\foreman\gates\APPROVED_PROJECT_REGISTRY.json'),
  (Join-Path $PSScriptRoot '..\..\.cursor\permissions.json'),
  (Join-Path $env:USERPROFILE '.cursor\permissions.json')
)
foreach ($f in $paths) {
  $resolved = Resolve-Path $f -ErrorAction SilentlyContinue
  if ($resolved) { Write-Host "OK  $resolved" } else { Write-Host "MISSING  $f" }
}

Write-Host ''
Write-Host '=== Approved total projects ==='
$registry = Join-Path $PSScriptRoot '..\..\foreman\gates\APPROVED_PROJECT_REGISTRY.json' | Resolve-Path -ErrorAction SilentlyContinue
if ($registry) {
  $data = Get-Content $registry | ConvertFrom-Json
  foreach ($proj in $data.projects) {
    if ($proj.status -eq 'approved_total') {
      Write-Host "- $($proj.id) [$($proj.name)] machines=$($proj.machines -join ',')"
    }
  }
}

Write-Host ''
Write-Host '=== Cursor Run Mode (manual) ==='
Write-Host 'Open Cursor -> Settings -> Agents -> Run Mode'
Write-Host 'Target: Run Everything (max swat) OR Auto-review + permissions.json (steered swat)'
Write-Host 'If prompts returned after update, re-check Run Mode before blaming agents.'
