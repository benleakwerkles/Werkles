/**
 * Autonomous Matching feature flags.
 * Shadow runs on intake by default; public delivery and LLM layers are gated.
 */

/** Run hybrid engine on every intake; store shadow receipt (operator-visible). */
export const MATCHING_AUTONOMOUS_SHADOW = true;

/** Show Autonomous Matching output to end users on intake/recommendation surfaces. */
export const MATCHING_AUTONOMOUS_PUBLIC = true;

/** Allow OpenAI (or compatible) translation + Squibb voice LLM assist. Requires env + gate phrase. */
export const MATCHING_LLM_TRANSLATE_ENABLED = false;

export function isMatchingShadowEnabled() {
  return MATCHING_AUTONOMOUS_SHADOW;
}

export function isMatchingPublicEnabled() {
  return MATCHING_AUTONOMOUS_PUBLIC;
}

export function isMatchingLlmEnabled() {
  return (
    MATCHING_LLM_TRANSLATE_ENABLED &&
    Boolean(process.env.OPENAI_API_KEY?.trim() || process.env.MATCHING_LLM_API_KEY?.trim())
  );
}

/** Member/API mode label when public delivery is on. */
export function matchingPublicModeLabel() {
  return "autonomous_matching" as const;
}
