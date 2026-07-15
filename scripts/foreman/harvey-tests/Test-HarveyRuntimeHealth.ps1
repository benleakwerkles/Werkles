[CmdletBinding()]
param(
    [string]$LocalUrl = 'http://127.0.0.1:3000',
    [string]$LanUrl = 'http://10.1.10.8:3000'
)

$ErrorActionPreference = 'Stop'
$checks = foreach ($base in @($LocalUrl.TrimEnd('/'), $LanUrl.TrimEnd('/'))) {
    foreach ($path in @('/harvey', '/api/harvey/snapshot', '/api/harvey/machines', '/api/harvey/commands?machine=Doss', '/api/harvey/knock?machine=Doss', '/api/harvey/witness', '/api/harvey/witness?format=packet')) {
        try {
            $response = Invoke-WebRequest -UseBasicParsing -Uri ($base + $path) -TimeoutSec 15
            [pscustomobject]@{ url=($base+$path); status='PASS'; http=[int]$response.StatusCode; bytes=$response.Content.Length }
        } catch {
            [pscustomobject]@{ url=($base+$path); status='FAIL'; error=$_.Exception.Message }
        }
    }
}
$failed = @($checks | Where-Object { $_.status -ne 'PASS' -or $_.http -ne 200 })
$listener = Get-NetTCPConnection -State Listen -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -First 1
[pscustomobject]@{ schema='werkles.harvey-runtime-health/v1'; status=$(if($failed.Count -eq 0 -and $listener){'PASS'}else{'FAIL'}); listener_pid=$(if($listener){$listener.OwningProcess}else{$null}); checks=$checks } | ConvertTo-Json -Depth 8
if ($failed.Count -gt 0 -or -not $listener) { exit 1 }
