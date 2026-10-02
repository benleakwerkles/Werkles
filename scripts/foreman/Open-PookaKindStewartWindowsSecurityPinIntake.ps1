#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$StoreRoot = (Join-Path $env:LOCALAPPDATA "PookaKind\Stewart\PrivateDock"),
  [switch]$SelfTest
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Security

function Set-StewartCurrentUserOnlyAcl {
  param([Parameter(Mandatory)][string]$Path, [switch]$Directory)

  $identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
  if ($Directory) {
    $security = [Security.AccessControl.DirectorySecurity]::new()
    $inheritance = [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
  } else {
    $security = [Security.AccessControl.FileSecurity]::new()
    $inheritance = [Security.AccessControl.InheritanceFlags]::None
  }
  $security.SetAccessRuleProtection($true, $false)
  $security.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
    $identity,
    [Security.AccessControl.FileSystemRights]::FullControl,
    $inheritance,
    [Security.AccessControl.PropagationFlags]::None,
    [Security.AccessControl.AccessControlType]::Allow
  ))
  if ($Directory) {
    [IO.DirectoryInfo]::new($Path).SetAccessControl($security)
  } else {
    [IO.FileInfo]::new($Path).SetAccessControl($security)
  }
}

function Convert-StewartSecurePinToUtf16Bytes {
  param([Parameter(Mandatory)][System.Security.SecureString]$Pin)

  $bstr = [IntPtr]::Zero
  try {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Pin)
    $length = [Runtime.InteropServices.Marshal]::ReadInt32($bstr, -4)
    if ($length -lt 8 -or $length -gt 32 -or ($length % 2) -ne 0) {
      throw "Blind PIN must contain 4-16 digits."
    }
    $plainBytes = [byte[]]::new($length)
    [Runtime.InteropServices.Marshal]::Copy($bstr, $plainBytes, 0, $length)
    for ($index = 0; $index -lt $plainBytes.Length; $index += 2) {
      if ($plainBytes[$index] -lt 48 -or $plainBytes[$index] -gt 57 -or $plainBytes[$index + 1] -ne 0) {
        [Array]::Clear($plainBytes, 0, $plainBytes.Length)
        throw "Blind PIN must contain digits only."
      }
    }
    return ,$plainBytes
  } finally {
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  }
}

