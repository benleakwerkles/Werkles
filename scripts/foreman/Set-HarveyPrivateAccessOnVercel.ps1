[CmdletBinding()]
param(
    [switch]$UpdateExisting
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$projectFile = Join-Path $repoRoot '.vercel\project.json'
if (-not (Test-Path -LiteralPath $projectFile)) {
    throw 'VERCEL_PROJECT_NOT_LINKED: link the canonical Werkles project before private secret entry.'
}

$node = (Get-Command node.exe -ErrorAction Stop).Source
$vercelCommand = Get-Command vercel.cmd -ErrorAction SilentlyContinue
if ($vercelCommand) {
    $vercelExecutable = $vercelCommand.Source
    $vercelPrefixArgs = @()
}
else {
    $npx = (Get-Command npx.cmd -ErrorAction Stop).Source
    $vercelExecutable = $npx
    $vercelPrefixArgs = @('--yes', 'vercel@56.3.1')
}
$bridge = Join-Path $PSScriptRoot 'harvey-private-access-material.mjs'
$securePassword = Read-Host 'Enter the existing Juryduty password for Harvey (input stays hidden)' -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$plain = $null
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    if ([string]::IsNullOrEmpty($plain)) { throw 'PASSWORD_INPUT_INVALID' }

    $start = [Diagnostics.ProcessStartInfo]::new()
    $start.FileName = $node
    $start.Arguments = ('"{0}" --internal-stdio' -f $bridge.Replace('"', '\"'))
    $start.UseShellExecute = $false
    $start.RedirectStandardInput = $true
    $start.RedirectStandardOutput = $true
    $start.RedirectStandardError = $true
    $start.CreateNoWindow = $true
    $process = [Diagnostics.Process]::Start($start)
    $process.StandardInput.WriteLine($plain)
    $process.StandardInput.Close()
    $materialJson = $process.StandardOutput.ReadToEnd()
    $bridgeError = $process.StandardError.ReadToEnd()
    $process.WaitForExit()
    if ($process.ExitCode -ne 0) { throw ('PRIVATE_ACCESS_MATERIAL_FAILED: ' + $bridgeError.Trim()) }
    $material = $materialJson | ConvertFrom-Json
}
finally {
    $plain = $null
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
    $securePassword.Dispose()
}

$verb = if ($UpdateExisting) { 'update' } else { 'add' }
try {
    $verifierArgs = $vercelPrefixArgs + @('env', $verb, 'HARVEY_PRIVATE_PASSWORD_VERIFIER', 'production', '--sensitive', '--yes')
    $material.verifier | & $vercelExecutable @verifierArgs
    if ($LASTEXITCODE -ne 0) { throw 'PASSWORD_VERIFIER_ENV_WRITE_FAILED' }
    $sessionArgs = $vercelPrefixArgs + @('env', $verb, 'HARVEY_PRIVATE_SESSION_SECRET', 'production', '--sensitive', '--yes')
    $material.sessionSecret | & $vercelExecutable @sessionArgs
    if ($LASTEXITCODE -ne 0) { throw 'SESSION_SECRET_ENV_WRITE_FAILED' }
}
finally {
    $material.verifier = $null
    $material.sessionSecret = $null
    $material = $null
    $materialJson = $null
}

Write-Output 'HARVEY_PRIVATE_ACCESS_ENV_CONFIGURED: plaintext was never written or printed; a new production deployment is required.'
