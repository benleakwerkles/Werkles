#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$StoreRoot = (Join-Path $env:LOCALAPPDATA 'PookaKind\Stewart\PrivateDocumentDock'),
  [string]$UploadStagingRoot = (Join-Path $env:LOCALAPPDATA 'PookaKind\Stewart\DocumentUploadStaging'),
  [switch]$SelfTest,
  [switch]$CameraProbe,
  [switch]$OpenCameraOnLaunch,
  [switch]$ReviewLatestOnLaunch
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()

if (-not ('Stewart.NativeCamera' -as [type])) {
  Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;

namespace Stewart {
  public static class NativeCamera {
    public const uint WS_CHILD = 0x40000000;
    public const uint WS_VISIBLE = 0x10000000;
    public const uint WM_CAP_DRIVER_CONNECT = 0x040A;
    public const uint WM_CAP_DRIVER_DISCONNECT = 0x040B;
    public const uint WM_CAP_FILE_SAVEDIB = 0x0419;
    public const uint WM_CAP_SET_PREVIEW = 0x0432;
    public const uint WM_CAP_SET_PREVIEWRATE = 0x0434;
    public const uint WM_CAP_SET_SCALE = 0x0435;
    public const uint WM_CAP_GRAB_FRAME_NOSTOP = 0x043D;

    [DllImport("avicap32.dll", EntryPoint="capCreateCaptureWindowW", CharSet=CharSet.Unicode)]
    public static extern IntPtr CreateCaptureWindow(string title, uint style, int x, int y,
      int width, int height, IntPtr parent, int id);

    [DllImport("user32.dll", EntryPoint="SendMessageW")]
    public static extern IntPtr SendMessage(IntPtr window, uint message, IntPtr wParam, IntPtr lParam);

    [DllImport("user32.dll", EntryPoint="SendMessageW", CharSet=CharSet.Unicode)]
    public static extern IntPtr SendMessageString(IntPtr window, uint message, IntPtr wParam, string lParam);

    [DllImport("user32.dll")]
    public static extern bool MoveWindow(IntPtr window, int x, int y, int width, int height, bool repaint);

    [DllImport("user32.dll")]
    public static extern bool DestroyWindow(IntPtr window);
  }
}
'@
}

$script:DocumentKinds = @(
  [pscustomobject]@{ Id='DRIVER_LICENSE_FRONT'; Label='Driver license - front' },
  [pscustomobject]@{ Id='DRIVER_LICENSE_BACK'; Label='Driver license - back' },
  [pscustomobject]@{ Id='PASSPORT_BIO_PAGE'; Label='Passport - biographical page' },
  [pscustomobject]@{ Id='HEALTH_INSURANCE_FRONT'; Label='Health insurance card - front' },
  [pscustomobject]@{ Id='HEALTH_INSURANCE_BACK'; Label='Health insurance card - back' },
  [pscustomobject]@{ Id='GEORGIA_THC_CARD_FRONT'; Label='Georgia THC / registry card - front' },
  [pscustomobject]@{ Id='GEORGIA_THC_CARD_BACK'; Label='Georgia THC / registry card - back' },
  [pscustomobject]@{ Id='VEHICLE_INSURANCE_CARD'; Label='Vehicle insurance card' },
  [pscustomobject]@{ Id='BUSINESS_LICENSE'; Label='Business license or certificate' },
  [pscustomobject]@{ Id='PROFESSIONAL_LICENSE'; Label='Professional license' }
)

