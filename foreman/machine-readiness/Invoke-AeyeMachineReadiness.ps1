param(
    [string]$Nickname = $env:COMPUTERNAME,
    [string]$ProjectRoot = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$OutputRoot,
    [switch]$SkipCredentialBaseline,
    [switch]$SkipWorkspaceCliBaseline,
    [switch]$NoPacketSearch
)

$ErrorActionPreference = "Continue"

function Resolve-ProjectRoot {
    param([string]$Root)

    $candidates = @(
        $Root,
        (Join-Path $env:USERPROFILE "Documents\1password Project"),
        "C:\Users\BenLeak\Documents\1password Project",
        "C:\Users\Ben Leak\Documents\1password Project"
    ) | Where-Object { $_ -and $_ -ne "" } | Select-Object -Unique

    foreach ($candidate in $candidates) {
        if (Test-Path -LiteralPath $candidate) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }

    return $Root
}

function Invoke-ChildBaseline {
    param(
        [string]$ScriptPath,
        [string]$Nickname,
        [string]$ProjectRoot,
        [string]$OutputPath
    )

    if (-not (Test-Path -LiteralPath $ScriptPath)) {
        return [pscustomobject]@{
            script = $ScriptPath
            status = "MISSING"
            output_path = $OutputPath
            exit_code = $null
            stdout = ""
            sha256 = $null
        }
    }

    $args = @(
        "-NoProfile",
        "-ExecutionPolicy", "Bypass",
        "-File", $ScriptPath,
        "-Nickname", $Nickname,
        "-ProjectRoot", $ProjectRoot,
        "-OutputPath", $OutputPath
    )

    $output = & powershell @args 2>&1
    $exit = $LASTEXITCODE
    $hash = $null
    if (Test-Path -LiteralPath $OutputPath) {
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $OutputPath).Hash
    }

    return [pscustomobject]@{
        script = $ScriptPath
        status = $(if ($exit -eq 0 -and (Test-Path -LiteralPath $OutputPath)) { "COMPLETE" } else { "FAILED_OR_NO_RECEIPT" })
        output_path = $OutputPath
        exit_code = $exit
        stdout = (($output | Out-String).Trim())
        sha256 = $hash
    }
}

function Read-JsonSafe {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    try {
        return (Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json)
    }
    catch {
        return $null
    }
}

$ProjectRoot = Resolve-ProjectRoot $ProjectRoot
if (-not $OutputRoot) {
    $OutputRoot = Join-Path $ProjectRoot "Receipts"
}
New-Item -ItemType Directory -Force -Path $OutputRoot | Out-Null

$safeName = ($Nickname -replace "[^A-Za-z0-9_.-]", "_")
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"

$credentialReceipt = Join-Path $OutputRoot ("aeye-credential-baseline-" + $safeName + "-" + $stamp + ".json")
$workspaceReceipt = Join-Path $OutputRoot ("aeye-workspace-cli-baseline-" + $safeName + "-" + $stamp + ".json")
$summaryReceipt = Join-Path $OutputRoot ("aeye-machine-readiness-" + $safeName + "-" + $stamp + ".json")

$packetSearch = [pscustomobject]@{
    status = "SKIPPED"
    command = $null
    output = ""
}

