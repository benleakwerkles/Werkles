#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$StoreRoot = (Join-Path $env:LOCALAPPDATA "PookaKind\Stewart\SecretHandles"),
  [ValidatePattern('^$|^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$')]
  [string]$SuggestedHandle = "",
  [string]$PurposeLabel = "Private value"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName PresentationFramework
Add-Type -AssemblyName System.Security

function Set-StewartCurrentUserOnlyDirectoryAcl {
  param([Parameter(Mandatory)][string]$Path)

  $identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $security = [Security.AccessControl.DirectorySecurity]::new()
  $security.SetAccessRuleProtection($true, $false)
  $security.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
    $identity,
    [Security.AccessControl.FileSystemRights]::FullControl,
    [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit,
    [Security.AccessControl.PropagationFlags]::None,
    [Security.AccessControl.AccessControlType]::Allow
  ))
  [IO.DirectoryInfo]::new($Path).SetAccessControl($security)
}

function Set-StewartCurrentUserOnlyFileAcl {
  param([Parameter(Mandatory)][string]$Path)

  $identity = [Security.Principal.WindowsIdentity]::GetCurrent().User
  $security = [Security.AccessControl.FileSecurity]::new()
  $security.SetAccessRuleProtection($true, $false)
  $security.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
    $identity,
    [Security.AccessControl.FileSystemRights]::FullControl,
    [Security.AccessControl.AccessControlType]::Allow
  ))
  [IO.FileInfo]::new($Path).SetAccessControl($security)
}

