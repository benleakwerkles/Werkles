import { verifyStewartWindowsSecurityUiAccessSigningInstallTransaction, STEWART_WINDOWS_SECURITY_UIACCESS_SIGNING_RELEASE as release } from "./stewart-windows-security-uiaccess-signing-install.mjs";

const HASH = /^[a-f0-9]{64}$/;
const THUMBPRINT = /^[A-F0-9]{40,128}$/;
const INPUT_FIELDS = ["install_receipt", "observation", "ownership", "transaction"];
const OWNERSHIP_FIELDS = ["activation_record_sha256", "certificate_thumbprint", "operation_id_sha256", "package_sha256", "schema", "session_nonce_sha256", "subject"];
const INSTALL_FIELDS = ["adapter_sha256", "certificate_thumbprint", "fixture_sha256", "schema", "state"];
const OBSERVATION_FIELDS = ["certificates", "files", "install_root_present", "processes"];
const FILE_FIELDS = ["directory", "name", "reparse_point", "sha256"];
const CERTIFICATE_FIELDS = ["store", "subject", "thumbprint"];
const PROCESS_FIELDS = ["name", "path"];
const STORES = new Set(["MY", "ROOT", "TRUSTED_PUBLISHER"]);
const PROCESS_NAMES = new Set(["PookaKindWindowsSecurityUiAccessAdapter", "PookaKindWindowsSecurityUiAccessSyntheticFixture"]);

function fail(code) { const error = new Error(code); error.code = code; throw error; }
function exact(value, fields, code) {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype || Object.getOwnPropertySymbols(value).length) fail(code);
  const descriptors = Object.getOwnPropertyDescriptors(value); const actual = Reflect.ownKeys(value).sort(); const expected = [...fields].sort();
  if (actual.length !== expected.length || actual.some((key, index) => typeof key !== "string" || key !== expected[index])) fail(code);
  for (const descriptor of Object.values(descriptors)) if (!("value" in descriptor) || descriptor.get || descriptor.set || descriptor.enumerable !== true) fail(code);
}
function dense(value, maximum, code) {
  if (!Array.isArray(value) || Object.getPrototypeOf(value) !== Array.prototype || value.length > maximum || Object.getOwnPropertySymbols(value).length) fail(code);
  const keys = Reflect.ownKeys(value); const expected = Array.from({ length: value.length }, (_, index) => String(index));
  if (keys.length !== expected.length + 1 || keys.some((key) => typeof key !== "string" || (key !== "length" && !expected.includes(key)))) fail(code);
  for (const key of expected) { const descriptor = Object.getOwnPropertyDescriptor(value, key); if (!descriptor?.enumerable || !("value" in descriptor) || descriptor.get || descriptor.set) fail(code); }
}

