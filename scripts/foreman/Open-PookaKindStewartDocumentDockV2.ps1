#Requires -Version 5.1
[CmdletBinding()]
param(
  [string]$StoreRoot = (Join-Path $env:LOCALAPPDATA 'PookaKind\Stewart\PrivateDocumentDock'),
  [switch]$SelfTest
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
Add-Type -AssemblyName System.Runtime.WindowsRuntime
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[Windows.Forms.Application]::EnableVisualStyles()

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
  $acl = if ($Directory) { [Security.AccessControl.DirectorySecurity]::new() }
         else { [Security.AccessControl.FileSecurity]::new() }
  $acl.SetAccessRuleProtection($true, $false)
  $inheritance = if ($Directory) {
    [Security.AccessControl.InheritanceFlags]::ContainerInherit -bor [Security.AccessControl.InheritanceFlags]::ObjectInherit
  } else { [Security.AccessControl.InheritanceFlags]::None }
  $rule = [Security.AccessControl.FileSystemAccessRule]::new(
    [Security.Principal.WindowsIdentity]::GetCurrent().User,
    [Security.AccessControl.FileSystemRights]::FullControl,
    $inheritance,
    [Security.AccessControl.PropagationFlags]::None,
    [Security.AccessControl.AccessControlType]::Allow
  )
  $acl.AddAccessRule($rule)
  if ($Directory) { [IO.Directory]::SetAccessControl($LiteralPath, $acl) }
  else { [IO.File]::SetAccessControl($LiteralPath, $acl) }
}

function Initialize-StewartDestination {
  param([Parameter(Mandatory)][string]$Path)
  $resolved = [IO.Path]::GetFullPath($Path)
  New-Item -ItemType Directory -Path $resolved -Force | Out-Null
  Set-StewartPrivateAcl -LiteralPath $resolved -Directory
  $resolved
}

function Get-StewartDocumentEntropy {
  param([Parameter(Mandatory)][string]$Kind)
  $inputBytes = [Text.Encoding]::UTF8.GetBytes("PookaKind.Stewart.DocumentDock.v2|$Kind|DOSS")
  $sha = [Security.Cryptography.SHA256]::Create()
  try { $sha.ComputeHash($inputBytes) }
  finally { $sha.Dispose(); [Array]::Clear($inputBytes, 0, $inputBytes.Length) }
}

function Get-StewartSha256 {
  param([Parameter(Mandatory)][byte[]]$Bytes)
  $sha = [Security.Cryptography.SHA256]::Create()
  try { ([BitConverter]::ToString($sha.ComputeHash($Bytes)) -replace '-', '').ToLowerInvariant() }
  finally { $sha.Dispose() }
}

function Wait-StewartWinRtOperation {
  param([Parameter(Mandatory)]$Operation, [Parameter(Mandatory)][Type]$ResultType)
  $method = @([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
    $_.Name -eq 'AsTask' -and $_.IsGenericMethodDefinition -and
    $_.GetParameters().Count -eq 1 -and
    $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1'
  })[0]
  if (-not $method) { throw 'STEWART_CAMERA_ASYNC_BRIDGE_MISSING' }
  $method.MakeGenericMethod($ResultType).Invoke($null, @($Operation)).GetAwaiter().GetResult()
}

