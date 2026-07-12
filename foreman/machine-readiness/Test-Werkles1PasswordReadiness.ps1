param(
    [switch]$IncludeVaultNames,
    [switch]$Allow1PasswordCli
)

$ErrorActionPreference = "Continue"
$script:OnePasswordCliAllowed = $Allow1PasswordCli -or ($env:WERKLES_ALLOW_1PASSWORD_CLI -eq 'YES')

function Assert-1PasswordCliAllowed {
    if (-not $script:OnePasswordCliAllowed) {
        throw '1PASSWORD_CLI_BLOCKED_BY_DEFAULT: this script will not call op unless launched with -Allow1PasswordCli or WERKLES_ALLOW_1PASSWORD_CLI=YES for this process.'
    }
}

function Invoke-OpJson {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Command
    )

    Assert-1PasswordCliAllowed
    $output = & op @Command 2>&1
    $exitCode = $LASTEXITCODE
    [pscustomobject]@{
        ExitCode = $exitCode
        Output = ($output -join "`n")
    }
}

$result = [ordered]@{
    Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss zzz")
    Machine = $env:COMPUTERNAME
    User = "$env:USERDOMAIN\$env:USERNAME"
    OpVersion = $null
    Accounts = @()
    ReadyAccountCount = 0
    OverallStatus = "UNKNOWN"
}

if (-not $script:OnePasswordCliAllowed) {
    $result.OpVersion = "blocked by default"
    $result.OverallStatus = "BLOCKED_1PASSWORD_CLI_NOT_EXPLICITLY_ALLOWED"
    $result | ConvertTo-Json -Depth 8
    exit 3
}

$opVersion = & op --version 2>&1
if ($LASTEXITCODE -ne 0) {
    $result.OpVersion = "op unavailable"
    $result.OverallStatus = "BLOCKED_OP_NOT_AVAILABLE"
    $result | ConvertTo-Json -Depth 8
    exit 1
}

$result.OpVersion = ($opVersion -join "`n").Trim()

$accountsRaw = Invoke-OpJson -Command @("account", "list", "--format", "json")
if ($accountsRaw.ExitCode -ne 0) {
    $result.OverallStatus = "BLOCKED_ACCOUNT_LIST_FAILED"
    $result.AccountListError = $accountsRaw.Output
    $result | ConvertTo-Json -Depth 8
    exit 1
}

try {
    $accounts = $accountsRaw.Output | ConvertFrom-Json
} catch {
    $result.OverallStatus = "BLOCKED_ACCOUNT_LIST_PARSE_FAILED"
    $result.AccountListError = $_.Exception.Message
    $result | ConvertTo-Json -Depth 8
    exit 1
}

foreach ($account in @($accounts)) {
    $accountUuid = $account.account_uuid
    $who = Invoke-OpJson -Command @("whoami", "--account", $accountUuid, "--format", "json")
    $accountRecord = [ordered]@{
        Url = $account.url
        Email = $account.email
        AccountUuid = $accountUuid
        SignedIn = $false
        WhoamiStatus = $null
        VaultCount = $null
        VaultNames = @()
    }

    if ($who.ExitCode -eq 0) {
        $accountRecord.SignedIn = $true
        $accountRecord.WhoamiStatus = "SIGNED_IN"
        $result.ReadyAccountCount++

        $vaults = Invoke-OpJson -Command @("vault", "list", "--account", $accountUuid, "--format", "json")
        if ($vaults.ExitCode -eq 0) {
            try {
                $vaultObjects = @($vaults.Output | ConvertFrom-Json)
                $accountRecord.VaultCount = $vaultObjects.Count
                if ($IncludeVaultNames) {
                    $accountRecord.VaultNames = @($vaultObjects | ForEach-Object { $_.name })
                }
            } catch {
                $accountRecord.VaultCount = "PARSE_FAILED"
            }
        } else {
            $accountRecord.VaultCount = "VAULT_LIST_FAILED"
        }
    } else {
        $accountRecord.WhoamiStatus = ($who.Output -replace "\s+", " ").Trim()
    }

    $result.Accounts += [pscustomobject]$accountRecord
}

if ($result.ReadyAccountCount -gt 0) {
    $result.OverallStatus = "READY_FOR_AUTHENTICATED_1PASSWORD_WORK"
} else {
    $result.OverallStatus = "BLOCKED_1PASSWORD_NOT_SIGNED_IN"
}

$result | ConvertTo-Json -Depth 8

if ($result.ReadyAccountCount -gt 0) {
    exit 0
}

exit 2