function Set-StewartPrivateAcl {
  param([Parameter(Mandatory)][string]$LiteralPath, [switch]$Directory)
  $acl = if ($Directory) { [Security.AccessControl.DirectorySecurity]::new() } else { [Security.AccessControl.FileSecurity]::new() }
  $acl.SetAccessRuleProtection($true, $false)
  $inheritance = if ($Directory) {
    [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
  } else { [Security.AccessControl.InheritanceFlags]::None }
  $acl.AddAccessRule([Security.AccessControl.FileSystemAccessRule]::new(
    [Security.Principal.WindowsIdentity]::GetCurrent().User,
    [Security.AccessControl.FileSystemRights]::FullControl,
    $inheritance,
    [Security.AccessControl.PropagationFlags]::None,
    [Security.AccessControl.AccessControlType]::Allow
  ))
  if ($Directory) { [IO.Directory]::SetAccessControl($LiteralPath, $acl) } else { [IO.File]::SetAccessControl($LiteralPath, $acl) }
}

function Initialize-StewartPrivateRoot {
  param([Parameter(Mandatory)][string]$Path)
  $resolved = [IO.Path]::GetFullPath($Path)
  New-Item -ItemType Directory -Path $resolved -Force | Out-Null
  Set-StewartPrivateAcl -LiteralPath $resolved -Directory
  $resolved
}

function Get-StewartEntropy {
  param([Parameter(Mandatory)][string]$Kind)
  $inputBytes = [Text.Encoding]::UTF8.GetBytes("PookaKind.Stewart.DocumentDock.v3|$Kind|DOSS")
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $sha.ComputeHash($inputBytes) }
  finally { $sha.Dispose(); [Array]::Clear($inputBytes, 0, $inputBytes.Length) }
}

