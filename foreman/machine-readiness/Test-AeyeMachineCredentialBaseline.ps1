param(
    [string]$Nickname = $env:COMPUTERNAME,
    [string]$ProjectRoot = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string[]]$RepoPaths = @(
        "C:\Users\BenLeak\github\Werkles",
        "C:\Users\BenLeak\Desktop\github\Werkles",
        "C:\Users\BenLeak\Desktop\github\Werklesclone\Werkles",
        "C:\Users\BenLeak\github\Werkles1"
    ),
    [switch]$CheckOpAccounts,
    [switch]$CheckGhAuth,
    [string]$OutputPath
)

$ErrorActionPreference = "Continue"

function Get-CommandPath {
    param([string]$Name)
    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $cmd) { return $null }
    return $cmd.Source
}

function Invoke-TextCommand {
    param(
        [string]$FilePath,
        [string[]]$Arguments,
        [string]$WorkingDirectory
    )

    $oldLocation = Get-Location
    try {
        if ($WorkingDirectory) {
            Set-Location -LiteralPath $WorkingDirectory
        }
        $output = & $FilePath @Arguments 2>&1
        $exitCode = $LASTEXITCODE
        return [pscustomobject]@{
            exit_code = $exitCode
            output = (($output | Out-String).Trim())
        }
    }
    catch {
        return [pscustomobject]@{
            exit_code = -1
            output = $_.Exception.Message
        }
    }
    finally {
        Set-Location -LiteralPath $oldLocation
    }
}

function Read-JsonFile {
    param([string]$Path)
    if (-not (Test-Path -LiteralPath $Path)) { return $null }
    try {
        return (Get-Content -Raw -LiteralPath $Path | ConvertFrom-Json)
    }
    catch {
        return $null
    }
}

function Get-JsonProperty {
    param(
        [object]$Object,
        [string]$Name
    )
    if ($null -eq $Object) { return $null }
    if ($Object.PSObject.Properties.Name -contains $Name) {
        return $Object.$Name
    }
    return $null
}

function Get-GitRepoReadback {
    param([string]$Path)

    $gitPath = Get-CommandPath "git"
    if ($null -eq $gitPath) {
        return [pscustomobject]@{
            path = $Path
            exists = (Test-Path -LiteralPath $Path)
            is_git = $false
            blocker = "git_not_on_path"
        }
    }

    $exists = Test-Path -LiteralPath $Path
    if (-not $exists) {
        return [pscustomobject]@{
            path = $Path
            exists = $false
            is_git = $false
            blocker = "path_not_found"
        }
    }

    $inside = Invoke-TextCommand $gitPath @("-C", $Path, "rev-parse", "--is-inside-work-tree") $null
    if ($inside.exit_code -ne 0 -or $inside.output -ne "true") {
        return [pscustomobject]@{
            path = $Path
            exists = $true
            is_git = $false
            blocker = "not_a_git_worktree"
        }
    }

    $root = Invoke-TextCommand $gitPath @("-C", $Path, "rev-parse", "--show-toplevel") $null
    $branch = Invoke-TextCommand $gitPath @("-C", $Path, "branch", "--show-current") $null
    $head = Invoke-TextCommand $gitPath @("-C", $Path, "rev-parse", "--short", "HEAD") $null
    $origin = Invoke-TextCommand $gitPath @("-C", $Path, "remote", "get-url", "origin") $null
    $status = Invoke-TextCommand $gitPath @("-C", $Path, "status", "--short") $null

    $statusLines = @()
    if ($status.output) {
        $statusLines = @($status.output -split "`r?`n" | Where-Object { $_ -ne "" })
    }

    return [pscustomobject]@{
        path = $Path
        exists = $true
        is_git = $true
        root = $root.output
        branch = $branch.output
        head = $head.output
        origin = $origin.output
        dirty_count = $statusLines.Count
        status_preview = @($statusLines | Select-Object -First 20)
    }
}