function Protect-StewartWindowsSecurityPin {
  param([Parameter(Mandatory)][System.Security.SecureString]$Pin)

  $plainBytes = $null
  $protectedBytes = $null
  try {
    $plainBytes = Convert-StewartSecurePinToUtf16Bytes -Pin $Pin
    $protectedBytes = [Security.Cryptography.ProtectedData]::Protect(
      $plainBytes,
      $null,
      [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    $hex = [BitConverter]::ToString($protectedBytes).Replace("-", "")
    return ,([Text.Encoding]::ASCII.GetBytes($hex))
  } finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    if ($protectedBytes) { [Array]::Clear($protectedBytes, 0, $protectedBytes.Length) }
  }
}

function Save-StewartWindowsSecurityPinAtomically {
  param(
    [Parameter(Mandatory)][System.Security.SecureString]$Pin,
    [Parameter(Mandatory)][string]$Root
  )

  $resolvedRoot = [IO.Path]::GetFullPath($Root)
  New-Item -ItemType Directory -Path $resolvedRoot -Force | Out-Null
  Set-StewartCurrentUserOnlyAcl -Path $resolvedRoot -Directory
  $destination = Join-Path $resolvedRoot "device-pin.dpapi.txt"
  $temporary = Join-Path $resolvedRoot (".device-pin.{0}.pending" -f [Guid]::NewGuid().ToString("N"))
  $backup = Join-Path $resolvedRoot (".device-pin.{0}.replaced" -f [Guid]::NewGuid().ToString("N"))
  $payload = $null
  try {
    $payload = Protect-StewartWindowsSecurityPin -Pin $Pin
    $stream = [IO.FileStream]::new($temporary, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try {
      $stream.Write($payload, 0, $payload.Length)
      $stream.Flush($true)
    } finally {
      $stream.Dispose()
    }
    Set-StewartCurrentUserOnlyAcl -Path $temporary
    if (Test-Path -LiteralPath $destination -PathType Leaf) {
      [IO.File]::Replace($temporary, $destination, $backup, $true)
    } else {
      [IO.File]::Move($temporary, $destination)
    }
    Set-StewartCurrentUserOnlyAcl -Path $destination
  } finally {
    if ($payload) { [Array]::Clear($payload, 0, $payload.Length) }
    if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
    if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Force }
  }
}

function Test-StewartWindowsSecurityPinReadback {
  param(
    [Parameter(Mandatory)][System.Security.SecureString]$Expected,
    [Parameter(Mandatory)][string]$Root
  )

  $expectedBytes = $null
  $protectedBytes = $null
  $recoveredBytes = $null
  try {
    $expectedBytes = Convert-StewartSecurePinToUtf16Bytes -Pin $Expected
    $hex = [IO.File]::ReadAllText((Join-Path $Root "device-pin.dpapi.txt"), [Text.Encoding]::ASCII).Trim()
    if ($hex -notmatch '^[0-9A-F]+$' -or ($hex.Length % 2) -ne 0) { throw "SELF_TEST_PIN_ENCODING_INVALID" }
    $protectedBytes = [byte[]]::new($hex.Length / 2)
    for ($index = 0; $index -lt $protectedBytes.Length; $index++) {
      $protectedBytes[$index] = [Convert]::ToByte($hex.Substring($index * 2, 2), 16)
    }
    $recoveredBytes = [Security.Cryptography.ProtectedData]::Unprotect(
      $protectedBytes,
      $null,
      [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    if ($recoveredBytes.Length -ne $expectedBytes.Length) { return $false }
    for ($index = 0; $index -lt $expectedBytes.Length; $index++) {
      if ($expectedBytes[$index] -ne $recoveredBytes[$index]) { return $false }
    }
    return $true
  } finally {
    if ($expectedBytes) { [Array]::Clear($expectedBytes, 0, $expectedBytes.Length) }
    if ($protectedBytes) { [Array]::Clear($protectedBytes, 0, $protectedBytes.Length) }
    if ($recoveredBytes) { [Array]::Clear($recoveredBytes, 0, $recoveredBytes.Length) }
  }
}

if ($SelfTest) {
  $tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
  $proofRoot = Join-Path $tempBase ("stewart-pin-intake-proof-" + [Guid]::NewGuid().ToString("N"))
  $resolvedProofRoot = [IO.Path]::GetFullPath($proofRoot)
  if (-not $resolvedProofRoot.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase)) { throw "SELF_TEST_ROOT_INVALID" }
  $first = ConvertTo-SecureString "1234" -AsPlainText -Force
  $second = ConvertTo-SecureString "567890" -AsPlainText -Force
  try {
    Save-StewartWindowsSecurityPinAtomically -Pin $first -Root $resolvedProofRoot
    if (-not (Test-StewartWindowsSecurityPinReadback -Expected $first -Root $resolvedProofRoot)) { throw "SELF_TEST_CREATE_READBACK_FAILED" }
    Save-StewartWindowsSecurityPinAtomically -Pin $second -Root $resolvedProofRoot
    if (-not (Test-StewartWindowsSecurityPinReadback -Expected $second -Root $resolvedProofRoot)) { throw "SELF_TEST_REPLACE_READBACK_FAILED" }
    if (Test-StewartWindowsSecurityPinReadback -Expected $first -Root $resolvedProofRoot) { throw "SELF_TEST_OLD_VALUE_REMAINED" }
    if (@(Get-ChildItem -LiteralPath $resolvedProofRoot -File -Filter "*.pending").Count -ne 0) { throw "SELF_TEST_PENDING_FILE_REMAINED" }
    if (@(Get-ChildItem -LiteralPath $resolvedProofRoot -File -Filter "*.replaced").Count -ne 0) { throw "SELF_TEST_BACKUP_FILE_REMAINED" }
    $acl = Get-Acl -LiteralPath (Join-Path $resolvedProofRoot "device-pin.dpapi.txt")
    $currentSid = [Security.Principal.WindowsIdentity]::GetCurrent().User.Value
    $access = @($acl.Access)
    if (-not $acl.AreAccessRulesProtected -or $access.Count -ne 1 -or
      $access[0].IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -ne $currentSid) {
      throw "SELF_TEST_CURRENT_USER_ONLY_DACL_FAILED"
    }
    Write-Output "STEWART_WINDOWS_SECURITY_PIN_INTAKE_SELF_TEST_PASS"
  } finally {
    $first.Dispose()
    $second.Dispose()
    if (Test-Path -LiteralPath $resolvedProofRoot) { Remove-Item -LiteralPath $resolvedProofRoot -Recurse -Force }
  }
  exit 0
}

Add-Type -AssemblyName PresentationFramework
[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        Title="Stewart — Windows Security Blind PIN" Height="360" Width="620"
        WindowStartupLocation="CenterScreen" ResizeMode="NoResize" Topmost="True"
        Background="#101722" Foreground="#F3F4F6">
  <Grid Margin="26">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/>
      <RowDefinition Height="Auto"/><RowDefinition Height="*"/>
    </Grid.RowDefinitions>
    <TextBlock Grid.Row="0" FontSize="24" FontWeight="Bold" Text="Windows Security Blind PIN"/>
    <TextBlock Grid.Row="1" Margin="0,8,0,18" Foreground="#B8C2D1" TextWrapping="Wrap"
               Text="This changes only Stewart's encrypted Windows Security PIN slot on Doss. The existing value is never revealed. Enter 4-16 digits; nothing is copied, logged, hashed, sent, or stored in the repository."/>
    <StackPanel Grid.Row="2" Margin="0,0,0,14">
      <TextBlock Text="Blind PIN" Margin="0,0,0,5"/>
      <PasswordBox Name="PinValue" Height="32" MaxLength="16"/>
    </StackPanel>
    <TextBlock Name="Status" Grid.Row="3" MinHeight="42" Foreground="#FBBF24" TextWrapping="Wrap"/>
    <StackPanel Grid.Row="4" Orientation="Horizontal" HorizontalAlignment="Right" VerticalAlignment="Bottom">
      <Button Name="SavePin" Content="Store / replace Blind PIN" Padding="18,10" Margin="0,0,10,0" Background="#93C5FD" Foreground="#172554"/>
      <Button Name="Done" Content="Done" Padding="18,10" Background="#CBD5E1" Foreground="#0F172A"/>
    </StackPanel>
  </Grid>
</Window>
'@

$reader = [System.Xml.XmlNodeReader]::new($xaml)
$window = [Windows.Markup.XamlReader]::Load($reader)
$pinValue = $window.FindName("PinValue")
$status = $window.FindName("Status")
$savePin = $window.FindName("SavePin")
$done = $window.FindName("Done")
$pinPath = Join-Path ([IO.Path]::GetFullPath($StoreRoot)) "device-pin.dpapi.txt"
$status.Text = if (Test-Path -LiteralPath $pinPath -PathType Leaf) {
  "An encrypted Blind PIN slot already exists. Saving replaces only that exact slot atomically."
} else {
  "No encrypted Blind PIN slot exists yet. Saving creates the exact slot used by Stewart's Windows Security runner."
}

$savePin.Add_Click({
  $secureCopy = $null
  try {
    $secureCopy = $pinValue.SecurePassword
    Save-StewartWindowsSecurityPinAtomically -Pin $secureCopy -Root $StoreRoot
    $pinValue.Clear()
    $status.Foreground = "#6EE7B7"
    $status.Text = "Blind PIN encrypted slot stored or replaced atomically. No value was displayed. Choose Done, then send BVPGM for one bounded PID-bound attempt."
  } catch {
    $pinValue.Clear()
    $status.Foreground = "#FCA5A5"
    $status.Text = $_.Exception.Message
  } finally {
    if ($secureCopy) { $secureCopy.Dispose() }
  }
})

$done.Add_Click({ $window.Close() })
$window.Add_Closed({ $pinValue.Clear() })
$window.ShowDialog() | Out-Null
