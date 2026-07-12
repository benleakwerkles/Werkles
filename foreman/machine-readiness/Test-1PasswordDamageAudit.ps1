param(
    [string]$OutputPath = '.\outputs\1password-damage-audit-20260712.json',
    [switch]$Allow1PasswordCli
)

$ErrorActionPreference = 'Stop'
$script:OnePasswordCliAllowed = $Allow1PasswordCli -or ($env:WERKLES_ALLOW_1PASSWORD_CLI -eq 'YES')

function Assert-1PasswordCliAllowed {
    if (-not $script:OnePasswordCliAllowed) {
        throw '1PASSWORD_CLI_BLOCKED_BY_DEFAULT: this script will not call op unless launched with -Allow1PasswordCli or WERKLES_ALLOW_1PASSWORD_CLI=YES for this process.'
    }
}

function Invoke-OpJson {
    param(
        [Parameter(Mandatory = $true)]
        [string[]]$Arguments
    )

    Assert-1PasswordCliAllowed
    $output = & op @Arguments 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw ($output -join [Environment]::NewLine)
    }

    if (-not $output) {
        return @()
    }

    $json = ($output -join [Environment]::NewLine) | ConvertFrom-Json
    if ($null -eq $json) {
        return @()
    }

    if ($json -is [System.Array]) {
        return @($json)
    }

    return @($json)
}

function Get-Sha256Text {
    param([AllowNull()][string]$Text)

    if ($null -eq $Text) {
        $Text = ''
    }

    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
        return (($sha.ComputeHash($bytes) | ForEach-Object { $_.ToString('x2') }) -join '').ToUpperInvariant()
    } finally {
        $sha.Dispose()
    }
}

function Test-MigrationCandidate {
    param([Parameter(Mandatory = $true)][object]$Item)

    $tagText = ''
    if ($Item.tags) {
        $tagText = ($Item.tags -join ' ')
    }

    return (($Item.title -match '^(?i)MIGTEST\b') -or ($tagText -match '(?i)migration-stage-testing|migration-gate|migration-row'))
}

function Get-ServiceName {
    param([AllowNull()][string]$Title)

    $rules = [ordered]@{
        'Wells Fargo' = '(?i)\bwells\s*fargo\b|\bWF\b'
        'GitHub' = '(?i)\bgithub\b'
        'Google / Gmail / Workspace' = '(?i)\bgoogle\b|\bgmail\b|\bworkspace\b'
        'Apple ID' = '(?i)\bapple\s*id\b'
        'Amazon' = '(?i)\bamazon\b'
        'Stripe' = '(?i)\bstripe\b'
        'Mercury' = '(?i)\bmercury\b'
        'Intuit / QuickBooks' = '(?i)\bintuit\b|\bquick\s*books\b|\bquickbooks\b'
        'Chase' = '(?i)\bchase\b'
        'Path2college' = '(?i)\bpath2college\b'
        'Xfinity' = '(?i)\bxfinity\b|\bcomcast\b'
        'Netflix' = '(?i)\bnetflix\b'
        'Max / HBO' = '(?i)\bmax\b|\bhbo\b'
        'Fox Sports' = '(?i)\bfox\s*sports\b'
        'YouTube TV' = '(?i)\byoutube\s*tv\b'
        'Roku' = '(?i)\broku\b'
        'Prime Video' = '(?i)\bprime\s*video\b'
        'OpenAI / ChatGPT' = '(?i)\bopenai\b|\bchatgpt\b'
        'Supabase' = '(?i)\bsupabase\b'
        'Vercel / v0' = '(?i)\bvercel\b|\bv0\b'
    }

    foreach ($service in $rules.Keys) {
        if ($Title -match $rules[$service]) {
            return $service
        }
    }

    return $null
}

function Get-RiskClass {
    param([Parameter(Mandatory = $true)][string]$Service)

    if ($Service -in @('Wells Fargo', 'Chase', 'Mercury', 'Stripe', 'Intuit / QuickBooks', 'Path2college')) {
        return 'HIGH_FINANCE_OR_ADMIN'
    }

    if ($Service -in @('Google / Gmail / Workspace', 'Apple ID', 'Amazon', 'GitHub')) {
        return 'HIGH_IDENTITY_OR_ROOT'
    }

    if ($Service -in @('Max / HBO', 'Fox Sports', 'YouTube TV', 'Roku', 'Prime Video')) {
        return 'PROVIDER_ENTITLEMENT_OR_AMBIGUOUS'
    }

    return 'NORMAL_SHARED_OR_APP'
}

$accounts = @(
    [pscustomobject]@{ Account = 'ITZZGKIRKVAAXJLMX7OQI7W7X4'; Label = 'my.1password.com / benleak81@gmail.com' },
    [pscustomobject]@{ Account = 'N7N3YHAZQNFY3HT7P4XG45DWIE'; Label = 'werkles.1password.com / ben.leak@kindsir.com' }
)