function Protect-StewartSecret {
  param(
    [Parameter(Mandatory)][System.Security.SecureString]$Secret,
    [Parameter(Mandatory)][string]$Handle
  )

  $bstr = [IntPtr]::Zero
  $plainBytes = $null
  $entropy = $null
  try {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
    $length = [Runtime.InteropServices.Marshal]::ReadInt32($bstr, -4)
    if ($length -le 0) { throw "STEWART_PRIVATE_INTAKE_SECRET_REQUIRED" }
    $plainBytes = [byte[]]::new($length)
    [Runtime.InteropServices.Marshal]::Copy($bstr, $plainBytes, 0, $length)
    $entropy = [Text.Encoding]::UTF8.GetBytes("Werkles.PookaKind.Stewart.SecretHandle.v1:$Handle")
    $cipherBytes = [Security.Cryptography.ProtectedData]::Protect(
      $plainBytes,
      $entropy,
      [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    return ,$cipherBytes
  } finally {
    if ($plainBytes) { [Array]::Clear($plainBytes, 0, $plainBytes.Length) }
    if ($entropy) { [Array]::Clear($entropy, 0, $entropy.Length) }
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  }
}

function Protect-StewartDevicePin {
  param([Parameter(Mandatory)][System.Security.SecureString]$Secret)

  $bstr = [IntPtr]::Zero
  $plainBytes = $null
  $protectedBytes = $null
  try {
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($Secret)
    $length = [Runtime.InteropServices.Marshal]::ReadInt32($bstr, -4)
    if ($length -lt 8 -or $length -gt 32 -or ($length % 2) -ne 0) {
      throw "Blind PIN must contain 4-16 digits."
    }
    $plainBytes = [byte[]]::new($length)
    [Runtime.InteropServices.Marshal]::Copy($bstr, $plainBytes, 0, $length)
    for ($index = 0; $index -lt $plainBytes.Length; $index += 2) {
      if ($plainBytes[$index] -lt 48 -or $plainBytes[$index] -gt 57 -or $plainBytes[$index + 1] -ne 0) {
        throw "Blind PIN must contain digits only."
      }
    }
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
    if ($bstr -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr) }
  }
}

New-Item -ItemType Directory -Path $StoreRoot -Force | Out-Null
Set-StewartCurrentUserOnlyDirectoryAcl -Path $StoreRoot

function Save-StewartProtectedHandleAtomically {
  param(
    [Parameter(Mandatory)][System.Security.SecureString]$Secret,
    [Parameter(Mandatory)][string]$Handle,
    [Parameter(Mandatory)][string]$Destination,
    [Parameter(Mandatory)][ValidateSet("Create", "Replace")][string]$Mode,
    [ValidateSet("General", "DevicePin")][string]$Purpose = "General"
  )

  $destinationExists = Test-Path -LiteralPath $Destination -PathType Leaf
  if ($Mode -eq "Create" -and $destinationExists) {
    throw "That handle already exists; choose it below to replace it explicitly."
  }
  if ($Mode -eq "Replace" -and -not $destinationExists) {
    throw "The selected handle no longer exists; refresh and choose again."
  }

  $protected = $null
  $destinationDirectory = [IO.Path]::GetDirectoryName([IO.Path]::GetFullPath($Destination))
  New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  Set-StewartCurrentUserOnlyDirectoryAcl -Path $destinationDirectory
  $temporary = Join-Path $destinationDirectory (".{0}.{1}.pending" -f $Handle, [Guid]::NewGuid().ToString("N"))
  $backup = Join-Path $destinationDirectory (".{0}.{1}.replaced" -f $Handle, [Guid]::NewGuid().ToString("N"))
  try {
    $protected = if ($Purpose -eq "DevicePin") {
      Protect-StewartDevicePin -Secret $Secret
    } else {
      Protect-StewartSecret -Secret $Secret -Handle $Handle
    }
    $stream = [IO.FileStream]::new($temporary, [IO.FileMode]::CreateNew, [IO.FileAccess]::Write, [IO.FileShare]::None)
    try {
      $stream.Write($protected, 0, $protected.Length)
      $stream.Flush($true)
    } finally {
      $stream.Dispose()
    }
    Set-StewartCurrentUserOnlyFileAcl -Path $temporary

    if ($Mode -eq "Replace") {
      [IO.File]::Replace($temporary, $Destination, $backup, $true)
    } else {
      [IO.File]::Move($temporary, $Destination)
    }
    Set-StewartCurrentUserOnlyFileAcl -Path $Destination
  } finally {
    if ($protected) { [Array]::Clear($protected, 0, $protected.Length) }
    if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
    if (Test-Path -LiteralPath $backup) { Remove-Item -LiteralPath $backup -Force }
  }
}

[xml]$xaml = @'
<Window xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        Title="Stewart Private Intake - Blind PIN Ready" Height="500" Width="760"
        WindowStartupLocation="CenterScreen" ResizeMode="NoResize"
        Background="#101722" Foreground="#F3F4F6">
  <Grid Margin="24">
    <Grid.RowDefinitions>
      <RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/>
      <RowDefinition Height="Auto"/><RowDefinition Height="Auto"/><RowDefinition Height="Auto"/>
      <RowDefinition Height="Auto"/><RowDefinition Height="*"/>
    </Grid.RowDefinitions>
    <TextBlock Grid.Row="0" FontSize="24" FontWeight="Bold" Text="Stewart Private Intake"/>
    <TextBlock Grid.Row="1" Margin="0,8,0,18" Foreground="#B8C2D1" TextWrapping="Wrap"
               Text="Add or explicitly replace one private handle at a time. Values stay on Doss, protected for this Windows user. Existing values are never revealed, and neither old nor new values appear in chat, logs, receipts, or the repository."/>
    <StackPanel Grid.Row="2" Margin="0,0,0,12">
      <TextBlock Text="New handle name" Margin="0,0,0,4"/>
      <TextBox Name="HandleName" Height="30" ToolTip="Letters, numbers, dot, underscore, or hyphen"/>
    </StackPanel>
    <StackPanel Grid.Row="3" Margin="0,0,0,12">
      <TextBlock Text="Or replace an existing handle" Margin="0,0,0,4"/>
      <ComboBox Name="ExistingHandles" Height="30"/>
    </StackPanel>
    <StackPanel Grid.Row="4" Margin="0,0,0,12">
      <TextBlock Text="Private value" Margin="0,0,0,4"/>
      <PasswordBox Name="SecretValue" Height="30"/>
    </StackPanel>
    <TextBlock Grid.Row="5" Margin="0,0,0,10" Foreground="#B8C2D1" TextWrapping="Wrap"
               Text="Store new never overwrites. Replace selected handle changes only the exact selection above, using an atomic same-folder swap."/>
    <TextBlock Name="Status" Grid.Row="6" MinHeight="38" Foreground="#FBBF24" TextWrapping="Wrap"/>
    <StackPanel Grid.Row="7" Orientation="Horizontal" HorizontalAlignment="Right" VerticalAlignment="Bottom">
      <Button Name="SaveHandle" Content="Store new handle" Padding="18,9" Margin="0,0,10,0" Background="#6EE7B7" Foreground="#052E16"/>
      <Button Name="ReplaceHandle" Content="Replace selected handle" Padding="18,9" Margin="0,0,10,0" Background="#FBBF24" Foreground="#422006"/>
      <Button Name="SaveBlindPin" Content="Store / replace Blind PIN" Padding="18,9" Margin="0,0,10,0" Background="#93C5FD" Foreground="#172554"/>
      <Button Name="CloseWindow" Content="Done" Padding="18,9" Background="#CBD5E1" Foreground="#0F172A"/>
    </StackPanel>
  </Grid>
</Window>
'@

$reader = [System.Xml.XmlNodeReader]::new($xaml)
$window = [Windows.Markup.XamlReader]::Load($reader)
$handleName = $window.FindName("HandleName")
$existingHandles = $window.FindName("ExistingHandles")
$secretValue = $window.FindName("SecretValue")
$status = $window.FindName("Status")
$saveHandle = $window.FindName("SaveHandle")
$replaceHandle = $window.FindName("ReplaceHandle")
$saveBlindPin = $window.FindName("SaveBlindPin")
$closeWindow = $window.FindName("CloseWindow")

if ($SuggestedHandle) {
  $handleName.Text = $SuggestedHandle
}
$window.Title = "Stewart Private Intake - $PurposeLabel"
$status.Text = "Store the private $PurposeLabel value. Stewart will return only sanitized custody evidence."

function Update-StewartHandleList {
  param([string]$SelectHandle)

  $existingHandles.Items.Clear()
  foreach ($file in Get-ChildItem -LiteralPath $StoreRoot -File -Filter "*.dpapi" | Sort-Object Name) {
    [void]$existingHandles.Items.Add([IO.Path]::GetFileNameWithoutExtension($file.Name))
  }
  if ($SelectHandle -and $existingHandles.Items.Contains($SelectHandle)) {
    $existingHandles.SelectedItem = $SelectHandle
  } elseif ($existingHandles.Items.Count -gt 0) {
    $existingHandles.SelectedIndex = 0
  }
}

Update-StewartHandleList

$saveHandle.Add_Click({
  $secureCopy = $null
  try {
    $handle = $handleName.Text.Trim()
    if ($handle -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$') {
      throw "Use 1-64 letters, numbers, dots, underscores, or hyphens."
    }
    $secureCopy = $secretValue.SecurePassword
    if ($secureCopy.Length -eq 0) { throw "Enter a private value." }
    $destination = Join-Path $StoreRoot "$handle.dpapi"
    Save-StewartProtectedHandleAtomically -Secret $secureCopy -Handle $handle -Destination $destination -Mode Create
    $secretValue.Clear()
    $handleName.Clear()
    Update-StewartHandleList -SelectHandle $handle
    $status.Foreground = "#6EE7B7"
    $status.Text = "Encrypted handle stored. Add another item or choose Done."
    $handleName.Focus() | Out-Null
  } catch {
    $secretValue.Clear()
    $status.Foreground = "#FCA5A5"
    $status.Text = $_.Exception.Message
  } finally {
    if ($secureCopy) { $secureCopy.Dispose() }
  }
})

$replaceHandle.Add_Click({
  $secureCopy = $null
  try {
    $selected = [string]$existingHandles.SelectedItem
    if ([string]::IsNullOrWhiteSpace($selected)) { throw "Choose the existing handle to replace." }
    if ($selected -notmatch '^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$') { throw "The selected handle name is invalid." }
    $secureCopy = $secretValue.SecurePassword
    if ($secureCopy.Length -eq 0) { throw "Enter the replacement private value." }
    $destination = Join-Path $StoreRoot "$selected.dpapi"
    Save-StewartProtectedHandleAtomically -Secret $secureCopy -Handle $selected -Destination $destination -Mode Replace
    $secretValue.Clear()
    Update-StewartHandleList -SelectHandle $selected
    $status.Foreground = "#6EE7B7"
    $status.Text = "Selected encrypted handle replaced atomically. No value was displayed."
    $secretValue.Focus() | Out-Null
  } catch {
    $secretValue.Clear()
    $status.Foreground = "#FCA5A5"
    $status.Text = $_.Exception.Message
  } finally {
    if ($secureCopy) { $secureCopy.Dispose() }
  }
})

$saveBlindPin.Add_Click({
  $secureCopy = $null
  try {
    $secureCopy = $secretValue.SecurePassword
    if ($secureCopy.Length -eq 0) { throw "Enter the Blind PIN private value." }
    $privateDock = Join-Path $env:LOCALAPPDATA "PookaKind\Stewart\PrivateDock"
    $destination = Join-Path $privateDock "device-pin.dpapi.txt"
    $mode = if (Test-Path -LiteralPath $destination -PathType Leaf) { "Replace" } else { "Create" }
    Save-StewartProtectedHandleAtomically -Secret $secureCopy -Handle "device-pin" -Destination $destination -Mode $mode -Purpose DevicePin
    $secretValue.Clear()
    $status.Foreground = "#6EE7B7"
    $status.Text = "Blind PIN encrypted slot stored or replaced atomically for Stewart's Windows Security runner. No value was displayed."
    $secretValue.Focus() | Out-Null
  } catch {
    $secretValue.Clear()
    $status.Foreground = "#FCA5A5"
    $status.Text = $_.Exception.Message
  } finally {
    if ($secureCopy) { $secureCopy.Dispose() }
  }
})

$closeWindow.Add_Click({ $window.Close() })
$window.Add_Closed({ $secretValue.Clear() })
$window.ShowDialog() | Out-Null
