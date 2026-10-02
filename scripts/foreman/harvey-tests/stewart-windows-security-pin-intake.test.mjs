import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../Open-PookaKindStewartWindowsSecurityPinIntake.ps1", import.meta.url), "utf8");
const runner = await readFile(new URL("../native/PookaKindWindowsSecurityPinRunner.cs", import.meta.url), "utf8");

test("dedicated intake binds the exact legacy Windows Security PIN slot and encoding", () => {
  assert.match(source, /PookaKind\\Stewart\\PrivateDock/);
  assert.match(source, /device-pin\.dpapi\.txt/);
  assert.match(source, /ProtectedData\]::Protect\([\s\S]*?\$null,[\s\S]*?DataProtectionScope\]::CurrentUser/);
  assert.match(source, /BitConverter\]::ToString\(\$protectedBytes\)\.Replace\("-", ""\)/);
  assert.match(runner, /"PrivateDock", "device-pin\.dpapi\.txt"/);
  assert.match(runner, /ProtectedData\.Unprotect\(protectedBytes, null, DataProtectionScope\.CurrentUser\)/);
});

test("dedicated intake validates numeric length without creating a plaintext string", () => {
  assert.match(source, /Blind PIN must contain 4-16 digits/);
  assert.match(source, /Blind PIN must contain digits only/);
  assert.match(source, /\$plainBytes\[\$index\] -lt 48/);
  assert.doesNotMatch(source, /\.Password\b|PtrToString|NetworkCredential/);
  assert.match(source, /ZeroFreeBSTR/);
  assert.match(source, /\[Array\]::Clear/);
});

test("dedicated intake atomically replaces only the runner slot with a current-user DACL", () => {
  assert.match(source, /FileMode\]::CreateNew/);
  assert.match(source, /\[IO\.File\]::Replace\(\$temporary, \$destination, \$backup, \$true\)/);
  assert.match(source, /Remove-Item -LiteralPath \$backup -Force/);
  assert.match(source, /\[IO\.File\]::Move\(\$temporary, \$destination\)/);
  assert.match(source, /DirectorySecurity\]::new\(\)/);
  assert.match(source, /FileSecurity\]::new\(\)/);
  assert.doesNotMatch(source, /Set-Acl|Audit|Sacl|SeSecurityPrivilege/i);
});

test("self-test proves create, replacement, readback equality, and old-value removal", () => {
  assert.match(source, /SELF_TEST_CREATE_READBACK_FAILED/);
  assert.match(source, /SELF_TEST_REPLACE_READBACK_FAILED/);
  assert.match(source, /SELF_TEST_OLD_VALUE_REMAINED/);
  assert.match(source, /SELF_TEST_PENDING_FILE_REMAINED/);
  assert.match(source, /SELF_TEST_BACKUP_FILE_REMAINED/);
  assert.match(source, /SELF_TEST_CURRENT_USER_ONLY_DACL_FAILED/);
});

test("dedicated intake is local, visible, non-recurring, and non-disclosing", () => {
  assert.match(source, /Stewart — Windows Security Blind PIN/);
  assert.match(source, /Store \/ replace Blind PIN/);
  assert.doesNotMatch(source, /SecretHandles/);
  assert.doesNotMatch(source, /Invoke-WebRequest|HttpClient|TcpClient|NamedPipe|Start-Job|Register-ScheduledTask|clipboard/i);
  assert.doesNotMatch(source, /Write-(Host|Verbose|Debug).*Pin|ConvertTo-Json|Get-FileHash/i);
});
