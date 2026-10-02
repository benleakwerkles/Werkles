import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const script = path.resolve('scripts/foreman/Open-PookaKindStewartDocumentDockV3.ps1');
const source = fs.readFileSync(script, 'utf8');
const cameraHelper = path.resolve('scripts/foreman/stewart_live_camera.py');
const cameraSource = fs.readFileSync(cameraHelper, 'utf8');

assert.match(source, /WM_CAP_SET_PREVIEW/);
assert.match(source, /Get-StewartDefaultOutputPath/);
assert.match(source, /DocumentUploadStaging/);
assert.match(source, /stewart_live_camera\.py/);
assert.match(cameraSource, /VideoCapture/);
assert.match(cameraSource, /Capture for review/);
assert.match(cameraSource, /Save JPEG \+ PNG/);
assert.match(cameraSource, /Center 4:3/);
assert.match(cameraSource, /Center square/);
assert.match(cameraSource, /--source/);
assert.match(source, /Review latest capture/);
assert.match(cameraSource, /Laplacian/);
assert.match(cameraSource, /CHECK SHARPNESS/);
assert.match(cameraSource, /write_exclusive/);
assert.match(source, /SaveFileDialog/);
assert.match(source, /ValidateSet\('JPEG','PNG'\)/);
assert.match(source, /JPEG \+ PNG/);
assert.match(source, /Get-StewartOutputPair/);
assert.match(source, /DataProtectionScope\]::CurrentUser/);
assert.doesNotMatch(source, /Clipboard|SendKeys|SetCursorPos|mouse_event|keybd_event/);
assert.doesNotMatch(cameraSource, /(?:import|from)\s+(?:pyautogui|pynput|requests|urllib|socket|win32clipboard)/i);
assert.doesNotMatch(source, /Register-ScheduledTask|New-Service|Start-Job|while\s*\(\s*\$true/);

const run = spawnSync('powershell.exe', [
  '-NoProfile', '-Sta', '-ExecutionPolicy', 'Bypass', '-File', script, '-SelfTest'
], { encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr || run.stdout);
const receipt = JSON.parse(run.stdout.trim());
assert.equal(receipt.state, 'PASS');
assert.equal(receipt.clipboard_accessed, false);
assert.equal(receipt.jpeg_ready, true);
assert.equal(receipt.png_ready, true);
assert.equal(receipt.paired_output_required, true);
assert.equal(receipt.exact_destination_required, true);
assert.equal(receipt.recurring_operation_created, false);

const cameraPython = path.join(process.env.LOCALAPPDATA, 'PookaKind', 'Stewart', 'CameraRuntime', 'Scripts', 'python.exe');
const cameraRun = spawnSync(cameraPython, [cameraHelper, '--self-test'], { encoding: 'utf8' });
assert.equal(cameraRun.status, 0, cameraRun.stderr || cameraRun.stdout);
const cameraReceipt = JSON.parse(cameraRun.stdout.trim());
assert.equal(cameraReceipt.state, 'PASS');
assert.equal(cameraReceipt.review_before_write, true);
assert.equal(cameraReceipt.crop_ready, true);
assert.equal(cameraReceipt.quality_advisory_ready, true);
assert.equal(cameraReceipt.private_image_opened, false);

console.log('PASS stewart-document-dock-v3');
