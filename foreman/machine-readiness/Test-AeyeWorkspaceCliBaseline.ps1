param(
    [string]$Nickname = $env:COMPUTERNAME,
    [string]$ProjectRoot = (Split-Path -Parent $MyInvocation.MyCommand.Path),
    [string]$OutputPath
)

$ErrorActionPreference = "Continue"

function Get-CommandInfo {
    param(
        [string]$Name,
        [string[]]$VersionArgs = @()
    )

    $cmd = Get-Command $Name -ErrorAction SilentlyContinue
    if ($null -eq $cmd) {
        return [pscustomobject]@{
            name = $Name
            present = $false
            path = $null
            version = $null
        }
    }

    $version = $null
    if ($VersionArgs.Count -gt 0) {
        try {
            $psi = New-Object System.Diagnostics.ProcessStartInfo
            $psi.FileName = $cmd.Source
            $psi.Arguments = ($VersionArgs -join " ")
            $psi.RedirectStandardOutput = $true
            $psi.RedirectStandardError = $true
            $psi.UseShellExecute = $false
            $psi.CreateNoWindow = $true
            $p = New-Object System.Diagnostics.Process
            $p.StartInfo = $psi
            [void]$p.Start()
            if ($p.WaitForExit(5000)) {
                $stdout = $p.StandardOutput.ReadToEnd().Trim()
                $stderr = $p.StandardError.ReadToEnd().Trim()
                if ($stdout) { $version = $stdout }
                elseif ($stderr) { $version = $stderr }
            }
            else {
                try { $p.Kill() } catch {}
                $version = "version_check_timeout"
            }
        }
        catch {
            $version = "version_check_failed: " + $_.Exception.Message
        }
    }

    return [pscustomobject]@{
        name = $Name
        present = $true
        path = $cmd.Source
        version = $version
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

function Get-StartAppMatches {
    param([string[]]$Patterns)
    $apps = @()
    try {
        $all = @(Get-StartApps)
        foreach ($pattern in $Patterns) {
            $apps += $all | Where-Object { $_.Name -match $pattern } | Select-Object Name, AppID
        }
    }
    catch {}
    return @($apps | Sort-Object Name -Unique)
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
        $onePasswordExtensionId = "aeblfdkhhhdcdjpifhhbdiojplfjncoa"
        $onePasswordExtensionPath = Join-Path $profileDir.FullName ("Extensions\" + $onePasswordExtensionId)

        $rows += [pscustomobject]@{
            profile_directory = $profileDir.Name
            name = Get-JsonProperty $profile "name"
            one_password_extension_present = (Test-Path -LiteralPath $onePasswordExtensionPath)
            credentials_enable_service = Get-JsonProperty $preferences "credentials_enable_service"
            profile_password_manager_enabled = Get-JsonProperty $profile "password_manager_enabled"
            autofill_profile_enabled = Get-JsonProperty $autofill "profile_enabled"
            autofill_credit_card_enabled = Get-JsonProperty $autofill "credit_card_enabled"
        }
    }
    return $rows
}

function Get-PowerToysReadback {
    $settingsPath = Join-Path $env:LOCALAPPDATA "Microsoft\PowerToys\settings.json"
    $workspacesRoot = Join-Path $env:LOCALAPPDATA "Microsoft\PowerToys\Workspaces"
    $fancyZonesRoot = Join-Path $env:LOCALAPPDATA "Microsoft\PowerToys\FancyZones"
    $workspacesLogs = @()
    if (Test-Path -LiteralPath $workspacesRoot) {
        $workspacesLogs = @(Get-ChildItem -LiteralPath $workspacesRoot -Recurse -File -ErrorAction SilentlyContinue |
            Where-Object { $_.FullName -match "Log|Logs|log" } |
            Sort-Object LastWriteTime -Descending |
            Select-Object -First 10 FullName, LastWriteTime, Length)
    }

    return [pscustomobject]@{
        settings_path = $settingsPath
        settings_present = (Test-Path -LiteralPath $settingsPath)
        workspaces_root = $workspacesRoot
        workspaces_root_present = (Test-Path -LiteralPath $workspacesRoot)
        fancyzones_root = $fancyZonesRoot
        fancyzones_root_present = (Test-Path -LiteralPath $fancyZonesRoot)
        recent_workspaces_logs = $workspacesLogs
    }
}

function Get-RepoReadback {
    $paths = @(
        "C:\Users\BenLeak\github\Werkles",
        "C:\Users\Ben Leak\github\Werkles",
        "C:\Users\BenLeak\Desktop\github\Werkles",
        "C:\Users\Ben Leak\Desktop\github\Werkles"
    )
    $git = Get-Command git -ErrorAction SilentlyContinue
    $rows = @()
    foreach ($path in $paths) {
        $exists = Test-Path -LiteralPath $path
        $row = [ordered]@{
            path = $path
            exists = $exists
            is_git = $false
            branch = $null
            head = $null
            origin = $null
            dirty_preview = @()
        }
        if ($exists -and $git) {
            try {
                $inside = & git -C $path rev-parse --is-inside-work-tree 2>$null
                if ($inside -eq "true") {
                    $row.is_git = $true
                    $row.branch = (& git -C $path branch --show-current 2>$null | Out-String).Trim()
                    $row.head = (& git -C $path rev-parse --short HEAD 2>$null | Out-String).Trim()
                    $row.origin = (& git -C $path remote get-url origin 2>$null | Out-String).Trim()
                    $status = @(& git -C $path status --short 2>$null | Select-Object -First 20)
                    $row.dirty_preview = $status
                }
            }
            catch {}
        }
        $rows += [pscustomobject]$row
    }
    return $rows
}

$coreCommands = @(
    @{ name = "powershell"; version = @("-NoProfile", "-Command", "`$PSVersionTable.PSVersion.ToString()") },
    @{ name = "pwsh"; version = @("-NoProfile", "-Command", "`$PSVersionTable.PSVersion.ToString()") },
    @{ name = "winget"; version = @("--version") },
    @{ name = "git"; version = @("--version") },
    @{ name = "gh"; version = @("--version") },
    @{ name = "op"; version = @("--version") },
    @{ name = "node"; version = @("--version") },
    @{ name = "npm"; version = @("--version") },
    @{ name = "npm.cmd"; version = @("--version") },
    @{ name = "corepack"; version = @("--version") },
    @{ name = "pnpm"; version = @("--version") },
    @{ name = "yarn"; version = @("--version") },
    @{ name = "python"; version = @("--version") },
    @{ name = "py"; version = @("--version") },
    @{ name = "pip"; version = @("--version") },
    @{ name = "uv"; version = @("--version") },
    @{ name = "ssh"; version = @("-V") }
)

$providerCommands = @(
    "codex",
    "openai",
    "vercel",
    "supabase",
    "stripe",
    "firebase",
    "netlify",
    "wrangler",
    "docker",
    "wsl",
    "gcloud",
    "aws",
    "az",
    "playwright"
)

$coreReadback = foreach ($entry in $coreCommands) {
    Get-CommandInfo -Name $entry.name -VersionArgs $entry.version
}

$providerReadback = foreach ($name in $providerCommands) {
    Get-CommandInfo -Name $name
}

$startApps = Get-StartAppMatches @(
    "1Password",
    "PowerToys",
    "Chrome",
    "Cursor",
    "Visual Studio Code|VS Code",
    "GitHub Desktop",
    "RustDesk",
    "Windows Terminal"
)

$harveyScripts = @(
    "Start-Harvey1PasswordWorker.ps1",
    "Submit-Harvey1PasswordJob.ps1",
    "Invoke-Werkles1PasswordWorker.ps1"
) | ForEach-Object {
    $p = Join-Path $ProjectRoot $_
    [pscustomobject]@{ path = $p; present = (Test-Path -LiteralPath $p) }
}

$receipt = [pscustomobject]@{
    schema = "aeye_workspace_cli_baseline_v0_1"
    mode = "read_only_no_secrets_no_auth_status"
    nickname = $Nickname
    hostname = $env:COMPUTERNAME
    user = $env:USERNAME
    userprofile = $env:USERPROFILE
    cwd = (Get-Location).Path
    timestamp = (Get-Date).ToString("o")
    powershell_version = $PSVersionTable.PSVersion.ToString()
    execution_policy = @(Get-ExecutionPolicy -List | Select-Object Scope, ExecutionPolicy)
    start_apps = $startApps
    powertoys = Get-PowerToysReadback
    chrome_profiles = @(Get-ChromeProfileReadback)
    core_commands = @($coreReadback)
    provider_commands = @($providerReadback)
    repos = @(Get-RepoReadback)
    harvey_scripts = @($harveyScripts)
    notes = @(
        "No op account list was run.",
        "No gh auth status was run.",
        "No provider auth/login command was run.",
        "No credential values were read."
    )
}

if (-not $OutputPath) {
    $safeName = ($Nickname -replace "[^A-Za-z0-9_.-]", "_")
    $stamp = Get-Date -Format "yyyyMMddTHHmmss"
    $OutputPath = Join-Path $ProjectRoot ("outputs\workspace-cli-baseline-" + $safeName + "-" + $stamp + ".json")
}

$outputDir = Split-Path -Parent $OutputPath
if ($outputDir -and -not (Test-Path -LiteralPath $outputDir)) {
    New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Write-Output ("WROTE_RECEIPT=" + $OutputPath)