export function compileStewartWindowsSecurityUiAccessRollbackCustody(input) {
  exact(input, INPUT_FIELDS, "STEWART_WINDOWS_SECURITY_ROLLBACK_INPUT_INVALID");
  const approvedAt = Date.parse(input.transaction?.activation_record?.payload?.approved_at);
  if (!Number.isFinite(approvedAt)) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_TRANSACTION_INVALID");
  verifyStewartWindowsSecurityUiAccessSigningInstallTransaction(input.transaction, approvedAt + 1);
  exact(input.ownership, OWNERSHIP_FIELDS, "STEWART_WINDOWS_SECURITY_ROLLBACK_OWNERSHIP_INVALID");
  if (input.ownership.schema !== "pookakind.stewart-windows-security-uiaccess-created-identity/v1"
    || input.ownership.operation_id_sha256 !== input.transaction.operation_id_sha256
    || input.ownership.activation_record_sha256 !== input.transaction.activation_record_sha256
    || input.ownership.package_sha256 !== release.package_sha256
    || input.ownership.subject !== release.certificate_profile.subject
    || !THUMBPRINT.test(input.ownership.certificate_thumbprint ?? "")
    || !HASH.test(input.ownership.session_nonce_sha256 ?? "")) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_OWNERSHIP_CONFLICT");
  exact(input.observation, OBSERVATION_FIELDS, "STEWART_WINDOWS_SECURITY_ROLLBACK_OBSERVATION_INVALID");
  if (typeof input.observation.install_root_present !== "boolean") fail("STEWART_WINDOWS_SECURITY_ROLLBACK_OBSERVATION_INVALID");
  dense(input.observation.files, 6, "STEWART_WINDOWS_SECURITY_ROLLBACK_FILE_INVENTORY_INVALID");
  dense(input.observation.certificates, 3, "STEWART_WINDOWS_SECURITY_ROLLBACK_CERTIFICATE_INVENTORY_INVALID");
  dense(input.observation.processes, 2, "STEWART_WINDOWS_SECURITY_ROLLBACK_PROCESS_INVENTORY_INVALID");

  const expectedFiles = new Map();
  if (input.observation.install_root_present) {
    exact(input.install_receipt, INSTALL_FIELDS, "STEWART_WINDOWS_SECURITY_ROLLBACK_INSTALL_RECEIPT_INVALID");
    if (input.install_receipt.schema !== "pookakind.stewart-windows-security-uiaccess-elevated-install/v1" || input.install_receipt.state !== "INSTALLED_ADMIN_ONLY"
      || input.install_receipt.certificate_thumbprint !== input.ownership.certificate_thumbprint || !HASH.test(input.install_receipt.adapter_sha256 ?? "") || !HASH.test(input.install_receipt.fixture_sha256 ?? "")) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_INSTALL_RECEIPT_CONFLICT");
    expectedFiles.set("PookaKindWindowsSecurityUiAccessAdapter.exe", input.install_receipt.adapter_sha256);
    expectedFiles.set("PookaKindWindowsSecurityUiAccessSyntheticFixture.exe", input.install_receipt.fixture_sha256);
    expectedFiles.set("PookaKindWindowsSecurityUiAccessAdapter.SelfTest.exe", release.self_test_executable_sha256);
    expectedFiles.set("embedded.manifest", release.embedded_manifest_sha256);
    expectedFiles.set("synthetic-fixture.embedded.manifest", release.synthetic_fixture_manifest_sha256);
  } else if (input.install_receipt !== null) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_INSTALL_RECEIPT_UNEXPECTED");
  if (input.observation.files.length !== expectedFiles.size) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_FILE_INVENTORY_CONFLICT");
  const seenFiles = new Set();
  for (const file of input.observation.files) {
    exact(file, FILE_FIELDS, "STEWART_WINDOWS_SECURITY_ROLLBACK_FILE_INVENTORY_INVALID");
    if (file.directory !== false || file.reparse_point !== false || !expectedFiles.has(file.name) || expectedFiles.get(file.name) !== file.sha256 || seenFiles.has(file.name)) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_FILE_INVENTORY_CONFLICT");
    seenFiles.add(file.name);
  }

  const seenStores = new Set();
  for (const certificate of input.observation.certificates) {
    exact(certificate, CERTIFICATE_FIELDS, "STEWART_WINDOWS_SECURITY_ROLLBACK_CERTIFICATE_INVENTORY_INVALID");
    if (!STORES.has(certificate.store) || seenStores.has(certificate.store) || certificate.thumbprint !== input.ownership.certificate_thumbprint || certificate.subject !== input.ownership.subject) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_CERTIFICATE_INVENTORY_CONFLICT");
    seenStores.add(certificate.store);
  }
  const seenProcesses = new Set();
  const root = "%ProgramFiles%\\PookaKind\\Stewart\\WindowsSecurityUiAccess\\";
  for (const process of input.observation.processes) {
    exact(process, PROCESS_FIELDS, "STEWART_WINDOWS_SECURITY_ROLLBACK_PROCESS_INVENTORY_INVALID");
    if (!PROCESS_NAMES.has(process.name) || seenProcesses.has(process.name) || typeof process.path !== "string" || !process.path.startsWith(root)) fail("STEWART_WINDOWS_SECURITY_ROLLBACK_PROCESS_INVENTORY_CONFLICT");
    seenProcesses.add(process.name);
  }
  return Object.freeze({ schema: "pookakind.stewart-windows-security-uiaccess-rollback-plan/v1", state: "EXACT_OWNED_ROLLBACK_ADMITTED", operation_id_sha256: input.transaction.operation_id_sha256, certificate_thumbprint: input.ownership.certificate_thumbprint, files: Object.freeze([...seenFiles]), certificate_stores: Object.freeze([...seenStores]), processes: Object.freeze([...seenProcesses]), deletes_unrelated_state: false, secret_accessed: false, windows_security_opened: false });
}
