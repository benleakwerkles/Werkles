export type PublicAuthContext = "login" | "signup" | "callback";

type PublicAuthMessageInput = {
  context: PublicAuthContext;
  code?: unknown;
  status?: unknown;
};

const INVALID_CREDENTIAL_CODES = new Set(["invalid_credentials", "invalid_grant"]);
const EXPIRED_CONFIRMATION_CODES = new Set(["otp_expired", "expired_token"]);
const RATE_LIMIT_CODES = new Set([
  "over_email_send_rate_limit",
  "over_request_rate_limit",
  "rate_limit_exceeded",
  "too_many_requests"
]);
const TEMPORARY_SERVICE_CODES = new Set(["network_error", "request_timeout", "service_unavailable"]);
const POSSIBLE_EXISTING_ACCOUNT_CODES = new Set(["possible_existing_account", "user_already_exists"]);

function normalizedCode(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function publicAuthMessage({ context, code, status }: PublicAuthMessageInput) {
  const stableCode = normalizedCode(code);

  if (status === 429 || RATE_LIMIT_CODES.has(stableCode)) {
    return "Too many attempts too quickly. Wait a moment, then try again.";
  }

  if (TEMPORARY_SERVICE_CODES.has(stableCode)) {
    return "Werkles could not reach sign-in right now. Try again in a moment.";
  }

  if (EXPIRED_CONFIRMATION_CODES.has(stableCode)) {
    return "That confirmation link has expired. Try logging in, or create an account again.";
  }

  if (stableCode === "missing_confirmation") {
    return "This confirmation link is incomplete. Start from your email, or try logging in.";
  }

  if (context === "login" && INVALID_CREDENTIAL_CODES.has(stableCode)) {
    return "That sign-in did not work. Check your email and password, then try again.";
  }

  if (context === "signup" && POSSIBLE_EXISTING_ACCOUNT_CODES.has(stableCode)) {
    return "We could not finish that signup. Try logging in, or use another email.";
  }

  if (context === "login") {
    return "We could not sign you in. Check your details and try again.";
  }

  if (context === "signup") {
    return "We could not create the account. Try again in a moment.";
  }

  return "We could not confirm that link. Try logging in, or create an account again.";
}
