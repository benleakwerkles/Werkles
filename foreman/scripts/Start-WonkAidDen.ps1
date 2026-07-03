param(
  [switch]$NoOpen
)

$ErrorActionPreference = "Stop"

$Root = "C:\Users\benle\Documents\Werkles"
$Ports = @(3006, 3007, 3008)
$PagePath = "/soledash"

function Test-WonkAidDenUrl {
  param([int]$Port)

  $url = "http://127.0.0.1:$Port$PagePath"
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -TimeoutSec 4
    return $response.StatusCode -eq 200
  } catch {
    return $false
  }
}

function Test-PortListening {
  param([int]$Port)

  try {
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
  } catch {
    return $false
  }
}

function Open-WonkAidDen {
  param([int]$Port)

  $url = "http://127.0.0.1:$Port$PagePath"
  if (-not $NoOpen) {
    Start-Process -FilePath $url
  }
  Write-Output "WonkAidDen URL: $url"
}

Set-Location $Root

foreach ($port in $Ports) {
  if (Test-WonkAidDenUrl -Port $port) {
    Open-WonkAidDen -Port $port
    exit 0
  }
}

if (-not (Test-Path ".next\BUILD_ID")) {
  & npm.cmd run build
}

foreach ($port in $Ports) {
  if (Test-PortListening -Port $port) {
    continue
  }

  Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "start", "--", "-p", "$port") -WorkingDirectory $Root -WindowStyle Hidden

  for ($attempt = 0; $attempt -lt 30; $attempt++) {
    Start-Sleep -Seconds 1
    if (Test-WonkAidDenUrl -Port $port) {
      Open-WonkAidDen -Port $port
      exit 0
    }
  }
}

throw "WonkAidDen could not find or start a healthy local server on ports $($Ports -join ', ')."
