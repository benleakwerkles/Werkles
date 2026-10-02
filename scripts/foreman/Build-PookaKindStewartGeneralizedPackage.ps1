#Requires -Version 5.1
[CmdletBinding()]
param(
  [Parameter(Mandatory = $true)][string]$NodeExecutable,
  [string]$OutputDirectory = (Join-Path $env:TEMP "PookaKindStewartGeneralizedPackage"),
  [ValidateSet('GENERALIZED','AMAZON_PASSWORD_FALLBACK')][string]$RuntimeProfile = 'GENERALIZED'
)
$ErrorActionPreference = 'Stop'
function Get-StringSha256([string[]]$Lines) {
  $sha = [Security.Cryptography.SHA256]::Create()
  try {
    $bytes = [Text.UTF8Encoding]::new($false).GetBytes(($Lines -join "`n"))
    return ([BitConverter]::ToString($sha.ComputeHash($bytes))).Replace('-', '').ToLowerInvariant()
  } finally { $sha.Dispose() }
}
function Get-RepoRelativePath([string]$BasePath, [string]$TargetPath) {
  $baseFull = [IO.Path]::GetFullPath($BasePath).TrimEnd('\') + '\'
  $targetFull = [IO.Path]::GetFullPath($TargetPath)
  $baseUri = [Uri]::new($baseFull)
  $targetUri = [Uri]::new($targetFull)
  if ($baseUri.Scheme -ne $targetUri.Scheme) { throw 'STEWART_GENERALIZED_RUNTIME_PATH_ESCAPE' }
  return [Uri]::UnescapeDataString($baseUri.MakeRelativeUri($targetUri).ToString()).Replace('/', '\')
}
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$hostScript = Join-Path $PSScriptRoot 'stewart-generalized-native-host.mjs'
$launcherTemplate = Join-Path $PSScriptRoot 'native\PookaKindCredentialStewardHostLauncher.cs'
$resolverSource = Join-Path $PSScriptRoot 'native\PookaKindStewartHandleResolver.cs'
$manifestTemplate = Join-Path $PSScriptRoot 'stewart-generalized-native-host.template.json'
$extensionSource = Join-Path $PSScriptRoot 'stewart-generalized-extension'
$compiler = Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
$commonRuntimeFiles = @(
  $hostScript,
  (Join-Path $repoRoot 'lib\harvey\stewart-generalized-native-host.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-generalized-extension-bridge.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-background-credential-operation.mjs'),
  (Join-Path $repoRoot 'lib\harvey\station-crypto-core.mjs'),
  (Join-Path $repoRoot 'lib\harvey\secret-shape-screen.mjs')
)
$generalizedRuntimeFiles = @(
  (Join-Path $repoRoot 'lib\harvey\disney-mydisney-email-otp-transaction.mjs'),
  (Join-Path $repoRoot 'lib\harvey\disney-mydisney-full-conversion.mjs'),
  (Join-Path $repoRoot 'lib\harvey\private-inbox-email-otp-handle.mjs'),
  (Join-Path $repoRoot 'lib\harvey\private-inbox-email-otp-doss-adapter.mjs'),
  (Join-Path $repoRoot 'lib\harvey\authenticated-inbox-identity-handle.mjs'),
  (Join-Path $repoRoot 'lib\harvey\authenticated-inbox-identity-dpapi-binding.mjs'),
  (Join-Path $repoRoot 'lib\harvey\onepassword-sdk-identity-handle-capability.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-live-surface-probe.mjs'),
  (Join-Path $repoRoot 'lib\harvey\password-provider-deferred-execution.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-deferred-live-adapter.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-deferred-concrete-driver.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-doss-live-actions.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-background-provider-organs.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-authenticated-inbox-organ.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-onepassword-vault-organ.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-disney-dynamic-package-custody.mjs'),
  (Join-Path $repoRoot 'scripts\foreman\stewart-generalized-disney-doss-one-shot-runtime.mjs'),
  (Join-Path $repoRoot 'scripts\foreman\stewart-disney-deferred-package-entrypoint.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-generalized-playwright-provider-adapter.mjs'),
  (Join-Path $repoRoot 'lib\harvey\stewart-generalized-amazon-sign-in.mjs'),
  (Join-Path $repoRoot 'lib\harvey\disney-mydisney-doss-durable-dependencies.mjs'),
  (Join-Path $repoRoot 'lib\harvey\onepassword-sdk-service-account-capability.mjs'),
  (Join-Path $repoRoot 'lib\harvey\onepassword-sdk-service-account-client.mjs'),
  (Join-Path $repoRoot 'lib\harvey\onepassword-sdk-field-preserving-adapter.mjs'),
  (Join-Path $repoRoot 'lib\harvey\vault-exact-one-credential-save-once.mjs'),
  (Join-Path $repoRoot 'lib\harvey\vault-exact-one-metadata-proposal.mjs')
)
$amazonRuntimeFiles = @((Join-Path $repoRoot 'lib\harvey\stewart-generalized-amazon-sign-in.mjs'))
$runtimeFiles = @($commonRuntimeFiles + $(if ($RuntimeProfile -eq 'AMAZON_PASSWORD_FALLBACK') { $amazonRuntimeFiles } else { $generalizedRuntimeFiles }))
function Get-RelativeModuleClosure([string[]]$SeedFiles) {
  $seen = [Collections.Generic.HashSet[string]]::new([StringComparer]::OrdinalIgnoreCase)
  $pending = [Collections.Generic.Queue[string]]::new()
  foreach ($seed in $SeedFiles) { $pending.Enqueue((Resolve-Path -LiteralPath $seed).Path) }
  while ($pending.Count -gt 0) {
    $current = $pending.Dequeue()
    if (-not $seen.Add($current)) { continue }
    $content = Get-Content -Raw -LiteralPath $current
    $matches = [regex]::Matches($content, '(?:from\s+|import\s*\()\s*["''](\.{1,2}/[^"'']+)["'']')
    foreach ($match in $matches) {
      $candidate = Join-Path (Split-Path -Parent $current) $match.Groups[1].Value
      if (-not (Test-Path -LiteralPath $candidate -PathType Leaf)) { throw 'STEWART_GENERALIZED_RELATIVE_IMPORT_MISSING' }
      $resolved = (Resolve-Path -LiteralPath $candidate).Path
      $relative = Get-RepoRelativePath $repoRoot $resolved
      if ([IO.Path]::IsPathRooted($relative) -or $relative.StartsWith('..')) { throw 'STEWART_GENERALIZED_RUNTIME_PATH_ESCAPE' }
      if (-not $seen.Contains($resolved)) { $pending.Enqueue($resolved) }
    }
  }
  return @($seen | Sort-Object)
}
$runtimeFiles = Get-RelativeModuleClosure $runtimeFiles
$moduleRoots = if ($RuntimeProfile -eq 'GENERALIZED') { @(
  (Join-Path $repoRoot 'node_modules\@1password\sdk'),
  (Join-Path $repoRoot 'node_modules\@1password\sdk-core'),
  (Join-Path $repoRoot 'node_modules\playwright'),
  (Join-Path $repoRoot 'node_modules\playwright-core')
) } else { @() }
$required = @($NodeExecutable, $launcherTemplate, $resolverSource, $manifestTemplate) + $runtimeFiles
foreach ($path in $required) { if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { throw 'STEWART_GENERALIZED_PACKAGE_INPUT_MISSING' } }
foreach ($path in $moduleRoots) { if (-not (Test-Path -LiteralPath $path -PathType Container)) { throw 'STEWART_GENERALIZED_PACKAGE_MODULE_MISSING' } }
foreach ($name in @('manifest.json','service-worker.js','content-runtime.js','content-script.js')) { if (-not (Test-Path -LiteralPath (Join-Path $extensionSource $name) -PathType Leaf)) { throw 'STEWART_GENERALIZED_EXTENSION_INPUT_MISSING' } }

$resolvedNode = (Resolve-Path -LiteralPath $NodeExecutable).Path
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$resolvedOutput = (Resolve-Path -LiteralPath $OutputDirectory).Path
$extensionOutput = Join-Path $OutputDirectory 'extension'
New-Item -ItemType Directory -Force -Path $extensionOutput | Out-Null
foreach ($name in @('manifest.json','service-worker.js','content-runtime.js','content-script.js')) { Copy-Item -LiteralPath (Join-Path $extensionSource $name) -Destination (Join-Path $extensionOutput $name) -Force }

# Carry the exact runtime tree inside the package. The launcher and manifest
# must never depend on mutable source files outside the staged directory.
$packagedRuntimeFiles = foreach ($path in $runtimeFiles) {
  $resolvedSource = (Resolve-Path -LiteralPath $path).Path
  $sourceRelative = Get-RepoRelativePath $repoRoot $resolvedSource
  if ([IO.Path]::IsPathRooted($sourceRelative) -or $sourceRelative.StartsWith('..')) { throw 'STEWART_GENERALIZED_RUNTIME_PATH_ESCAPE' }
  $destination = Join-Path $resolvedOutput $sourceRelative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  Copy-Item -LiteralPath $resolvedSource -Destination $destination -Force
  (Resolve-Path -LiteralPath $destination).Path
}
foreach ($moduleRoot in $moduleRoots) {
  $resolvedModule = (Resolve-Path -LiteralPath $moduleRoot).Path
  $moduleRelative = Get-RepoRelativePath $repoRoot $resolvedModule
  if ([IO.Path]::IsPathRooted($moduleRelative) -or $moduleRelative.StartsWith('..')) { throw 'STEWART_GENERALIZED_MODULE_PATH_ESCAPE' }
  $moduleDestination = Join-Path $resolvedOutput $moduleRelative
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $moduleDestination) | Out-Null
  Copy-Item -LiteralPath $resolvedModule -Destination $moduleDestination -Recurse -Force
}
$resolvedHost = (Resolve-Path -LiteralPath (Join-Path $resolvedOutput (Get-RepoRelativePath $repoRoot $hostScript))).Path

$resolverOutput = Join-Path $OutputDirectory 'PookaKindStewartHandleResolver.exe'
& $compiler /nologo /target:exe /optimize+ /reference:System.Security.dll /out:$resolverOutput $resolverSource
if ($LASTEXITCODE -ne 0) { throw 'STEWART_GENERALIZED_RESOLVER_BUILD_FAILED' }
$resolverTest = & $resolverOutput --self-test 2>&1
if ($LASTEXITCODE -ne 0 -or $resolverTest -notcontains 'STEWART_HANDLE_RESOLVER_SELF_TEST_PASS') { throw 'STEWART_GENERALIZED_RESOLVER_SELF_TEST_FAILED' }

$manifestPath = Join-Path $OutputDirectory 'runtime.sha256'
$runtimeLines = foreach ($path in ($packagedRuntimeFiles + $resolverOutput)) { '{0} {1}' -f (Get-FileHash -Algorithm SHA256 -LiteralPath $path).Hash.ToLowerInvariant(), (Resolve-Path -LiteralPath $path).Path }
[IO.File]::WriteAllLines($manifestPath, $runtimeLines, [Text.UTF8Encoding]::new($false))
$launcherSource = (Get-Content -Raw -LiteralPath $launcherTemplate).
  Replace('__PINNED_NODE_PATH__', $resolvedNode.Replace('\','\\').Replace('"','\"')).
  Replace('__PINNED_NODE_SHA256__', (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedNode).Hash.ToLowerInvariant()).
  Replace('__PINNED_HOST_SCRIPT_PATH__', $resolvedHost.Replace('\','\\').Replace('"','\"')).
  Replace('__PINNED_RUNTIME_MANIFEST_PATH__', $manifestPath.Replace('\','\\').Replace('"','\"')).
  Replace('__PINNED_RUNTIME_MANIFEST_SHA256__', (Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash.ToLowerInvariant())
$generatedSource = Join-Path $OutputDirectory 'PookaKindStewartGeneralizedHostLauncher.generated.cs'
[IO.File]::WriteAllText($generatedSource, $launcherSource, [Text.UTF8Encoding]::new($false))
$launcherOutput = Join-Path $OutputDirectory 'PookaKindStewartGeneralizedHostLauncher.exe'
& $compiler /nologo /target:exe /optimize+ /out:$launcherOutput $generatedSource
if ($LASTEXITCODE -ne 0) { throw 'STEWART_GENERALIZED_LAUNCHER_BUILD_FAILED' }
$launcherTest = & $launcherOutput --self-test 2>&1
if ($LASTEXITCODE -ne 0 -or $launcherTest -notcontains 'CREDENTIAL_STEWARD_HOST_LAUNCHER_SELF_TEST_PASS') { throw 'STEWART_GENERALIZED_LAUNCHER_SELF_TEST_FAILED' }

$nativeManifest = Join-Path $OutputDirectory 'com.werkles.pookakind.stewart_generalized.json'
$manifest = (Get-Content -Raw -LiteralPath $manifestTemplate).Replace('__PINNED_NATIVE_HOST_EXECUTABLE__', $launcherOutput.Replace('\','\\'))
[IO.File]::WriteAllText($nativeManifest, $manifest, [Text.UTF8Encoding]::new($false))
$packageFiles = [IO.FileInfo[]]@(Get-ChildItem -LiteralPath $OutputDirectory -File -Recurse)
# The runtime verifier sorts package-relative paths with JavaScript's ordinal
# ordering. PowerShell's culture-aware Sort-Object can report a different tree
# digest for the exact same bytes (notably upper/lower-case path segments).
[Array]::Sort[IO.FileInfo]($packageFiles, [Comparison[IO.FileInfo]] {
  param($left, $right)
  $leftRelative = $left.FullName.Substring($resolvedOutput.Length + 1).Replace('\', '/')
  $rightRelative = $right.FullName.Substring($resolvedOutput.Length + 1).Replace('\', '/')
  [StringComparer]::Ordinal.Compare($leftRelative, $rightRelative)
})
$packageRecords = @($packageFiles | ForEach-Object {
  [ordered]@{
    relative_path = $_.FullName.Substring($resolvedOutput.Length + 1).Replace('\', '/')
    sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
  }
})
$extensionRecords = @($packageRecords | Where-Object { $_.relative_path.StartsWith('extension/') })
$packageSha256 = Get-StringSha256 @($packageRecords | ForEach-Object { '{0}:{1}' -f $_.relative_path, $_.sha256 })
$extensionBundleSha256 = Get-StringSha256 @($extensionRecords | ForEach-Object { '{0}:{1}' -f $_.relative_path, $_.sha256 })
[ordered]@{
  schema = 'pookakind.stewart-generalized-installable-package/v1'
  state = 'PINNED_PACKAGE_BUILT_NOT_INSTALLED'
  runtime_profile = $RuntimeProfile
  extension_id = 'dlkekkfjpgfghllndmdjffnfnpencdge'
  native_host_name = 'com.werkles.pookakind.stewart_generalized'
  launcher_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $launcherOutput).Hash.ToLowerInvariant()
  resolver_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolverOutput).Hash.ToLowerInvariant()
  runtime_manifest_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $manifestPath).Hash.ToLowerInvariant()
  native_manifest_sha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $nativeManifest).Hash.ToLowerInvariant()
  extension_bundle_sha256 = $extensionBundleSha256
  package_sha256 = $packageSha256
  package_file_count = $packageFiles.Count
  package_files = $packageRecords
  extension_files = $extensionRecords
  extension_load = 'HUMAN_GATE_CHROME_LOAD_UNPACKED'
  native_host_registry = 'PREPARED_NOT_WRITTEN'
  live_operation = 'NOT_ATTEMPTED'
  installs_anything = $false
  recurring_operation_created = $false
  output_directory = $resolvedOutput
} | ConvertTo-Json -Depth 5 -Compress