function Get-ChromeProfileReadback {
    $chromeRoot = Join-Path $env:LOCALAPPDATA "Google\Chrome\User Data"
    if (-not (Test-Path -LiteralPath $chromeRoot)) {
        return @()
    }

    $profileDirs = Get-ChildItem -LiteralPath $chromeRoot -Directory -ErrorAction SilentlyContinue |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName "Preferences") }

    $rows = @()
    foreach ($profileDir in $profileDirs) {
        $preferencesPath = Join-Path $profileDir.FullName "Preferences"
        $preferences = Read-JsonFile $preferencesPath
        $profile = Get-JsonProperty $preferences "profile"
        $autofill = Get-JsonProperty $preferences "autofill"

        $credentialsService = Get-JsonProperty $preferences "credentials_enable_service"
        $passwordManager = Get-JsonProperty $profile "password_manager_enabled"
        $autofillProfile = Get-JsonProperty $autofill "profile_enabled"
        $autofillCards = Get-JsonProperty $autofill "credit_card_enabled"

        $onePasswordExtensionId = "aeblfdkhhhdcdjpifhhbdiojplfjncoa"
        $onePasswordExtensionPath = Join-Path $profileDir.FullName ("Extensions\" + $onePasswordExtensionId)
        $hasOnePasswordExtension = Test-Path -LiteralPath $onePasswordExtensionPath

        $googlePasswordManagerState = "unknown"
        if ($credentialsService -eq $false -and $passwordManager -eq $false) {
            $googlePasswordManagerState = "off"
        }
        elseif ($credentialsService -eq $true -or $passwordManager -eq $true) {
            $googlePasswordManagerState = "on_or_partial"
        }

        $rows += [pscustomobject]@{
            profile_directory = $profileDir.Name
            preferences_path = $preferencesPath
            one_password_extension_present = $hasOnePasswordExtension
            credentials_enable_service = $credentialsService
            profile_password_manager_enabled = $passwordManager
            autofill_profile_enabled = $autofillProfile
            autofill_credit_card_enabled = $autofillCards
            google_password_manager_state = $googlePasswordManagerState
        }
    }

    return $rows
}

function Get-StartAppMatch {
    param([string]$Pattern)
    try {
        return @(Get-StartApps | Where-Object { $_.Name -match $Pattern } | Select-Object -First 10)
    }
    catch {
        return @()
    }
}

$gitPath = Get-CommandPath "git"
$ghPath = Get-CommandPath "gh"
$opPath = Get-CommandPath "op"

$toolReadback = [ordered]@{
    git = [ordered]@{
        path = $gitPath
        version = $null
    }
    gh = [ordered]@{
        path = $ghPath
        version = $null
        auth_status = "not_checked"
    }
    op = [ordered]@{
        path = $opPath
        version = $null
        account_list = "not_checked"
    }
    one_password_desktop = [ordered]@{
        start_apps = @(Get-StartAppMatch "1Password")
    }
}

if ($gitPath) {
    $toolReadback.git.version = (Invoke-TextCommand $gitPath @("--version") $null).output
}

if ($ghPath) {
    $toolReadback.gh.version = (Invoke-TextCommand $ghPath @("--version") $null).output
    if ($CheckGhAuth) {
        $toolReadback.gh.auth_status = (Invoke-TextCommand $ghPath @("auth", "status", "--hostname", "github.com") $null).output
    }
}

if ($opPath) {
    $toolReadback.op.version = (Invoke-TextCommand $opPath @("--version") $null).output
    if ($CheckOpAccounts) {
        $toolReadback.op.account_list = (Invoke-TextCommand $opPath @("account", "list", "--format", "json") $null).output
    }
}

$repoReadbacks = @()
foreach ($repoPath in $RepoPaths) {
    $repoReadbacks += Get-GitRepoReadback $repoPath
}

$chromeProfiles = @(Get-ChromeProfileReadback)

$blockers = @()
if (-not $gitPath) { $blockers += "git_not_on_path" }
if (-not $ghPath) { $blockers += "gh_not_on_path" }
if (-not $opPath) { $blockers += "op_not_on_path" }
if (@($toolReadback.one_password_desktop.start_apps).Count -eq 0) { $blockers += "one_password_desktop_not_found_in_start_apps" }
if (@($chromeProfiles | Where-Object { $_.one_password_extension_present -eq $true }).Count -eq 0) { $blockers += "one_password_chrome_extension_not_found" }
if (@($chromeProfiles | Where-Object { $_.google_password_manager_state -eq "on_or_partial" }).Count -gt 0) { $blockers += "google_password_manager_on_or_partial" }

$receipt = [pscustomobject]@{
    schema = "aeye_machine_credential_baseline_v0_1"
    mode = "read_only_no_secrets"
    nickname = $Nickname
    hostname = $env:COMPUTERNAME
    user = $env:USERNAME
    domain = $env:USERDOMAIN
    cwd = (Get-Location).Path
    timestamp = (Get-Date).ToString("o")
    powershell = $PSVersionTable.PSVersion.ToString()
    tools = $toolReadback
    repos = $repoReadbacks
    chrome_profiles = $chromeProfiles
    blockers = $blockers
}

if (-not $OutputPath) {
    $safeName = ($Nickname -replace "[^A-Za-z0-9_.-]", "_")
    $stamp = Get-Date -Format "yyyyMMddTHHmmss"
    $OutputPath = Join-Path $ProjectRoot ("outputs\machine-baseline-" + $safeName + "-" + $stamp + ".json")
}

$outputDir = Split-Path -Parent $OutputPath
if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Output ("WROTE_RECEIPT=" + $OutputPath)
Write-Output ("BLOCKERS=" + (($blockers -join ", ")))
