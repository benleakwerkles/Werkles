param(
    [string[]]$Accounts = @(
        'N7N3YHAZQNFY3HT7P4XG45DWIE',
        'ITZZGKIRKVAAXJLMX7OQI7W7X4'
    ),
    [string]$Query = '(?i)\b(wells|fargo|wf)\b',
    [string]$OutputPath = '.\outputs\portal-item-search.json',
    [switch]$Allow1PasswordCli
)

$ErrorActionPreference = 'Continue'
$script:OnePasswordCliAllowed = $Allow1PasswordCli -or ($env:WERKLES_ALLOW_1PASSWORD_CLI -eq 'YES')

function Assert-1PasswordCliAllowed {
    if (-not $script:OnePasswordCliAllowed) {
        throw '1PASSWORD_CLI_BLOCKED_BY_DEFAULT: this script will not call op unless launched with -Allow1PasswordCli or WERKLES_ALLOW_1PASSWORD_CLI=YES for this process.'
    }
}

function ConvertTo-ObjectList {
    param([AllowNull()][object]$Value)
    if ($null -eq $Value) {
        return @()
    }
    if ($Value -is [System.Array]) {
        foreach ($entry in $Value) {
            $entry
        }
        return
    }
    $Value
}

function Invoke-OpJsonList {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    Assert-1PasswordCliAllowed
    $raw = & op @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($raw -join ' ')
    }

    $parsed = ($raw -join [Environment]::NewLine) | ConvertFrom-Json
    return @(ConvertTo-ObjectList -Value $parsed)
}

function Get-Sha256Text {
    param([AllowNull()][string]$Text)
    if ($null -eq $Text) {
        $Text = ''
    }

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        (($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Text)) | ForEach-Object { $_.ToString('x2') }) -join '').ToUpperInvariant()
    } finally {
        $sha.Dispose()
    }
}

function Get-AccountLabel {
    param([string]$Account)
    switch ($Account) {
        'N7N3YHAZQNFY3HT7P4XG45DWIE' { return 'business / werkles.1password.com' }
        'ITZZGKIRKVAAXJLMX7OQI7W7X4' { return 'family / my.1password.com' }
        default { return 'unknown' }
    }
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null

$results = foreach ($account in $Accounts) {
    try {
        $items = Invoke-OpJsonList -Arguments @('item', 'list', '--account', $account, '--format', 'json')
        $matches = @($items | Where-Object {
            $metadata = @(
                $_.title
                $_.vault.name
                ($_.tags -join ' ')
                ($_.urls | ForEach-Object { $_.href }) -join ' '
            ) -join ' '
            $metadata -match $Query
        } | ForEach-Object {
            $urls = @($_.urls | ForEach-Object { $_.href } | Where-Object { $_ })
            [pscustomobject]@{
                item_id = $_.id
                vault = $_.vault.name
                category = $_.category
                title_sha256 = Get-Sha256Text -Text ([string]$_.title)
                title_length = ([string]$_.title).Length
                tags_sha256 = Get-Sha256Text -Text (($_.tags -join '|'))
                tag_count = @($_.tags).Count
                url_count = $urls.Count
                url_hosts = @($urls | ForEach-Object {
                    try { ([uri]$_).Host.ToLowerInvariant() } catch { 'UNPARSEABLE' }
                } | Sort-Object -Unique)
                migration_tagged = (($_.tags -join ' ') -match '(?i)migration-stage-testing|migration-gate|migration-row|MIGTEST')
            }
        })

        [pscustomobject]@{
            account_uuid = $account
            account_label = Get-AccountLabel -Account $account
            status = 'COMPLETE'
            total_items = $items.Count
            match_count = $matches.Count
            matches = $matches
            error = $null
        }
    } catch {
        [pscustomobject]@{
            account_uuid = $account
            account_label = Get-AccountLabel -Account $account
            status = 'BLOCKED_OR_FAILED'
            total_items = $null
            match_count = 0
            matches = @()
            error = $_.Exception.Message
        }
    }
}

$payload = [ordered]@{
    timestamp = (Get-Date).ToString('o')
    query = $Query
    secret_boundary = 'metadata only; no fields, passwords, OTP seeds, passkeys, recovery codes, Secret Keys, or notes'
    results = @($results)
}

$payload | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $OutputPath -Encoding UTF8
Get-Content -Raw -LiteralPath $OutputPath