$receipt = [ordered]@{
    timestamp = (Get-Date).ToString('o')
    machine = $env:COMPUTERNAME
    user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    mode = 'DamageAudit'
    secret_boundary = 'metadata-only item list; no item fields, passwords, OTP seeds, passkeys, recovery codes, Secret Keys, notes, account numbers, or security answers'
    status = 'STARTED'
    accounts = @()
    service_summary = @()
    findings = @()
    recommendations = @()
    errors = @()
}

try {
    $allRows = @()

    foreach ($account in $accounts) {
        $items = @(Invoke-OpJson -Arguments @('item', 'list', '--account', $account.Account, '--format', 'json'))
        $migrationCount = 0
        foreach ($item in $items) {
            $service = Get-ServiceName -Title ([string]$item.title)
            $isMigration = Test-MigrationCandidate -Item $item
            if ($isMigration) {
                $migrationCount++
            }

            if ($service) {
                $allRows += [pscustomobject]@{
                    account_uuid = $account.Account
                    account_label = $account.Label
                    service = $service
                    risk_class = Get-RiskClass -Service $service
                    vault = if ($item.vault -and $item.vault.name) { [string]$item.vault.name } else { $null }
                    category = if ($item.category) { [string]$item.category } else { $null }
                    item_id = $item.id
                    title_sha256 = Get-Sha256Text -Text ([string]$item.title)
                    title_length = if ($null -eq $item.title) { 0 } else { ([string]$item.title).Length }
                    migration_candidate = $isMigration
                    tags_hash = Get-Sha256Text -Text (($item.tags -join '|'))
                }
            }
        }

        $receipt.accounts += [pscustomobject]@{
            account_label = $account.Label
            item_count = $items.Count
            migration_candidate_count = $migrationCount
            matched_high_value_service_item_count = @($allRows | Where-Object { $_.account_uuid -eq $account.Account }).Count
        }
    }

    $receipt.service_summary = @(
        $allRows |
            Group-Object service |
            Sort-Object Name |
            ForEach-Object {
                $rows = @($_.Group)
                [pscustomobject]@{
                    service = $_.Name
                    risk_class = ($rows | Select-Object -First 1).risk_class
                    total_matches = $rows.Count
                    non_migration_matches = @($rows | Where-Object { -not $_.migration_candidate }).Count
                    migration_matches = @($rows | Where-Object { $_.migration_candidate }).Count
                    account_vault_counts = @(
                        $rows |
                            Group-Object account_label, vault |
                            Sort-Object Count -Descending |
                            ForEach-Object {
                                [pscustomobject]@{
                                    account_vault = $_.Name
                                    count = $_.Count
                                    non_migration_count = @($_.Group | Where-Object { -not $_.migration_candidate }).Count
                                    migration_count = @($_.Group | Where-Object { $_.migration_candidate }).Count
                                }
                            }
                    )
                }
            }
    )

    foreach ($summary in $receipt.service_summary) {
        if ($summary.non_migration_matches -gt 1 -and $summary.risk_class -in @('HIGH_FINANCE_OR_ADMIN', 'HIGH_IDENTITY_OR_ROOT')) {
            $receipt.findings += [pscustomobject]@{
                severity = 'P0'
                service = $summary.service
                issue = 'Multiple non-migration matches for a finance/admin or identity/root service'
                non_migration_matches = $summary.non_migration_matches
                recommended_action = 'Do not autofill blindly; verify canonical item by successful provider login, then quarantine duplicates from fill surfaces'
            }
        } elseif ($summary.migration_matches -gt 0 -and $summary.risk_class -in @('HIGH_FINANCE_OR_ADMIN', 'HIGH_IDENTITY_OR_ROOT')) {
            $receipt.findings += [pscustomobject]@{
                severity = 'P1'
                service = $summary.service
                issue = 'Migration candidates exist near a high-risk service'
                migration_matches = $summary.migration_matches
                recommended_action = 'Keep migration candidates quarantined; do not promote without provider-side proof'
            }
        } elseif ($summary.risk_class -eq 'PROVIDER_ENTITLEMENT_OR_AMBIGUOUS') {
            $receipt.findings += [pscustomobject]@{
                severity = 'P2'
                service = $summary.service
                issue = 'Provider/entitlement service should not be solved by creating or trusting fake standalone credentials'
                total_matches = $summary.total_matches
                recommended_action = 'Verify provider route and entitlement before moving or sharing'
            }
        }
    }

    $receipt.recommendations = @(
        'Freeze banking/finance autofill retries after any provider rejection.',
        'For P0 services, prove one canonical item by successful provider login before archiving/quarantining duplicates.',
        'For identity roots, prefer platform-native family/delegate access over credential sharing.',
        'For provider-entitlement services, verify provider route before creating standalone items.',
        'Keep MIGTEST/migration-tagged rows quarantined unless provider-side proof promotes them.'
    )

    $receipt.status = 'COMPLETE'
} catch {
    $receipt.status = 'BLOCKED_OR_FAILED'
    $receipt.errors = @($_.Exception.Message)
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null
$receipt | ConvertTo-Json -Depth 12 | Set-Content -LiteralPath $OutputPath -Encoding UTF8

if ($receipt.status -ne 'COMPLETE') {
    exit 1
}
