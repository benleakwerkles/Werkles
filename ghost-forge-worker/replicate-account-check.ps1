param(
  [string]$BaseUrl = $env:PUBLIC_BASE_URL
)

$ErrorActionPreference = "Stop"

Write-Warning "This checks non-secret Replicate account context through the Ghost Forge worker."
Write-Warning "It does not need the Replicate token, does not print secrets, and does not create predictions."

if (-not $BaseUrl) {
  Write-Error "PUBLIC_BASE_URL is required. Pass -BaseUrl or set it in the environment."
  exit 1
}

if (-not $env:GHOST_FORGE_API_KEY) {
  Write-Error "GHOST_FORGE_API_KEY is required in the environment. Do not paste it into chat."
  exit 1
}

$base = $BaseUrl.TrimEnd("/")
$url = "$base/diagnostics/replicate/account"

$headers = @{
  Authorization = "Bearer $env:GHOST_FORGE_API_KEY"
}

try {
  $response = Invoke-RestMethod -Method Get -Uri $url -Headers $headers -TimeoutSec 60
  $response | ConvertTo-Json -Depth 10
} catch {
  Write-Error "Replicate account diagnostic failed. $($_.Exception.Message)"
  exit 1
}