function Save-StewartDocumentBytes {
  param(
    [Parameter(Mandatory)][string]$Kind,
    [Parameter(Mandatory)][string]$Label,
    [Parameter(Mandatory)][string]$Extension,
    [Parameter(Mandatory)][byte[]]$PlaintextBytes,
    [Parameter(Mandatory)][string]$LiteralPath
  )
  $entropy = Get-StewartDocumentEntropy -Kind $Kind
  $protectedBytes = $null
  $temporary = "$LiteralPath.tmp-$([guid]::NewGuid().ToString('N'))"
  try {
    $protectedBytes = [Security.Cryptography.ProtectedData]::Protect(
      $PlaintextBytes, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    [IO.File]::WriteAllBytes($temporary, $protectedBytes)
    Set-StewartPrivateAcl -LiteralPath $temporary
    Move-Item -LiteralPath $temporary -Destination $LiteralPath -Force
    Set-StewartPrivateAcl -LiteralPath $LiteralPath
    [ordered]@{
      kind = $Kind
      label = $Label
      state = 'CURRENT_USER_DPAPI_DOCUMENT_READY'
      file = [IO.Path]::GetFileName($LiteralPath)
      source_extension = $Extension.ToLowerInvariant()
      original_byte_count = $PlaintextBytes.Length
      ciphertext_sha256 = Get-StewartSha256 -Bytes $protectedBytes
      saved_at = [DateTimeOffset]::Now.ToString('o')
      dock_version = 2
    }
  } finally {
    if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force }
    if ($protectedBytes) { [Array]::Clear($protectedBytes, 0, $protectedBytes.Length) }
    if ($entropy) { [Array]::Clear($entropy, 0, $entropy.Length) }
  }
}

function Test-StewartEncryptedDocumentMatch {
  param([string]$Kind, [byte[]]$ExpectedBytes, [string]$LiteralPath)
  $cipher = $null; $entropy = $null; $recovered = $null
  try {
    $cipher = [IO.File]::ReadAllBytes($LiteralPath)
    $entropy = Get-StewartDocumentEntropy -Kind $Kind
    $recovered = [Security.Cryptography.ProtectedData]::Unprotect(
      $cipher, $entropy, [Security.Cryptography.DataProtectionScope]::CurrentUser
    )
    if ($recovered.Length -ne $ExpectedBytes.Length) { return $false }
    for ($i=0; $i -lt $ExpectedBytes.Length; $i++) { if ($recovered[$i] -ne $ExpectedBytes[$i]) { return $false } }
    $true
  } finally {
    if ($cipher) { [Array]::Clear($cipher, 0, $cipher.Length) }
    if ($entropy) { [Array]::Clear($entropy, 0, $entropy.Length) }
    if ($recovered) { [Array]::Clear($recovered, 0, $recovered.Length) }
  }
}

function Write-StewartDocumentManifest {
  param([Parameter(Mandatory)][string]$Root)
  $documents = @()
  foreach ($kind in $script:DocumentKinds) {
    $slug = $kind.Id.ToLowerInvariant().Replace('_','-')
    $dataPath = Join-Path $Root "$slug.dpapi.bin"
    $sidecarPath = Join-Path $Root "$slug.metadata.json"
    if ((Test-Path -LiteralPath $dataPath) -and (Test-Path -LiteralPath $sidecarPath)) {
      $documents += Get-Content -Raw -LiteralPath $sidecarPath | ConvertFrom-Json
    }
  }
  $manifest = [ordered]@{
    schema = 'pookakind.stewart-private-document-dock/v2'
    state = 'LOCAL_DPAPI_DOCUMENTS_READY__NO_UPLOAD_OR_PROVIDER_ACTION'
    machine = 'DOSS'
    windows_scope = 'CURRENT_USER'
    documents = @($documents)
    capture_requires_preview = $true
    destination_selected_before_capture = $true
    format_selected_before_capture = $true
    source_files_deleted = $false
    ocr_performed = $false
    clipboard_accessed = $false
    payment_card_capture_permitted = $false
    provider_action_performed = $false
    recurring_operation_created = $false
  }
  $path = Join-Path $Root 'manifest.json'
  $temporary = "$path.tmp-$([guid]::NewGuid().ToString('N'))"
  try {
    [IO.File]::WriteAllText($temporary, ($manifest | ConvertTo-Json -Depth 8), [Text.UTF8Encoding]::new($false))
    Set-StewartPrivateAcl -LiteralPath $temporary
    Move-Item -LiteralPath $temporary -Destination $path -Force
    Set-StewartPrivateAcl -LiteralPath $path
  } finally { if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary -Force } }
}

