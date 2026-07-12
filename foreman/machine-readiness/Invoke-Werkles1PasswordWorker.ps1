param(
    [ValidateSet('ReceiptOnly', 'BusinessVaultsAndInventory', 'FamilyVaults', 'FamilyVaultsAndInvites', 'Tier1GitHubItemCheck')]
    [string]$Mode = 'ReceiptOnly',

    [string]$Account = 'N7N3YHAZQNFY3HT7P4XG45DWIE',

    [string]$OutputPath = '.\outputs\werkles-1password-worker-receipt.json',

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
        return $null
    }

    return ($output -join [Environment]::NewLine) | ConvertFrom-Json
}

function ConvertTo-JsonObjectList {
    param(
        [AllowNull()]
        [object]$Value
    )

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

function Get-Sha256Text {
    param(
        [AllowNull()]
        [string]$Text
    )

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
    param(
        [Parameter(Mandatory = $true)]
        [object]$Item
    )

    return ($Item.title -match '^(?i)MIGTEST\b' -or (($Item.tags -join ' ') -match '(?i)migration-stage-testing|migration-gate|migration-row'))
}

function Get-RedactedTierCounts {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Items
    )

    $services = [ordered]@{
        '1Password' = '(?i)1password'
        'Google Workspace / Google Account' = '(?i)google|gmail|workspace'
        'GitHub' = '(?i)github'
        'Stripe' = '(?i)stripe'
        'Supabase' = '(?i)supabase'
        'Vercel' = '(?i)vercel'
    }

    foreach ($service in $services.Keys) {
        $pattern = $services[$service]
        $matches = @($Items | Where-Object {
            $_.title -match $pattern -or (($_.tags -join ' ') -match $pattern)
        })

        foreach ($group in ($matches | Group-Object { $_.vault.name })) {
            $migrationTagged = @($group.Group | Where-Object {
                $_.title -match '^(?i)MIGTEST\b' -or (($_.tags -join ' ') -match '(?i)migration-stage-testing|migration-gate|migration-row')
            })

            [pscustomobject]@{
                Service = $service
                Vault = $group.Name
                Count = $group.Count
                MigrationCandidateCount = $migrationTagged.Count
                NonMigrationCandidateCount = $group.Count - $migrationTagged.Count
            }
        }
    }
}

function Get-RedactedTierActionPlan {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Items
    )

    $services = [ordered]@{
        '1Password' = '(?i)1password'
        'Google Workspace / Google Account' = '(?i)google|gmail|workspace'
        'GitHub' = '(?i)github'
        'Stripe' = '(?i)stripe'
        'Supabase' = '(?i)supabase'
        'Vercel' = '(?i)vercel'
    }

    foreach ($service in $services.Keys) {
        $pattern = $services[$service]
        $matches = @($Items | Where-Object {
            $_.title -match $pattern -or (($_.tags -join ' ') -match $pattern)
        })

        if ($matches.Count -eq 0) {
            [pscustomobject]@{
                service = $service
                item_id = $null
                source_vault = $null
                title_sha256 = $null
                title_length = $null
                migration_candidate = $false
                recommended_action = 'NO_VISIBLE_CANDIDATE'
            }
            continue
        }

        foreach ($item in $matches) {
            $isMigration = Test-MigrationCandidate -Item $item
            $recommended = 'REVIEW'
            if ($service -eq 'GitHub' -and -not $isMigration -and $item.vault.name -eq 'Ben Work Admin') {
                $recommended = 'MOVE_TO_WERKLES_TIER1_PENDING_ACTION_CONFIRMATION'
            } elseif ($service -in @('Supabase', 'Vercel') -and -not $isMigration) {
                $recommended = 'VERIFY_OR_MOVE_IF_CONFIRMED'
            } elseif ($isMigration) {
                $recommended = 'KEEP_QUARANTINED_OR_MOVE_TO_MIGRATION_REVIEW'
            }

            [pscustomobject]@{
                service = $service
                item_id = $item.id
                source_vault = $item.vault.name
                title_sha256 = Get-Sha256Text -Text $item.title
                title_length = if ($null -eq $item.title) { 0 } else { ([string]$item.title).Length }
                migration_candidate = $isMigration
                recommended_action = $recommended
            }
        }
    }
}

