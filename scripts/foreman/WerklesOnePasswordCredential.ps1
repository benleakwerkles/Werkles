Set-StrictMode -Version 2.0

$script:WerklesOnePasswordCredentialTarget = 'Werkles/1Password/AutomationToken'

function Get-WerklesRepositoryRoot {
    [CmdletBinding()]
    param()

    return (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
}

function Get-WerklesOnePasswordCredentialTarget {
    [CmdletBinding()]
    param()

    return $script:WerklesOnePasswordCredentialTarget
}

function Initialize-WerklesCredentialInterop {
    [CmdletBinding()]
    param()

    if ('WerklesCredentialManager.NativeMethods' -as [type]) {
        return
    }

    Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;

namespace WerklesCredentialManager {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct NativeCredential {
        public UInt32 Flags;
        public UInt32 Type;
        public string TargetName;
        public string Comment;
        public System.Runtime.InteropServices.ComTypes.FILETIME LastWritten;
        public UInt32 CredentialBlobSize;
        public IntPtr CredentialBlob;
        public UInt32 Persist;
        public UInt32 AttributeCount;
        public IntPtr Attributes;
        public string TargetAlias;
        public string UserName;
    }

    public static class NativeMethods {
        [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool CredRead(string target, UInt32 type, UInt32 reservedFlag, out IntPtr credentialPtr);

        [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool CredWrite(ref NativeCredential credential, UInt32 flags);

        [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
        public static extern bool CredDelete(string target, UInt32 type, UInt32 flags);

        [DllImport("advapi32.dll", SetLastError = true)]
        public static extern void CredFree(IntPtr buffer);
    }
}
"@
}

function Get-WerklesOnePasswordCliCandidates {
    [CmdletBinding()]
    param()

    $paths = New-Object System.Collections.Generic.List[string]

    try {
        Get-Command op -All -ErrorAction SilentlyContinue | ForEach-Object {
            if ($_.Source) {
                $paths.Add($_.Source)
            }
        }
    } catch {
        # PATH lookup is best-effort; known locations below still run.
    }

    $knownPaths = @(
        (Join-Path $env:ProgramFiles '1Password CLI\op.exe'),
        (Join-Path $env:ProgramFiles '1Password\op.exe'),
        (Join-Path ${env:ProgramFiles(x86)} '1Password CLI\op.exe'),
        (Join-Path $env:LOCALAPPDATA 'Programs\1Password CLI\op.exe'),
        (Join-Path $env:LOCALAPPDATA '1Password\app\8\op.exe')
    )

    foreach ($path in $knownPaths) {
        if ($path) {
            $paths.Add($path)
        }
    }

    $wingetPackages = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages'
    if (Test-Path $wingetPackages) {
        Get-ChildItem -Path $wingetPackages -Filter op.exe -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
            $paths.Add($_.FullName)
        }
    }

    $paths |
        Where-Object { $_ -and (Test-Path -LiteralPath $_) } |
        Sort-Object -Unique |
        ForEach-Object {
            $file = Get-Item -LiteralPath $_
            $signature = Get-AuthenticodeSignature -LiteralPath $file.FullName -ErrorAction SilentlyContinue
            $signer = $null
            if ($signature -and $signature.SignerCertificate) {
                $signer = $signature.SignerCertificate.Subject
            }

            $isStable = ($file.FullName -notmatch '(?i)(beta|preview|nightly|dev)')
            $isSignedByExpectedPublisher = $false
            if ($signature -and $signature.Status -eq 'Valid' -and $signer -match '(?i)(AgileBits|1Password)') {
                $isSignedByExpectedPublisher = $true
            }

            [pscustomobject]@{
                Path = $file.FullName
                Version = $file.VersionInfo.ProductVersion
                SignatureStatus = if ($signature) { [string]$signature.Status } else { 'Unknown' }
                Signer = $signer
                IsStable = $isStable
                IsSignedByExpectedPublisher = $isSignedByExpectedPublisher
            }
        }
}

function Resolve-WerklesOnePasswordCli {
    [CmdletBinding()]
    param(
        [switch]$AllowUnsignedFallback
    )

    $candidates = @(Get-WerklesOnePasswordCliCandidates)
    if ($candidates.Count -eq 0) {
        return $null
    }

    $best = @($candidates | Where-Object { $_.IsStable -and $_.IsSignedByExpectedPublisher } | Select-Object -First 1)
    if ($best.Count -gt 0) {
        return $best[0]
    }

    $signedFallback = @($candidates | Where-Object { $_.IsSignedByExpectedPublisher } | Select-Object -First 1)
    if ($signedFallback.Count -gt 0) {
        return $signedFallback[0]
    }

    if ($AllowUnsignedFallback) {
        $stableFallback = @($candidates | Where-Object { $_.IsStable } | Select-Object -First 1)
        if ($stableFallback.Count -gt 0) {
            return $stableFallback[0]
        }

        return $candidates[0]
    }

    return $null
}

function ConvertTo-WerklesPlainText {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [securestring]$SecureValue
    )

    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureValue)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    } finally {
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}

function Get-WerklesOnePasswordAutomationSecret {
    [CmdletBinding()]
    param(
        [string]$TargetName = (Get-WerklesOnePasswordCredentialTarget)
    )

    Initialize-WerklesCredentialInterop

    $credentialPtr = [IntPtr]::Zero
    $found = [WerklesCredentialManager.NativeMethods]::CredRead($TargetName, 1, 0, [ref]$credentialPtr)
    if (-not $found -or $credentialPtr -eq [IntPtr]::Zero) {
        return $null
    }

    try {
        $credential = [Runtime.InteropServices.Marshal]::PtrToStructure(
            $credentialPtr,
            [type][WerklesCredentialManager.NativeCredential]
        )

        if ($credential.CredentialBlobSize -eq 0 -or $credential.CredentialBlob -eq [IntPtr]::Zero) {
            return $null
        }

        return [Runtime.InteropServices.Marshal]::PtrToStringUni(
            $credential.CredentialBlob,
            [int]($credential.CredentialBlobSize / 2)
        )
    } finally {
        [WerklesCredentialManager.NativeMethods]::CredFree($credentialPtr)
    }
}

function Test-WerklesOnePasswordAutomationSecretPresent {
    [CmdletBinding()]
    param(
        [string]$TargetName = (Get-WerklesOnePasswordCredentialTarget)
    )

    Initialize-WerklesCredentialInterop

    $credentialPtr = [IntPtr]::Zero
    $found = [WerklesCredentialManager.NativeMethods]::CredRead($TargetName, 1, 0, [ref]$credentialPtr)
    if (-not $found -or $credentialPtr -eq [IntPtr]::Zero) {
        return $false
    }

    try {
        $credential = [Runtime.InteropServices.Marshal]::PtrToStructure(
            $credentialPtr,
            [type][WerklesCredentialManager.NativeCredential]
        )

        return ($credential.CredentialBlobSize -gt 0 -and $credential.CredentialBlob -ne [IntPtr]::Zero)
    } finally {
        [WerklesCredentialManager.NativeMethods]::CredFree($credentialPtr)
    }
}

function Test-WerklesOnePasswordAutomationCredential {
    [CmdletBinding()]
    param()

    $targetName = Get-WerklesOnePasswordCredentialTarget
    $environmentTokenPresent = -not [string]::IsNullOrWhiteSpace($env:OP_SERVICE_ACCOUNT_TOKEN)
    $storedCredentialPresent = Test-WerklesOnePasswordAutomationSecretPresent -TargetName $targetName

    $authSource = 'NONE'
    if ($environmentTokenPresent) {
        $authSource = 'ENVIRONMENT'
    } elseif ($storedCredentialPresent) {
        $authSource = 'WINDOWS_CREDENTIAL_MANAGER'
    }

    [pscustomobject]@{
        AuthSource = $authSource
        CredentialTarget = $targetName
        EnvironmentTokenPresent = $environmentTokenPresent
        StoredCredentialPresent = $storedCredentialPresent
    }
}

function Set-WerklesOnePasswordAutomationSecret {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [Parameter(Mandatory = $true)]
        [securestring]$Secret,

        [string]$TargetName = (Get-WerklesOnePasswordCredentialTarget)
    )

    Initialize-WerklesCredentialInterop

    $plainText = ConvertTo-WerklesPlainText -SecureValue $Secret
    if ([string]::IsNullOrWhiteSpace($plainText)) {
        throw 'Refusing to store an empty 1Password automation token.'
    }

    $bytes = [Text.Encoding]::Unicode.GetBytes($plainText)
    if ($bytes.Length -gt 5120) {
        throw 'The 1Password automation token is too large for a Windows Credential Manager generic credential.'
    }

    $blobPtr = [Runtime.InteropServices.Marshal]::AllocCoTaskMem($bytes.Length)
    try {
        [Runtime.InteropServices.Marshal]::Copy($bytes, 0, $blobPtr, $bytes.Length)

        $credential = New-Object WerklesCredentialManager.NativeCredential
        $credential.Type = 1
        $credential.TargetName = $TargetName
        $credential.CredentialBlobSize = [uint32]$bytes.Length
        $credential.CredentialBlob = $blobPtr
        $credential.Persist = 2
        $credential.UserName = $env:USERNAME
        $credential.Comment = 'Werkles 1Password automation service token for non-interactive Codex runs.'

        if ($PSCmdlet.ShouldProcess($TargetName, 'Store 1Password automation token in Windows Credential Manager')) {
            $written = [WerklesCredentialManager.NativeMethods]::CredWrite([ref]$credential, 0)
            if (-not $written) {
                $errorCode = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
                throw "Windows Credential Manager write failed. Win32Error=$errorCode"
            }
        }
    } finally {
        if ($bytes) {
            [Array]::Clear($bytes, 0, $bytes.Length)
        }

        if ($blobPtr -ne [IntPtr]::Zero) {
            $zeroBytes = New-Object byte[] ($bytes.Length)
            [Runtime.InteropServices.Marshal]::Copy($zeroBytes, 0, $blobPtr, $zeroBytes.Length)
            [Runtime.InteropServices.Marshal]::FreeCoTaskMem($blobPtr)
        }

        $plainText = $null
    }
}