if ($SelfTest) {
  $root = Join-Path ([IO.Path]::GetTempPath()) "stewart-document-dock-v2-$([guid]::NewGuid().ToString('N'))"
  $plain = [byte[]](9,18,27,36,45,54,63,72,81)
  try {
    $root = Initialize-StewartDestination -Path $root
    $path = Join-Path $root 'driver-license-front.dpapi.bin'
    $metadata = Save-StewartDocumentBytes -Kind 'DRIVER_LICENSE_FRONT' -Label 'Driver license - front' -Extension '.png' -PlaintextBytes $plain -LiteralPath $path
    if (-not (Test-StewartEncryptedDocumentMatch -Kind 'DRIVER_LICENSE_FRONT' -ExpectedBytes $plain -LiteralPath $path)) { throw 'STEWART_DOCUMENT_DOCK_V2_SELF_TEST_FAILED' }
    [IO.File]::WriteAllText((Join-Path $root 'driver-license-front.metadata.json'), ($metadata | ConvertTo-Json), [Text.UTF8Encoding]::new($false))
    Write-StewartDocumentManifest -Root $root
    [pscustomobject]@{ state='PASS'; preview_required=$true; pre_capture_format=$true; pre_capture_destination=$true; plaintext_printed=$false; recurring_operation_created=$false } | ConvertTo-Json -Compress
  } finally {
    [Array]::Clear($plain,0,$plain.Length)
    if (Test-Path -LiteralPath $root) { Remove-Item -LiteralPath $root -Recurse -Force }
  }
  exit 0
}

$form = [Windows.Forms.Form]::new()
$form.Text = 'Stewart Document Dock V2'
$form.StartPosition = 'CenterScreen'
$form.Size = [Drawing.Size]::new(820, 900)
$form.MinimumSize = $form.Size
$form.MaximizeBox = $false
$form.TopMost = $true
$form.BackColor = [Drawing.Color]::FromArgb(247,244,237)
$form.Font = [Drawing.Font]::new('Segoe UI',10)

function Add-Label([string]$Text,[int]$X,[int]$Y,[int]$Width=730,[int]$Height=25) {
  $c=[Windows.Forms.Label]::new(); $c.Text=$Text; $c.Location=[Drawing.Point]::new($X,$Y); $c.Size=[Drawing.Size]::new($Width,$Height); $form.Controls.Add($c); $c
}

$title=Add-Label 'Stewart Document Dock V2' 28 20 730 40
$title.Font=[Drawing.Font]::new('Segoe UI Semibold',20)
$intro=Add-Label 'Choose the document category, image format, and encrypted destination before opening the camera. Capture first, inspect the laptop preview, then save only if the image is usable.' 30 67 740 48

$null=Add-Label 'Document category' 30 125 250 24
$category=[Windows.Forms.ComboBox]::new(); $category.Location=[Drawing.Point]::new(30,150); $category.Size=[Drawing.Size]::new(420,32); $category.DropDownStyle='DropDownList'; $category.DisplayMember='Label'; foreach($k in $script:DocumentKinds){[void]$category.Items.Add($k)}; $category.SelectedIndex=0; $form.Controls.Add($category)

$null=Add-Label 'Camera format' 470 125 160 24
$format=[Windows.Forms.ComboBox]::new(); $format.Location=[Drawing.Point]::new(470,150); $format.Size=[Drawing.Size]::new(150,32); $format.DropDownStyle='DropDownList'; [void]$format.Items.Add('JPEG'); [void]$format.Items.Add('PNG'); $format.SelectedIndex=0; $form.Controls.Add($format)

$null=Add-Label 'Encrypted destination' 30 195 300 24
$destination=[Windows.Forms.TextBox]::new(); $destination.Location=[Drawing.Point]::new(30,220); $destination.Size=[Drawing.Size]::new(590,30); $destination.ReadOnly=$true; $destination.Text=[IO.Path]::GetFullPath($StoreRoot); $form.Controls.Add($destination)
$browse=[Windows.Forms.Button]::new(); $browse.Text='Choose destination'; $browse.Location=[Drawing.Point]::new(632,217); $browse.Size=[Drawing.Size]::new(140,34); $form.Controls.Add($browse)

