import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../Open-PookaKindStewartPrivateIntake.ps1", import.meta.url), "utf8");
const pinRunner = await readFile(new URL("../native/PookaKindWindowsSecurityPinRunner.cs", import.meta.url), "utf8");

test("Stewart intake uses CurrentUser DPAPI and clears plaintext buffers", () => {
  assert.match(source, /DataProtectionScope\]::CurrentUser/);
  assert.match(source, /ZeroFreeBSTR/);
  assert.match(source, /\[Array\]::Clear/);
  assert.match(source, /\$secureCopy\.Dispose\(\)/);
  assert.doesNotMatch(source, /\.Password\b|PtrToString|NetworkCredential/);
});

test("Stewart intake is local-only, non-recurring, and does not expose values", () => {
  assert.doesNotMatch(source, /Invoke-WebRequest|HttpClient|TcpClient|NamedPipe|Start-Job|Register-ScheduledTask|clipboard/i);
  assert.doesNotMatch(source, /Write-(Output|Host|Verbose|Debug).*Secret|ConvertFrom-SecureStringToPlainText/i);
  assert.match(source, /SecretHandles/);
});

test("Stewart intake creates without overwrite and restricts handle names", () => {
  assert.match(source, /\^\[A-Za-z0-9\]\[A-Za-z0-9\._-\]\{0,63\}\$/);
  assert.match(source, /already exists; choose it below to replace it explicitly/);
  assert.match(source, /FileMode\]::CreateNew/);
  assert.doesNotMatch(source, /-Force\s*\|\s*Set-Content|WriteAllBytes/i);
});

test("Stewart intake uses DACL-only current-user descriptors without SACL privilege", () => {
  assert.match(source, /DirectorySecurity\]::new\(\)/);
  assert.match(source, /FileSecurity\]::new\(\)/);
  assert.match(source, /WindowsIdentity\]::GetCurrent\(\)\.User/);
  assert.match(source, /SetAccessRuleProtection\(\$true, \$false\)/);
  assert.doesNotMatch(source, /Get-Acl|Set-Acl|Audit|Sacl|SeSecurityPrivilege/i);
});

test("Stewart rotation is explicit, exact-handle bound, and atomic", () => {
  assert.match(source, /Replace selected handle/);
  assert.match(source, /\$selected = \[string\]\$existingHandles\.SelectedItem/);
  assert.match(source, /Join-Path \$StoreRoot "\$selected\.dpapi"/);
  assert.match(source, /-Mode Replace/);
  assert.match(source, /\[IO\.File\]::Replace\(\$temporary, \$Destination, \$backup, \$true\)/);
  assert.match(source, /Remove-Item -LiteralPath \$backup -Force/);
  assert.match(source, /\[IO\.File\]::Move\(\$temporary, \$Destination\)/);
  assert.match(source, /\.pending/);
});

test("Stewart intake binds Blind PIN to the exact Windows Security runner slot", () => {
  assert.match(source, /Store \/ replace Blind PIN/);
  assert.match(source, /PookaKind\\Stewart\\PrivateDock/);
  assert.match(source, /device-pin\.dpapi\.txt/);
  assert.match(source, /-Handle "device-pin" -Destination \$destination -Mode \$mode -Purpose DevicePin/);
  assert.match(source, /ProtectedData\]::Protect\([\s\S]*?\$null,[\s\S]*?DataProtectionScope\]::CurrentUser/);
  assert.match(source, /Blind PIN must contain 4-16 digits/);
  assert.match(source, /Blind PIN must contain digits only/);
  assert.match(pinRunner, /"PrivateDock", "device-pin\.dpapi\.txt"/);
  assert.match(pinRunner, /ProtectedData\.Unprotect\(protectedBytes, null, DataProtectionScope\.CurrentUser\)/);
});