function Get-RedactedItemFieldMetadata {
    param(
        [AllowNull()]
        [object[]]$Fields
    )

    foreach ($field in @(ConvertTo-JsonObjectList -Value $Fields)) {
        [pscustomobject]@{
            id = if ($field.id) { [string]$field.id } else { $null }
            label = if ($field.label) { [string]$field.label } else { $null }
            type = if ($field.type) { [string]$field.type } else { $null }
            purpose = if ($field.purpose) { [string]$field.purpose } else { $null }
            section_id = if ($field.section -and $field.section.id) { [string]$field.section.id } else { $null }
            section_label = if ($field.section -and $field.section.label) { [string]$field.section.label } else { $null }
        }
    }
}

function Test-FieldMetadataMatch {
    param(
        [Parameter(Mandatory = $true)]
        [object[]]$Metadata,
        [Parameter(Mandatory = $true)]
        [string]$Pattern
    )

    $metadataText = ($Metadata | ConvertTo-Json -Depth 6 -Compress)
    return ($metadataText -match $Pattern)
}

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $OutputPath) | Out-Null

$receipt = [ordered]@{
    timestamp = (Get-Date).ToString('o')
    machine = $env:COMPUTERNAME
    user = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    mode = $Mode
    account_uuid = $Account
    account_label = if ($Account -eq 'ITZZGKIRKVAAXJLMX7OQI7W7X4') { 'my.1password.com / benleak81@gmail.com' } else { 'werkles.1password.com / ben.leak@kindsir.com' }
    secret_boundary = 'metadata only; no item fields, passwords, OTP seeds, passkeys, recovery codes, Secret Keys, or notes'
    status = 'STARTED'
    vaults = @()
    users = @()
    invites = @()
    item_summary = $null
    tier_counts = @()
    tier_action_plan = @()
    tier1_item_check = $null
    errors = @()
}