$camera=[Windows.Forms.Button]::new(); $camera.Text='Take photo for preview'; $camera.Location=[Drawing.Point]::new(30,270); $camera.Size=[Drawing.Size]::new(220,38); $camera.BackColor=[Drawing.Color]::FromArgb(75,92,109); $camera.ForeColor=[Drawing.Color]::White; $camera.FlatStyle='Flat'; $form.Controls.Add($camera)
$choose=[Windows.Forms.Button]::new(); $choose.Text='Choose existing JPG, PNG, or PDF'; $choose.Location=[Drawing.Point]::new(265,270); $choose.Size=[Drawing.Size]::new(260,38); $form.Controls.Add($choose)
$clear=[Windows.Forms.Button]::new(); $clear.Text='Clear / retake'; $clear.Location=[Drawing.Point]::new(540,270); $clear.Size=[Drawing.Size]::new(130,38); $form.Controls.Add($clear)

$preview=[Windows.Forms.PictureBox]::new(); $preview.Location=[Drawing.Point]::new(30,325); $preview.Size=[Drawing.Size]::new(742,330); $preview.BorderStyle='FixedSingle'; $preview.BackColor=[Drawing.Color]::FromArgb(224,226,221); $preview.SizeMode='Zoom'; $form.Controls.Add($preview)
$previewText=Add-Label 'No image captured. Choose settings above, then take a photo.' 55 474 690 30
$previewText.TextAlign='MiddleCenter'; $previewText.ForeColor=[Drawing.Color]::FromArgb(75,92,109); $previewText.BackColor=[Drawing.Color]::Transparent; $previewText.BringToFront()

$status=Add-Label 'Ready. No private document has been opened.' 30 670 742 52
$status.ForeColor=[Drawing.Color]::FromArgb(31,70,59)
$boundary=Add-Label 'Not accepted: Social Security cards, payment/bank cards, checks, passwords, OTPs, or recovery codes. This dock encrypts locally; it does not upload, OCR, autofill, or contact a provider.' 30 724 742 48
$boundary.ForeColor=[Drawing.Color]::FromArgb(115,55,40)

$save=[Windows.Forms.Button]::new(); $save.Text='Encrypt approved preview'; $save.Location=[Drawing.Point]::new(30,790); $save.Size=[Drawing.Size]::new(230,40); $save.BackColor=[Drawing.Color]::FromArgb(31,70,59); $save.ForeColor=[Drawing.Color]::White; $save.FlatStyle='Flat'; $save.Enabled=$false; $form.Controls.Add($save)
$done=[Windows.Forms.Button]::new(); $done.Text='Done'; $done.Location=[Drawing.Point]::new(280,790); $done.Size=[Drawing.Size]::new(100,40); $form.Controls.Add($done)

$script:Pending = $null

function Remove-StewartPendingRaw {
  if ($script:Pending -and $script:Pending.Temporary -and (Test-Path -LiteralPath $script:Pending.Path)) {
    Remove-Item -LiteralPath $script:Pending.Path -Force -ErrorAction SilentlyContinue
  }
}

function Clear-StewartPreview {
  if ($preview.Image) { $old=$preview.Image; $preview.Image=$null; $old.Dispose() }
  Remove-StewartPendingRaw
  $script:Pending=$null; $save.Enabled=$false; $previewText.Visible=$true
}

function Show-StewartImagePreview([string]$Path) {
  $bytes=$null; $stream=$null; $source=$null
  try {
    $bytes=[IO.File]::ReadAllBytes($Path)
    $stream=[IO.MemoryStream]::new($bytes,$false)
    $source=[Drawing.Image]::FromStream($stream)
    if ($preview.Image) { $old=$preview.Image; $preview.Image=$null; $old.Dispose() }
    $preview.Image=[Drawing.Bitmap]::new($source)
    $previewText.Visible=$false
  } finally {
    if ($source) { $source.Dispose() }; if ($stream) { $stream.Dispose() }; if ($bytes) { [Array]::Clear($bytes,0,$bytes.Length) }
  }
}