function Remove-WerklesOnePasswordAutomationSecret {
    [CmdletBinding(SupportsShouldProcess = $true)]
    param(
        [string]$TargetName = (Get-WerklesOnePasswordCredentialTarget)
    )

    Initialize-WerklesCredentialInterop

    if ($PSCmdlet.ShouldProcess($TargetName, 'Remove 1Password automation token from Windows Credential Manager')) {
        [void][WerklesCredentialManager.NativeMethods]::CredDelete($TargetName, 1, 0)
    }
}

function Get-WerklesWindowsHelloStatus {
    [CmdletBinding()]
    param()

    $values = @{}
    try {
        $output = & dsregcmd /status 2>$null
        foreach ($line in $output) {
            if ($line -match '^\s*([^:]+?)\s*:\s*(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                if ($key -in @('AzureAdJoined', 'Device Name', 'NgcSet', 'NgcKeyId', 'CanReset', 'WamDefaultSet', 'KeySignTest', 'PreReqResult', 'Executing Account Name')) {
                    $values[$key] = $value
                }
            }
        }
    } catch {
        $values['Error'] = $_.Exception.Message
    }

    [pscustomobject]@{
        AzureAdJoined = $values['AzureAdJoined']
        DeviceName = $values['Device Name']
        NgcSet = $values['NgcSet']
        NgcKeyId = $values['NgcKeyId']
        CanReset = $values['CanReset']
        WamDefaultSet = $values['WamDefaultSet']
        KeySignTest = $values['KeySignTest']
        PreReqResult = $values['PreReqResult']
        ExecutingAccountName = $values['Executing Account Name']
        Error = $values['Error']
    }
}

function Get-WerklesOnePasswordAutomationReadiness {
    [CmdletBinding()]
    param()

    $cli = Resolve-WerklesOnePasswordCli
    $candidates = @(Get-WerklesOnePasswordCliCandidates)
    $credential = Test-WerklesOnePasswordAutomationCredential
    $hello = Get-WerklesWindowsHelloStatus

    $isReady = $false
    $reason = 'OK'

    if (-not $cli) {
        $reason = 'OP_CLI: MISSING_OR_UNSIGNED'
    } elseif ($credential.AuthSource -eq 'NONE') {
        $reason = 'OP_AUTH_SOURCE: NONE'
    } else {
        $isReady = $true
    }

    [pscustomobject]@{
        Ready = $isReady
        Reason = $reason
        RepositoryRoot = Get-WerklesRepositoryRoot
        MachineName = $env:COMPUTERNAME
        UserName = $env:USERNAME
        Credential = $credential
        OnePasswordCli = $cli
        OnePasswordCliCandidates = $candidates
        WindowsHello = $hello
    }
}
