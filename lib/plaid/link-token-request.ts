import { PLAID_LINK_CLIENT_NAME } from "./link-config.ts";

export interface PlaidSandboxLinkTokenInput {
  ownerUserId: string;
  linkCustomizationName?: string;
}

export interface PlaidSandboxLinkTokenPublicFields {
  client_name: "Werkles";
  user: { client_user_id: string };
  products: ["assets"];
  country_codes: ["US"];
  language: "en";
  link_customization_name?: string;
}

const OPAQUE_OWNER_ID = /^[A-Za-z0-9][A-Za-z0-9:_-]{0,127}$/;
const LINK_CUSTOMIZATION_NAME = /^[A-Za-z0-9][A-Za-z0-9_-]{0,99}$/;

function requireOpaqueOwnerId(value: string): string {
  if (value !== value.trim() || !OPAQUE_OWNER_ID.test(value)) {
    throw new TypeError("ownerUserId must be a nonblank opaque owner identifier");
  }
  return value;
}

function requireCustomizationName(value: string): string {
  if (value !== value.trim() || !LINK_CUSTOMIZATION_NAME.test(value)) {
    throw new TypeError(
      "linkCustomizationName must be 1-100 ASCII letters, digits, underscores, or hyphens"
    );
  }
  return value;
}

export function buildPlaidSandboxLinkTokenRequest(
  input: PlaidSandboxLinkTokenInput
): PlaidSandboxLinkTokenPublicFields {
  if (
    PLAID_LINK_CLIENT_NAME !== "Werkles" ||
    PLAID_LINK_CLIENT_NAME.length < 1 ||
    PLAID_LINK_CLIENT_NAME.length > 30
  ) {
    throw new TypeError("Plaid Link client_name must be exactly Werkles and 1-30 characters");
  }

  const request: PlaidSandboxLinkTokenPublicFields = {
    client_name: "Werkles",
    user: { client_user_id: requireOpaqueOwnerId(input.ownerUserId) },
    products: ["assets"],
    country_codes: ["US"],
    language: "en"
  };

  if (input.linkCustomizationName !== undefined) {
    request.link_customization_name = requireCustomizationName(input.linkCustomizationName);
  }

  return request;
}