function New-StewartPending([string]$Path,[string]$Extension,[bool]$Temporary,[string]$Origin) {
  $kind=$category.SelectedItem
  $script:Pending=[pscustomobject]@{
    Path=$Path; Extension=$Extension; Temporary=$Temporary; Origin=$Origin
    Kind=$kind.Id; Label=$kind.Label; Destination=[IO.Path]::GetFullPath($destination.Text)
    Format=[string]$format.SelectedItem
  }
  $save.Enabled=$true
}

$browse.Add_Click({
  $dialog=[Windows.Forms.FolderBrowserDialog]::new(); $dialog.Description='Choose Stewart encrypted-document destination'; $dialog.SelectedPath=$destination.Text
  try { if($dialog.ShowDialog($form) -eq 'OK'){ Clear-StewartPreview; $destination.Text=Initialize-StewartDestination -Path $dialog.SelectedPath; $status.Text='Destination selected. Capture settings are ready.' } } finally { $dialog.Dispose() }
})
$category.Add_SelectedIndexChanged({ if($script:Pending){Clear-StewartPreview; $status.Text='Category changed. Capture again so the preview is bound to the correct slot.'} })
$format.Add_SelectedIndexChanged({ if($script:Pending){Clear-StewartPreview; $status.Text='Format changed. Capture again so the preview matches the selected format.'} })
$clear.Add_Click({ Clear-StewartPreview; $status.Text='Preview cleared. Settings remain selected.' })

$camera.Add_Click({
  Clear-StewartPreview; $camera.Enabled=$false; $form.TopMost=$false
  try {
    $null=Initialize-StewartDestination -Path $destination.Text
    $cameraUi=[Windows.Media.Capture.CameraCaptureUI,Windows.Media.Capture,ContentType=WindowsRuntime]::new()
    $cameraUi.PhotoSettings.AllowCropping=$false
    if([string]$format.SelectedItem -eq 'PNG'){$cameraUi.PhotoSettings.Format=[Windows.Media.Capture.CameraCaptureUIPhotoFormat,Windows.Media.Capture,ContentType=WindowsRuntime]::Png; $ext='.png'}
    else{$cameraUi.PhotoSettings.Format=[Windows.Media.Capture.CameraCaptureUIPhotoFormat,Windows.Media.Capture,ContentType=WindowsRuntime]::Jpeg; $ext='.jpg'}
    $status.Text='Windows camera is open. You control the shutter.'
    $file=Wait-StewartWinRtOperation -Operation ($cameraUi.CaptureFileAsync([Windows.Media.Capture.CameraCaptureUIMode,Windows.Media.Capture,ContentType=WindowsRuntime]::Photo)) -ResultType ([Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime])
    if(-not $file){$status.Text='Capture canceled. Nothing was stored.'; return}
    $path=[string]$file.Path; $info=Get-Item -LiteralPath $path
    if($info.Length -le 0 -or $info.Length -gt 25MB){throw 'Camera image must be between 1 byte and 25 MB.'}
    Show-StewartImagePreview -Path $path
    New-StewartPending -Path $path -Extension $ext -Temporary $true -Origin 'WINDOWS_CAMERA_CAPTURE_UI'
    $status.Text='Preview ready. Inspect the image, then encrypt it or choose Clear / retake.'
  } catch { Clear-StewartPreview; $status.ForeColor=[Drawing.Color]::FromArgb(156,45,36); $status.Text=$_.Exception.Message }
  finally { $form.TopMost=$true; $form.Activate(); $camera.Enabled=$true }
})