if (-not $NoPacketSearch) {
    $rg = Get-Command rg -ErrorAction SilentlyContinue
    $packetFiles = @(
        (Join-Path $ProjectRoot "AEYE_MACHINE_SINGLE_COMMAND_20260711.md"),
        (Join-Path $ProjectRoot "AEYE_MACHINE_CREDENTIAL_BASELINE_20260711.md"),
        (Join-Path $ProjectRoot "AEYE_WORKSPACE_AND_CLI_BASELINE_20260711.md"),
        (Join-Path $ProjectRoot "PASSWORD_CHECKLIST_ACTIVE_QUEUE_20260711.md")
    ) | Where-Object { Test-Path -LiteralPath $_ }

    if ($rg -and $packetFiles.Count -gt 0) {
        $patterns = "COPY_PASTE|Universal No-Items|Workspace And CLI|Machine Checklist|Success Definition|Do not run auth-status"
        $packetOutput = & rg -n $patterns @packetFiles 2>&1
        $packetSearch = [pscustomobject]@{
            status = "COMPLETE"
            command = "rg -n `"$patterns`" <packet files>"
            output = (($packetOutput | Out-String).Trim())
        }
        Write-Output "PACKET_ANCHORS:"
        Write-Output $packetSearch.output
    }
    else {
        $packetSearch = [pscustomobject]@{
            status = "RG_OR_PACKET_FILES_MISSING"
            command = "rg packet search"
            output = ""
        }
    }
}

$credentialResult = [pscustomobject]@{ status = "SKIPPED" }
if (-not $SkipCredentialBaseline) {
    $credentialResult = Invoke-ChildBaseline `
        -ScriptPath (Join-Path $ProjectRoot "Test-AeyeMachineCredentialBaseline.ps1") `
        -Nickname $Nickname `
        -ProjectRoot $ProjectRoot `
        -OutputPath $credentialReceipt
}

$workspaceResult = [pscustomobject]@{ status = "SKIPPED" }
if (-not $SkipWorkspaceCliBaseline) {
    $workspaceResult = Invoke-ChildBaseline `
        -ScriptPath (Join-Path $ProjectRoot "Test-AeyeWorkspaceCliBaseline.ps1") `
        -Nickname $Nickname `
        -ProjectRoot $ProjectRoot `
        -OutputPath $workspaceReceipt
}

$credentialJson = Read-JsonSafe $credentialReceipt
$workspaceJson = Read-JsonSafe $workspaceReceipt

$summary = [pscustomobject]@{
    schema = "aeye_machine_readiness_summary_v0_1"
    mode = "read_only_no_secrets_no_auth_status"
    nickname = $Nickname
    hostname = $env:COMPUTERNAME
    user = $env:USERNAME
    userprofile = $env:USERPROFILE
    project_root = $ProjectRoot
    timestamp = (Get-Date).ToString("o")
    packet_search = $packetSearch
    credential_baseline = $credentialResult
    workspace_cli_baseline = $workspaceResult
    observed = [pscustomobject]@{
        credential_blockers = $(if ($credentialJson) { @($credentialJson.blockers) } else { @() })
        chrome_profile_count = $(if ($workspaceJson) { @($workspaceJson.chrome_profiles).Count } elseif ($credentialJson) { @($credentialJson.chrome_profiles).Count } else { 0 })
        core_commands_present = $(if ($workspaceJson) { @($workspaceJson.core_commands | Where-Object { $_.present }).Count } else { 0 })
        provider_commands_present = $(if ($workspaceJson) { @($workspaceJson.provider_commands | Where-Object { $_.present }).Count } else { 0 })
        powertoys_settings_present = $(if ($workspaceJson) { $workspaceJson.powertoys.settings_present } else { $null })
        powertoys_workspaces_root_present = $(if ($workspaceJson) { $workspaceJson.powertoys.workspaces_root_present } else { $null })
    }
    notes = @(
        "No op account list was run by this wrapper.",
        "No gh auth status was run by this wrapper.",
        "No provider login/auth/deploy command was run by this wrapper.",
        "No credential values were read."
    )
}

$summary | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $summaryReceipt -Encoding UTF8
$summaryHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $summaryReceipt).Hash

Write-Output ("SUMMARY_RECEIPT=" + $summaryReceipt)
Write-Output ("SUMMARY_SHA256=" + $summaryHash)
Write-Output ("CREDENTIAL_STATUS=" + $credentialResult.status)
Write-Output ("WORKSPACE_CLI_STATUS=" + $workspaceResult.status)
if ($summary.observed.credential_blockers.Count -gt 0) {
    Write-Output ("BLOCKERS=" + (($summary.observed.credential_blockers) -join ", "))
}
else {
    Write-Output "BLOCKERS="
}