try {
    if ($Mode -like 'FamilyVaults*') {
        $targetVaults = @(
            'Family Streaming',
            'Family Aeyes',
            'Joint Household',
            'Banking Delegate Review'
        )
    } else {
        $targetVaults = @(
            'Werkles - Tier 1 Human Gates',
            'Werkles - Automation',
            'Werkles - Operator Notes',
            'Werkles - Migration Cleanup Review'
        )
    }

    $vaults = @(ConvertTo-JsonObjectList -Value (Invoke-OpJson -Arguments @('vault', 'list', '--account', $Account, '--format', 'json')))

    if ($Mode -in @('BusinessVaultsAndInventory', 'FamilyVaults', 'FamilyVaultsAndInvites')) {
        foreach ($name in $targetVaults) {
            $existing = $vaults | Where-Object { $_.name -eq $name } | Select-Object -First 1
            if (-not $existing) {
                Invoke-OpJson -Arguments @('vault', 'create', $name, '--account', $Account, '--format', 'json') | Out-Null
            }
        }

        $vaults = @(ConvertTo-JsonObjectList -Value (Invoke-OpJson -Arguments @('vault', 'list', '--account', $Account, '--format', 'json')))
    }

    $receipt.vaults = @($vaults | Select-Object name, id, items, updated_at)

    if ($Mode -like 'FamilyVaults*') {
        $users = @(ConvertTo-JsonObjectList -Value (Invoke-OpJson -Arguments @('user', 'list', '--account', $Account, '--format', 'json')))
        $receipt.users = @($users | ForEach-Object {
            [pscustomobject]@{
                name = $_.name
                email = $_.email
                state = $_.state
                type = $_.type
            }
        })

        if ($Mode -eq 'FamilyVaultsAndInvites') {
            $targets = @(
                [pscustomobject]@{ Name = 'Courtney Leak'; Email = 'courtneydleak@gmail.com' },
                [pscustomobject]@{ Name = 'Annabelle Leak'; Email = 'annabelleleak18@gmail.com' }
            )

            foreach ($target in $targets) {
                $existingUser = $users | Where-Object { $_.email -eq $target.Email } | Select-Object -First 1
                if ($existingUser) {
                    $receipt.invites += [pscustomobject]@{
                        email = $target.Email
                        action = 'SKIPPED_ALREADY_PRESENT'
                        state = $existingUser.state
                    }
                } else {
                    $provisioned = Invoke-OpJson -Arguments @('user', 'provision', '--account', $Account, '--name', $target.Name, '--email', $target.Email, '--format', 'json')
                    $receipt.invites += [pscustomobject]@{
                        email = $target.Email
                        action = 'INVITE_SENT'
                        state = $provisioned.state
                    }
                }
            }

            $users = @(ConvertTo-JsonObjectList -Value (Invoke-OpJson -Arguments @('user', 'list', '--account', $Account, '--format', 'json')))
            $receipt.users = @($users | ForEach-Object {
                [pscustomobject]@{
                    name = $_.name
                    email = $_.email
                    state = $_.state
                    type = $_.type
                }
            })
        }
    }

    if ($Mode -eq 'BusinessVaultsAndInventory') {
        $items = @(ConvertTo-JsonObjectList -Value (Invoke-OpJson -Arguments @('item', 'list', '--account', $Account, '--format', 'json')))
        $receipt.item_summary = [ordered]@{
            total_items = $items.Count
            starts_with_migtest = @($items | Where-Object { $_.title -match '^(?i)MIGTEST\b' }).Count
            in_migration_staging = @($items | Where-Object { $_.vault.name -eq 'Werkles Migration Staging' }).Count
            tagged_migration_stage_testing = @($items | Where-Object { (($_.tags -join ' ') -match '(?i)migration-stage-testing') }).Count
            tagged_migration_gate = @($items | Where-Object { (($_.tags -join ' ') -match '(?i)migration-gate') }).Count
        }
        $receipt.tier_counts = @(Get-RedactedTierCounts -Items $items)
        $receipt.tier_action_plan = @(Get-RedactedTierActionPlan -Items $items)
    }

    if ($Mode -eq 'Tier1GitHubItemCheck') {
        $targetVaultName = 'Werkles - Tier 1 Human Gates'
        $targetItemTitle = 'GitHub - benleakwerkles'
        $item = Invoke-OpJson -Arguments @(
            'item', 'get', $targetItemTitle,
            '--vault', $targetVaultName,
            '--account', $Account,
            '--format', 'json'
        )

        $fieldMetadata = @(Get-RedactedItemFieldMetadata -Fields $item.fields)
        $urlMetadata = @()
        foreach ($url in @(ConvertTo-JsonObjectList -Value $item.urls)) {
            $urlMetadata += [pscustomobject]@{
                label = if ($url.label) { [string]$url.label } else { $null }
                href = if ($url.href) { [string]$url.href } else { $null }
            }
        }

        $receipt.tier1_item_check = [ordered]@{
            title_sha256 = Get-Sha256Text -Text $item.title
            title_length = if ($null -eq $item.title) { 0 } else { ([string]$item.title).Length }
            item_id = $item.id
            vault_name = if ($item.vault -and $item.vault.name) { [string]$item.vault.name } else { $targetVaultName }
            category = if ($item.category) { [string]$item.category } else { $null }
            urls = $urlMetadata
            field_metadata = $fieldMetadata
            has_password_like_metadata = Test-FieldMetadataMatch -Metadata $fieldMetadata -Pattern '(?i)password'
            has_totp_like_metadata = Test-FieldMetadataMatch -Metadata $fieldMetadata -Pattern '(?i)otp|totp|one.?time|authenticator'
            has_passkey_like_metadata = Test-FieldMetadataMatch -Metadata $fieldMetadata -Pattern '(?i)passkey|webauthn|public.?key|credential'
            value_fields_redacted = $true
        }
    }

    $receipt.status = 'COMPLETE'
} catch {
    $receipt.status = 'BLOCKED_OR_FAILED'
    $receipt.errors = @($_.Exception.Message)
}

$receipt | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath -Encoding UTF8

if ($receipt.status -ne 'COMPLETE') {
    exit 1
}

exit 0