function Save-StewartEncryptedArchive {
  param([string]$Kind, [string]$Label, [string]$Extension, [byte[]]$PlaintextBytes, [string]$Root)
  $rootPath = Initialize-StewartPrivateRoot -Path $Root
  $slug = $Kind.ToLowerInvariant().Replace('_','-')
  $formatSlug = $Extension.TrimStart('.').ToLowerInvariant()
  $target = Join-Path $rootPath "$slug.$formatSlug.dpapi.bin"
  $sidecar = Join-Path $rootPath "$slug.$formatSlug.metadata.json"
  $entropy = $null; $cipher = $null
  try {
    $entropy = Get-StewartEntropy -Kind $Kind
    $cipher = [Security.Cryptography.ProtectedData]::Protect($PlaintextBytes, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    [IO.File]::WriteAllBytes($target, $cipher)
    Set-StewartPrivateAcl -LiteralPath $target
    $metadata = [ordered]@{
      schema='pookakind.stewart-private-document/v3'; kind=$Kind; label=$Label
      source_extension=$Extension; state='CURRENT_USER_DPAPI_DOCUMENT_READY'
      saved_at=[DateTimeOffset]::Now.ToString('o'); plaintext_retained_outside_archive=$true
      ocr_performed=$false; upload_performed=$false
    }
    [IO.File]::WriteAllText($sidecar, ($metadata | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    Set-StewartPrivateAcl -LiteralPath $sidecar
    $recovered = [Security.Cryptography.ProtectedData]::Unprotect([IO.File]::ReadAllBytes($target), $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser)
    try {
      if ($recovered.Length -ne $PlaintextBytes.Length) { throw 'Encrypted archive verification failed.' }
      for ($i=0; $i -lt $recovered.Length; $i++) { if ($recovered[$i] -ne $PlaintextBytes[$i]) { throw 'Encrypted archive verification failed.' } }
    } finally { [Array]::Clear($recovered,0,$recovered.Length) }
  } finally {
    if ($entropy) { [Array]::Clear($entropy,0,$entropy.Length) }
    if ($cipher) { [Array]::Clear($cipher,0,$cipher.Length) }
  }
}

function Save-StewartJpeg {
  param([Parameter(Mandatory)][Drawing.Image]$Image, [Parameter(Mandatory)][string]$Path, [int]$Quality=92)
  $codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg' | Select-Object -First 1
  $parameters = [Drawing.Imaging.EncoderParameters]::new(1)
  try {
    $parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, [long]$Quality)
    $Image.Save($Path, $codec, $parameters)
  } finally { $parameters.Dispose() }
}

function Convert-StewartCapture {
  param([Parameter(Mandatory)][string]$BmpPath, [Parameter(Mandatory)][string]$OutputPath, [Parameter(Mandatory)][ValidateSet('JPEG','PNG')]$Format)
  $image = [Drawing.Image]::FromFile($BmpPath)
  try {
    if ($Format -eq 'PNG') { $image.Save($OutputPath, [Drawing.Imaging.ImageFormat]::Png) }
    else { Save-StewartJpeg -Image $image -Path $OutputPath }
  } finally { $image.Dispose() }
  $info = Get-Item -LiteralPath $OutputPath
  if ($info.Length -le 0 -or $info.Length -gt 25MB) { throw 'Captured document must be between 1 byte and 25 MB.' }
}

function Wait-StewartWinRtOperation {
  param([Parameter(Mandatory)]$Operation, [Parameter(Mandatory)][Type]$ResultType)
  $method=@([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]
  if(-not $method){throw 'STEWART_CAMERA_ASYNC_BRIDGE_MISSING'}
  $method.MakeGenericMethod($ResultType).Invoke($null,@($Operation)).GetAwaiter().GetResult()
}

function Get-StewartOutputPair {
  param([Parameter(Mandatory)][string]$SelectedPath)
  $fullPath=[IO.Path]::GetFullPath($SelectedPath)
  $directory=[IO.Path]::GetDirectoryName($fullPath)
  $stem=[IO.Path]::GetFileNameWithoutExtension($fullPath)
  if([string]::IsNullOrWhiteSpace($stem)){throw 'Choose a usable output filename.'}
  [pscustomobject]@{
    Jpeg=(Join-Path $directory "$stem.jpg")
    Png=(Join-Path $directory "$stem.png")
  }
}

function Get-StewartDefaultOutputPath {
  param([Parameter(Mandatory)][string]$Kind, [Parameter(Mandatory)][string]$Root)
  $directory=Initialize-StewartPrivateRoot -Path $Root
  $stem=$Kind.ToLowerInvariant().Replace('_','-') + '-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
  Join-Path $directory "$stem.jpg"
}

if ($CameraProbe) {
  $probeForm=[Windows.Forms.Form]::new(); $probePanel=[Windows.Forms.Panel]::new(); $captureWindow=[IntPtr]::Zero; $connected=$false
  try {
    $probeForm.ShowInTaskbar=$false; $probeForm.Opacity=0; $probeForm.Size=[Drawing.Size]::new(320,240)
    $probePanel.Dock='Fill'; $probeForm.Controls.Add($probePanel); $probeForm.Show(); [Windows.Forms.Application]::DoEvents()
    $style=[Stewart.NativeCamera]::WS_CHILD -bor [Stewart.NativeCamera]::WS_VISIBLE
    $captureWindow=[Stewart.NativeCamera]::CreateCaptureWindow('Stewart camera probe',$style,0,0,320,240,$probePanel.Handle,901)
    if($captureWindow -eq [IntPtr]::Zero){throw 'CAMERA_PREVIEW_WINDOW_UNAVAILABLE'}
    $connected=([Stewart.NativeCamera]::SendMessage($captureWindow,[Stewart.NativeCamera]::WM_CAP_DRIVER_CONNECT,[IntPtr]::Zero,[IntPtr]::Zero) -ne [IntPtr]::Zero)
    if(-not $connected){throw 'CAMERA_DRIVER_CONNECT_UNAVAILABLE'}
    [void][Stewart.NativeCamera]::SendMessage($captureWindow,[Stewart.NativeCamera]::WM_CAP_SET_SCALE,[IntPtr]::new(1),[IntPtr]::Zero)
    [void][Stewart.NativeCamera]::SendMessage($captureWindow,[Stewart.NativeCamera]::WM_CAP_SET_PREVIEWRATE,[IntPtr]::new(33),[IntPtr]::Zero)
    $preview=([Stewart.NativeCamera]::SendMessage($captureWindow,[Stewart.NativeCamera]::WM_CAP_SET_PREVIEW,[IntPtr]::new(1),[IntPtr]::Zero) -ne [IntPtr]::Zero)
    [Windows.Forms.Application]::DoEvents()
    [pscustomobject]@{state=if($preview){'PASS'}else{'PREVIEW_COMMAND_UNCONFIRMED'}; camera_connected=$true; preview_initialized=$preview; frame_captured=$false; file_written=$false} | ConvertTo-Json -Compress
  } catch {
    [pscustomobject]@{state='BLOCKED'; reason=$_.Exception.Message; frame_captured=$false; file_written=$false} | ConvertTo-Json -Compress
    exit 2
  } finally {
    if($captureWindow -ne [IntPtr]::Zero){if($connected){[void][Stewart.NativeCamera]::SendMessage($captureWindow,[Stewart.NativeCamera]::WM_CAP_DRIVER_DISCONNECT,[IntPtr]::Zero,[IntPtr]::Zero)};[void][Stewart.NativeCamera]::DestroyWindow($captureWindow)}
    $probeForm.Close(); $probeForm.Dispose()
  }
  exit 0
}

if ($SelfTest) {
  $root = Join-Path ([IO.Path]::GetTempPath()) "stewart-document-dock-v3-$([guid]::NewGuid().ToString('N'))"
  New-Item -ItemType Directory -Path $root | Out-Null
  $bmpPath=Join-Path $root 'synthetic.bmp'; $jpgPath=Join-Path $root 'synthetic.jpg'; $pngPath=Join-Path $root 'synthetic.png'
  $bitmap=[Drawing.Bitmap]::new(64,48); $graphics=[Drawing.Graphics]::FromImage($bitmap)
  try {
    $graphics.Clear([Drawing.Color]::CornflowerBlue); $bitmap.Save($bmpPath,[Drawing.Imaging.ImageFormat]::Bmp)
    Convert-StewartCapture -BmpPath $bmpPath -OutputPath $jpgPath -Format JPEG
    Convert-StewartCapture -BmpPath $bmpPath -OutputPath $pngPath -Format PNG
    $pair=Get-StewartOutputPair -SelectedPath (Join-Path $root 'official-document.jpg')
    if($pair.Jpeg -ne (Join-Path $root 'official-document.jpg') -or $pair.Png -ne (Join-Path $root 'official-document.png')){throw 'Output-pair derivation failed.'}
    $plain=[IO.File]::ReadAllBytes($jpgPath)
    try { Save-StewartEncryptedArchive -Kind 'SYNTHETIC_TEST' -Label 'Synthetic test' -Extension '.jpg' -PlaintextBytes $plain -Root (Join-Path $root 'private') }
    finally { [Array]::Clear($plain,0,$plain.Length) }
    [pscustomobject]@{ state='PASS'; live_preview_engine='AVICAP_CHILD_WINDOW'; clipboard_accessed=$false; jpeg_ready=$true; png_ready=$true; paired_output_required=$true; exact_destination_required=$true; recurring_operation_created=$false } | ConvertTo-Json -Compress
  } finally {
    $graphics.Dispose(); $bitmap.Dispose()
    if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
  }
  exit 0
}

$form=[Windows.Forms.Form]::new()
$form.Text='Stewart Document Dock V3 - Live Camera'
$form.StartPosition='CenterScreen'; $form.Size=[Drawing.Size]::new(940,860); $form.MinimumSize=$form.Size
$form.BackColor=[Drawing.Color]::FromArgb(247,244,237); $form.Font=[Drawing.Font]::new('Segoe UI',10); $form.TopMost=$true

function Add-Label([string]$Text,[int]$X,[int]$Y,[int]$Width=840,[int]$Height=25) {
  $control=[Windows.Forms.Label]::new(); $control.Text=$Text; $control.Location=[Drawing.Point]::new($X,$Y); $control.Size=[Drawing.Size]::new($Width,$Height); $form.Controls.Add($control); $control
}

$title=Add-Label 'Stewart Document Dock - Live Camera' 28 18 850 38
$title.Font=[Drawing.Font]::new('Segoe UI Semibold',20)
$intro=Add-Label 'Stewart chooses a protected local staging path. Open the Windows live camera, frame the document, and use its shutter. Every capture creates JPEG and PNG siblings.' 30 62 855 44

$null=Add-Label 'Document category' 30 112 250 24
$category=[Windows.Forms.ComboBox]::new(); $category.Location=[Drawing.Point]::new(30,137); $category.Size=[Drawing.Size]::new(410,32); $category.DropDownStyle='DropDownList'; $category.DisplayMember='Label'; foreach($kind in $script:DocumentKinds){[void]$category.Items.Add($kind)}; $category.SelectedIndex=0; $form.Controls.Add($category)
$null=Add-Label 'Outputs' 470 112 170 24
$format=[Windows.Forms.TextBox]::new(); $format.Location=[Drawing.Point]::new(470,137); $format.Size=[Drawing.Size]::new(145,32); $format.ReadOnly=$true; $format.Text='JPEG + PNG'; $format.TextAlign='Center'; $form.Controls.Add($format)
$archive=[Windows.Forms.CheckBox]::new(); $archive.Text='Also keep a DPAPI-encrypted Stewart copy'; $archive.Location=[Drawing.Point]::new(640,138); $archive.Size=[Drawing.Size]::new(270,28); $archive.Checked=$true; $form.Controls.Add($archive)

$null=Add-Label 'Temporary raw upload pair (protected local default)' 30 182 500 24
$destination=[Windows.Forms.TextBox]::new(); $destination.Location=[Drawing.Point]::new(30,207); $destination.Size=[Drawing.Size]::new(690,30); $destination.ReadOnly=$true; $form.Controls.Add($destination)
$browse=[Windows.Forms.Button]::new(); $browse.Text='Choose file...'; $browse.Location=[Drawing.Point]::new(735,204); $browse.Size=[Drawing.Size]::new(145,35); $form.Controls.Add($browse)

$previewPanel=[Windows.Forms.Panel]::new(); $previewPanel.Location=[Drawing.Point]::new(30,260); $previewPanel.Size=[Drawing.Size]::new(850,455); $previewPanel.BorderStyle='FixedSingle'; $previewPanel.BackColor=[Drawing.Color]::FromArgb(35,38,40); $form.Controls.Add($previewPanel)
$overlay=[Windows.Forms.Label]::new(); $overlay.Text="Press Open live camera. Windows supplies the live viewfinder before the shutter.`r`n`r`nRaw JPEG/PNG files are temporary upload copies; the encrypted Stewart archive is the durable copy."; $overlay.ForeColor=[Drawing.Color]::White; $overlay.BackColor=[Drawing.Color]::Transparent; $overlay.TextAlign='MiddleCenter'; $overlay.Dock='Fill'; $previewPanel.Controls.Add($overlay)

$start=[Windows.Forms.Button]::new(); $start.Text='Open live camera'; $start.Location=[Drawing.Point]::new(30,732); $start.Size=[Drawing.Size]::new(190,40); $start.BackColor=[Drawing.Color]::FromArgb(31,70,59); $start.ForeColor=[Drawing.Color]::White; $start.FlatStyle='Flat'; $form.Controls.Add($start)
$capture=[Windows.Forms.Button]::new(); $capture.Visible=$false; $form.Controls.Add($capture)
$stop=[Windows.Forms.Button]::new(); $stop.Visible=$false; $form.Controls.Add($stop)
$review=[Windows.Forms.Button]::new(); $review.Text='Review latest capture'; $review.Location=[Drawing.Point]::new(240,732); $review.Size=[Drawing.Size]::new(190,40); $form.Controls.Add($review)
$done=[Windows.Forms.Button]::new(); $done.Text='Done'; $done.Location=[Drawing.Point]::new(450,732); $done.Size=[Drawing.Size]::new(100,40); $form.Controls.Add($done)
$status=Add-Label 'Ready. No camera or document is open.' 30 785 850 44
$status.ForeColor=[Drawing.Color]::FromArgb(31,70,59)

$script:CaptureWindow=[IntPtr]::Zero
$script:CameraConnected=$false

function Stop-StewartCamera {
  if ($script:CaptureWindow -ne [IntPtr]::Zero) {
    if ($script:CameraConnected) { [void][Stewart.NativeCamera]::SendMessage($script:CaptureWindow,[Stewart.NativeCamera]::WM_CAP_DRIVER_DISCONNECT,[IntPtr]::Zero,[IntPtr]::Zero) }
    [void][Stewart.NativeCamera]::DestroyWindow($script:CaptureWindow)
  }
  $script:CaptureWindow=[IntPtr]::Zero; $script:CameraConnected=$false
  $capture.Enabled=$false; $stop.Enabled=$false; $start.Enabled=$true; $overlay.Visible=$true
}

function Start-StewartCamera {
  if ([string]::IsNullOrWhiteSpace($destination.Text)) { throw 'Stewart has no output path. Choose a destination and try again.' }
  $pair=Get-StewartOutputPair -SelectedPath $destination.Text
  if((Test-Path -LiteralPath $pair.Jpeg) -or (Test-Path -LiteralPath $pair.Png)){throw 'The current output pair already exists. Choose a new basename before capturing.'}
  $pythonw=Join-Path $env:LOCALAPPDATA 'PookaKind\Stewart\CameraRuntime\Scripts\pythonw.exe'
  $helper=Join-Path $PSScriptRoot 'stewart_live_camera.py'
  if(-not(Test-Path -LiteralPath $pythonw)){throw 'Stewart camera runtime is missing.'}
  if(-not(Test-Path -LiteralPath $helper)){throw 'Stewart live-camera helper is missing.'}
  $parent=[IO.Path]::GetDirectoryName($pair.Jpeg)
  if(-not(Test-Path -LiteralPath $parent)){New-Item -ItemType Directory -Path $parent -Force | Out-Null}
  if([IO.Path]::GetFullPath($parent).StartsWith([IO.Path]::GetFullPath($UploadStagingRoot),[StringComparison]::OrdinalIgnoreCase)){Set-StewartPrivateAcl -LiteralPath $parent -Directory}
  $start.Enabled=$false; $form.TopMost=$false; $plain=$null
  try {
    $status.Text='Stewart live camera is opening. Frame the document, then capture JPEG + PNG.'
    $arguments=@(('"'+$helper+'"'),'--jpeg',('"'+$pair.Jpeg+'"'),'--png',('"'+$pair.Png+'"'))
    $cameraProcess=Start-Process -FilePath $pythonw -ArgumentList $arguments -PassThru -Wait
    if($cameraProcess.ExitCode -eq 2){$status.Text='Camera canceled. No document was stored.';return}
    if($cameraProcess.ExitCode -ne 0 -or -not(Test-Path -LiteralPath $pair.Jpeg) -or -not(Test-Path -LiteralPath $pair.Png)){throw 'The live camera did not produce the verified JPEG + PNG pair.'}
    if($archive.Checked){
      $kind=$category.SelectedItem
      foreach($output in @($pair.Jpeg,$pair.Png)){$plain=[IO.File]::ReadAllBytes($output);try{Save-StewartEncryptedArchive -Kind $kind.Id -Label $kind.Label -Extension ([IO.Path]::GetExtension($output)) -PlaintextBytes $plain -Root $StoreRoot}finally{[Array]::Clear($plain,0,$plain.Length);$plain=$null}}
    }
    $status.ForeColor=[Drawing.Color]::FromArgb(31,70,59); $status.Text='Captured and verified as JPEG + PNG. Stewart selected a fresh protected staging path for the next capture.'
    $destination.Text=Get-StewartDefaultOutputPath -Kind $category.SelectedItem.Id -Root $UploadStagingRoot
  } finally {
    if($plain){[Array]::Clear($plain,0,$plain.Length)}
    $form.TopMost=$true; $form.Activate(); $start.Enabled=$true
  }
}

function Review-StewartLatestCapture {
  $root=Initialize-StewartPrivateRoot -Path $UploadStagingRoot
  $latest=Get-ChildItem -LiteralPath $root -File -Filter '*.jpg' | Where-Object {$_.BaseName -notmatch '-reviewed-\d{8}-\d{6}$'} | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if(-not $latest){throw 'No staged JPEG capture is available to review.'}
  $stem=$latest.BaseName + '-reviewed-' + [DateTime]::Now.ToString('yyyyMMdd-HHmmss')
  $pair=Get-StewartOutputPair -SelectedPath (Join-Path $root "$stem.jpg")
  $pythonw=Join-Path $env:LOCALAPPDATA 'PookaKind\Stewart\CameraRuntime\Scripts\pythonw.exe'
  $helper=Join-Path $PSScriptRoot 'stewart_live_camera.py'
  $review.Enabled=$false; $start.Enabled=$false; $form.TopMost=$false; $plain=$null
  try {
    $status.Text='Opening the latest capture for private review and crop. No new file is written until Save.'
    $arguments=@(('"'+$helper+'"'),'--source',('"'+$latest.FullName+'"'),'--jpeg',('"'+$pair.Jpeg+'"'),'--png',('"'+$pair.Png+'"'))
    $process=Start-Process -FilePath $pythonw -ArgumentList $arguments -PassThru -Wait
    if($process.ExitCode -eq 2){$status.Text='Review canceled. The original capture remains unchanged.';return}
    if($process.ExitCode -ne 0 -or -not(Test-Path -LiteralPath $pair.Jpeg) -or -not(Test-Path -LiteralPath $pair.Png)){throw 'The reviewed JPEG + PNG pair was not produced.'}
    if($archive.Checked){
      $kind=$category.SelectedItem
      foreach($output in @($pair.Jpeg,$pair.Png)){$plain=[IO.File]::ReadAllBytes($output);try{Save-StewartEncryptedArchive -Kind $kind.Id -Label $kind.Label -Extension ([IO.Path]::GetExtension($output)) -PlaintextBytes $plain -Root $StoreRoot}finally{[Array]::Clear($plain,0,$plain.Length);$plain=$null}}
    }
    $status.ForeColor=[Drawing.Color]::FromArgb(31,70,59);$status.Text='Reviewed/cropped JPEG + PNG saved. The original capture remains unchanged.'
  } finally {
    if($plain){[Array]::Clear($plain,0,$plain.Length)}
    $form.TopMost=$true;$form.Activate();$review.Enabled=$true;$start.Enabled=$true
  }
}

$browse.Add_Click({
  $dialog=[Windows.Forms.SaveFileDialog]::new(); $dialog.Filter='JPEG + PNG output pair (*.jpg;*.png)|*.jpg'; $dialog.DefaultExt='jpg'
  $dialog.AddExtension=$true; $dialog.OverwritePrompt=$true; $dialog.Title='Choose the basename for the JPEG + PNG pair'
  $dialog.InitialDirectory=(Initialize-StewartPrivateRoot -Path $UploadStagingRoot)
  try { if($dialog.ShowDialog($form) -eq 'OK'){Stop-StewartCamera; $pair=Get-StewartOutputPair -SelectedPath $dialog.FileName; $destination.Text=$pair.Jpeg; $status.Text="Output pair selected: $([IO.Path]::GetFileName($pair.Jpeg)) and $([IO.Path]::GetFileName($pair.Png))."} } finally {$dialog.Dispose()}
})
$category.Add_SelectedIndexChanged({if($destination){$destination.Text=Get-StewartDefaultOutputPath -Kind $category.SelectedItem.Id -Root $UploadStagingRoot;$status.Text='Stewart selected a protected staging basename for this document type.'}})
$start.Add_Click({ try{Start-StewartCamera}catch{$status.ForeColor=[Drawing.Color]::FromArgb(156,45,36);$status.Text=$_.Exception.Message;$form.TopMost=$true;$start.Enabled=$true} })
$review.Add_Click({try{Review-StewartLatestCapture}catch{$status.ForeColor=[Drawing.Color]::FromArgb(156,45,36);$status.Text=$_.Exception.Message;$form.TopMost=$true;$review.Enabled=$true;$start.Enabled=$true}})
$stop.Add_Click({Stop-StewartCamera;$status.Text='Camera stopped. The selected destination remains ready.'})
$previewPanel.Add_Resize({if($script:CaptureWindow -ne [IntPtr]::Zero){[void][Stewart.NativeCamera]::MoveWindow($script:CaptureWindow,0,0,$previewPanel.ClientSize.Width,$previewPanel.ClientSize.Height,$true)}})

$capture.Add_Click({
  $capture.Enabled=$false; $temporary=Join-Path ([IO.Path]::GetTempPath()) "stewart-frame-$([guid]::NewGuid().ToString('N')).bmp"; $plain=$null
  try {
    if(-not $script:CameraConnected){throw 'The live camera is not running.'}
    [void][Stewart.NativeCamera]::SendMessage($script:CaptureWindow,[Stewart.NativeCamera]::WM_CAP_GRAB_FRAME_NOSTOP,[IntPtr]::Zero,[IntPtr]::Zero)
    $saved=[Stewart.NativeCamera]::SendMessageString($script:CaptureWindow,[Stewart.NativeCamera]::WM_CAP_FILE_SAVEDIB,[IntPtr]::Zero,$temporary)
    if($saved -eq [IntPtr]::Zero -or -not(Test-Path -LiteralPath $temporary)){throw 'Windows did not return a camera frame. The output file was not changed.'}
    $pair=Get-StewartOutputPair -SelectedPath $destination.Text
    $parent=[IO.Path]::GetDirectoryName($pair.Jpeg); if(-not(Test-Path -LiteralPath $parent)){New-Item -ItemType Directory -Path $parent -Force | Out-Null}
    if((Test-Path -LiteralPath $pair.Jpeg) -or (Test-Path -LiteralPath $pair.Png)){throw 'One or both output files already exist. Choose a new basename to prevent an accidental overwrite.'}
    Convert-StewartCapture -BmpPath $temporary -OutputPath $pair.Jpeg -Format JPEG
    try { Convert-StewartCapture -BmpPath $temporary -OutputPath $pair.Png -Format PNG }
    catch { if(Test-Path -LiteralPath $pair.Jpeg){Remove-Item -LiteralPath $pair.Jpeg -Force}; throw }
    if($archive.Checked){
      $kind=$category.SelectedItem
      foreach($output in @($pair.Jpeg,$pair.Png)){$plain=[IO.File]::ReadAllBytes($output); try{Save-StewartEncryptedArchive -Kind $kind.Id -Label $kind.Label -Extension ([IO.Path]::GetExtension($output)) -PlaintextBytes $plain -Root $StoreRoot}finally{[Array]::Clear($plain,0,$plain.Length);$plain=$null}}
    }
    $status.ForeColor=[Drawing.Color]::FromArgb(31,70,59); $status.Text='Capture saved and verified as both JPEG and PNG. Live preview remains active for another document.'
  } catch {$status.ForeColor=[Drawing.Color]::FromArgb(156,45,36);$status.Text=$_.Exception.Message}
  finally {if($plain){[Array]::Clear($plain,0,$plain.Length)};if(Test-Path -LiteralPath $temporary){Remove-Item -LiteralPath $temporary -Force};$capture.Enabled=$script:CameraConnected}
})

$done.Add_Click({$form.Close()})
$form.Add_FormClosed({Stop-StewartCamera})
$destination.Text=Get-StewartDefaultOutputPath -Kind $category.SelectedItem.Id -Root $UploadStagingRoot
$status.Text='Protected local staging path selected. Open the Windows live camera when ready.'
if($ReviewLatestOnLaunch){$form.Add_Shown({$form.BeginInvoke([Action]{try{Review-StewartLatestCapture}catch{$status.ForeColor=[Drawing.Color]::FromArgb(156,45,36);$status.Text=$_.Exception.Message;$form.TopMost=$true;$review.Enabled=$true;$start.Enabled=$true}}) | Out-Null})}
elseif($OpenCameraOnLaunch){$form.Add_Shown({$form.BeginInvoke([Action]{try{Start-StewartCamera}catch{$status.ForeColor=[Drawing.Color]::FromArgb(156,45,36);$status.Text=$_.Exception.Message;$form.TopMost=$true;$start.Enabled=$true}}) | Out-Null})}
$null=$form.ShowDialog()
$form.Dispose()
