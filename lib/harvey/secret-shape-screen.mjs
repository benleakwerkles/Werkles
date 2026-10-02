const SECRET_PATTERNS = [
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/i,
  /\bAKIA[0-9A-Z]{16}\b/,
  /\b(?:gh[pousr]|github_pat)_[A-Za-z0-9_]{16,}\b/,
  /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/,
  /\b(?:password|passcode|token|secret|recovery\s+(?:key|code))\s*[:=]\s*\S+/i
];

const UNSAFE_CONTROL_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

export function containsHarveySecretShape(value) {
  return typeof value === "string" && SECRET_PATTERNS.some((pattern) => pattern.test(value));
}

export function containsUnsafeHarveyControlCharacters(value) {
  return typeof value === "string" && UNSAFE_CONTROL_CHARACTERS.test(value);
}
