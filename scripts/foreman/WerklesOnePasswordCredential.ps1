#requires -Version 5.1

$script:WerklesOnePasswordCredentialTarget = "Werkles/1Password/WerklesAutomationServiceAccount"

function Get-WerklesOpBinary {
  if ($env:OP_BIN -and (Test-Path -LiteralPath $env:OP_BIN)) {
    return (Resolve-Path -LiteralPath $env:OP_BIN).Path
  }

  $stable = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages\AgileBits.1Password.CLI_Microsoft.Winget.Source_8wekyb3d8bbwe\op.exe"
  if (Test-Path -LiteralPath $stable) {
    return (Resolve-Path -LiteralPath $stable).Path
  }

  $beta = Join-Path $env:LOCALAPPDATA "1PasswordCLI-beta\op.exe"
  if (Test-Path -LiteralPath $beta) {
    return (Resolve-Path -LiteralPath $beta).Path
  }

  $cmd = Get-Command op -ErrorAction SilentlyContinue
  if ($cmd) {
    return $cmd.Source
  }

  throw "1Password CLI not found."
}

function Import-WerklesCredentialNative {
  if ("WerklesCredNative" -as [type]) {
    return
  }

  Add-Type @"
using System;
using System.Runtime.InteropServices;

public static class WerklesCredNative
{
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
    public struct Credential
    {
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

    [DllImport("advapi32.dll", EntryPoint = "CredWriteW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredWrite(ref Credential credential, UInt32 flags);

    [DllImport("advapi32.dll", EntryPoint = "CredReadW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredRead(string target, UInt32 type, UInt32 reservedFlag, out IntPtr credentialPtr);

    [DllImport("advapi32.dll", EntryPoint = "CredDeleteW", CharSet = CharSet.Unicode, SetLastError = true)]
    public static extern bool CredDelete(string target, UInt32 type, UInt32 flags);

    [DllImport("advapi32.dll")]
    public static extern void CredFree(IntPtr credentialPtr);
}
"@
}

function Set-WerklesOnePasswordServiceToken {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Token,
    [string]$UserName = "Werkles Automation service account",
    [string]$Target = $script:WerklesOnePasswordCredentialTarget
  )

  Import-WerklesCredentialNative

  $bytes = [System.Text.Encoding]::Unicode.GetBytes($Token)
  $blob = [System.Runtime.InteropServices.Marshal]::AllocCoTaskMem($bytes.Length)
  try {
    [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $blob, $bytes.Length)

    $credential = New-Object WerklesCredNative+Credential
    $credential.Type = 1
    $credential.TargetName = $Target
    $credential.UserName = $UserName
    $credential.CredentialBlob = $blob
    $credential.CredentialBlobSize = $bytes.Length
    $credential.Persist = 2

    $ok = [WerklesCredNative]::CredWrite([ref]$credential, 0)
    if (-not $ok) {
      throw (New-Object ComponentModel.Win32Exception([Runtime.InteropServices.Marshal]::GetLastWin32Error()))
    }
  } finally {
    if ($blob -ne [IntPtr]::Zero) {
      $zero = New-Object byte[] $bytes.Length
      [System.Runtime.InteropServices.Marshal]::Copy($zero, 0, $blob, $zero.Length)
      [System.Runtime.InteropServices.Marshal]::FreeCoTaskMem($blob)
    }
    [Array]::Clear($bytes, 0, $bytes.Length)
  }
}

function Get-WerklesOnePasswordServiceToken {
  param(
    [string]$Target = $script:WerklesOnePasswordCredentialTarget
  )

  Import-WerklesCredentialNative

  $ptr = [IntPtr]::Zero
  $ok = [WerklesCredNative]::CredRead($Target, 1, 0, [ref]$ptr)
  if (-not $ok) {
    return $null
  }

  try {
    $credential = [Runtime.InteropServices.Marshal]::PtrToStructure($ptr, [type][WerklesCredNative+Credential])
    if ($credential.CredentialBlobSize -eq 0 -or $credential.CredentialBlob -eq [IntPtr]::Zero) {
      return $null
    }

    $bytes = New-Object byte[] $credential.CredentialBlobSize
    [Runtime.InteropServices.Marshal]::Copy($credential.CredentialBlob, $bytes, 0, $bytes.Length)
    try {
      return [System.Text.Encoding]::Unicode.GetString($bytes)
    } finally {
      [Array]::Clear($bytes, 0, $bytes.Length)
    }
  } finally {
    if ($ptr -ne [IntPtr]::Zero) {
      [WerklesCredNative]::CredFree($ptr)
    }
  }
}

function Remove-WerklesOnePasswordServiceToken {
  param(
    [string]$Target = $script:WerklesOnePasswordCredentialTarget
  )

  Import-WerklesCredentialNative
  $ok = [WerklesCredNative]::CredDelete($Target, 1, 0)
  if (-not $ok) {
    $errorCode = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
    if ($errorCode -ne 1168) {
      throw (New-Object ComponentModel.Win32Exception($errorCode))
    }
  }
}
