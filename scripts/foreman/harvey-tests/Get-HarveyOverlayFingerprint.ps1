function Get-HarveyOverlayFingerprint {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [Parameter(Mandatory = $true)]$Contract
    )

    $resolvedRoot = (Resolve-Path -LiteralPath $Root).Path.TrimEnd('\')
    $hashes = @{}
    foreach ($overlayPath in @($Contract.overlay_paths)) {
        $candidate = Join-Path $resolvedRoot ([string]$overlayPath)
        if (-not (Test-Path -LiteralPath $candidate)) { throw "OVERLAY_FINGERPRINT_PATH_MISSING: $overlayPath" }
        $items = if (Test-Path -LiteralPath $candidate -PathType Container) {
            @(Get-ChildItem -LiteralPath $candidate -Recurse -File)
        } else {
            @((Get-Item -LiteralPath $candidate))
        }
        foreach ($item in $items) {
            $relative = $item.FullName.Substring($resolvedRoot.Length).TrimStart('\').Replace('\','/')
            if ($relative.StartsWith('outputs/harvey-tests/', [System.StringComparison]::OrdinalIgnoreCase)) { continue }
            if ($relative.StartsWith('data/harvey/machine-control/', [System.StringComparison]::OrdinalIgnoreCase)) { continue }
            if ($relative.StartsWith('data/harvey/crew-bridge/', [System.StringComparison]::OrdinalIgnoreCase)) { continue }
            $hashes[$relative] = (Get-FileHash -Algorithm SHA256 -LiteralPath $item.FullName).Hash.ToLowerInvariant()
        }
    }
    $rows = @($hashes.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name):$($_.Value)" })
    $sha = [System.Security.Cryptography.SHA256]::Create()
    try {
        $digest = ([System.BitConverter]::ToString($sha.ComputeHash([System.Text.Encoding]::UTF8.GetBytes(($rows -join "`n"))))).Replace('-','').ToLowerInvariant()
    } finally {
        $sha.Dispose()
    }
    [pscustomobject]@{
        sha256 = $digest
        file_count = $rows.Count
        files = $rows
        excludes = @(
            'outputs/harvey-tests/** (generated evidence)',
            'data/harvey/machine-control/** (ephemeral runtime)',
            'data/harvey/crew-bridge/** (ephemeral runtime)'
        )
    }
}