$choose.Add_Click({
  Clear-StewartPreview
  $dialog=[Windows.Forms.OpenFileDialog]::new(); $dialog.Title='Choose a document for local encrypted custody'; $dialog.Filter='Supported documents (*.jpg;*.jpeg;*.png;*.pdf)|*.jpg;*.jpeg;*.png;*.pdf'; $dialog.Multiselect=$false
  try {
    if($dialog.ShowDialog($form) -ne 'OK'){return}
    $ext=[IO.Path]::GetExtension($dialog.FileName).ToLowerInvariant(); $info=Get-Item -LiteralPath $dialog.FileName
    if($info.Length -le 0 -or $info.Length -gt 25MB){throw 'Document must be between 1 byte and 25 MB.'}
    New-StewartPending -Path $dialog.FileName -Extension $ext -Temporary $false -Origin 'USER_SELECTED_FILE'
    if($ext -eq '.pdf'){$previewText.Text='PDF selected. Image preview is unavailable; the PDF remains unopened until you save.'; $previewText.Visible=$true}
    else{Show-StewartImagePreview -Path $dialog.FileName}
    $status.Text='Local preview ready. The source file remains unchanged.'
  } catch { Clear-StewartPreview; $status.ForeColor=[Drawing.Color]::FromArgb(156,45,36); $status.Text=$_.Exception.Message }
  finally { $dialog.Dispose() }
})

$save.Add_Click({
  if(-not $script:Pending){return}; $save.Enabled=$false; $plain=$null
  try {
    $root=Initialize-StewartDestination -Path $script:Pending.Destination
    $slug=$script:Pending.Kind.ToLowerInvariant().Replace('_','-')
    $dataPath=Join-Path $root "$slug.dpapi.bin"; $sidecarPath=Join-Path $root "$slug.metadata.json"
    if(Test-Path -LiteralPath $dataPath){
      $answer=[Windows.Forms.MessageBox]::Show($form,'An encrypted document already exists in this category. Replace it?','Stewart overwrite confirmation','YesNo','Warning')
      if($answer -ne 'Yes'){$status.Text='Existing encrypted document preserved. Nothing changed.'; $save.Enabled=$true; return}
    }
    $plain=[IO.File]::ReadAllBytes($script:Pending.Path)
    $metadata=Save-StewartDocumentBytes -Kind $script:Pending.Kind -Label $script:Pending.Label -Extension $script:Pending.Extension -PlaintextBytes $plain -LiteralPath $dataPath
    if(-not (Test-StewartEncryptedDocumentMatch -Kind $script:Pending.Kind -ExpectedBytes $plain -LiteralPath $dataPath)){throw 'Encrypted document failed local round-trip verification.'}
    $rawDeleted=$false
    if($script:Pending.Temporary){Remove-Item -LiteralPath $script:Pending.Path -Force -ErrorAction SilentlyContinue; $rawDeleted=-not(Test-Path -LiteralPath $script:Pending.Path)}
    $metadata['capture_origin']=$script:Pending.Origin; $metadata['camera_temporary_source_deleted']=$rawDeleted
    $temporary="$sidecarPath.tmp-$([guid]::NewGuid().ToString('N'))"
    [IO.File]::WriteAllText($temporary,($metadata|ConvertTo-Json),[Text.UTF8Encoding]::new($false)); Set-StewartPrivateAcl -LiteralPath $temporary; Move-Item -LiteralPath $temporary -Destination $sidecarPath -Force; Set-StewartPrivateAcl -LiteralPath $sidecarPath
    Write-StewartDocumentManifest -Root $root
    $label=$script:Pending.Label; Clear-StewartPreview; $status.ForeColor=[Drawing.Color]::FromArgb(31,70,59); $status.Text="Encrypted and round-trip verified locally: $label."
  } catch { $status.ForeColor=[Drawing.Color]::FromArgb(156,45,36); $status.Text=$_.Exception.Message; $save.Enabled=[bool]$script:Pending }
  finally { if($plain){[Array]::Clear($plain,0,$plain.Length)} }
})

$done.Add_Click({$form.Close()})
$form.Add_FormClosed({Clear-StewartPreview})
$null=Initialize-StewartDestination -Path $destination.Text
$null=$form.ShowDialog()
$form.Dispose()
