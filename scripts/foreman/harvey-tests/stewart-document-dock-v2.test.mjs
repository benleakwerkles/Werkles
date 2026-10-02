import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../Open-PookaKindStewartDocumentDockV2.ps1", import.meta.url), "utf8");

test("camera capture is preview-first and save is a separate user action", () => {
  assert.match(source, /Take photo for preview/);
  assert.match(source, /Show-StewartImagePreview -Path \$path/);
  assert.match(source, /Encrypt approved preview/);
  assert.match(source, /Preview ready\. Inspect the image/);
});

test("format and destination are selected and pinned before camera capture", () => {
  assert.match(source, /Camera format/);
  assert.match(source, /Choose destination/);
  assert.match(source, /Destination=\[IO\.Path\]::GetFullPath\(\$destination\.Text\)/);
  assert.match(source, /Format=\[string\]\$format\.SelectedItem/);
  assert.match(source, /CameraCaptureUIPhotoFormat.*::Png/);
  assert.match(source, /CameraCaptureUIPhotoFormat.*::Jpeg/);
});

test("private bytes remain local, DPAPI protected, and cleared", () => {
  assert.match(source, /DataProtectionScope\]::CurrentUser/);
  assert.match(source, /Set-StewartPrivateAcl/);
  assert.match(source, /\[Array\]::Clear/);
  assert.doesNotMatch(source, /Invoke-WebRequest|HttpClient|TcpClient|NamedPipe|Get-Clipboard|Set-Clipboard|Clipboard\]::/i);
});

test("replacement, temporary raw capture, and unsupported secret classes fail safely", () => {
  assert.match(source, /Replace it\?/);
  assert.match(source, /Existing encrypted document preserved/);
  assert.match(source, /Remove-StewartPendingRaw/);
  assert.match(source, /Social Security cards, payment\/bank cards/);
  assert.match(source, /passwords, OTPs, or recovery codes/);
});
