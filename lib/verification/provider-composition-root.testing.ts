import "server-only";

import { EXTERNAL_VERIFICATION_PROVIDER_IDS } from "./provider-adapter-port.ts";
import {
  composeVerificationProviderRoot,
  type VerificationProviderCompositionDependencies,
  type VerificationProviderCompositionRoot
} from "./provider-composition-root-internal.ts";

/** Offline-only dependency injection seam. Application code must never import this module. */
export function composeTestVerificationProviderRoot(
  dependencies: VerificationProviderCompositionDependencies
): VerificationProviderCompositionRoot {
  if (
    dependencies.adapters.length !== EXTERNAL_VERIFICATION_PROVIDER_IDS.length ||
    dependencies.adapters.some((adapter) => adapter.trustDomain !== "test")
  ) {
    throw new TypeError("Test verification provider composition requires the complete test-domain adapter set");
  }
  const root = composeVerificationProviderRoot(dependencies);
  if (root.trustDomain !== "test") throw new TypeError("Test verification provider composition cannot enter production trust");
  return root;
}
